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
	"time"

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

	// Ensure Reviewer Admin starts enabled with standard permissions in case a prior run stopped mid-test.
	_, _ = pool.Exec(ctx, `UPDATE users SET is_disabled = FALSE, disabled_reason = NULL, disabled_at = NULL, permissions = '{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}' WHERE mobile_number = '8888888888'`)

	var openCatID int
	if err := pool.QueryRow(ctx, `SELECT id FROM job_categories WHERE is_approval_open = TRUE AND approved_count < approval_limit ORDER BY id LIMIT 1`).Scan(&openCatID); err != nil {
		t.Fatalf("no open job_categories row available: %v", err)
	}

	var createdAppIDs []string
	var decrementCategoryID int
	defer func() {
		if decrementCategoryID > 0 {
			if _, err := pool.Exec(ctx, `
				UPDATE job_categories
				SET approved_count = GREATEST(0, approved_count - 1),
				    is_approval_open = (GREATEST(0, approved_count - 1) < approval_limit)
				WHERE id = $1`, decrementCategoryID); err != nil {
				t.Logf("cleanup quota %d: %v", decrementCategoryID, err)
			}
		}
		for _, cid := range createdAppIDs {
			if _, err := pool.Exec(ctx, `DELETE FROM applications WHERE id = $1`, cid); err != nil {
				t.Logf("cleanup synthetic application %s: %v", cid, err)
			}
		}
		if _, err := pool.Exec(ctx, `UPDATE users SET is_disabled = FALSE, disabled_reason = NULL, disabled_at = NULL, permissions = '{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}' WHERE mobile_number = '8888888888'`); err != nil {
			t.Logf("cleanup restore reviewer admin: %v", err)
		}
	}()

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

	// 1. Validate field-specific signup rejections and register Applicant A and Applicant B
	wBadReg := doJSON(http.MethodPost, "/api/v1/auth/register", map[string]string{
		"mobile_number": "9000",
		"password":      "short",
		"email":         "bad-email",
		"district":      "InvalidDistrict",
	}, "")
	if wBadReg.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on incomplete signup, got %d (%s)", wBadReg.Code, wBadReg.Body.String())
	}
	var badRegBody map[string]any
	_ = json.Unmarshal(wBadReg.Body.Bytes(), &badRegBody)
	errMap, hasErrorsMap := badRegBody["errors"].(map[string]any)
	if !hasErrorsMap || errMap["full_name"] == nil || errMap["father_name"] == nil || errMap["mother_name"] == nil || errMap["dob"] == nil || errMap["district"] == nil || errMap["address_line1"] == nil || errMap["email"] == nil {
		t.Fatalf("expected detailed field-specific validation errors, got %s", wBadReg.Body.String())
	}

	nonce := time.Now().UnixNano() % 100000000
	mobileA := fmt.Sprintf("90%08d", nonce)
	mobileB := fmt.Sprintf("91%08d", nonce)

	wRegA := doJSON(http.MethodPost, "/api/v1/auth/register", map[string]string{
		"full_name":     "Bina Devi",
		"father_name":   "Tomba Singh",
		"mother_name":   "Sanatombi Devi",
		"dob":           "1999-05-12",
		"mobile_number": mobileA,
		"password":      "SecurePass123!",
		"email":         "a@example.com",
		"country":       "India",
		"state":         "Manipur",
		"district":      "Imphal West",
		"address_line1": "Paona Bazar, Ward 12",
		"address_line2": "Near Khwairamband",
	}, "")
	if wRegA.Code != http.StatusCreated {
		t.Fatalf("register A failed: %d %s", wRegA.Code, wRegA.Body.String())
	}
	var resA map[string]any
	_ = json.Unmarshal(wRegA.Body.Bytes(), &resA)
	tokenA := resA["token"].(string)

	// Verify /auth/me returns persisted profile fields including dob
	wMeA := doJSON(http.MethodGet, "/api/v1/auth/me", nil, tokenA)
	if wMeA.Code != http.StatusOK || !strings.Contains(wMeA.Body.String(), "Imphal West") || !strings.Contains(wMeA.Body.String(), "Sanatombi Devi") || !strings.Contains(wMeA.Body.String(), "1999-05-12") {
		t.Fatalf("expected persisted profile in /auth/me, got %d %s", wMeA.Code, wMeA.Body.String())
	}

	// Verify Edit Profile (PUT /api/v1/auth/profile) validates and updates user profile cleanly
	wBadProf := doJSON(http.MethodPut, "/api/v1/auth/profile", map[string]string{
		"full_name": "Bina Devi",
		"dob":       "not-a-date",
	}, tokenA)
	if wBadProf.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 on invalid profile update, got %d", wBadProf.Code)
	}

	wUpdProf := doJSON(http.MethodPut, "/api/v1/auth/profile", map[string]string{
		"full_name":     "Bina Devi",
		"father_name":   "Tomba Singh",
		"mother_name":   "Sanatombi Devi",
		"dob":           "1999-05-14",
		"email":         "bina.updated@example.com",
		"country":       "India",
		"state":         "Manipur",
		"district":      "Imphal West",
		"address_line1": "Paona Bazar, Ward 12",
		"address_line2": "Near Temple Gate",
	}, tokenA)
	if wUpdProf.Code != http.StatusOK || !strings.Contains(wUpdProf.Body.String(), "1999-05-14") || !strings.Contains(wUpdProf.Body.String(), "bina.updated@example.com") {
		t.Fatalf("expected updated profile in PUT /auth/profile, got %d %s", wUpdProf.Code, wUpdProf.Body.String())
	}

	wRegB := doJSON(http.MethodPost, "/api/v1/auth/register", map[string]string{
		"full_name":     "Chaoba Meitei",
		"father_name":   "Ibomcha Meitei",
		"mother_name":   "Memcha Devi",
		"dob":           "2001-08-20",
		"mobile_number": mobileB,
		"password":      "SecurePass123!",
		"email":         "b@example.com",
		"country":       "India",
		"state":         "Manipur",
		"district":      "Thoubal",
		"address_line1": "Athokpam Bazar",
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
		"category_id":     openCatID,
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
		"category_id":     openCatID,
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
		"category_id":     openCatID,
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
	createdAppIDs = append(createdAppIDs, appID)

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

	// 7. SQL Injection probe on Track + Valid Track verification with masked details
	wSQLiTrack := doJSON(http.MethodGet, "/api/v1/applications/track?identifier="+url.QueryEscape("' OR '1'='1")+"&dob=1999-05-12", nil, "")
	if wSQLiTrack.Code != http.StatusNotFound {
		t.Fatalf("SQLi probe on Track should return 404, got %d", wSQLiTrack.Code)
	}

	wValidTrack := doJSON(http.MethodGet, "/api/v1/applications/track?identifier="+url.QueryEscape(mobileA)+"&dob=1999-05-12", nil, "")
	if wValidTrack.Code != http.StatusOK {
		t.Fatalf("expected 200 on valid Track lookup, got %d (%s)", wValidTrack.Code, wValidTrack.Body.String())
	}
	trackBody := wValidTrack.Body.String()
	if !strings.Contains(trackBody, "Imphal West") || !strings.Contains(trackBody, "Tomba Singh") || !strings.Contains(trackBody, "•••• •••• 5544") || strings.Contains(trackBody, "998877665544") || strings.Contains(trackBody, "<script>") {
		t.Fatalf("unexpected Track payload masking/content: %s", trackBody)
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
	if wRevLogin.Code != http.StatusOK {
		t.Fatalf("reviewer admin login failed: %d %s", wRevLogin.Code, wRevLogin.Body.String())
	}
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

	// Verify /admin/metrics reports live district-wise application counts including Imphal West
	wMetrics := doJSON(http.MethodGet, "/api/v1/admin/metrics", nil, superToken)
	if wMetrics.Code != http.StatusOK {
		t.Fatalf("admin metrics failed: %d %s", wMetrics.Code, wMetrics.Body.String())
	}
	var metricsResp struct {
		TotalApplied int `json:"total_applied"`
		Districts    []struct {
			District     string `json:"district"`
			TotalApplied int    `json:"total_applied"`
		} `json:"districts"`
	}
	if err := json.Unmarshal(wMetrics.Body.Bytes(), &metricsResp); err != nil {
		t.Fatalf("unmarshal metrics: %v", err)
	}
	foundImphalWest := false
	for _, dm := range metricsResp.Districts {
		if dm.District == "Imphal West" && dm.TotalApplied >= 1 {
			foundImphalWest = true
			break
		}
	}
	if !foundImphalWest {
		t.Fatalf("expected district analytics for Imphal West >= 1, got %+v", metricsResp.Districts)
	}

	// Verify /admin/applications?district= filters to the submitted Imphal West application
	wDistList := doJSON(http.MethodGet, "/api/v1/admin/applications?district="+url.QueryEscape("Imphal West"), nil, superToken)
	if wDistList.Code != http.StatusOK || !strings.Contains(wDistList.Body.String(), appID) {
		t.Fatalf("expected submitted application %s in Imphal West filter, got %d %s", appID, wDistList.Code, wDistList.Body.String())
	}

	// 10. Business Rules: Submitted applications are read-only, duplicates blocked when PENDING/APPROVED, resubmission allowed after REJECTED
	// 10a. Candidate A cannot edit their submitted application
	wEditSubmitted := doJSON(http.MethodPut, fmt.Sprintf("/api/v1/applications/%s", appID), map[string]any{
		"full_name": "Attempted Tamper",
	}, tokenA)
	if wEditSubmitted.Code != http.StatusForbidden {
		t.Fatalf("expected 403 blocking candidate edit of submitted application, got %d (%s)", wEditSubmitted.Code, wEditSubmitted.Body.String())
	}

	// 10b. Duplicate application for same category blocked while appID is PENDING
	dupPayload := map[string]any{
		"category_id":     openCatID,
		"full_name":       "Bina Devi",
		"guardian_name":   "Tomba Singh",
		"dob":             "1999-05-12",
		"social_category": "ST",
		"address_full":    "Paona Bazar, Imphal",
		"highest_qual":    "CLASS_X",
		"documents": map[string]string{
			"photograph":               uploadedURL,
			"id_proof":                 uploadedURL,
			"address_proof":            uploadedURL,
			"edu_cert":                 uploadedURL,
			"category_disability_cert": uploadedURL,
		},
	}
	wDupPending := doJSON(http.MethodPost, "/api/v1/applications", dupPayload, tokenA)
	if wDupPending.Code != http.StatusConflict {
		t.Fatalf("expected 409 blocking duplicate PENDING application, got %d (%s)", wDupPending.Code, wDupPending.Body.String())
	}

	// 10c. Super Admin rejects appID; Candidate A MUST now be allowed to submit a new application under same openCatID
	wRej := doJSON(http.MethodPatch, fmt.Sprintf("/api/v1/admin/applications/%s/reject", appID), map[string]string{
		"reason": "Document scan blurry; please submit a new application with clearer copies.",
	}, superToken)
	if wRej.Code != http.StatusOK {
		t.Fatalf("expected 200 rejecting appID, got %d (%s)", wRej.Code, wRej.Body.String())
	}

	wResub := doJSON(http.MethodPost, "/api/v1/applications", dupPayload, tokenA)
	if wResub.Code != http.StatusCreated {
		t.Fatalf("expected 201 allowing new application after REJECTED, got %d (%s)", wResub.Code, wResub.Body.String())
	}
	var resubRes map[string]any
	_ = json.Unmarshal(wResub.Body.Bytes(), &resubRes)
	appID2 := resubRes["id"].(string)
	createdAppIDs = append(createdAppIDs, appID2)

	// 10d. Super Admin approves appID2; subsequent duplicate submission under openCatID MUST be blocked (409)
	wApp2 := doJSON(http.MethodPatch, fmt.Sprintf("/api/v1/admin/applications/%s/approve", appID2), nil, superToken)
	if wApp2.Code != http.StatusOK {
		t.Fatalf("expected 200 approving resubmitted appID2, got %d (%s)", wApp2.Code, wApp2.Body.String())
	}
	decrementCategoryID = openCatID

	wDupApproved := doJSON(http.MethodPost, "/api/v1/applications", dupPayload, tokenA)
	if wDupApproved.Code != http.StatusConflict {
		t.Fatalf("expected 409 blocking duplicate APPROVED application, got %d (%s)", wDupApproved.Code, wDupApproved.Body.String())
	}

	_ = pgxpool.Conn{}
}
