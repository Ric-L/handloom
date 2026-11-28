package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/config"
	"handloom-portal/internal/middleware"
)

func testRouter(t *testing.T, uploadDir string) (*gin.Engine, *config.Config) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	audit.Init(t.TempDir())
	cfg := &config.Config{
		JWTSecret:      "super-secret-test-key-at-least-32-chars-long",
		UploadDir:      uploadDir,
		AllowedOrigins: []string{"http://localhost:5173"},
	}
	return NewRouter(nil, cfg), cfg
}

func signedTestToken(t *testing.T, secret, userID, role string) string {
	t.Helper()
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := tok.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("SignedString: %v", err)
	}
	return s
}

func TestCORSBlocksUntrustedOrigins(t *testing.T) {
	r, _ := testRouter(t, t.TempDir())

	// Untrusted origin preflight must be blocked (403) and lack Allow-Origin
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/categories", nil)
	req.Header.Set("Origin", "https://evil-attacker.example")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for untrusted CORS preflight, got %d", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("expected empty Access-Control-Allow-Origin for untrusted origin, got %q", w.Header().Get("Access-Control-Allow-Origin"))
	}

	// Trusted origin preflight must succeed
	reqOK := httptest.NewRequest(http.MethodOptions, "/api/v1/categories", nil)
	reqOK.Header.Set("Origin", "http://localhost:5173")
	wOK := httptest.NewRecorder()
	r.ServeHTTP(wOK, reqOK)

	if wOK.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for trusted CORS preflight, got %d", wOK.Code)
	}
	if wOK.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatalf("expected exact allowlisted origin, got %q", wOK.Header().Get("Access-Control-Allow-Origin"))
	}

	// Render default CORS permits HTTPS single-label *.onrender.com when enabled,
	// while still rejecting HTTP, multi-label subdomains, and arbitrary third-party origins.
	audit.Init(t.TempDir())
	renderCfg := &config.Config{
		JWTSecret:          "super-secret-test-key-at-least-32-chars-long",
		UploadDir:          t.TempDir(),
		AllowedOrigins:     []string{"https://handloom-api.onrender.com"},
		AllowRenderOrigins: true,
	}
	renderRouter := NewRouter(nil, renderCfg)

	for _, allowed := range []string{"https://handloom-frontend.onrender.com", "https://handloom-api.onrender.com"} {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
		req.Header.Set("Origin", allowed)
		w := httptest.NewRecorder()
		renderRouter.ServeHTTP(w, req)
		if w.Code != http.StatusNoContent || w.Header().Get("Access-Control-Allow-Origin") != allowed {
			t.Fatalf("expected 204 + ACAO %q on Render router, got status=%d acao=%q", allowed, w.Code, w.Header().Get("Access-Control-Allow-Origin"))
		}
	}

	for _, blocked := range []string{"http://handloom-frontend.onrender.com", "https://sub.evil.onrender.com", "https://evil-attacker.example"} {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/auth/login", nil)
		req.Header.Set("Origin", blocked)
		w := httptest.NewRecorder()
		renderRouter.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden || w.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Fatalf("expected 403 + empty ACAO for %q, got status=%d acao=%q", blocked, w.Code, w.Header().Get("Access-Control-Allow-Origin"))
		}
	}
}

func TestSecurityHeadersAndHSTS(t *testing.T) {
	r, _ := testRouter(t, t.TempDir())

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf-token", nil)
	req.Header.Set("X-Forwarded-Proto", "https")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("missing X-Content-Type-Options: nosniff")
	}
	if w.Header().Get("X-Frame-Options") != "DENY" {
		t.Fatalf("missing X-Frame-Options: DENY")
	}
	if w.Header().Get("Content-Security-Policy") == "" {
		t.Fatalf("missing Content-Security-Policy header")
	}
	if w.Header().Get("Strict-Transport-Security") == "" {
		t.Fatalf("expected HSTS header on HTTPS request")
	}
	if w.Header().Get("Cache-Control") == "" {
		t.Fatalf("expected strict Cache-Control on /api/v1/auth endpoint")
	}
}

func TestUploadsRequireAuthAndRejectTraversal(t *testing.T) {
	uploadDir := t.TempDir()
	sampleFile := "550e8400e29b41d4a716446655440000.png"
	if err := os.WriteFile(filepath.Join(uploadDir, sampleFile), []byte("\x89PNG\r\n\x1a\n"), 0600); err != nil {
		t.Fatalf("WriteFile: %v", err)
	}

	r, cfg := testRouter(t, uploadDir)

	// 1. Unauthenticated request must return 401 (never serve PII publicly)
	reqUnauth := httptest.NewRequest(http.MethodGet, "/uploads/"+sampleFile, nil)
	wUnauth := httptest.NewRecorder()
	r.ServeHTTP(wUnauth, reqUnauth)
	if wUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthenticated upload fetch, got %d", wUnauth.Code)
	}

	// 2. Authenticated traversal/invalid extension must return 400
	token := signedTestToken(t, cfg.JWTSecret, "550e8400-e29b-41d4-a716-446655440000", "APPLICANT")
	reqBad := httptest.NewRequest(http.MethodGet, "/api/v1/uploads/evil.html", nil)
	reqBad.Header.Set("Authorization", "Bearer "+token)
	wBad := httptest.NewRecorder()
	r.ServeHTTP(wBad, reqBad)
	if wBad.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid uploaded filename, got %d", wBad.Code)
	}

	// 3. Authenticated legitimate fetch sets nosniff and serves bytes
	reqGood := httptest.NewRequest(http.MethodGet, "/api/v1/uploads/"+sampleFile, nil)
	reqGood.Header.Set("Authorization", "Bearer "+token)
	wGood := httptest.NewRecorder()
	r.ServeHTTP(wGood, reqGood)
	if wGood.Code != http.StatusOK {
		t.Fatalf("expected 200 for authenticated file access, got %d (%s)", wGood.Code, wGood.Body.String())
	}
	if wGood.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("expected nosniff on served upload")
	}
}

