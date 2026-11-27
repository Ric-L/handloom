package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/audit"
)

type ApplicationHandler struct {
	DB        *pgxpool.Pool
	UploadDir string
}

func generateRegistrationNo(categoryCode string) string {
	year := time.Now().Year()
	cleanCode := strings.ReplaceAll(categoryCode, "-", "")
	cleanCode = strings.ReplaceAll(cleanCode, ".", "")
	if len(cleanCode) > 3 {
		cleanCode = cleanCode[:3]
	}
	uid := strings.ToUpper(uuid.New().String()[:6])
	return fmt.Sprintf("HND-%d-%s-%s", year, cleanCode, uid)
}

type SubmitApplicationPayload struct {
	CategoryID       int               `json:"category_id" form:"category_id"`
	FullName         string            `json:"full_name" form:"full_name" binding:"required"`
	GuardianName     string            `json:"guardian_name" form:"guardian_name" binding:"required"`
	DOB              string            `json:"dob" form:"dob" binding:"required"`
	Gender           string            `json:"gender" form:"gender"`
	MobileNumber     string            `json:"mobile_number" form:"mobile_number"`
	Email            string            `json:"email" form:"email"`
	AltMobile        string            `json:"alt_mobile" form:"alt_mobile"`
	GovIDType        string            `json:"gov_id_type" form:"gov_id_type"`
	GovIDLast4       string            `json:"gov_id_last4" form:"gov_id_last4"`
	SocialCategory   string            `json:"social_category" form:"social_category"`
	AddressFull      string            `json:"address_full" form:"address_full" binding:"required"`
	DistrictStatePin string            `json:"district_state_pin" form:"district_state_pin"`
	HighestQual      string            `json:"highest_qual" form:"highest_qual" binding:"required"`
	InstitutionName  string            `json:"institution_name" form:"institution_name"`
	Occupation       string            `json:"occupation" form:"occupation"`
	PrevTraining     string            `json:"prev_training" form:"prev_training"`
	RelevantExp      string            `json:"relevant_experience" form:"relevant_experience"`
	PreferredCentre  string            `json:"preferred_centre" form:"preferred_centre"`
	TrainingMode     string            `json:"training_mode" form:"training_mode"`
	BankHolderName   string            `json:"bank_holder_name" form:"bank_holder_name"`
	BankNameBranch   string            `json:"bank_name_branch" form:"bank_name_branch"`
	AccountNumber    string            `json:"account_number" form:"account_number"`
	IFSCCode         string            `json:"ifsc_code" form:"ifsc_code"`
	Documents        map[string]string `json:"documents" form:"documents"`
	PhotographURL    string            `json:"photograph_url" form:"photograph_url"`
}

// Track allows applicants to check their admission progress via Mobile Number and Date of Birth
func (h *ApplicationHandler) Track(c *gin.Context) {
	// Support both identifier (mobile or reg_no) and reg_no
	identifier := sanitizeInputMax(c.Query("identifier"), 40)
	if identifier == "" {
		identifier = sanitizeInputMax(c.Query("reg_no"), 40)
	}
	if identifier == "" {
		identifier = sanitizeInputMax(c.Query("mobile_number"), 20)
	}
	dobStr := strings.TrimSpace(c.Query("dob"))

	if identifier == "" || dobStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Registered mobile number and Date of Birth are required"})
		return
	}
	if _, err := time.Parse("2006-01-02", dobStr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Date of Birth format. Please use YYYY-MM-DD."})
		return
	}

	var result struct {
		RegistrationNo  string  `json:"registration_no"`
		FullName        string  `json:"full_name"`
		Category        string  `json:"category"`
		CategoryCode    string  `json:"category_code"`
		SubmittedAt     string  `json:"submitted_at"`
		Status          string  `json:"status"`
		RejectionReason *string `json:"rejection_reason,omitempty"`
	}

	var submittedAt time.Time
	err := h.DB.QueryRow(c.Request.Context(), `
		SELECT a.registration_no, a.full_name, jc.title, jc.code, a.submitted_at, a.status, a.rejection_reason
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		JOIN users u ON u.id = a.user_id
		WHERE (u.mobile_number = $1 OR a.registration_no = $1) AND a.dob = $2::date
		ORDER BY a.submitted_at DESC
		LIMIT 1
	`, identifier, dobStr).Scan(
		&result.RegistrationNo, &result.FullName, &result.Category, &result.CategoryCode,
		&submittedAt, &result.Status, &result.RejectionReason,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No matching application found for provided mobile number and date of birth."})
		return
	}

	result.SubmittedAt = submittedAt.Format(time.RFC3339)
	c.JSON(http.StatusOK, result)
}

