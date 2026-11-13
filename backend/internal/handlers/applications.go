package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
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
	identifier := c.Query("identifier")
	if identifier == "" {
		identifier = c.Query("reg_no")
	}
	if identifier == "" {
		identifier = c.Query("mobile_number")
	}
	dobStr := c.Query("dob")

	if identifier == "" || dobStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Registered mobile number and Date of Birth are required"})
		return
	}

	var result struct {
		FullName        string  `json:"full_name"`
		Category        string  `json:"category"`
		CategoryCode    string  `json:"category_code"`
		SubmittedAt     string  `json:"submitted_at"`
		Status          string  `json:"status"`
		RejectionReason *string `json:"rejection_reason,omitempty"`
	}

	var submittedAt time.Time
	err := h.DB.QueryRow(context.Background(), `
		SELECT a.full_name, jc.title, jc.code, a.submitted_at, a.status, a.rejection_reason
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		JOIN users u ON u.id = a.user_id
		WHERE (u.mobile_number = $1 OR a.registration_no = $1) AND a.dob = $2::date
		ORDER BY a.submitted_at DESC
		LIMIT 1
	`, identifier, dobStr).Scan(
		&result.FullName, &result.Category, &result.CategoryCode,
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
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid application data: %v", err)})
		return
	}

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
	err := h.DB.QueryRow(context.Background(),
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
	_ = h.DB.QueryRow(context.Background(),
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

	// Defaults for flexible Apply Online form
	if req.Gender == "" {
		req.Gender = "MALE"
	}
	if req.GovIDType == "" {
		req.GovIDType = "Aadhaar"
	}
	if req.GovIDLast4 == "" {
		req.GovIDLast4 = "0000"
	}
	if req.SocialCategory == "" {
		req.SocialCategory = "GENERAL"
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

	// Prepare Documents & Photograph
	if req.Documents == nil {
		req.Documents = make(map[string]string)
	}
	if req.PhotographURL != "" {
		req.Documents["photograph"] = req.PhotographURL
	}
	docBytes, _ := json.Marshal(req.Documents)

	// Prepare Prior Experience
	expData := map[string]interface{}{}
	if req.RelevantExp != "" {
		expData["has_experience"] = true
		expData["details"] = req.RelevantExp
	}
	expBytes, _ := json.Marshal(expData)

	var appID string
	var status string
	var submittedAt time.Time

	err = h.DB.QueryRow(context.Background(), `
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
		strings.TrimSpace(req.FullName), strings.TrimSpace(req.GuardianName), parsedDOB, req.Gender,
		strings.TrimSpace(req.AltMobile), req.GovIDType, strings.TrimSpace(req.GovIDLast4), req.SocialCategory,
		strings.TrimSpace(req.AddressFull), strings.TrimSpace(req.DistrictStatePin),
		req.HighestQual, strings.TrimSpace(req.InstitutionName), req.Occupation,
		strings.TrimSpace(req.PrevTraining), expBytes, strings.TrimSpace(req.PreferredCentre), req.TrainingMode,
		strings.TrimSpace(req.BankHolderName), strings.TrimSpace(req.BankNameBranch),
		strings.TrimSpace(req.AccountNumber), strings.TrimSpace(req.IFSCCode),
		docBytes,
	).Scan(&appID, &status, &submittedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save application: %v", err)})
		return
	}

	// Note: Internal registration_no is stored for Admins, but hidden from regular candidates
	c.JSON(http.StatusCreated, gin.H{
		"message":      "Application submitted and saved successfully",
		"id":           appID,
		"status":       status,
		"submitted_at": submittedAt.Format(time.RFC3339),
	})
}

// MyApplications returns applications for the logged-in candidate
func (h *ApplicationHandler) MyApplications(c *gin.Context) {
	userID := c.GetString("user_id")
	userRole := c.GetString("role")

	rows, err := h.DB.Query(context.Background(), `
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

	isAdmin := (userRole == "SUPER_ADMIN" || userRole == "REVIEWER_ADMIN")

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

		// Only expose internal reference numbers to administrative accounts
		if isAdmin {
			item["registration_no"] = regNo
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
	ctx := context.Background()
	appID := c.Param("id")
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
		"account_number":     accountNumber,
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

// UploadFile handles candidate document uploads with file type and 5MB validation
func (h *ApplicationHandler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		file, err = c.FormFile("document")
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded. Please select a valid document or image."})
		return
	}

	// 5MB limit
	const maxFileSize = 5 * 1024 * 1024
	if file.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size exceeds 5MB limit. Please compress or choose a smaller file."})
		return
	}

	// Validate extension
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

	uploadDir := h.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare storage directory"})
		return
	}

	// Safe filename: prefix with 8 char UUID
	safeName := fmt.Sprintf("%s%s", uuid.New().String()[:12], ext)
	dstPath := filepath.Join(uploadDir, safeName)

	if err := c.SaveUploadedFile(file, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":       "/uploads/" + safeName,
		"filename":  file.Filename,
		"size":      file.Size,
		"extension": ext,
		"message":   "File uploaded successfully",
	})
}

// GetApplicationDossier returns full editable candidate dossier for the Registration Update Form
func (h *ApplicationHandler) GetApplicationDossier(c *gin.Context) {
	ctx := context.Background()
	appID := c.Param("id")
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
		"account_number":     accountNumber,
		"ifsc_code":          ifscCode,
		"documents":          docs,
		"status":             status,
		"rejection_reason":   rejectionReason,
		"submitted_at":       submittedAt.Format(time.RFC3339),
	}
	if isAdmin {
		res["registration_no"] = regNo
	}

	c.JSON(http.StatusOK, res)
}

// UpdateApplication allows candidate to update their pending admission enrolment dossier
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	ctx := context.Background()
	appID := c.Param("id")
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
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid data: %v", err)})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update application: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Enrolment dossier updated successfully",
		"id":      appID,
	})
}
