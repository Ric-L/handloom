package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/session"
)

// Auth creates an authentication and authorization middleware that strictly enforces:
// 1. JWT verification
// 2. Server-side session validation and 3-minute idle timeout tracking in PostgreSQL
// 3. Protection against session reuse and fixation
// 4. Role-based access control (RBAC)
func Auth(secret string, db *pgxpool.Pool, roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		// 1. Check HTTP-only auth_token cookie first (preferred session auth method)
		cookieToken, err := c.Cookie("auth_token")
		if err == nil && cookieToken != "" {
			tokenStr = cookieToken
		}

		// 2. Fall back to Authorization: Bearer <token> header for compatibility
		if tokenStr == "" {
			header := c.GetHeader("Authorization")
			if strings.HasPrefix(header, "Bearer ") {
				tokenStr = strings.TrimPrefix(header, "Bearer ")
			}
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication session required. Please sign in to continue.",
				"code":  "UNAUTHENTICATED",
			})
			return
		}

		// 3. Verify JWT signature and claims
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			// Clear stale auth cookie if invalid
			clearAuthCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired session token. Please sign in again.",
				"code":  "INVALID_TOKEN",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			clearAuthCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims structure.",
				"code":  "INVALID_CLAIMS",
			})
			return
		}

		userID, _ := claims["user_id"].(string)
		role, _ := claims["role"].(string)
		sessionToken, _ := claims["session_token"].(string)

		if userID == "" || role == "" {
			clearAuthCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication token missing required identity attributes.",
				"code":  "INVALID_IDENTITY",
			})
			return
		}

		// 4. Server-Side Session Validation & 3-Minute Idle Timeout Enforcement
		// If session_token is present in claims, strictly validate against PostgreSQL user_sessions table
		if sessionToken != "" && db != nil {
			sess, err := session.ValidateAndTouch(c.Request.Context(), db, sessionToken)
			if err != nil {
				clearAuthCookie(c)

				if errors.Is(err, session.ErrSessionIdleTimeout) {
					audit.Log(c.Request.Context(), db, &userID, role, audit.ActionSessionExpired, nil, c.ClientIP(), nil, nil, map[string]any{
						"reason": "3-minute inactivity timeout exceeded on server",
					}, "EXPIRED")

					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
						"error": "Your session has expired due to 3 minutes of inactivity. For your protection on this admissions portal, please sign in again.",
						"code":  "SESSION_IDLE_TIMEOUT",
					})
					return
				}

				if errors.Is(err, session.ErrSessionRevoked) {
					audit.Log(c.Request.Context(), db, &userID, role, audit.ActionSessionRevoked, nil, c.ClientIP(), nil, nil, map[string]any{
						"reason": "Attempted reuse of invalidated session",
					}, "REVOKED")

					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
						"error": "This session has been signed out or terminated.",
						"code":  "SESSION_REVOKED",
					})
					return
				}

				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "Session is no longer valid. Please sign in again.",
					"code":  "SESSION_INVALID",
				})
				return
			}

			c.Set("session_id", sess.ID)
			c.Set("session_token", sess.SessionToken)
			c.Set("last_activity", sess.LastActivity)
		}

		// 4b. Verify user account is not disabled
		if db != nil {
			var isDisabled bool
			if err := db.QueryRow(c.Request.Context(), `SELECT COALESCE(is_disabled, FALSE) FROM users WHERE id = $1`, userID).Scan(&isDisabled); err == nil && isDisabled {
				clearAuthCookie(c)
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "This administrator account has been disabled by a Super Administrator.",
					"code":  "ACCOUNT_DISABLED",
				})
				return
			}
		}

		// 5. Server-Side Role-Based Access Control (RBAC)
		if len(roles) > 0 {
			allowed := false
			for _, r := range roles {
				if r == role {
					allowed = true
					break
				}
			}
			if !allowed {
				audit.Log(c.Request.Context(), db, &userID, role, audit.ActionAccessDenied, nil, c.ClientIP(), nil, nil, map[string]any{
					"attempted_path": c.Request.URL.Path,
					"required_roles": roles,
					"user_role":      role,
				}, "DENIED")

				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Access denied: Insufficient privileges for this admissions portal operation.",
					"code":  "FORBIDDEN",
				})
				return
			}
		}

		// Set context values for downstream handlers
		c.Set("user_id", userID)
		c.Set("role", role)
		c.Next()
	}
}

func clearAuthCookie(c *gin.Context) {
	sameSite, isSecure := CookieSameSiteMode(c)
	c.SetSameSite(sameSite)
	c.SetCookie("auth_token", "", -1, "/", "", isSecure, true)
}