// Submit persists a new candidate application
func (h *ApplicationHandler) Submit(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User session expired. Please sign in again."})
		return
	}

	var req SubmitApplicationPayload
	// Bind JSON or Multipart
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application data. Please check required fields and formatting."})
		return
	}

	ctx := c.Request.Context()

	if req.CategoryID <= 0 {
		// Fallback check query/form string
		catStr := c.PostForm("category_id")
		if catID, err := strconv.Atoi(catStr); err == nil {
			req.CategoryID = catID
		}
	}

	if req.CategoryID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please select a valid artisan training category"})
		return
	}

	// Verify category exists and admissions are open
	var catCode string
	var isOpen bool
	err := h.DB.QueryRow(ctx,
		`SELECT code, is_approval_open FROM job_categories WHERE id = $1`, req.CategoryID,
	).Scan(&catCode, &isOpen)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Selected artisan category does not exist"})
		return
	}

	if !isOpen {
		c.JSON(http.StatusConflict, gin.H{"error": "Admissions for this category are currently closed (quota reached)."})
		return
	}

	// Verify candidate hasn't already submitted for this trade
	var existingCount int
	_ = h.DB.QueryRow(ctx,
		`SELECT COUNT(*) FROM applications WHERE user_id = $1 AND category_id = $2`,
		userID, req.CategoryID,
	).Scan(&existingCount)
	if existingCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already submitted an application for this artisan category. Only one submission per category is permitted."})
		return
	}

	// Validate Date of Birth
	parsedDOB, err := time.Parse("2006-01-02", strings.TrimSpace(req.DOB))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Date of Birth format. Please use YYYY-MM-DD."})
		return
	}

	// Generate system tamper-proof registration number for administrators
	regNo := generateRegistrationNo(catCode)

	// Defaults & strict enum allowlists
	req.Gender = strings.ToUpper(strings.TrimSpace(req.Gender))
	if req.Gender == "" {
		req.Gender = "MALE"
	}
	if !isAllowedValue(req.Gender, "MALE", "FEMALE", "OTHER") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid gender selection."})
		return
	}

	if req.GovIDType == "" {
		req.GovIDType = "Aadhaar"
	}
	req.GovIDType = sanitizeInputMax(req.GovIDType, 50)
	if req.GovIDLast4 == "" {
		req.GovIDLast4 = "0000"
	}

	req.SocialCategory = strings.ToUpper(strings.TrimSpace(req.SocialCategory))
	if req.SocialCategory == "" {
		req.SocialCategory = "ST"
	}
	if strings.EqualFold(req.SocialCategory, "GENERAL") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "General category is not eligible under this scheme."})
		return
	}
	if !isAllowedValue(req.SocialCategory, "ST", "SC", "OBC", "OTHER") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid social category selection."})
		return
	}

	if req.DistrictStatePin == "" {
		req.DistrictStatePin = "Handloom Training Cluster"
	}
	if req.Occupation == "" {
		req.Occupation = "SELF_EMPLOYED"
	}
	if req.TrainingMode == "" {
		req.TrainingMode = "CLASSROOM"
	}
	if !isAllowedValue(strings.ToUpper(req.TrainingMode), "CLASSROOM", "RESIDENTIAL", "APPRENTICESHIP", "HYBRID") {
		req.TrainingMode = "CLASSROOM"
	}
	if req.IFSCCode != "" {
		req.IFSCCode = strings.ToUpper(strings.TrimSpace(req.IFSCCode))
		if !ifscRegex.MatchString(req.IFSCCode) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid IFSC code format (expected 11 characters, e.g., SBIN0000123)."})
			return
		}
	}

	// Prepare & validate Documents (prevent stored XSS URLs or path injection)
	if req.Documents == nil {
		req.Documents = make(map[string]string)
	}
	if req.PhotographURL != "" {
		req.Documents["photograph"] = req.PhotographURL
	}
	allowedDocKeys := map[string]bool{
		"photograph":               true,
		"id_proof":                 true,
		"address_proof":            true,
		"edu_cert":                 true,
		"bank_passbook":            true,
		"category_disability_cert": true,
		"signature_thumb":          true,
		"other_doc":                true,
		"other_doc_label":          true,
	}
	sanitizedDocs := make(map[string]string)
	for k, v := range req.Documents {
		if !allowedDocKeys[k] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported document field supplied."})
			return
		}
		trimmedVal := strings.TrimSpace(v)
		if trimmedVal == "" {
			continue
		}
		if k == "other_doc_label" {
			sanitizedDocs[k] = sanitizeInputMax(trimmedVal, 100)
			continue
		}
		if !safeUploadURLRegex.MatchString(trimmedVal) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document URL format. Please re-upload your document."})
			return
		}
		sanitizedDocs[k] = trimmedVal
	}
	req.Documents = sanitizedDocs

	requiredDocs := []struct {
		Key   string
		Label string
	}{
		{"photograph", "Passport-size Photograph"},
		{"id_proof", "Aadhaar Card"},
		{"address_proof", "Address Proof"},
		{"edu_cert", "Education Certificate"},
		{"category_disability_cert", "ST / Minority Certificate"},
	}
	for _, doc := range requiredDocs {
		if strings.TrimSpace(req.Documents[doc.Key]) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": doc.Label + " upload is mandatory."})
			return
		}
	}
	docBytes, _ := json.Marshal(req.Documents)

	// Prepare Prior Experience
	expData := map[string]interface{}{}
	if req.RelevantExp != "" {
		expData["has_experience"] = true
		expData["details"] = sanitizeInputMax(req.RelevantExp, 300)
	}
	expBytes, _ := json.Marshal(expData)

	var appID string
	var status string
	var submittedAt time.Time

	err = h.DB.QueryRow(ctx, `
		INSERT INTO applications (
			registration_no, user_id, category_id, full_name, guardian_name, dob, gender,
			alt_mobile, gov_id_type, gov_id_last4, social_category, address_full, district_state_pin,
			highest_qual, institution_name, occupation, prev_training, prior_experience, preferred_centre, training_mode,
			bank_holder_name, bank_name_branch, account_number, ifsc_code, documents, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			NULLIF($8, ''), $9, $10, $11, $12, $13,
			$14, NULLIF($15, ''), $16, NULLIF($17, ''), $18, NULLIF($19, ''), $20,
			NULLIF($21, ''), NULLIF($22, ''), NULLIF($23, ''), NULLIF($24, ''), $25, 'PENDING'
		) RETURNING id, status, submitted_at`,
		regNo, userID, req.CategoryID,
		sanitizeInputMax(req.FullName, 150), sanitizeInputMax(req.GuardianName, 150), parsedDOB, req.Gender,
		sanitizeInputMax(req.AltMobile, 15), req.GovIDType, sanitizeInputMax(req.GovIDLast4, 4), req.SocialCategory,
		sanitizeInputMax(req.AddressFull, 500), sanitizeInputMax(req.DistrictStatePin, 150),
		sanitizeInputMax(req.HighestQual, 20), sanitizeInputMax(req.InstitutionName, 200), sanitizeInputMax(req.Occupation, 20),
		sanitizeInputMax(req.PrevTraining, 300), expBytes, sanitizeInputMax(req.PreferredCentre, 150), sanitizeInputMax(req.TrainingMode, 30),
		sanitizeInputMax(req.BankHolderName, 150), sanitizeInputMax(req.BankNameBranch, 200),
		sanitizeInputMax(req.AccountNumber, 40), sanitizeInputMax(req.IFSCCode, 20),
		docBytes,
	).Scan(&appID, &status, &submittedAt)

	if err != nil {
		log.Printf("[SUBMIT ERROR] user=%s category=%d err=%v", userID, req.CategoryID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save application. Please verify all fields and try again."})
		return
	}

	// Sync full_name back to user record if empty or updated
	if strings.TrimSpace(req.FullName) != "" {
		_, _ = h.DB.Exec(ctx, `UPDATE users SET full_name = $1 WHERE id = $2`, sanitizeInputMax(req.FullName, 150), userID)
	}

	userRole := c.GetString("role")
	audit.Log(c.Request.Context(), h.DB, &userID, userRole, audit.ActionApplicationSubmit, &appID, c.ClientIP(), nil, nil, map[string]any{
		"registration_no": regNo,
		"category_id":     req.CategoryID,
	}, "SUCCESS")

	c.JSON(http.StatusCreated, gin.H{
		"message":         "Application submitted and saved successfully",
		"id":              appID,
		"registration_no": regNo,
		"status":          status,
		"submitted_at":    submittedAt.Format(time.RFC3339),
	})
}

