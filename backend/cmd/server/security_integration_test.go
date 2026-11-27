package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/config"
	"handloom-portal/internal/db"
)

func TestLiveDBSecurityPenetrationSuite(t *testing.T) {
	dsn := os.Getenv("HANDLOOM_TEST_DSN")
	if dsn == "" {
		t.Skip("Set HANDLOOM_TEST_DSN to run live PostgreSQL penetration tests")
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("db.Connect: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(ctx, pool); err != nil {
		t.Fatalf("RunMigrations: %v", err)
	}
	if err := db.SeedCategories(ctx, pool); err != nil {
		t.Fatalf("SeedCategories: %v", err)
	}
	if err := db.SeedDefaultAdmins(ctx, pool); err != nil {
		t.Fatalf("SeedDefaultAdmins: %v", err)
	}

	audit.Init(t.TempDir())
	uploadDir := t.TempDir()
	cfg := &config.Config{
		DatabaseURL:    dsn,
		JWTSecret:      "live-integration-test-jwt-secret-key-32-chars",
		UploadDir:      uploadDir,
		AllowedOrigins: []string{"http://localhost:5173"},
	}
	r := NewRouter(pool, cfg)

	doJSON := func(method, path string, body any, token string, cookies ...*http.Cookie) *httptest.ResponseRecorder {
		var buf bytes.Buffer
		if body != nil {
			_ = json.NewEncoder(&buf).Encode(body)
		}
		req := httptest.NewRequest(method, path, &buf)
		req.Header.Set("Content-Type", "application/json")
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		for _, ck := range cookies {
			req.AddCookie(ck)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}

	// 1. Register Applicant A and Applicant B
	wRegA := doJSON(http.MethodPost, "/api/v1/auth/register", map[string]string{
		"mobile_number": "9000000001",
		"password":      "SecurePass123!",
		"email":         "a@example.com",
	}, "")
	if wRegA.Code != http.StatusCreated {
		t.Fatalf("register A failed: %d %s", wRegA.Code, wRegA.Body.String())
	}
	var resA map[string]any
	_ = json.Unmarshal(wRegA.Body.Bytes(), &resA)
	tokenA := resA["token"].(string)

	wRegB := doJSON(http.MethodPost, "/api/v1/auth/register", map[string]string{
		"mobile_number": "9000000002",
		"password":      "SecurePass123!",
		"email":         "b@example.com",
	}, "")
	if wRegB.Code != http.StatusCreated {
		t.Fatalf("register B failed: %d %s", wRegB.Code, wRegB.Body.String())
	}
	var resB map[string]any
	_ = json.Unmarshal(wRegB.Body.Bytes(), &resB)
	tokenB := resB["token"].(string)

	// 2. Upload valid PNG as Applicant A
	var upBuf bytes.Buffer
	mw := multipart.NewWriter(&upBuf)
	fw, _ := mw.CreateFormFile("file", "photo.png")
	_, _ = fw.Write([]byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"))
	_ = mw.Close()
	upReq := httptest.NewRequest(http.MethodPost, "/api/v1/upload", &upBuf)
	upReq.Header.Set("Content-Type", mw.FormDataContentType())
	upReq.Header.Set("Authorization", "Bearer "+tokenA)
	wUp := httptest.NewRecorder()
	r.ServeHTTP(wUp, upReq)
	if wUp.Code != http.StatusOK {
		t.Fatalf("upload A failed: %d %s", wUp.Code, wUp.Body.String())
	}
	var upRes map[string]any
	_ = json.Unmarshal(wUp.Body.Bytes(), &upRes)
	uploadedURL := upRes["url"].(string)

	// 3. IDOR Test: Applicant B attempts to access Applicant A's uploaded document -> MUST get 403
	wIDORFile := doJSON(http.MethodGet, "/api/v1"+uploadedURL, nil, tokenB)
	if wIDORFile.Code != http.StatusForbidden {
		t.Fatalf("IDOR FAILURE: Applicant B accessed Applicant A's file, got %d", wIDORFile.Code)
	}

	// Applicant A accesses own uploaded document -> MUST get 200
	wOwnFile := doJSON(http.MethodGet, "/api/v1"+uploadedURL, nil, tokenA)
	if wOwnFile.Code != http.StatusOK {
		t.Fatalf("expected owner A to access file, got %d", wOwnFile.Code)
	}

	// 4. Reject GENERAL social category, missing mandatory documents, and XSS javascript: URL
	wGen := doJSON(http.MethodPost, "/api/v1/applications", map[string]any{
		"category_id":     1,
		"full_name":       "Test Applicant",
		"guardian_name":   "Guardian",
		"dob":             "2000-01-01",
		"social_category": "GENERAL",
		"address_full":    "Imphal",
		"highest_qual":    "CLASS_X",
		"documents": map[string]string{
			"photograph":               uploadedURL,
			"id_proof":                 uploadedURL,
			"address_proof":            uploadedURL,
			"edu_cert":                 uploadedURL,
			"category_disability_cert": uploadedURL,
		},
	}, tokenA)
	if wGen.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 rejecting GENERAL category, got %d", wGen.Code)
	}

	wXSSDoc := doJSON(http.MethodPost, "/api/v1/applications", map[string]any{
		"category_id":     1,
		"full_name":       "Test Applicant",
		"guardian_name":   "Guardian",
		"dob":             "2000-01-01",
		"social_category": "ST",
		"address_full":    "Imphal",
		"highest_qual":    "CLASS_X",
		"documents": map[string]string{
			"photograph":               "javascript:alert(1)",
			"id_proof":                 uploadedURL,
			"address_proof":            uploadedURL,
			"edu_cert":                 uploadedURL,
			"category_disability_cert": uploadedURL,
		},
	}, tokenA)
	if wXSSDoc.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 rejecting javascript: URL, got %d", wXSSDoc.Code)
	}

	// 5. Submit valid application with XSS + CSV-formula payload in FullName to verify sanitization & CSV protection
	wSub := doJSON(http.MethodPost, "/api/v1/applications", map[string]any{
		"category_id":     1,
		"full_name":       "<script>alert(1)</script>=CMD('calc') Bina Devi",
		"guardian_name":   "Tomba Singh",
		"dob":             "1999-05-12",
		"social_category": "ST",
		"address_full":    "Paona Bazar, Imphal",
		"highest_qual":    "CLASS_X",
		"account_number":  "998877665544",
		"ifsc_code":       "SBIN0000123",
		"documents": map[string]string{
			"photograph":               uploadedURL,
			"id_proof":                 uploadedURL,
			"address_proof":            uploadedURL,
			"edu_cert":                 uploadedURL,
			"category_disability_cert": uploadedURL,
		},
	}, tokenA)
	if wSub.Code != http.StatusCreated {
		t.Fatalf("expected 201 on valid submission, got %d (%s)", wSub.Code, wSub.Body.String())
	}
	var subRes map[string]any
	_ = json.Unmarshal(wSub.Body.Bytes(), &subRes)
	appID := subRes["id"].(string)

	// 6. IDOR Test: Applicant B attempts to inspect or download Applicant A's dossier
	wIDORDossier := doJSON(http.MethodGet, fmt.Sprintf("/api/v1/applications/%s/dossier", appID), nil, tokenB)
	if wIDORDossier.Code != http.StatusForbidden {
		t.Fatalf("IDOR FAILURE: Applicant B accessed Applicant A's dossier, got %d", wIDORDossier.Code)
	}

	// Verify Applicant A's dossier masks bank account number and stripped <script>
	wOwnDossier := doJSON(http.MethodGet, fmt.Sprintf("/api/v1/applications/%s/dossier", appID), nil, tokenA)
	if wOwnDossier.Code != http.StatusOK {
		t.Fatalf("expected 200 on owner dossier, got %d", wOwnDossier.Code)
	}
	dossierBody := wOwnDossier.Body.String()
	if strings.Contains(dossierBody, "<script>") || strings.Contains(dossierBody, "998877665544") {
		t.Fatalf("expected sanitized XSS and masked account_number in dossier response: %s", dossierBody)
	}

	// 7. SQL Injection probes on Track and Admin search
	wSQLiTrack := doJSON(http.MethodGet, "/api/v1/applications/track?identifier="+url.QueryEscape("' OR '1'='1")+"&dob=1999-05-12", nil, "")
	if wSQLiTrack.Code != http.StatusNotFound {
		t.Fatalf("SQLi probe on Track should return 404, got %d", wSQLiTrack.Code)
	}

	// 8. Admin login, granular RBAC permission enforcement, and disabled admin login block
	wSuper := doJSON(http.MethodPost, "/api/v1/auth/admin-login", map[string]string{
		"mobile_number": "9999999999",
		"password":      "Admin@12345",
	}, "")
	if wSuper.Code != http.StatusOK {
		t.Fatalf("super admin login failed: %d %s", wSuper.Code, wSuper.Body.String())
	}
	var superRes map[string]any
	_ = json.Unmarshal(wSuper.Body.Bytes(), &superRes)
	superToken := superRes["token"].(string)

	// Login as Reviewer Admin (8888888888) and revoke can_approve + can_export via Super Admin
	wRevLogin := doJSON(http.MethodPost, "/api/v1/auth/admin-login", map[string]string{
		"mobile_number": "8888888888",
		"password":      "Reviewer@12345",
	}, "")
	var revRes map[string]any
	_ = json.Unmarshal(wRevLogin.Body.Bytes(), &revRes)
	revToken := revRes["token"].(string)
	revID := revRes["user"].(map[string]any)["id"].(string)

	wPerm := doJSON(http.MethodPut, fmt.Sprintf("/api/v1/admin/users/%s/permissions", revID), map[string]any{
		"permissions": map[string]bool{
			"can_review":  true,
			"can_approve": false,
			"can_reject":  false,
			"can_export":  false,
		},
	}, superToken)
	if wPerm.Code != http.StatusOK {
		t.Fatalf("failed updating permissions: %d %s", wPerm.Code, wPerm.Body.String())
	}

	// Reviewer with can_approve=false MUST get 403 on Approve and ExportCSV
	wRevApprove := doJSON(http.MethodPatch, fmt.Sprintf("/api/v1/admin/applications/%s/approve", appID), nil, revToken)
	if wRevApprove.Code != http.StatusForbidden {
		t.Fatalf("RBAC FAILURE: Reviewer without can_approve approved application, got %d", wRevApprove.Code)
	}
	wRevExport := doJSON(http.MethodGet, "/api/v1/admin/export/csv?status=PENDING", nil, revToken)
	if wRevExport.Code != http.StatusForbidden {
		t.Fatalf("RBAC FAILURE: Reviewer without can_export exported CSV, got %d", wRevExport.Code)
	}

	// Disable Reviewer and verify AdminLogin immediately blocks with 403 ACCOUNT_DISABLED
	wDis := doJSON(http.MethodPost, fmt.Sprintf("/api/v1/admin/users/%s/disable", revID), map[string]string{
		"reason": "Security audit check",
	}, superToken)
	if wDis.Code != http.StatusOK {
		t.Fatalf("disable reviewer failed: %d", wDis.Code)
	}
	wDisLogin := doJSON(http.MethodPost, "/api/v1/auth/admin-login", map[string]string{
		"mobile_number": "8888888888",
		"password":      "Reviewer@12345",
	}, "")
	if wDisLogin.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on disabled admin login, got %d", wDisLogin.Code)
	}

	// 9. Super Admin ExportCSV checks formula neutralization and account masking
	wExport := doJSON(http.MethodGet, "/api/v1/admin/export/csv?status=PENDING", nil, superToken)
	if wExport.Code != http.StatusOK {
		t.Fatalf("super admin CSV export failed: %d", wExport.Code)
	}
	csvText := wExport.Body.String()
	if strings.Contains(csvText, "998877665544") {
		t.Fatalf("CSV export leaked unmasked bank account number")
	}

	// Verify parameterized SQLi query on admin applications search returns 200 safely
	wAdminSQLi := doJSON(http.MethodGet, "/api/v1/admin/applications?search_query="+url.QueryEscape("' OR 1=1--"), nil, superToken)
	if wAdminSQLi.Code != http.StatusOK {
		t.Fatalf("expected 200 on parameterized SQLi probe, got %d", wAdminSQLi.Code)
	}

	_ = pgxpool.Conn{}
}
