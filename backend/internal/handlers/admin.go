package handlers

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/models"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

// Metrics returns live counters and per-category capacity breakdowns
func (h *AdminHandler) Metrics(c *gin.Context) {
	ctx := context.Background()

	var total, pending, approved, rejected int
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM applications`).Scan(&total)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE status='PENDING'`).Scan(&pending)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE status='APPROVED'`).Scan(&approved)
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE status='REJECTED'`).Scan(&rejected)

	rows, err := h.DB.Query(ctx, `
		SELECT jc.id, jc.code, jc.title, jc.approval_limit, jc.approved_count, jc.is_approval_open,
		       COUNT(a.id) FILTER (WHERE a.status = 'PENDING') AS pending_count
		FROM job_categories jc
		LEFT JOIN applications a ON a.category_id = jc.id
		GROUP BY jc.id, jc.code, jc.title, jc.approval_limit, jc.approved_count, jc.is_approval_open
		ORDER BY jc.id ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate category metrics"})
		return
	}
	defer rows.Close()

	var categories []models.CategoryMetric
	for rows.Next() {
		var m models.CategoryMetric
		if err := rows.Scan(&m.CategoryID, &m.Code, &m.Title, &m.ApprovalLimit, &m.ApprovedCount, &m.IsApprovalOpen, &m.PendingCount); err != nil {
			continue
		}
		m.RemainingQuota = m.ApprovalLimit - m.ApprovedCount
		if m.RemainingQuota < 0 {
			m.RemainingQuota = 0
		}
		categories = append(categories, m)
	}
	if categories == nil {
		categories = []models.CategoryMetric{}
	}

	c.JSON(http.StatusOK, models.AdminMetricsResponse{
		TotalApplied: total,
		Pending:      pending,
		Approved:     approved,
		Rejected:     rejected,
		Categories:   categories,
	})
}

// ListApplications provides a paginated, filtered list of candidate registrations
func (h *AdminHandler) ListApplications(c *gin.Context) {
	ctx := context.Background()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	categoryIDStr := c.Query("category_id")
	status := c.Query("status")
	district := c.Query("district")
	socialCategory := c.Query("social_category")
	searchQuery := c.Query("search_query")

	baseWhere := " WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if categoryIDStr != "" {
		if catID, err := strconv.Atoi(categoryIDStr); err == nil && catID > 0 {
			baseWhere += fmt.Sprintf(" AND a.category_id = $%d", argIdx)
			args = append(args, catID)
			argIdx++
		}
	}

	if status != "" && status != "ALL" {
		baseWhere += fmt.Sprintf(" AND a.status = $%d", argIdx)
		args = append(args, strings.ToUpper(status))
		argIdx++
	}

	if district != "" {
		baseWhere += fmt.Sprintf(" AND a.district_state_pin ILIKE $%d", argIdx)
		args = append(args, "%"+district+"%")
		argIdx++
	}

	if socialCategory != "" && socialCategory != "ALL" {
		baseWhere += fmt.Sprintf(" AND a.social_category = $%d", argIdx)
		args = append(args, strings.ToUpper(socialCategory))
		argIdx++
	}

	if searchQuery != "" {
		baseWhere += fmt.Sprintf(" AND (a.registration_no ILIKE $%d OR a.full_name ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+searchQuery+"%")
		argIdx++
	}

	// Count total records
	var total int
	countQuery := "SELECT COUNT(*) FROM applications a" + baseWhere
	err := h.DB.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count applications"})
		return
	}

	// Select records
	dataQuery := fmt.Sprintf(`
		SELECT a.id, a.registration_no, a.user_id, a.category_id, jc.code, jc.title,
		       a.full_name, a.guardian_name, a.dob, a.gender, a.social_category,
		       a.district_state_pin, a.gov_id_type, a.gov_id_last4, a.highest_qual,
		       a.training_mode, a.status, a.rejection_reason, a.submitted_at, a.reviewed_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		%s
		ORDER BY a.submitted_at DESC
		LIMIT $%d OFFSET $%d
	`, baseWhere, argIdx, argIdx+1)

	queryArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(ctx, dataQuery, queryArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query applications"})
		return
	}
	defer rows.Close()

	var apps []gin.H
	for rows.Next() {
		var (
			id, regNo, userID, catCode, catTitle, fullName, guardian, gender, socialCat string
			districtState, govIDType, govIDLast4, highestQual, trainingMode, appStatus string
			catID                                                                      int
			dob                                                                        time.Time
			submittedAt                                                                time.Time
			rejectionReason                                                            *string
			reviewedAt                                                                 *time.Time
		)

		err := rows.Scan(
			&id, &regNo, &userID, &catID, &catCode, &catTitle,
			&fullName, &guardian, &dob, &gender, &socialCat,
			&districtState, &govIDType, &govIDLast4, &highestQual,
			&trainingMode, &appStatus, &rejectionReason, &submittedAt, &reviewedAt,
		)
		if err != nil {
			continue
		}

		apps = append(apps, gin.H{
			"id":                 id,
			"registration_no":    regNo,
			"user_id":            userID,
			"category_id":        catID,
			"category_code":      catCode,
			"category_title":     catTitle,
			"full_name":          fullName,
			"guardian_name":      guardian,
			"dob":                dob.Format("2006-01-02"),
			"gender":             gender,
			"social_category":    socialCat,
			"district_state_pin": districtState,
			"gov_id_type":        govIDType,
			"gov_id_last4":       govIDLast4,
			"highest_qual":       highestQual,
			"training_mode":      trainingMode,
			"status":             appStatus,
			"rejection_reason":   rejectionReason,
			"submitted_at":       submittedAt,
			"reviewed_at":        reviewedAt,
		})
	}
	if apps == nil {
		apps = []gin.H{}
	}

	totalPages := (total + pageSize - 1) / pageSize
	if totalPages == 0 {
		totalPages = 1
	}

	adminID := c.GetString("user_id")
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionApplicationsViewed,
		nil,
		"applications",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"page":            page,
			"page_size":       pageSize,
			"category_id":     categoryIDStr,
			"status":          status,
			"district":        district,
			"social_category": socialCategory,
			"search_query":    searchQuery,
			"total_results":   total,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"data":        apps,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// GetApplication returns full applicant dossier and documents for review drawer
func (h *AdminHandler) GetApplication(c *gin.Context) {
	ctx := context.Background()
	appID := c.Param("id")

	query := `
		SELECT a.id, a.registration_no, a.user_id, a.category_id, jc.code, jc.title,
		       jc.approval_limit, jc.approved_count, jc.is_approval_open,
		       a.full_name, a.guardian_name, a.dob, a.gender, a.alt_mobile,
		       a.gov_id_type, a.gov_id_last4, a.social_category, a.address_full,
		       a.district_state_pin, a.emergency_contact, a.highest_qual, a.institution_name,
		       a.occupation, a.prev_training, a.prior_experience, a.disability_req,
		       a.preferred_centre, a.training_mode, a.bank_holder_name, a.bank_name_branch,
		       a.account_number, a.ifsc_code, a.documents, a.status,
		       a.rejection_reason, a.reviewed_by, a.reviewed_at, a.submitted_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		WHERE a.id = $1
	`

	var (
		id, regNo, userID, catCode, catTitle, fullName, guardian, gender, govIDType, govIDLast4 string
		socialCat, addressFull, districtState, highestQual, occupation, trainingMode, status    string
		catID, approvalLimit, approvedCount                                                     int
		isApprovalOpen                                                                          bool
		dob, submittedAt                                                                        time.Time
		altMobile, institutionName, prevTraining, preferredCentre                               *string
		bankHolderName, bankNameBranch, accountNumber, ifscCode                                 *string
		rejectionReason, reviewedBy                                                             *string
		reviewedAt                                                                              *time.Time
		emergencyContactRaw, priorExpRaw, disabilityReqRaw, documentsRaw                        []byte
	)

	err := h.DB.QueryRow(ctx, query, appID).Scan(
		&id, &regNo, &userID, &catID, &catCode, &catTitle,
		&approvalLimit, &approvedCount, &isApprovalOpen,
		&fullName, &guardian, &dob, &gender, &altMobile,
		&govIDType, &govIDLast4, &socialCat, &addressFull,
		&districtState, &emergencyContactRaw, &highestQual, &institutionName,
		&occupation, &prevTraining, &priorExpRaw, &disabilityReqRaw,
		&preferredCentre, &trainingMode, &bankHolderName, &bankNameBranch,
		&accountNumber, &ifscCode, &documentsRaw, &status,
		&rejectionReason, &reviewedBy, &reviewedAt, &submittedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application record not found"})
		return
	}

	var emergencyContact, priorExperience, disabilityReq, documents interface{}
	_ = json.Unmarshal(emergencyContactRaw, &emergencyContact)
	_ = json.Unmarshal(priorExpRaw, &priorExperience)
	_ = json.Unmarshal(disabilityReqRaw, &disabilityReq)
	_ = json.Unmarshal(documentsRaw, &documents)

	adminID := c.GetString("user_id")
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionApplicationInspected,
		&appID,
		"application",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"registration_no": regNo,
			"category_code":   catCode,
			"status":          status,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"id":                 id,
		"registration_no":    regNo,
		"user_id":            userID,
		"category_id":        catID,
		"category_code":      catCode,
		"category_title":     catTitle,
		"approval_limit":     approvalLimit,
		"approved_count":     approvedCount,
		"is_approval_open":   isApprovalOpen,
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
		"emergency_contact":  emergencyContact,
		"highest_qual":       highestQual,
		"institution_name":   institutionName,
		"occupation":         occupation,
		"prev_training":      prevTraining,
		"prior_experience":   priorExperience,
		"disability_req":     disabilityReq,
		"preferred_centre":   preferredCentre,
		"training_mode":      trainingMode,
		"bank_holder_name":   bankHolderName,
		"bank_name_branch":   bankNameBranch,
		"account_number":     accountNumber,
		"ifsc_code":          ifscCode,
		"documents":          documents,
		"status":             status,
		"rejection_reason":   rejectionReason,
		"reviewed_by":        reviewedBy,
		"reviewed_at":        reviewedAt,
		"submitted_at":       submittedAt,
	})
}

// Approve atomically enforces the category quota using PostgreSQL Row-Level Lock (SELECT FOR UPDATE)
func (h *AdminHandler) Approve(c *gin.Context) {
	ctx := context.Background()
	appID := c.Param("id")
	adminID := c.GetString("user_id")
	clientIP := c.ClientIP()

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize atomic transaction"})
		return
	}
	defer tx.Rollback(ctx)

	// Step 1: Verify application existence and current status
	var categoryID int
	var currentStatus string
	err = tx.QueryRow(ctx,
		`SELECT category_id, status FROM applications WHERE id = $1`, appID,
	).Scan(&categoryID, &currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	if currentStatus != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Application cannot be approved because it is already %s", currentStatus),
		})
		return
	}

	// Step 2: Row-level lock on the target job category
	var approvalLimit, approvedCount int
	var isApprovalOpen bool
	var categoryCode string
	err = tx.QueryRow(ctx,
		`SELECT code, approval_limit, approved_count, is_approval_open
		 FROM job_categories
		 WHERE id = $1 FOR UPDATE`,
		categoryID,
	).Scan(&categoryCode, &approvalLimit, &approvedCount, &isApprovalOpen)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acquire quota lock on artisan category"})
		return
	}

	// Step 3: Hard quota enforcement check
	if !isApprovalOpen || approvedCount >= approvalLimit {
		// Rollback immediately and return HTTP 409 Conflict
		c.JSON(http.StatusConflict, gin.H{
			"error": fmt.Sprintf("Category approval quota for %s has been reached (%d/%d). Approvals are closed.", categoryCode, approvedCount, approvalLimit),
			"code":  "QUOTA_FULL",
		})
		return
	}

	// Step 4: Advance approval
	now := time.Now()
	newApprovedCount := approvedCount + 1
	newIsOpen := newApprovedCount < approvalLimit

	// Update applications
	_, err = tx.Exec(ctx,
		`UPDATE applications
		 SET status = 'APPROVED', reviewed_by = $1, reviewed_at = $2, rejection_reason = NULL
		 WHERE id = $3 AND status = 'PENDING'`,
		adminID, now, appID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update candidate approval status"})
		return
	}

	// Update category approved headcount and lock flag
	_, err = tx.Exec(ctx,
		`UPDATE job_categories
		 SET approved_count = $1, is_approval_open = $2
		 WHERE id = $3`,
		newApprovedCount, newIsOpen, categoryID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to increment artisan quota"})
		return
	}

	// Step 5: Commit transaction
	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit approval transaction"})
		return
	}

	// Step 6: Append immutable audit log to date-partitioned file & database
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionApplicationApprove,
		&appID,
		"application",
		clientIP,
		c.GetHeader("User-Agent"),
		map[string]any{
			"status":         currentStatus,
			"approved_count": approvedCount,
			"is_open":        isApprovalOpen,
			"category_code":  categoryCode,
		},
		map[string]any{
			"status":         "APPROVED",
			"approved_count": newApprovedCount,
			"is_open":        newIsOpen,
			"category_code":  categoryCode,
		},
		map[string]any{
			"category_id":   categoryID,
			"category_code": categoryCode,
			"app_id":        appID,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"message":          "Application approved successfully",
		"category_code":    categoryCode,
		"approved_count":   newApprovedCount,
		"approval_limit":   approvalLimit,
		"is_approval_open": newIsOpen,
	})
}

// Reject updates an application with a mandatory reason within an ACID transaction
func (h *AdminHandler) Reject(c *gin.Context) {
	ctx := context.Background()
	appID := c.Param("id")
	adminID := c.GetString("user_id")
	clientIP := c.ClientIP()

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(strings.TrimSpace(req.Reason)) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "A detailed rejection reason of at least 10 characters is required for audit trails.",
		})
		return
	}
	trimmedReason := strings.TrimSpace(req.Reason)

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize rejection transaction"})
		return
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	err = tx.QueryRow(ctx, `SELECT status FROM applications WHERE id = $1`, appID).Scan(&currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	if currentStatus != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Application cannot be rejected because it is currently %s", currentStatus),
		})
		return
	}

	now := time.Now()
	_, err = tx.Exec(ctx,
		`UPDATE applications
		 SET status = 'REJECTED', rejection_reason = $1, reviewed_by = $2, reviewed_at = $3
		 WHERE id = $4 AND status = 'PENDING'`,
		trimmedReason, adminID, now, appID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject application"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit rejection"})
		return
	}

	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionApplicationReject,
		&appID,
		"application",
		clientIP,
		c.GetHeader("User-Agent"),
		map[string]any{
			"status": currentStatus,
		},
		map[string]any{
			"status": "REJECTED",
			"reason": trimmedReason,
		},
		map[string]any{
			"app_id": appID,
			"reason": trimmedReason,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Application rejected and logged for audit.",
	})
}

// ExportCSV streams a CSV file of verified and approved trainees for training centers
func (h *AdminHandler) ExportCSV(c *gin.Context) {
	ctx := context.Background()

	categoryIDStr := c.Query("category_id")
	status := strings.ToUpper(c.DefaultQuery("status", "APPROVED"))

	whereClause := "WHERE a.status = $1"
	args := []interface{}{status}

	if categoryIDStr != "" {
		if catID, err := strconv.Atoi(categoryIDStr); err == nil && catID > 0 {
			whereClause += " AND a.category_id = $2"
			args = append(args, catID)
		}
	}

	query := fmt.Sprintf(`
		SELECT a.registration_no, a.full_name, a.guardian_name, jc.code, jc.title,
		       a.gender, a.dob, a.social_category, a.district_state_pin, a.gov_id_type,
		       a.gov_id_last4, a.highest_qual, a.training_mode, COALESCE(a.bank_holder_name, ''),
		       COALESCE(a.bank_name_branch, ''), COALESCE(a.account_number, ''),
		       COALESCE(a.ifsc_code, ''), a.status, a.submitted_at, a.reviewed_at
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		%s
		ORDER BY a.reviewed_at DESC NULLS LAST, a.submitted_at ASC
	`, whereClause)

	rows, err := h.DB.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query trainee export records"})
		return
	}
	defer rows.Close()

	adminID := c.GetString("user_id")
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionDataExported,
		nil,
		"trainee_export",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"status":      status,
			"category_id": categoryIDStr,
		},
		"SUCCESS",
	)

	fileName := fmt.Sprintf("handloom_trainees_%s_%s.csv", strings.ToLower(status), time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Header("Transfer-Encoding", "chunked")

	// UTF-8 BOM for Microsoft Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	headers := []string{
		"Registration Number",
		"Trainee Full Name",
		"Father / Guardian Name",
		"Job Role Code",
		"Job Role Title",
		"Gender",
		"Date of Birth",
		"Social Category",
		"District & State",
		"Govt ID Type",
		"Govt ID Last 4",
		"Highest Qualification",
		"Training Mode",
		"Bank Account Holder",
		"Bank & Branch",
		"Bank Account Number",
		"IFSC Code",
		"Application Status",
		"Submission Timestamp",
		"Approval / Review Timestamp",
	}
	if err := writer.Write(headers); err != nil {
		return
	}

	for rows.Next() {
		var (
			regNo, fullName, guardian, catCode, catTitle, gender, socialCat string
			districtState, govIDType, govIDLast4, highestQual, trainingMode string
			bankHolder, bankBranch, accountNum, ifsc, appStatus             string
			dob, submittedAt                                                time.Time
			reviewedAt                                                      *time.Time
		)

		err := rows.Scan(
			&regNo, &fullName, &guardian, &catCode, &catTitle,
			&gender, &dob, &socialCat, &districtState, &govIDType,
			&govIDLast4, &highestQual, &trainingMode, &bankHolder,
			&bankBranch, &accountNum, &ifsc, &appStatus,
			&submittedAt, &reviewedAt,
		)
		if err != nil {
			continue
		}

		reviewedAtStr := ""
		if reviewedAt != nil {
			reviewedAtStr = reviewedAt.Format("2006-01-02 15:04:05")
		}

		row := []string{
			regNo,
			fullName,
			guardian,
			catCode,
			catTitle,
			gender,
			dob.Format("2006-01-02"),
			socialCat,
			districtState,
			govIDType,
			govIDLast4,
			highestQual,
			trainingMode,
			bankHolder,
			bankBranch,
			accountNum,
			ifsc,
			appStatus,
			submittedAt.Format("2006-01-02 15:04:05"),
			reviewedAtStr,
		}
		_ = writer.Write(row)
	}
}

// UpdateCategoryQuota allows Super Admins to modify category capacity limits within an ACID transaction
func (h *AdminHandler) UpdateCategoryQuota(c *gin.Context) {
	ctx := context.Background()
	userRole := c.GetString("role")
	if userRole != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can modify category quota allocations."})
		return
	}

	adminID := c.GetString("user_id")
	clientIP := c.ClientIP()
	catIDStr := c.Param("id")
	catID, err := strconv.Atoi(catIDStr)
	if err != nil || catID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var req struct {
		ApprovalLimit int `json:"approval_limit" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.ApprovalLimit <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sanctioned quota limit must be a positive integer greater than zero."})
		return
	}

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start quota update transaction"})
		return
	}
	defer tx.Rollback(ctx)

	var code, title string
	var currentLimit, approvedCount int
	var currentIsOpen bool

	err = tx.QueryRow(ctx, `
		SELECT code, title, approval_limit, approved_count, is_approval_open
		FROM job_categories
		WHERE id = $1
		FOR UPDATE
	`, catID).Scan(&code, &title, &currentLimit, &approvedCount, &currentIsOpen)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target artisan trade category not found"})
		return
	}

	if req.ApprovalLimit < approvedCount {
		c.JSON(http.StatusConflict, gin.H{
			"error": fmt.Sprintf("Cannot reduce category quota to %d because %d candidates have already been approved and inducted.", req.ApprovalLimit, approvedCount),
		})
		return
	}

	newIsOpen := req.ApprovalLimit > approvedCount

	_, err = tx.Exec(ctx, `
		UPDATE job_categories
		SET approval_limit = $1, is_approval_open = $2
		WHERE id = $3
	`, req.ApprovalLimit, newIsOpen, catID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category quota"})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit quota modification"})
		return
	}

	// Audit trail logging to persistent file and database
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	catIDStrVal := strconv.Itoa(catID)
	audit.LogDetailed(
		ctx,
		h.DB,
		aID,
		userRole,
		audit.ActionQuotaUpdated,
		&catIDStrVal,
		"job_category",
		clientIP,
		c.GetHeader("User-Agent"),
		map[string]any{
			"code":             code,
			"approval_limit":   currentLimit,
			"approved_count":   approvedCount,
			"is_approval_open": currentIsOpen,
		},
		map[string]any{
			"code":             code,
			"approval_limit":   req.ApprovalLimit,
			"approved_count":   approvedCount,
			"is_approval_open": newIsOpen,
		},
		map[string]any{
			"category_id": catID,
			"code":        code,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"message":          fmt.Sprintf("Category %s quota successfully updated to %d seats", code, req.ApprovalLimit),
		"category_id":      catID,
		"code":             code,
		"title":            title,
		"approval_limit":   req.ApprovalLimit,
		"approved_count":   approvedCount,
		"remaining_quota":  req.ApprovalLimit - approvedCount,
		"is_approval_open": newIsOpen,
	})
}