// MyApplications returns applications for the logged-in candidate
func (h *ApplicationHandler) MyApplications(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := h.DB.Query(c.Request.Context(), `
		SELECT a.id, a.registration_no, a.user_id, a.category_id, jc.code, jc.title,
		       a.full_name, a.guardian_name, a.dob, a.gender, a.social_category,
		       a.district_state_pin, a.status, a.rejection_reason, a.submitted_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		WHERE a.user_id = $1
		ORDER BY a.submitted_at DESC`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch candidate applications"})
		return
	}
	defer rows.Close()

	var apps []gin.H
	for rows.Next() {
		var (
			id, regNo, uid, catCode, catTitle, fullName, guardianName, gender, socialCat, district, status string
			catID                                                                                           int
			dob                                                                                             time.Time
			submittedAt                                                                                     time.Time
			rejectionReason                                                                                 *string
		)

		if err := rows.Scan(
			&id, &regNo, &uid, &catID, &catCode, &catTitle,
			&fullName, &guardianName, &dob, &gender, &socialCat,
			&district, &status, &rejectionReason, &submittedAt,
		); err != nil {
			continue
		}

		item := gin.H{
			"id":                 id,
			"registration_no":    regNo,
			"user_id":            uid,
			"category_id":        catID,
			"category_code":      catCode,
			"category_title":     catTitle,
			"full_name":          fullName,
			"guardian_name":      guardianName,
			"dob":                dob.Format("2006-01-02"),
			"gender":             gender,
			"social_category":    socialCat,
			"district_state_pin": district,
			"status":             status,
			"rejection_reason":   rejectionReason,
			"submitted_at":       submittedAt.Format(time.RFC3339),
		}

		apps = append(apps, item)
	}
	if apps == nil {
		apps = []gin.H{}
	}

	c.JSON(http.StatusOK, apps)
}

