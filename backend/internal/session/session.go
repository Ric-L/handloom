package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Session timeout constants
const (
	// IdleTimeout is strictly set to 3 minutes as required by portal security controls
	IdleTimeout = 3 * time.Minute
	// AbsoluteSessionTimeout is the maximum lifetime of a session regardless of activity
	AbsoluteSessionTimeout = 12 * time.Hour
)

var (
	ErrSessionNotFound    = errors.New("session not found")
	ErrSessionRevoked     = errors.New("session has been revoked or signed out")
	ErrSessionIdleTimeout = errors.New("session expired due to 3 minutes of inactivity")
	ErrSessionExpired     = errors.New("session has expired")
)

type Session struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	SessionToken  string    `json:"session_token"`
	IPAddress     string    `json:"ip_address"`
	UserAgent     string    `json:"user_agent"`
	LastActivity  time.Time `json:"last_activity"`
	ExpiresAt     time.Time `json:"expires_at"`
	IsRevoked     bool      `json:"is_revoked"`
	RevokedReason *string   `json:"revoked_reason,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// GenerateSecureToken creates a cryptographically secure 32-byte hex token (64 characters)
func GenerateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// CreateSession generates a new user session and stores it in the database.
// To prevent session fixation, new sessions always receive fresh cryptographically secure identifiers.
func CreateSession(ctx context.Context, db *pgxpool.Pool, userID, ipAddress, userAgent string) (*Session, error) {
	token, err := GenerateSecureToken()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	expiresAt := now.Add(AbsoluteSessionTimeout)

	var sess Session
	err = db.QueryRow(ctx, `
		INSERT INTO user_sessions (
			user_id, session_token, ip_address, user_agent,
			last_activity, expires_at, is_revoked
		) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
		RETURNING id, user_id, session_token, ip_address, user_agent, last_activity, expires_at, is_revoked, created_at
	`, userID, token, ipAddress, userAgent, now, expiresAt).Scan(
		&sess.ID, &sess.UserID, &sess.SessionToken, &sess.IPAddress, &sess.UserAgent,
		&sess.LastActivity, &sess.ExpiresAt, &sess.IsRevoked, &sess.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to insert session: %w", err)
	}

	return &sess, nil
}

// ValidateAndTouch validates the session against idle and absolute expiration.
// If valid, it updates last_activity to now.
func ValidateAndTouch(ctx context.Context, db *pgxpool.Pool, sessionToken string) (*Session, error) {
	if sessionToken == "" {
		return nil, ErrSessionNotFound
	}

	var sess Session
	err := db.QueryRow(ctx, `
		SELECT id, user_id, session_token, ip_address, user_agent, last_activity, expires_at, is_revoked, revoked_reason, created_at
		FROM user_sessions
		WHERE session_token = $1
	`, sessionToken).Scan(
		&sess.ID, &sess.UserID, &sess.SessionToken, &sess.IPAddress, &sess.UserAgent,
		&sess.LastActivity, &sess.ExpiresAt, &sess.IsRevoked, &sess.RevokedReason, &sess.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}

	if sess.IsRevoked {
		return nil, ErrSessionRevoked
	}

	now := time.Now()

	// 1. Enforce strict 3-minute idle timeout on server-side
	if now.Sub(sess.LastActivity) > IdleTimeout {
		_ = RevokeSession(ctx, db, sessionToken, "IDLE_TIMEOUT")
		return nil, ErrSessionIdleTimeout
	}

	// 2. Enforce absolute session expiration
	if now.After(sess.ExpiresAt) {
		_ = RevokeSession(ctx, db, sessionToken, "ABSOLUTE_EXPIRATION")
		return nil, ErrSessionExpired
	}

	// 3. Touch session: update last_activity if more than 5 seconds have elapsed since last write
	if now.Sub(sess.LastActivity) > 5*time.Second {
		_, _ = db.Exec(ctx, `UPDATE user_sessions SET last_activity = $1 WHERE id = $2`, now, sess.ID)
		sess.LastActivity = now
	}

	return &sess, nil
}

// TouchSession explicitly resets the idle timer (e.g. on Keep-Alive / Stay Logged In)
func TouchSession(ctx context.Context, db *pgxpool.Pool, sessionToken string) error {
	now := time.Now()
	var sess Session
	err := db.QueryRow(ctx, `
		SELECT id, last_activity, expires_at, is_revoked
		FROM user_sessions
		WHERE session_token = $1
	`, sessionToken).Scan(&sess.ID, &sess.LastActivity, &sess.ExpiresAt, &sess.IsRevoked)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrSessionNotFound
		}
		return err
	}

	if sess.IsRevoked {
		return ErrSessionRevoked
	}

	if now.Sub(sess.LastActivity) > IdleTimeout {
		_ = RevokeSession(ctx, db, sessionToken, "IDLE_TIMEOUT")
		return ErrSessionIdleTimeout
	}

	_, err = db.Exec(ctx, `UPDATE user_sessions SET last_activity = $1 WHERE id = $2`, now, sess.ID)
	return err
}

// RevokeSession invalidates a session immediately
func RevokeSession(ctx context.Context, db *pgxpool.Pool, sessionToken, reason string) error {
	_, err := db.Exec(ctx, `
		UPDATE user_sessions
		SET is_revoked = TRUE, revoked_reason = $1
		WHERE session_token = $2 AND is_revoked = FALSE
	`, reason, sessionToken)
	return err
}

// RevokeAllUserSessions revokes all active sessions for a user (e.g., on role change or password reset)
func RevokeAllUserSessions(ctx context.Context, db *pgxpool.Pool, userID, reason string) error {
	_, err := db.Exec(ctx, `
		UPDATE user_sessions
		SET is_revoked = TRUE, revoked_reason = $1
		WHERE user_id = $2 AND is_revoked = FALSE
	`, reason, userID)
	return err
}

// RemainingIdleSeconds returns seconds left before idle timeout occurs
func RemainingIdleSeconds(lastActivity time.Time) int {
	elapsed := time.Since(lastActivity)
	remaining := IdleTimeout - elapsed
	if remaining <= 0 {
		return 0
	}
	return int(remaining.Seconds())
}
