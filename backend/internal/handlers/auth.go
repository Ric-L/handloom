package handlers

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/middleware"
	"handloom-portal/internal/models"
	"handloom-portal/internal/session"
)

type AuthHandler struct {
	DB          *pgxpool.Pool
	JWTSecret   string
	RateLimiter *middleware.LoginRateLimiter
}

type RegisterRequest struct {
	MobileNumber string  `json:"mobile_number" binding:"required"`
	Password     string  `json:"password" binding:"required,min=8"`
	Email        *string `json:"email"`
}

type LoginRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required"`
	Password     string `json:"password" binding:"required"`
}

var mobileRegex = regexp.MustCompile(`^[0-9]{10,15}$`)

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid registration details (minimum 8 character password required)"})
		return
	}

	if len(req.Password) < 8 || len(req.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be between 8 and 72 characters long."})
		return
	}

	cleanMobile := strings.TrimSpace(req.MobileNumber)
	if !mobileRegex.MatchString(cleanMobile) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mobile number. Please enter a valid 10 to 15-digit number."})
		return
	}

	var cleanEmail *string
	if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		trimmed := strings.ToLower(strings.TrimSpace(*req.Email))
		if !isValidEmail(trimmed) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Please enter a valid email address."})
			return
		}
		cleanEmail = &trimmed
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to securely process credentials"})
		return
	}

	var user models.User
	ctx := c.Request.Context()
	err = h.DB.QueryRow(ctx,
		`INSERT INTO users (mobile_number, email, password_hash, role) VALUES ($1, $2, $3, 'APPLICANT') RETURNING id, mobile_number, email, role, created_at`,
		cleanMobile, cleanEmail, string(hash),
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "This mobile number is already registered. Please sign in."})
		return
	}

	// Create active session in database
	sess, err := session.CreateSession(ctx, h.DB, user.ID, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize secure session"})
		return
	}

	token, err := h.generateToken(user.ID, user.Role, sess.SessionToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	// Set secure HTTP-only cookie and CSRF cookie
	h.setAuthCookies(c, token)

	// Audit log
	audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionUserRegistered, &user.ID, c.ClientIP(), nil, nil, map[string]any{
		"mobile": cleanMobile,
	}, "SUCCESS")
	audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionLoginSuccess, &user.ID, c.ClientIP(), nil, nil, map[string]any{
		"session_id": sess.ID,
		"auth_type":  "REGISTER_AUTO_LOGIN",
	}, "SUCCESS")

	c.JSON(http.StatusCreated, gin.H{
		"token":      token,
		"user":       user,
		"session_id": sess.ID,
		"expires_in": int(session.IdleTimeout.Seconds()), // 180 seconds (3 minutes)
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number and password are required"})
		return
	}

	cleanMobile := strings.TrimSpace(req.MobileNumber)
	ip := c.ClientIP()
	ctx := c.Request.Context()

	// 1. Check rate limiter lockout
	if h.RateLimiter != nil {
		if blocked, waitTime := h.RateLimiter.IsBlocked(cleanMobile); blocked {
			waitSecs := int(waitTime.Seconds())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many failed login attempts for this account. For security, access is temporarily locked. Please try again later.",
				"code":        "ACCOUNT_LOCKED",
				"retry_after": waitSecs,
			})
			return
		}
	}

	var user models.User
	var isDisabled bool
	err := h.DB.QueryRow(ctx,
		`SELECT id, mobile_number, email, password_hash, role, created_at, COALESCE(is_disabled, FALSE) FROM users WHERE mobile_number = $1`,
		cleanMobile,
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &isDisabled)

	if err != nil {
		if h.RateLimiter != nil {
			h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, false)
		}
		audit.Log(ctx, h.DB, nil, "ANONYMOUS", audit.ActionLoginFailed, nil, ip, nil, nil, map[string]any{
			"mobile": cleanMobile,
			"reason": "User not found",
		}, "FAILED")

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid mobile number or password"})
		return
	}

	if isDisabled {
		audit.Log(ctx, h.DB, &user.ID, user.Role, "LOGIN_BLOCKED_DISABLED", &user.ID, ip, nil, nil, map[string]any{
			"mobile": cleanMobile,
			"reason": "Account is disabled by Super Administrator",
		}, "BLOCKED")
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This administrator account has been disabled by a Super Administrator. Please contact system support.",
			"code":  "ACCOUNT_DISABLED",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		if h.RateLimiter != nil {
			h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, false)
		}
		audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionLoginFailed, &user.ID, ip, nil, nil, map[string]any{
			"mobile": cleanMobile,
			"reason": "Password mismatch",
		}, "FAILED")

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid mobile number or password"})
		return
	}

	// Login successful: reset rate limiter
	if h.RateLimiter != nil {
		h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, true)
	}

	// Prevent session fixation: create fresh session
	sess, err := session.CreateSession(ctx, h.DB, user.ID, ip, c.Request.UserAgent())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to establish secure session"})
		return
	}

	token, err := h.generateToken(user.ID, user.Role, sess.SessionToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	// Set secure HTTP-only cookie and CSRF cookie
	h.setAuthCookies(c, token)

	// Audit logging
	audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionLoginSuccess, &user.ID, ip, nil, nil, map[string]any{
		"session_id": sess.ID,
		"auth_type":  "PASSWORD",
	}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"user":       user,
		"session_id": sess.ID,
		"expires_in": int(session.IdleTimeout.Seconds()), // 180 seconds (3 minutes)
	})
}