// GetApprovedSlip returns full verified details for an approved application for PDF generation
func (h *ApplicationHandler) GetApprovedSlip(c *gin.Context) {
	ctx := c.Request.Context()
	appID := c.Param("id")
	if !isValidUUID(appID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}
	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	if userRole == "" {
		userRole = c.GetString("user_role")
	}

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized session"})
		return
	}

	isAdmin := (userRole == "SUPER_ADMIN" || userRole == "REVIEWER_ADMIN")

	query := `
		SELECT a.id, a.registration_no, a.user_id, a.category_id, jc.code, jc.title,
		       a.full_name, a.guardian_name, a.dob, a.gender, a.alt_mobile,
		       a.gov_id_type, a.gov_id_last4, a.social_category, a.address_full,
		       a.district_state_pin, a.highest_qual, a.institution_name,
		       a.occupation, a.prev_training, a.preferred_centre, a.training_mode,
		       a.bank_holder_name, a.bank_name_branch, a.account_number, a.ifsc_code,
		       a.status, a.reviewed_by, a.reviewed_at, a.submitted_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		WHERE a.id = $1
	`

	var (
		id, regNo, appUserID, catCode, catTitle, fullName, guardian, gender, govIDType, govIDLast4 string
		socialCat, addressFull, districtState, highestQual, occupation, trainingMode, status    string
		catID                                                                                   int
		dob, submittedAt                                                                        time.Time
		altMobile, institutionName, prevTraining, preferredCentre                               *string
		bankHolderName, bankNameBranch, accountNumber, ifscCode                                 *string
		reviewedBy                                                                              *string
		reviewedAt                                                                              *time.Time
	)

	err := h.DB.QueryRow(ctx, query, appID).Scan(
		&id, &regNo, &appUserID, &catID, &catCode, &catTitle,
		&fullName, &guardian, &dob, &gender, &altMobile,
		&govIDType, &govIDLast4, &socialCat, &addressFull,
		&districtState, &highestQual, &institutionName,
		&occupation, &prevTraining, &preferredCentre, &trainingMode,
		&bankHolderName, &bankNameBranch, &accountNumber, &ifscCode,
		&status, &reviewedBy, &reviewedAt, &submittedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application record not found"})
		return
	}

	// Permission check: if regular applicant, can only download own approved application
	if !isAdmin && appUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to view this application"})
		return
	}

	// Status check: Must be APPROVED to download enrolment slip
	if status != "APPROVED" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Enrolment slip is only accessible for approved applications."})
		return
	}

	res := gin.H{
		"id":                 id,
		"registration_no":    regNo,
		"category_id":        catID,
		"category_code":      catCode,
		"category_title":     catTitle,
		"full_name":          fullName,
		"guardian_name":      guardian,
		"dob":                dob.Format("2006-01-02"),
		"gender":             gender,
		"alt_mobile":         altMobile,
		"gov_id_type":        govIDType,
		"gov_id_last4":       govIDLast4,
		"social_category":    socialCat,
		"address_full":       addressFull,
		"district_state_pin": districtState,
		"highest_qual":       highestQual,
		"institution_name":   institutionName,
		"occupation":         occupation,
		"prev_training":      prevTraining,
		"preferred_centre":   preferredCentre,
		"training_mode":      trainingMode,
		"bank_holder_name":   bankHolderName,
		"bank_name_branch":   bankNameBranch,
		"account_number":     maskAccountNumber(accountNumber),
		"ifsc_code":          ifscCode,
		"status":             status,
		"submitted_at":       submittedAt.Format(time.RFC3339),
		"reviewed_by":        reviewedBy,
	}
	if reviewedAt != nil {
		res["reviewed_at"] = reviewedAt.Format(time.RFC3339)
	}

	c.JSON(http.StatusOK, res)
}