func TestRBACBlocksPrivilegeEscalation(t *testing.T) {
	r, cfg := testRouter(t, t.TempDir())

	applicantTok := signedTestToken(t, cfg.JWTSecret, "11111111-1111-1111-1111-111111111111", "APPLICANT")
	reviewerTok := signedTestToken(t, cfg.JWTSecret, "22222222-2222-2222-2222-222222222222", "REVIEWER_ADMIN")

	// Applicant cannot access admin routes
	for _, path := range []string{"/api/v1/admin/metrics", "/api/v1/admin/users", "/api/v1/admin/audit-logs"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		req.Header.Set("Authorization", "Bearer "+applicantTok)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for APPLICANT accessing %s, got %d", path, w.Code)
		}
	}

	// Reviewer Admin cannot access Super Admin routes
	for _, path := range []string{"/api/v1/admin/users", "/api/v1/admin/audit-logs"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		req.Header.Set("Authorization", "Bearer "+reviewerTok)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for REVIEWER_ADMIN accessing %s, got %d", path, w.Code)
		}
	}

	// Unsigned alg=none JWT must be rejected
	algNoneToken := "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoiMSIsInJvbGUiOiJTVVBFUl9BRE1JTiJ9."
	reqAlg := httptest.NewRequest(http.MethodGet, "/api/v1/admin/users", nil)
	reqAlg.Header.Set("Authorization", "Bearer "+algNoneToken)
	wAlg := httptest.NewRecorder()
	r.ServeHTTP(wAlg, reqAlg)
	if wAlg.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for alg=none JWT, got %d", wAlg.Code)
	}
}

func TestCSRFRejectsMismatchedOrMissingTokenWithCookieAuth(t *testing.T) {
	r, cfg := testRouter(t, t.TempDir())
	token := signedTestToken(t, cfg.JWTSecret, "11111111-1111-1111-1111-111111111111", "APPLICANT")

	// Cookie auth without X-CSRF-Token must fail with 403 CSRF_VALIDATION_FAILED
	reqNoCSRF := httptest.NewRequest(http.MethodPost, "/api/v1/applications", bytes.NewBufferString(`{}`))
	reqNoCSRF.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	reqNoCSRF.AddCookie(&http.Cookie{Name: "csrf_token", Value: "validtoken123456"})
	wNoCSRF := httptest.NewRecorder()
	r.ServeHTTP(wNoCSRF, reqNoCSRF)
	if wNoCSRF.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on missing CSRF token, got %d", wNoCSRF.Code)
	}

	// Mismatched X-CSRF-Token must also fail with 403
	reqBadCSRF := httptest.NewRequest(http.MethodPost, "/api/v1/applications", bytes.NewBufferString(`{}`))
	reqBadCSRF.AddCookie(&http.Cookie{Name: "auth_token", Value: token})
	reqBadCSRF.AddCookie(&http.Cookie{Name: "csrf_token", Value: "validtoken123456"})
	reqBadCSRF.Header.Set("X-CSRF-Token", "wrongtoken123456")
	wBadCSRF := httptest.NewRecorder()
	r.ServeHTTP(wBadCSRF, reqBadCSRF)
	if wBadCSRF.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on mismatched CSRF token, got %d", wBadCSRF.Code)
	}

	// CSRF token response header must be exposed on /api/v1 responses for allowlisted cross-origin SPAs
	reqHeaderCheck := httptest.NewRequest(http.MethodGet, "/api/v1/auth/csrf-token", nil)
	reqHeaderCheck.Header.Set("Origin", "http://localhost:5173")
	wHeaderCheck := httptest.NewRecorder()
	r.ServeHTTP(wHeaderCheck, reqHeaderCheck)
	if wHeaderCheck.Header().Get("X-CSRF-Token") == "" {
		t.Fatalf("expected X-CSRF-Token header to be set on API responses")
	}
	if wHeaderCheck.Header().Get("Access-Control-Expose-Headers") == "" {
		t.Fatalf("expected Access-Control-Expose-Headers to expose X-CSRF-Token")
	}
}

func TestRateLimitersBlockBruteForceAndBursts(t *testing.T) {
	// 1. LoginRateLimiter blocks after 5 failures
	rl := middleware.NewLoginRateLimiter(nil, 5, 5*time.Minute, 5*time.Minute)
	for i := 0; i < 5; i++ {
		rl.RecordAttempt(t.Context(), "9876543210", "10.0.0.1", false)
	}
	if blocked, _ := rl.IsBlocked("9876543210"); !blocked {
		t.Fatalf("expected mobile identifier to be blocked after 5 failures")
	}
	if blocked, _ := rl.IsBlocked("10.0.0.1"); !blocked {
		t.Fatalf("expected IP to be blocked after 5 failures")
	}

	// 2. EndpointRateLimiter blocks bursts above threshold
	erl := middleware.NewEndpointRateLimiter(2, time.Minute)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/ping", erl.Middleware(), func(c *gin.Context) { c.Status(http.StatusOK) })

	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/ping", nil))
		if w.Code != http.StatusOK {
			t.Fatalf("request %d expected 200, got %d", i+1, w.Code)
		}
	}
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, httptest.NewRequest(http.MethodGet, "/ping", nil))
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 on 3rd burst request, got %d", w3.Code)
	}
	if w3.Header().Get("Retry-After") == "" {
		t.Fatalf("expected Retry-After header on 429 response")
	}
}
