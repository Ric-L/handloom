package middleware

import (
	"context"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/audit"
)

// LoginRateLimiter tracks login attempts to protect against brute-force attacks.
type LoginRateLimiter struct {
	mu           sync.Mutex
	attempts     map[string][]time.Time
	maxAttempts  int
	window       time.Duration
	lockDuration time.Duration
	db           *pgxpool.Pool
}

func NewLoginRateLimiter(db *pgxpool.Pool, maxAttempts int, window, lockDuration time.Duration) *LoginRateLimiter {
	limiter := &LoginRateLimiter{
		attempts:     make(map[string][]time.Time),
		maxAttempts:  maxAttempts,
		window:       window,
		lockDuration: lockDuration,
		db:           db,
	}

	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			limiter.cleanup()
		}
	}()

	return limiter
}

func (rl *LoginRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	cutoff := time.Now().Add(-rl.window)
	for key, timestamps := range rl.attempts {
		var valid []time.Time
		for _, t := range timestamps {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) == 0 {
			delete(rl.attempts, key)
		} else {
			rl.attempts[key] = valid
		}
	}
}

// IsBlocked checks whether the given key (IP or mobile) is currently blocked.
func (rl *LoginRateLimiter) IsBlocked(key string) (bool, time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	timestamps, exists := rl.attempts[key]
	if !exists || len(timestamps) < rl.maxAttempts {
		return false, 0
	}

	cutoff := time.Now().Add(-rl.window)
	var recentCount int
	var newest time.Time
	for _, t := range timestamps {
		if t.After(cutoff) {
			recentCount++
			if t.After(newest) {
				newest = t
			}
		}
	}

	if recentCount >= rl.maxAttempts {
		lockUntil := newest.Add(rl.lockDuration)
		if time.Now().Before(lockUntil) {
			return true, time.Until(lockUntil)
		}
	}

	return false, 0
}

// RecordAttempt logs an attempt (failed or successful).
func (rl *LoginRateLimiter) RecordAttempt(ctx context.Context, identifier, ip string, success bool) {
	rl.mu.Lock()
	if success {
		delete(rl.attempts, ip)
		delete(rl.attempts, identifier)
	} else {
		now := time.Now()
		rl.attempts[ip] = append(rl.attempts[ip], now)
		if identifier != "" {
			rl.attempts[identifier] = append(rl.attempts[identifier], now)
		}
	}
	rl.mu.Unlock()

	if rl.db != nil {
		_, _ = rl.db.Exec(ctx, `
			INSERT INTO login_attempts (identifier, ip_address, attempted_at, success)
			VALUES ($1, $2, NOW(), $3)
		`, identifier, ip, success)
	}
}

// Middleware enforces brute-force lockout on login endpoints.
func (rl *LoginRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		if blocked, waitTime := rl.IsBlocked(ip); blocked {
			waitSecs := int(waitTime.Seconds())
			if waitSecs < 1 {
				waitSecs = 1
			}

			audit.Log(c.Request.Context(), rl.db, nil, "ANONYMOUS", audit.ActionRateLimited, nil, ip, nil, nil, map[string]any{
				"reason":     "Login rate limit exceeded",
				"retry_wait": waitSecs,
			}, "BLOCKED")

			c.Header("Retry-After", strconv.Itoa(waitSecs))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many failed login attempts. For security reasons, this service is temporarily locked. Please try again later.",
				"code":        "RATE_LIMIT_EXCEEDED",
				"retry_after": waitSecs,
			})
			return
		}

		c.Set("rate_limiter", rl)
		c.Next()
	}
}

// EndpointRateLimiter provides general sliding-window per-IP rate limiting for sensitive endpoints.
type EndpointRateLimiter struct {
	mu          sync.Mutex
	requests    map[string][]time.Time
	maxRequests int
	window      time.Duration
}

func NewEndpointRateLimiter(maxRequests int, window time.Duration) *EndpointRateLimiter {
	rl := &EndpointRateLimiter{
		requests:    make(map[string][]time.Time),
		maxRequests: maxRequests,
		window:      window,
	}
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.cleanup()
		}
	}()
	return rl
}

func (rl *EndpointRateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	cutoff := time.Now().Add(-rl.window)
	for key, timestamps := range rl.requests {
		var valid []time.Time
		for _, t := range timestamps {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) == 0 {
			delete(rl.requests, key)
		} else {
			rl.requests[key] = valid
		}
	}
}

func (rl *EndpointRateLimiter) Allow(key string) (bool, int) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)
	var valid []time.Time
	for _, t := range rl.requests[key] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= rl.maxRequests {
		rl.requests[key] = valid
		retryAfter := int(valid[0].Add(rl.window).Sub(now).Seconds())
		if retryAfter < 1 {
			retryAfter = 1
		}
		return false, retryAfter
	}

	valid = append(valid, now)
	rl.requests[key] = valid
	return true, 0
}

func (rl *EndpointRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP() + ":" + c.FullPath()
		allowed, retryAfter := rl.Allow(key)
		if !allowed {
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests. Please wait a moment before trying again.",
				"code":        "RATE_LIMIT_EXCEEDED",
				"retry_after": retryAfter,
			})
			return
		}
		c.Next()
	}
}