// UploadFile handles candidate document uploads with file type, size, and content magic bytes validation
func (h *ApplicationHandler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		file, err = c.FormFile("document")
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded. Please select a valid document or image."})
		return
	}

	// 1. Enforce strictly below 5MB limit and reject empty files
	const maxFileSize = 5 * 1024 * 1024
	if file.Size <= 0 || file.Size >= maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be greater than 0 bytes and below 5MB. Please compress or choose a smaller file."})
		return
	}

	// 2. Validate declared extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
		".pdf":  true,
	}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file format. Only JPG, PNG, WEBP, and PDF documents are accepted."})
		return
	}

	// 3. Inspect real content bytes (magic numbers) to prevent disguised executable/script uploads
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read uploaded file stream."})
		return
	}
	defer src.Close()

	header := make([]byte, 512)
	n, _ := src.Read(header)
	header = header[:n]

	detectedType := http.DetectContentType(header)
	validContent := false

	switch ext {
	case ".jpg", ".jpeg":
		if detectedType == "image/jpeg" || (len(header) >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) {
			validContent = true
		}
	case ".png":
		if detectedType == "image/png" || (len(header) >= 8 && string(header[:8]) == "\x89PNG\r\n\x1a\n") {
			validContent = true
		}
	case ".webp":
		if detectedType == "image/webp" || (len(header) >= 12 && string(header[:4]) == "RIFF" && string(header[8:12]) == "WEBP") {
			validContent = true
		}
	case ".pdf":
		if strings.HasPrefix(detectedType, "application/pdf") || (len(header) >= 5 && string(header[:5]) == "%PDF-") {
			validContent = true
		}
	}

	if !validContent {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "File content does not match the declared file extension or contains unsupported binary data.",
			"code":  "INVALID_FILE_CONTENT",
		})
		return
	}

	uploadDir := h.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare storage directory"})
		return
	}

	// 4. Safe filename: full random UUID (128-bit entropy), clean extension, prevent directory traversal
	cleanExt := filepath.Clean(ext)
	safeName := fmt.Sprintf("%s%s", strings.ReplaceAll(uuid.New().String(), "-", ""), cleanExt)
	dstPath := filepath.Join(uploadDir, safeName)

	if err := c.SaveUploadedFile(file, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	// Track file ownership in PostgreSQL for IDOR protection on retrieval
	if h.DB != nil && userID != "" {
		_, _ = h.DB.Exec(c.Request.Context(), `
			INSERT INTO uploaded_files (filename, user_id, content_type, size_bytes)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (filename) DO NOTHING
		`, safeName, userID, detectedType, file.Size)
	}

	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(c.Request.Context(), h.DB, uID, userRole, audit.ActionDocumentUploaded, nil, c.ClientIP(), nil, nil, map[string]any{
		"filename":  filepath.Base(file.Filename),
		"stored_as": safeName,
		"size":      file.Size,
		"ext":       ext,
	}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"url":       "/uploads/" + safeName,
		"filename":  filepath.Base(file.Filename),
		"size":      file.Size,
		"extension": ext,
		"message":   "File verified and uploaded successfully",
	})
}

