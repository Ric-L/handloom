package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders attaches standard government-portal defensive HTTP security headers to all responses.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME-sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking / frame embedding
		c.Header("X-Frame-Options", "DENY")

		// Cross-Site Scripting Filter
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer privacy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content Security Policy
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: http: https:; connect-src 'self' http://localhost:8080 http://localhost:5173;")

		// Restrict unneeded browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

		// For sensitive API paths, enforce strict no-cache to prevent browser history leakage
		if strings.HasPrefix(c.Request.URL.Path, "/api/v1/admin") ||
			strings.HasPrefix(c.Request.URL.Path, "/api/v1/applications") ||
			strings.HasPrefix(c.Request.URL.Path, "/api/v1/auth") {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	}
}

// GenerateCSRFToken generates a 32-character hexadecimal CSRF token.
func GenerateCSRFToken() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// SetCSRFCookie sets the CSRF token cookie on the response if not already present.
// Note: csrf_token cookie has HttpOnly=false so JavaScript can read it and send X-CSRF-Token header.
func SetCSRFCookie(c *gin.Context) string {
	existing, err := c.Cookie("csrf_token")
	if err == nil && existing != "" {
		return existing
	}

	token := GenerateCSRFToken()
	isSecure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"

	// SameSite=Lax, HttpOnly=false (required for double-submit cookie pattern)
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("csrf_token", token, 86400, "/", "", isSecure, false)
	return token
}

// CSRFProtection implements the Double Submit Cookie pattern for cross-site request forgery prevention.
// When cookies are used for authentication, state-changing requests must provide a matching X-CSRF-Token header.
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Always ensure CSRF cookie is present
		csrfCookie, err := c.Cookie("csrf_token")
		if err != nil || csrfCookie == "" {
			csrfCookie = SetCSRFCookie(c)
		}

		method := c.Request.Method
		// Safe methods (GET, HEAD, OPTIONS) do not require CSRF validation
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			c.Next()
			return
		}

		// Public authentication routes (login, register) are exempt from CSRF token enforcement
		path := c.Request.URL.Path
		if path == "/api/v1/auth/login" ||
			path == "/api/v1/auth/register" ||
			path == "/api/v1/auth/admin-login" ||
			path == "/api/v1/admin/auth/login" ||
			path == "/api/v1/auth/csrf-token" {
			c.Next()
			return
		}

		// If the request uses cookie-based authentication, CSRF token header must match the cookie
		_, authCookieErr := c.Cookie("auth_token")
		isCookieAuth := authCookieErr == nil

		// Even if Authorization header is used, if X-CSRF-Token is provided, it must match
		reqToken := c.GetHeader("X-CSRF-Token")

		if isCookieAuth {
			if reqToken == "" || reqToken != csrfCookie {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error": "Cross-Site Request Forgery (CSRF) validation failed. Request blocked.",
					"code":  "CSRF_VALIDATION_FAILED",
				})
				return
			}
		}

		c.Next()
	}
}
