package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"handloom-portal/internal/audit"
)

func TestSanitizeInputStripsHTMLAndControlChars(t *testing.T) {
	dirty := "  <script>alert('xss')</script>Bina Devi\x00\x07 <img src=x onerror=alert(1)> "
	clean := sanitizeInput(dirty)
	if strings.Contains(clean, "<") || strings.Contains(clean, ">") {
		t.Fatalf("expected HTML tags stripped, got %q", clean)
	}
	if strings.ContainsRune(clean, '\x00') || strings.ContainsRune(clean, '\x07') {
		t.Fatalf("expected control characters stripped, got %q", clean)
	}
	if clean != "alert('xss')Bina Devi" {
		t.Fatalf("unexpected sanitized output: %q", clean)
	}
}

func TestSanitizeCSVCellPreventsFormulaInjection(t *testing.T) {
	cases := []struct {
		in       string
		expected string
	}{
		{"=cmd|'/C calc'!A0", "'=cmd|'/C calc'!A0"},
		{"+SUM(1,2)", "'+SUM(1,2)"},
		{"-2+3", "'-2+3"},
		{"@SUM(A1:A2)", "'@SUM(A1:A2)"},
		{"\t=1+1", "'\t=1+1"},
		{"\r=1+1", "'\r=1+1"},
		{"Normal Name", "Normal Name"},
	}

	for _, tc := range cases {
		got := sanitizeCSVCell(tc.in)
		if got != tc.expected {
			t.Fatalf("sanitizeCSVCell(%q) = %q, want %q", tc.in, got, tc.expected)
		}
	}
}

func TestMaskAccountNumberAndUUIDValidation(t *testing.T) {
	acct := "123456789012"
	masked := maskAccountNumber(&acct)
	if masked == nil || *masked != "•••• •••• 9012" {
		t.Fatalf("expected masked account ending in 9012, got %v", masked)
	}

	if !isValidUUID("550e8400-e29b-41d4-a716-446655440000") {
		t.Fatalf("expected valid UUID to pass")
	}
	for _, bad := range []string{"' OR '1'='1", "../../../etc/passwd", "not-a-uuid", ""} {
		if isValidUUID(bad) {
			t.Fatalf("expected invalid UUID %q to fail", bad)
		}
	}
}

func TestAuditRedactMasksSensitiveKeys(t *testing.T) {
	payload := map[string]any{
		"full_name":      "Lakshmi Devi",
		"password":       "Secret123!",
		"account_number": "998877665544",
		"ifsc_code":      "SBIN0001234",
		"aadhaar_no":     "123412341234",
		"nested": map[string]any{
			"jwt_token": "eyJhbGciOiJIUzI1NiJ9",
			"safe":      "visible",
		},
	}

	redacted, ok := audit.Redact(payload).(map[string]any)
	if !ok {
		t.Fatalf("expected redacted map")
	}
	for _, k := range []string{"password", "account_number", "ifsc_code", "aadhaar_no"} {
		if redacted[k] != "[REDACTED]" {
			t.Fatalf("expected %s to be redacted, got %v", k, redacted[k])
		}
	}
	nested := redacted["nested"].(map[string]any)
	if nested["jwt_token"] != "[REDACTED]" || nested["safe"] != "visible" {
		t.Fatalf("unexpected nested redaction: %v", nested)
	}
}

func performUploadRequest(t *testing.T, h *ApplicationHandler, filename string, content []byte) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/upload", func(c *gin.Context) {
		c.Set("user_id", "550e8400-e29b-41d4-a716-446655440000")
		c.Set("role", "APPLICANT")
		h.UploadFile(c)
	})

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	fw, err := mw.CreateFormFile("file", filename)
	if err != nil {
		t.Fatalf("CreateFormFile: %v", err)
	}
	if _, err := fw.Write(content); err != nil {
		t.Fatalf("Write: %v", err)
	}
	_ = mw.Close()

	req := httptest.NewRequest(http.MethodPost, "/upload", &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestUploadFileSecurityValidations(t *testing.T) {
	audit.Init(t.TempDir())
	tmpDir := t.TempDir()
	h := &ApplicationHandler{UploadDir: tmpDir}

	// 1. Disguised HTML/script renamed to .jpg must fail magic byte check
	wBadMagic := performUploadRequest(t, h, "evil.jpg", []byte("<script>alert(1)</script>"))
	if wBadMagic.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for disguised HTML payload, got %d (%s)", wBadMagic.Code, wBadMagic.Body.String())
	}

	// 2. Disallowed extension (.svg / .html) must fail
	wBadExt := performUploadRequest(t, h, "xss.svg", []byte("<svg onload=alert(1)>"))
	if wBadExt.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for .svg upload, got %d", wBadExt.Code)
	}

	// 3. Exactly 5 MB file must be rejected (strictly below 5 MB required)
	fiveMB := make([]byte, 5*1024*1024)
	copy(fiveMB, []byte("\x89PNG\r\n\x1a\n"))
	wTooBig := performUploadRequest(t, h, "exact5mb.png", fiveMB)
	if wTooBig.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for exact 5MB upload, got %d (%s)", wTooBig.Code, wTooBig.Body.String())
	}

	// 4. Empty file must be rejected
	wEmpty := performUploadRequest(t, h, "empty.png", []byte{})
	if wEmpty.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty upload, got %d", wEmpty.Code)
	}

	// 5. Valid PNG under 5 MB must succeed and generate a 32-char UUID filename
	validPNG := []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")
	wOK := performUploadRequest(t, h, "../../traversal.png", validPNG)
	if wOK.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid PNG, got %d (%s)", wOK.Code, wOK.Body.String())
	}
	var resp map[string]any
	if err := json.Unmarshal(wOK.Body.Bytes(), &resp); err != nil {
		t.Fatalf("json.Unmarshal: %v", err)
	}
	urlStr, _ := resp["url"].(string)
	if !safeUploadURLRegex.MatchString(urlStr) || strings.Contains(urlStr, "traversal") {
		t.Fatalf("expected sanitized UUID upload URL, got %q", urlStr)
	}
}

func TestTrackRejectsInvalidDOBFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := &ApplicationHandler{}
	r.GET("/track", h.Track)

	req := httptest.NewRequest(http.MethodGet, "/track?identifier=9999999999&dob='OR'1'='1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for SQLi DOB payload, got %d", w.Code)
	}
}