// ServeUploadedFile serves uploaded documents ONLY to the file owner or authorized Administrators (prevents IDOR & XSS).
func (h *ApplicationHandler) ServeUploadedFile(c *gin.Context) {
	filename := filepath.Base(c.Param("filename"))
	if !safeUploadFileRegex.MatchString(filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file identifier"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	isAdmin := userRole == "SUPER_ADMIN" || userRole == "REVIEWER_ADMIN"

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to access uploaded documents"})
		return
	}

	if !isAdmin && h.DB != nil {
		ctx := c.Request.Context()
		var ownerID string
		err := h.DB.QueryRow(ctx, `SELECT user_id FROM uploaded_files WHERE filename = $1`, filename).Scan(&ownerID)
		authorized := err == nil && ownerID == userID

		if !authorized {
			// Fallback check: verify whether the file URL belongs to an application owned by this user
			var count int
			_ = h.DB.QueryRow(ctx, `
				SELECT COUNT(*) FROM applications
				WHERE user_id = $1 AND documents::text LIKE $2
			`, userID, "%/uploads/"+filename+"%").Scan(&count)
			authorized = count > 0
		}

		if !authorized {
			audit.Log(ctx, h.DB, &userID, userRole, audit.ActionAccessDenied, nil, c.ClientIP(), nil, nil, map[string]any{
				"attempted_file": filename,
				"reason":         "IDOR attempt on uploaded PII document",
			}, "DENIED")
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this document."})
			return
		}
	}

	uploadDir := h.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	absDir, err := filepath.Abs(uploadDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Storage configuration error"})
		return
	}
	targetPath := filepath.Join(absDir, filename)
	absTarget, err := filepath.Abs(targetPath)
	if err != nil || !strings.HasPrefix(absTarget, absDir+string(os.PathSeparator)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	if _, err := os.Stat(absTarget); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Uploaded document not found"})
		return
	}

	ext := strings.ToLower(filepath.Ext(filename))
	contentType := "application/octet-stream"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".webp":
		contentType = "image/webp"
	case ".pdf":
		contentType = "application/pdf"
	}

	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Cache-Control", "no-store, no-cache, must-revalidate")
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", filename))
	c.Header("Content-Type", contentType)
	c.File(absTarget)
}

