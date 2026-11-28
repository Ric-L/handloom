package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// IsHTTPSRequest reports whether the current request arrived over TLS or an HTTPS reverse proxy.
func IsHTTPSRequest(c *gin.Context) bool {
	return c.Request.TLS != nil || strings.EqualFold(c.GetHeader("X-Forwarded-Proto"), "https")
}

// SecurityHeaders attaches defensive HTTP security headers (OWASP ASVS / Top 10) to all responses.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("X-Permitted-Cross-Domain-Policies", "none")
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

		// Strict API Content Security Policy (mitigates inline script execution if an endpoint returns HTML/SVG)
		c.Header("Content-Security-Policy", "default-src 'none'; img-src 'self' data: blob:; style-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'")

		if IsHTTPSRequest(c) {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// Prevent caching of sensitive API or uploaded PII responses
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/v1/admin") ||
			strings.HasPrefix(path, "/api/v1/applications") ||
			strings.HasPrefix(path, "/api/v1/auth") ||
			strings.HasPrefix(path, "/api/v1/uploads") ||
			strings.HasPrefix(path, "/uploads") {
			c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}

		c.Next()
	}
}

// EnforceHTTPS redirects plain HTTP requests to HTTPS when enabled behind a proxy in production.
func EnforceHTTPS(enabled bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if enabled && !IsHTTPSRequest(c) {
			target := "https://" + c.Request.Host + c.Request.URL.RequestURI()
			c.Redirect(http.StatusPermanentRedirect, target)
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequestBodyLimit caps incoming request body bytes to protect against memory exhaustion / DoS.
func RequestBodyLimit(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Body != nil && !strings.HasPrefix(c.Request.URL.Path, "/api/v1/upload") {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		}
		c.Next()
	}
}

// GenerateCSRFToken generates a cryptographically random 32-character hexadecimal CSRF token.
func GenerateCSRFToken() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// CookieSameSiteMode returns SameSite=None on HTTPS (required for cross-subdomain deployments) and SameSite=Lax on local HTTP.
func CookieSameSiteMode(c *gin.Context) (http.SameSite, bool) {
	isSecure := IsHTTPSRequest(c)
	if isSecure {
		return http.SameSiteNoneMode, true
	}
	return http.SameSiteLaxMode, false
}

// SetCSRFCookie sets the CSRF token cookie on the response if not already present.
// Note: csrf_token cookie has HttpOnly=false so the SPA can read it on same-origin,
// and X-CSRF-Token response header mirrors it for allowlisted cross-origin deployments.
func SetCSRFCookie(c *gin.Context) string {
	existing, err := c.Cookie("csrf_token")
	if err == nil && existing != "" {
		c.Header("X-CSRF-Token", existing)
		return existing
	}

	token := GenerateCSRFToken()
	sameSite, isSecure := CookieSameSiteMode(c)
	c.SetSameSite(sameSite)
	c.SetCookie("csrf_token", token, 86400, "/", "", isSecure, false)
	c.Header("X-CSRF-Token", token)
	return token
}

// CSRFProtection implements the Double Submit Cookie pattern with constant-time comparison.
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		csrfCookie, err := c.Cookie("csrf_token")
		if err != nil || csrfCookie == "" {
			csrfCookie = SetCSRFCookie(c)
		} else {
			c.Header("X-CSRF-Token", csrfCookie)
		}

		method := c.Request.Method
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			c.Next()
			return
		}

		// Public auth endpoints that establish initial session/credentials are exempt
		path := c.Request.URL.Path
		if path == "/api/v1/auth/login" ||
			path == "/api/v1/auth/register" ||
			path == "/api/v1/auth/admin-login" ||
			path == "/api/v1/admin/auth/login" ||
			path == "/api/v1/auth/csrf-token" {
			c.Next()
			return
		}

		_, authCookieErr := c.Cookie("auth_token")
		isCookieAuth := authCookieErr == nil
		reqToken := c.GetHeader("X-CSRF-Token")

		// Enforce CSRF when cookie auth is present, OR if X-CSRF-Token header is provided alongside Bearer auth
		if isCookieAuth || reqToken != "" {
			if reqToken == "" || len(reqToken) != len(csrfCookie) ||
				subtle.ConstantTimeCompare([]byte(reqToken), []byte(csrfCookie)) != 1 {
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