// AdminLogin strictly enforces REVIEWER_ADMIN or SUPER_ADMIN roles with rate limiting and audit logging
func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number and password are required"})
		return
	}

	cleanMobile := strings.TrimSpace(req.MobileNumber)
	ip := c.ClientIP()
	ctx := c.Request.Context()

	// Rate limiter check
	if h.RateLimiter != nil {
		if blocked, waitTime := h.RateLimiter.IsBlocked(cleanMobile); blocked {
			waitSecs := int(waitTime.Seconds())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many failed administrator login attempts. Account access is temporarily locked.",
				"code":        "ACCOUNT_LOCKED",
				"retry_after": waitSecs,
			})
			return
		}
	}

	var user models.User
	var isDisabled bool
	err := h.DB.QueryRow(ctx,
		`SELECT id, mobile_number, email, password_hash, role, created_at, COALESCE(is_disabled, FALSE) FROM users WHERE mobile_number = $1`,
		cleanMobile,
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &isDisabled)

	if err != nil {
		if h.RateLimiter != nil {
			h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, false)
		}
		audit.Log(ctx, h.DB, nil, "ANONYMOUS", audit.ActionLoginFailed, nil, ip, nil, nil, map[string]any{
			"portal": "ADMIN",
			"mobile": cleanMobile,
			"reason": "Admin not found",
		}, "FAILED")

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid administrator credentials"})
		return
	}

	if isDisabled {
		audit.Log(ctx, h.DB, &user.ID, user.Role, "LOGIN_BLOCKED_DISABLED", &user.ID, ip, nil, nil, map[string]any{
			"portal": "ADMIN",
			"mobile": cleanMobile,
			"reason": "Account is disabled by Super Administrator",
		}, "BLOCKED")
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This administrator account has been disabled by a Super Administrator.",
			"code":  "ACCOUNT_DISABLED",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		if h.RateLimiter != nil {
			h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, false)
		}
		audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionLoginFailed, &user.ID, ip, nil, nil, map[string]any{
			"portal": "ADMIN",
			"mobile": cleanMobile,
			"reason": "Password mismatch",
		}, "FAILED")

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid administrator credentials"})
		return
	}

	// Strictly reject APPLICANT accounts
	if user.Role != "REVIEWER_ADMIN" && user.Role != "SUPER_ADMIN" {
		if h.RateLimiter != nil {
			h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, false)
		}
		audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionAccessDenied, &user.ID, ip, nil, nil, map[string]any{
			"portal": "ADMIN",
			"reason": "Applicant attempted admin login",
		}, "DENIED")

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied: Applicant accounts are not permitted in the Admin Moderation Portal.",
		})
		return
	}

	// Success
	if h.RateLimiter != nil {
		h.RateLimiter.RecordAttempt(ctx, cleanMobile, ip, true)
	}

	// Create fresh session
	sess, err := session.CreateSession(ctx, h.DB, user.ID, ip, c.Request.UserAgent())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to establish administrator session"})
		return
	}

	token, err := h.generateToken(user.ID, user.Role, sess.SessionToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate administrator session token"})
		return
	}

	h.setAuthCookies(c, token)

	audit.Log(ctx, h.DB, &user.ID, user.Role, audit.ActionLoginSuccess, &user.ID, ip, nil, nil, map[string]any{
		"portal":     "ADMIN",
		"session_id": sess.ID,
	}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"user":       user,
		"session_id": sess.ID,
		"expires_in": int(session.IdleTimeout.Seconds()), // 180 seconds (3 minutes)
	})
}