// GetApplicationDossier returns full editable candidate dossier for the Registration Update Form
func (h *ApplicationHandler) GetApplicationDossier(c *gin.Context) {
	ctx := c.Request.Context()
	appID := c.Param("id")
	if !isValidUUID(appID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}
	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	isAdmin := (userRole == "SUPER_ADMIN" || userRole == "REVIEWER_ADMIN")

	query := `
		SELECT a.id, a.registration_no, a.user_id, a.category_id, jc.code, jc.title,
		       a.full_name, a.guardian_name, a.dob, a.gender, a.alt_mobile,
		       a.gov_id_type, a.gov_id_last4, a.social_category, a.address_full,
		       a.district_state_pin, a.highest_qual, a.institution_name,
		       a.occupation, a.prev_training, a.prior_experience, a.preferred_centre, a.training_mode,
		       a.bank_holder_name, a.bank_name_branch, a.account_number, a.ifsc_code,
		       a.documents, a.status, a.rejection_reason, a.submitted_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		WHERE a.id = $1
	`

	var (
		id, regNo, appUserID, catCode, catTitle, fullName, guardian, gender, govIDType, govIDLast4 string
		socialCat, addressFull, districtState, highestQual, occupation, trainingMode, status    string
		catID                                                                                   int
		dob, submittedAt                                                                        time.Time
		altMobile, institutionName, prevTraining, preferredCentre                               *string
		bankHolderName, bankNameBranch, accountNumber, ifscCode, rejectionReason               *string
		priorExpRaw, documentsRaw                                                               []byte
	)

	err := h.DB.QueryRow(ctx, query, appID).Scan(
		&id, &regNo, &appUserID, &catID, &catCode, &catTitle,
		&fullName, &guardian, &dob, &gender, &altMobile,
		&govIDType, &govIDLast4, &socialCat, &addressFull,
		&districtState, &highestQual, &institutionName,
		&occupation, &prevTraining, &priorExpRaw, &preferredCentre, &trainingMode,
		&bankHolderName, &bankNameBranch, &accountNumber, &ifscCode,
		&documentsRaw, &status, &rejectionReason, &submittedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application record not found"})
		return
	}

	if !isAdmin && appUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	docs := map[string]string{}
	if len(documentsRaw) > 0 {
		_ = json.Unmarshal(documentsRaw, &docs)
	}

	priorExp := map[string]interface{}{}
	if len(priorExpRaw) > 0 {
		_ = json.Unmarshal(priorExpRaw, &priorExp)
	}

	res := gin.H{
		"id":                 id,
		"category_id":        catID,
		"category_code":      catCode,
		"category_title":     catTitle,
		"full_name":          fullName,
		"guardian_name":      guardian,
		"dob":                dob.Format("2006-01-02"),
		"gender":             gender,
		"alt_mobile":         altMobile,
		"gov_id_type":        govIDType,
		"gov_id_last4":       govIDLast4,
		"social_category":    socialCat,
		"address_full":       addressFull,
		"district_state_pin": districtState,
		"highest_qual":       highestQual,
		"institution_name":   institutionName,
		"occupation":         occupation,
		"prev_training":      prevTraining,
		"prior_experience":   priorExp,
		"preferred_centre":   preferredCentre,
		"training_mode":      trainingMode,
		"bank_holder_name":   bankHolderName,
		"bank_name_branch":   bankNameBranch,
		"account_number":     maskAccountNumber(accountNumber),
		"ifsc_code":          ifscCode,
		"documents":          docs,
		"status":             status,
		"rejection_reason":   rejectionReason,
		"submitted_at":       submittedAt.Format(time.RFC3339),
		"registration_no":    regNo,
	}

	c.JSON(http.StatusOK, res)
}

// UpdateApplication allows candidate to update their pending admission enrolment dossier
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	ctx := c.Request.Context()
	appID := c.Param("id")
	if !isValidUUID(appID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application ID"})
		return
	}
	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	isAdmin := (userRole == "SUPER_ADMIN" || userRole == "REVIEWER_ADMIN")

	var currentUserID string
	var currentStatus string
	err := h.DB.QueryRow(ctx, `SELECT user_id, status FROM applications WHERE id = $1`, appID).
		Scan(&currentUserID, &currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application record not found"})
		return
	}

	if !isAdmin && currentUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to modify this application"})
		return
	}

	if !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "This application has been finalized and submitted. Submitted applications are read-only and cannot be modified or replaced.",
		})
		return
	}

	var req SubmitApplicationPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid application update data."})
		return
	}

	// Validate DOB if given
	var parsedDOB *time.Time
	if strings.TrimSpace(req.DOB) != "" {
		t, err := time.Parse("2006-01-02", strings.TrimSpace(req.DOB))
		if err == nil {
			parsedDOB = &t
		}
	}

	// Preserve / merge documents
	if req.Documents == nil {
		req.Documents = make(map[string]string)
	}
	if req.PhotographURL != "" {
		req.Documents["photograph"] = req.PhotographURL
	}
	docBytes, _ := json.Marshal(req.Documents)

	expData := map[string]interface{}{}
	if req.RelevantExp != "" {
		expData["has_experience"] = true
		expData["details"] = req.RelevantExp
	}
	expBytes, _ := json.Marshal(expData)

	_, err = h.DB.Exec(ctx, `
		UPDATE applications SET
			full_name = COALESCE(NULLIF($1, ''), full_name),
			guardian_name = COALESCE(NULLIF($2, ''), guardian_name),
			dob = COALESCE($3, dob),
			gender = COALESCE(NULLIF($4, ''), gender),
			alt_mobile = $5,
			gov_id_type = COALESCE(NULLIF($6, ''), gov_id_type),
			gov_id_last4 = COALESCE(NULLIF($7, ''), gov_id_last4),
			social_category = COALESCE(NULLIF($8, ''), social_category),
			address_full = COALESCE(NULLIF($9, ''), address_full),
			district_state_pin = COALESCE(NULLIF($10, ''), district_state_pin),
			highest_qual = COALESCE(NULLIF($11, ''), highest_qual),
			institution_name = $12,
			occupation = COALESCE(NULLIF($13, ''), occupation),
			prev_training = $14,
			prior_experience = CASE WHEN $15::jsonb != '{}'::jsonb THEN $15::jsonb ELSE prior_experience END,
			preferred_centre = $16,
			training_mode = COALESCE(NULLIF($17, ''), training_mode),
			bank_holder_name = $18,
			bank_name_branch = $19,
			account_number = $20,
			ifsc_code = $21,
			documents = CASE WHEN $22::jsonb != '{}'::jsonb THEN $22::jsonb ELSE documents END
		WHERE id = $23
	`,
		strings.TrimSpace(req.FullName), strings.TrimSpace(req.GuardianName),
		parsedDOB, req.Gender,
		strings.TrimSpace(req.AltMobile), req.GovIDType, strings.TrimSpace(req.GovIDLast4), req.SocialCategory,
		strings.TrimSpace(req.AddressFull), strings.TrimSpace(req.DistrictStatePin),
		req.HighestQual, strings.TrimSpace(req.InstitutionName), req.Occupation,
		strings.TrimSpace(req.PrevTraining), expBytes, strings.TrimSpace(req.PreferredCentre), req.TrainingMode,
		strings.TrimSpace(req.BankHolderName), strings.TrimSpace(req.BankNameBranch),
		strings.TrimSpace(req.AccountNumber), strings.TrimSpace(req.IFSCCode),
		docBytes, appID,
	)

	if err != nil {
		log.Printf("[UPDATE APPLICATION ERROR] app=%s err=%v", appID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application."})
		return
	}

	if strings.TrimSpace(req.FullName) != "" {
		_, _ = h.DB.Exec(ctx, `UPDATE users SET full_name = $1 WHERE id = (SELECT user_id FROM applications WHERE id = $2)`, strings.TrimSpace(req.FullName), appID)
	}

	if isAdmin {
		adminID := c.GetString("user_id")
		var aID *string
		if adminID != "" {
			aID = &adminID
		}
		audit.LogDetailed(
			ctx,
			h.DB,
			aID,
			userRole,
			audit.ActionApplicationDossierUpdated,
			&appID,
			"application",
			c.ClientIP(),
			c.GetHeader("User-Agent"),
			map[string]any{"status": currentStatus},
			map[string]any{"full_name": req.FullName, "highest_qual": req.HighestQual},
			map[string]any{"app_id": appID, "updated_by": userRole},
			"SUCCESS",
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Enrolment dossier updated successfully",
		"id":      appID,
	})
}