// Logout invalidates the active session and clears authentication cookies
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionToken := c.GetString("session_token")
	userID := c.GetString("user_id")
	role := c.GetString("role")
	ctx := c.Request.Context()

	if sessionToken != "" {
		_ = session.RevokeSession(ctx, h.DB, sessionToken, "USER_LOGOUT")
	}

	h.clearAuthCookies(c)

	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, role, audit.ActionLogout, uID, c.ClientIP(), nil, nil, map[string]any{
		"reason": "User requested logout",
	}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"message": "Signed out successfully. Session invalidated.",
	})
}

// RefreshSession extends the idle timeout when user confirms activity (e.g. clicks "Stay Logged In")
func (h *AuthHandler) RefreshSession(c *gin.Context) {
	sessionToken := c.GetString("session_token")
	userID := c.GetString("user_id")
	role := c.GetString("role")
	ctx := c.Request.Context()

	if sessionToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No active session to refresh"})
		return
	}

	if err := session.TouchSession(ctx, h.DB, sessionToken); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Session could not be extended (it may have already expired)",
			"code":  "SESSION_EXPIRED",
		})
		return
	}

	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, role, audit.ActionSessionRefreshed, uID, c.ClientIP(), nil, nil, map[string]any{
		"extended_by": int(session.IdleTimeout.Seconds()),
	}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"message":    "Session extended successfully",
		"expires_in": int(session.IdleTimeout.Seconds()), // 180 seconds
	})
}

// SessionStatus returns the remaining idle time before expiration
func (h *AuthHandler) SessionStatus(c *gin.Context) {
	lastActivityVal, exists := c.Get("last_activity")
	if !exists {
		c.JSON(http.StatusOK, gin.H{"active": true, "remaining_seconds": int(session.IdleTimeout.Seconds())})
		return
	}

	lastActivity, ok := lastActivityVal.(time.Time)
	if !ok {
		c.JSON(http.StatusOK, gin.H{"active": true, "remaining_seconds": int(session.IdleTimeout.Seconds())})
		return
	}

	remaining := session.RemainingIdleSeconds(lastActivity)
	c.JSON(http.StatusOK, gin.H{
		"active":            remaining > 0,
		"remaining_seconds": remaining,
		"idle_timeout":      int(session.IdleTimeout.Seconds()),
	})
}

// GetCSRFToken returns the current or freshly generated CSRF token
func (h *AuthHandler) GetCSRFToken(c *gin.Context) {
	token := middleware.SetCSRFCookie(c)
	c.JSON(http.StatusOK, gin.H{
		"csrf_token": token,
	})
}

// Me returns the currently authenticated user's profile and active session status
func (h *AuthHandler) Me(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthenticated"})
		return
	}

	var user models.User
	err := h.DB.QueryRow(c.Request.Context(),
		`SELECT id, mobile_number, email, role, created_at FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User account not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":              user,
		"remaining_seconds": int(session.IdleTimeout.Seconds()),
	})
}

func (h *AuthHandler) generateToken(userID, role, sessionToken string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":       userID,
		"role":          role,
		"session_token": sessionToken,
		"exp":           time.Now().Add(session.AbsoluteSessionTimeout).Unix(),
		"iat":           time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}

func (h *AuthHandler) setAuthCookies(c *gin.Context, token string) {
	sameSite, isSecure := middleware.CookieSameSiteMode(c)
	c.SetSameSite(sameSite)
	c.SetCookie("auth_token", token, int(session.AbsoluteSessionTimeout.Seconds()), "/", "", isSecure, true)
	middleware.SetCSRFCookie(c)
}

func (h *AuthHandler) clearAuthCookies(c *gin.Context) {
	sameSite, isSecure := middleware.CookieSameSiteMode(c)
	c.SetSameSite(sameSite)
	c.SetCookie("auth_token", "", -1, "/", "", isSecure, true)
}
