package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/session"
)

// ListCandidates lists all users with role='APPLICANT', paginated, with candidate names, rich status/category info, and multi-type filters
func (h *AdminHandler) ListCandidates(c *gin.Context) {
	if !checkAdminPermission(c.Request.Context(), h.DB, c.GetString("user_id"), c.GetString("role"), "can_review") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your administrator account does not have permission to view candidates."})
		return
	}
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Filters
	search := strings.TrimSpace(c.Query("search"))
	nameFilter := strings.TrimSpace(c.Query("name"))
	mobileFilter := strings.TrimSpace(c.Query("mobile"))
	emailFilter := strings.TrimSpace(c.Query("email"))
	minAppsStr := strings.TrimSpace(c.Query("min_applications"))
	maxAppsStr := strings.TrimSpace(c.Query("max_applications"))
	hasAppsStr := strings.ToLower(strings.TrimSpace(c.Query("has_applications")))
	statusFilter := strings.ToUpper(strings.TrimSpace(c.Query("status")))
	socialCatFilter := strings.ToUpper(strings.TrimSpace(c.Query("social_category")))
	dateFromStr := strings.TrimSpace(c.Query("date_from"))
	dateToStr := strings.TrimSpace(c.Query("date_to"))

	var whereClauses []string
	var args []any
	argIdx := 1

	// 1. Text field searches
	if nameFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("full_name ILIKE $%d", argIdx))
		args = append(args, "%"+nameFilter+"%")
		argIdx++
	}

	if mobileFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("mobile_number ILIKE $%d", argIdx))
		args = append(args, "%"+mobileFilter+"%")
		argIdx++
	}

	if emailFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("email ILIKE $%d", argIdx))
		args = append(args, "%"+emailFilter+"%")
		argIdx++
	}

	// 2. Global search
	if search != "" {
		sPattern := "%" + search + "%"
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(mobile_number ILIKE $%d OR full_name ILIKE $%d OR email ILIKE $%d OR id::text ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx,
		))
		args = append(args, sPattern)
		argIdx++
	}

	// 3. Numeric range: Min-Max applications
	if minAppsStr != "" {
		if minVal, err := strconv.Atoi(minAppsStr); err == nil && minVal >= 0 {
			whereClauses = append(whereClauses, fmt.Sprintf("application_count >= $%d", argIdx))
			args = append(args, minVal)
			argIdx++
		}
	}
	if maxAppsStr != "" {
		if maxVal, err := strconv.Atoi(maxAppsStr); err == nil && maxVal >= 0 {
			whereClauses = append(whereClauses, fmt.Sprintf("application_count <= $%d", argIdx))
			args = append(args, maxVal)
			argIdx++
		}
	}

	// 4. Boolean field: Has applications (yes/no)
	if hasAppsStr == "true" || hasAppsStr == "yes" {
		whereClauses = append(whereClauses, "application_count > 0")
	} else if hasAppsStr == "false" || hasAppsStr == "no" {
		whereClauses = append(whereClauses, "application_count = 0")
	}

	// 5. Status / Category fields: Dropdown / multi-select
	if statusFilter != "" && statusFilter != "ALL" {
		whereClauses = append(whereClauses, fmt.Sprintf("latest_status = $%d", argIdx))
		args = append(args, statusFilter)
		argIdx++
	}

	if socialCatFilter != "" && socialCatFilter != "ALL" {
		whereClauses = append(whereClauses, fmt.Sprintf("social_category = $%d", argIdx))
		args = append(args, socialCatFilter)
		argIdx++
	}

	// 6. Date range: Dates (created_at)
	if dateFromStr != "" {
		if _, err := time.Parse("2006-01-02", dateFromStr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_from format. Expected YYYY-MM-DD."})
			return
		}
		whereClauses = append(whereClauses, fmt.Sprintf("created_at >= $%d::timestamptz", argIdx))
		args = append(args, dateFromStr)
		argIdx++
	}

	if dateToStr != "" {
		if _, err := time.Parse("2006-01-02", dateToStr); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_to format. Expected YYYY-MM-DD."})
			return
		}
		whereClauses = append(whereClauses, fmt.Sprintf("created_at <= ($%d::date + INTERVAL '1 day')", argIdx))
		args = append(args, dateToStr)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	cteSQL := `
		WITH candidate_summary AS (
			SELECT 
				u.id, 
				u.mobile_number, 
				COALESCE(u.email, '') AS email, 
				u.created_at,
				COALESCE(NULLIF(u.full_name, ''), NULLIF(latest_app.full_name, ''), '') AS full_name,
				COUNT(a.id)::int AS application_count,
				COALESCE(latest_app.status, 'NONE') AS latest_status,
				COALESCE(latest_app.social_category, 'NONE') AS social_category
			FROM users u
			LEFT JOIN applications a ON a.user_id = u.id
			LEFT JOIN (
				SELECT DISTINCT ON (user_id) user_id, full_name, status, social_category, submitted_at
				FROM applications
				ORDER BY user_id, submitted_at DESC
			) latest_app ON latest_app.user_id = u.id
			WHERE u.role = 'APPLICANT'
			GROUP BY u.id, u.mobile_number, u.email, u.created_at, u.full_name, latest_app.full_name, latest_app.status, latest_app.social_category
		)
	`

	countQuery := cteSQL + " SELECT COUNT(*) FROM candidate_summary " + whereSQL
	var total int
	if err := h.DB.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		log.Printf("[CANDIDATES COUNT ERROR] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count candidates"})
		return
	}

	dataQuery := fmt.Sprintf(`
		%s
		SELECT 
			id, mobile_number, email, created_at, full_name,
			application_count, latest_status, social_category
		FROM candidate_summary
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, cteSQL, whereSQL, argIdx, argIdx+1)

	queryArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(ctx, dataQuery, queryArgs...)
	if err != nil {
		log.Printf("[CANDIDATES QUERY ERROR] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query candidates"})
		return
	}
	defer rows.Close()

	var candidates []gin.H
	for rows.Next() {
		var (
			id, mobileNumber, email, fullName, latestStatus, socialCategory string
			createdAt                                                       time.Time
			applicationCount                                                int
		)
		if err := rows.Scan(&id, &mobileNumber, &email, &createdAt, &fullName, &applicationCount, &latestStatus, &socialCategory); err != nil {
			continue
		}
		candidates = append(candidates, gin.H{
			"id":                id,
			"mobile_number":     mobileNumber,
			"email":             email,
			"created_at":        createdAt,
			"full_name":         fullName,
			"application_count": applicationCount,
			"latest_status":     latestStatus,
			"social_category":   socialCategory,
		})
	}
	if candidates == nil {
		candidates = []gin.H{}
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
		audit.ActionCandidatesViewed,
		nil,
		"candidates",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"page":              page,
			"page_size":         pageSize,
			"search":            search,
			"name_filter":       nameFilter,
			"mobile_filter":     mobileFilter,
			"email_filter":      emailFilter,
			"min_applications":  minAppsStr,
			"max_applications":  maxAppsStr,
			"has_applications":  hasAppsStr,
			"status_filter":     statusFilter,
			"social_cat_filter": socialCatFilter,
			"date_from":         dateFromStr,
			"date_to":           dateToStr,
			"total_matches":     total,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"data":        candidates,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// ListUsers lists users with role filtering, multi-field search (ID, mobile, name), and names — SUPER_ADMIN only
func (h *AdminHandler) ListUsers(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can list all users."})
		return
	}

	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Filters
	search := strings.TrimSpace(c.Query("search"))
	userIDFilter := strings.TrimSpace(c.Query("user_id"))
	mobileFilter := strings.TrimSpace(c.Query("mobile"))
	nameFilter := strings.TrimSpace(c.Query("name"))
	emailFilter := strings.TrimSpace(c.Query("email"))
	roleParam := strings.ToUpper(strings.TrimSpace(c.Query("role")))
	includeApplicants := c.Query("include_applicants") == "true"

	// Default behavior: filter out role APPLICANT from user tab unless explicitly requested
	if roleParam == "" && !includeApplicants {
		roleParam = "STAFF"
	}

	var whereClauses []string
	var args []any
	argIdx := 1

	// Role filter
	if roleParam == "STAFF" || roleParam == "EXCLUDE_APPLICANT" {
		whereClauses = append(whereClauses, "u.role != 'APPLICANT'")
	} else if roleParam != "ALL" && roleParam != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("u.role = $%d", argIdx))
		args = append(args, roleParam)
		argIdx++
	}

	// Explicit search by User ID (partial UUID or full UUID)
	if userIDFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("u.id::text ILIKE $%d", argIdx))
		args = append(args, "%"+userIDFilter+"%")
		argIdx++
	}

	// Explicit search by Mobile
	if mobileFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("u.mobile_number ILIKE $%d", argIdx))
		args = append(args, "%"+mobileFilter+"%")
		argIdx++
	}

	// Explicit search by Name
	if nameFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("COALESCE(NULLIF(u.full_name, ''), NULLIF(app.full_name, ''), '') ILIKE $%d", argIdx))
		args = append(args, "%"+nameFilter+"%")
		argIdx++
	}

	// Explicit search by Email
	if emailFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("COALESCE(u.email, '') ILIKE $%d", argIdx))
		args = append(args, "%"+emailFilter+"%")
		argIdx++
	}

	// General search across ID, mobile, name, email
	if search != "" {
		sPattern := "%" + search + "%"
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(u.mobile_number ILIKE $%d OR u.id::text ILIKE $%d OR COALESCE(NULLIF(u.full_name, ''), NULLIF(app.full_name, ''), '') ILIKE $%d OR COALESCE(u.email, '') ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx,
		))
		args = append(args, sPattern)
		argIdx++
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	fromJoinSQL := `
		FROM users u
		LEFT JOIN (
			SELECT DISTINCT ON (user_id) user_id, full_name
			FROM applications
			WHERE full_name IS NOT NULL AND full_name != ''
			ORDER BY user_id, submitted_at DESC
		) app ON app.user_id = u.id
	`

	countQuery := "SELECT COUNT(*) " + fromJoinSQL + whereSQL
	var total int
	if err := h.DB.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		log.Printf("[USERS COUNT ERROR] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	selectQuery := fmt.Sprintf(`
		SELECT 
			u.id, 
			u.mobile_number, 
			COALESCE(u.email, '') AS email, 
			u.role, 
			u.created_at,
			COALESCE(NULLIF(u.full_name, ''), NULLIF(app.full_name, ''), '') AS full_name,
			COALESCE(u.is_disabled, FALSE) AS is_disabled,
			COALESCE(u.disabled_reason, '') AS disabled_reason,
			COALESCE(u.permissions, '{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}'::jsonb) AS permissions
		%s
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, fromJoinSQL, whereSQL, argIdx, argIdx+1)

	queryArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(ctx, selectQuery, queryArgs...)
	if err != nil {
		log.Printf("[USERS QUERY ERROR] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var (
			id, mobileNumber, email, role, fullName, disabledReason string
			createdAt                                               time.Time
			isDisabled                                              bool
			permBytes                                               []byte
		)
		if err := rows.Scan(&id, &mobileNumber, &email, &role, &createdAt, &fullName, &isDisabled, &disabledReason, &permBytes); err != nil {
			continue
		}
		var permMap map[string]any
		_ = json.Unmarshal(permBytes, &permMap)
		if permMap == nil {
			permMap = map[string]any{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}
		}

		users = append(users, gin.H{
			"id":              id,
			"mobile_number":   mobileNumber,
			"email":           email,
			"role":            role,
			"created_at":      createdAt,
			"full_name":       fullName,
			"is_disabled":     isDisabled,
			"disabled_reason": disabledReason,
			"permissions":     permMap,
		})
	}
	if users == nil {
		users = []gin.H{}
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
		audit.ActionUsersListViewed,
		nil,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"page":          page,
			"page_size":     pageSize,
			"role_filter":   roleParam,
			"user_id_query": userIDFilter,
			"mobile_query":  mobileFilter,
			"name_query":    nameFilter,
			"search":        search,
			"total_matches": total,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"data":        users,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// UpdateUserRole updates a user's role — SUPER_ADMIN only; cannot set SUPER_ADMIN
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can update user roles."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role field is required"})
		return
	}

	newRole := strings.ToUpper(strings.TrimSpace(req.Role))
	if newRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot assign SUPER_ADMIN role"})
		return
	}
	if newRole == "APPLICANT" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot assign a user as APPLICANT. Applicant roles are reserved for candidate self-registration."})
		return
	}
	if newRole != "REVIEWER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be REVIEWER_ADMIN"})
		return
	}

	ctx := c.Request.Context()

	// Capture previous role for audit ledger
	var oldRole string
	err := h.DB.QueryRow(ctx, `SELECT role FROM users WHERE id = $1`, userID).Scan(&oldRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if oldRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN role cannot be modified"})
		return
	}

	res, err := h.DB.Exec(ctx, `UPDATE users SET role = $1 WHERE id = $2`, newRole, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}
	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Security: Immediately terminate active sessions so user cannot reuse outdated permissions
	_ = session.RevokeAllUserSessions(ctx, h.DB, userID, "ROLE_CHANGED")

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
		audit.ActionUserRoleUpdated,
		&userID,
		"user",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		map[string]any{"role": oldRole},
		map[string]any{"role": newRole},
		map[string]any{"target_user": userID, "old_role": oldRole, "new_role": newRole},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{
		"message":  "User role updated successfully",
		"user_id":  userID,
		"new_role": newRole,
	})
}

// CreateAdminUser allows Super Administrators to create new administrative accounts (REVIEWER_ADMIN)
func (h *AdminHandler) CreateAdminUser(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators reserve the right to add admin users."})
		return
	}

	var req struct {
		FullName     string `json:"full_name" binding:"required"`
		MobileNumber string `json:"mobile_number" binding:"required"`
		Email        string `json:"email"`
		Password     string `json:"password" binding:"required"`
		Role         string `json:"role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Full name, mobile number, and password are required"})
		return
	}

	fullName := sanitizeInputMax(req.FullName, 150)
	mobile := strings.TrimSpace(req.MobileNumber)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := req.Password

	if fullName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Full name is required"})
		return
	}
	if email != "" && !isValidEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email address format"})
		return
	}

	// Validate mobile number: exactly 10 digits
	if len(mobile) != 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number must be exactly 10 digits"})
		return
	}
	for _, ch := range mobile {
		if ch < '0' || ch > '9' {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mobile number must contain digits only"})
			return
		}
	}

	// Validate role: cannot create APPLICANT or SUPER_ADMIN
	role := strings.ToUpper(strings.TrimSpace(req.Role))
	if role == "" || role == "REVIEWER_ADMIN" {
		role = "REVIEWER_ADMIN"
	} else if role == "APPLICANT" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot assign a user as APPLICANT. Only admin accounts can be provisioned."})
		return
	} else if role == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN role cannot be duplicated or provisioned."})
		return
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified. Only REVIEWER_ADMIN can be created."})
		return
	}

	if len(password) < 8 || len(password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be between 8 and 72 characters long"})
		return
	}

	ctx := c.Request.Context()

	// Check for existing mobile number
	var existingID string
	err := h.DB.QueryRow(ctx, `SELECT id FROM users WHERE mobile_number = $1`, mobile).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A user with this mobile number already exists"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var newUserID string
	var createdAt time.Time
	err = h.DB.QueryRow(ctx, `
		INSERT INTO users (mobile_number, email, password_hash, role, full_name)
		VALUES ($1, NULLIF($2, ''), $3, $4, $5)
		RETURNING id, created_at
	`, mobile, email, string(hash), role, fullName).Scan(&newUserID, &createdAt)
	if err != nil {
		log.Printf("[CREATE ADMIN ERROR] %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create administrator"})
		return
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
		"ADMIN_USER_CREATED",
		&newUserID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		map[string]any{
			"id":            newUserID,
			"mobile_number": mobile,
			"role":          role,
			"full_name":     fullName,
		},
		map[string]any{
			"created_user_id": newUserID,
			"role":            role,
			"full_name":       fullName,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Administrator created successfully",
		"user": gin.H{
			"id":            newUserID,
			"mobile_number": mobile,
			"email":         email,
			"role":          role,
			"full_name":     fullName,
			"created_at":    createdAt,
		},
	})
}

// DeleteAdminUser deletes or permanently revokes an administrator account — SUPER_ADMIN only, cannot delete SUPER_ADMIN
func (h *AdminHandler) DeleteAdminUser(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can revoke administrator accounts."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	if userID == c.GetString("user_id") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot revoke your own Super Administrator account"})
		return
	}
	ctx := c.Request.Context()

	var targetRole, mobile, fullName string
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, '') FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if targetRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN account cannot be deleted or revoked"})
		return
	}

	// 1. Revoke all active sessions first
	_ = session.RevokeAllUserSessions(ctx, h.DB, userID, "ADMIN_REVOKED")

	// 2. Try hard deletion if no audit trail rows reference this user
	delRes, err := h.DB.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID)
	if err != nil || delRes.RowsAffected() == 0 {
		// If foreign key constraint (e.g. audit_log) prevents hard deletion, permanently disable account & strip permissions
		_, err = h.DB.Exec(ctx, `
			UPDATE users 
			SET is_disabled = TRUE, 
			    disabled_reason = 'ADMIN_ACCESS_REVOKED', 
			    disabled_at = NOW(),
			    permissions = '{"can_review": false, "can_approve": false, "can_reject": false, "can_export": false}'::jsonb
			WHERE id = $1
		`, userID)
		if err != nil {
			log.Printf("[REVOKE ADMIN ERROR] user=%s err=%v", userID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to revoke administrator"})
			return
		}
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
		"ADMIN_USER_REVOKED",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		map[string]any{"id": userID, "role": targetRole, "mobile": mobile, "name": fullName},
		nil,
		map[string]any{"revoked_admin_id": userID, "mobile": mobile},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "Administrator privileges revoked successfully"})
}

// DisableUser temporarily disables an admin account and revokes active sessions — SUPER_ADMIN only
func (h *AdminHandler) DisableUser(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can disable administrator accounts."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	if userID == c.GetString("user_id") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot disable your own active administrator account"})
		return
	}
	ctx := c.Request.Context()

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)
	reason := sanitizeInputMax(req.Reason, 255)
	if reason == "" {
		reason = "Temporarily disabled by Super Administrator"
	}

	var targetRole, mobile, fullName string
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, '') FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if targetRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN account cannot be disabled"})
		return
	}

	// 1. Invalidate active sessions immediately
	_ = session.RevokeAllUserSessions(ctx, h.DB, userID, "ACCOUNT_DISABLED_BY_SUPER_ADMIN")

	// 2. Mark account disabled
	_, err = h.DB.Exec(ctx, `UPDATE users SET is_disabled = TRUE, disabled_reason = $1, disabled_at = NOW() WHERE id = $2`, reason, userID)
	if err != nil {
		log.Printf("[DISABLE USER ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disable account"})
		return
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
		"ADMIN_ACCOUNT_DISABLED",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		map[string]any{"is_disabled": false},
		map[string]any{"is_disabled": true, "reason": reason},
		map[string]any{"target_user": userID, "name": fullName, "mobile": mobile, "reason": reason},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "Administrator account disabled successfully"})
}

// EnableUser reactivates a disabled administrator account — SUPER_ADMIN only
func (h *AdminHandler) EnableUser(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can reactivate administrator accounts."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	ctx := c.Request.Context()

	var targetRole, mobile, fullName string
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, '') FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	_, err = h.DB.Exec(ctx, `UPDATE users SET is_disabled = FALSE, disabled_reason = NULL, disabled_at = NULL WHERE id = $1`, userID)
	if err != nil {
		log.Printf("[ENABLE USER ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reactivate account"})
		return
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
		"ADMIN_ACCOUNT_ENABLED",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		map[string]any{"is_disabled": true},
		map[string]any{"is_disabled": false},
		map[string]any{"target_user": userID, "name": fullName, "mobile": mobile},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "Administrator account reactivated successfully"})
}

// ResetUserPassword securely resets an admin's password and forces session termination — SUPER_ADMIN only
func (h *AdminHandler) ResetUserPassword(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can reset administrator passwords."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	ctx := c.Request.Context()

	var req struct {
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password is required"})
		return
	}

	if len(req.NewPassword) < 8 || len(req.NewPassword) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password must be between 8 and 72 characters long"})
		return
	}

	var targetRole, mobile, fullName string
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, '') FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if targetRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN password cannot be reset via this console"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	_, err = h.DB.Exec(ctx, `UPDATE users SET password_hash = $1 WHERE id = $2`, string(hash), userID)
	if err != nil {
		log.Printf("[RESET PASSWORD ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Security requirement: Invalidate all existing sessions so old credentials cannot be used
	_ = session.RevokeAllUserSessions(ctx, h.DB, userID, "PASSWORD_RESET_BY_SUPER_ADMIN")

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
		"ADMIN_PASSWORD_RESET",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{"target_user": userID, "name": fullName, "mobile": mobile, "forced_logout": true},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully and all active sessions terminated"})
}

// ForceLogoutUser terminates all active sessions across devices for this user — SUPER_ADMIN only
func (h *AdminHandler) ForceLogoutUser(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can terminate sessions."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	ctx := c.Request.Context()

	var targetRole, mobile, fullName string
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, '') FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	err = session.RevokeAllUserSessions(ctx, h.DB, userID, "FORCE_LOGOUT_BY_SUPER_ADMIN")
	if err != nil {
		log.Printf("[FORCE LOGOUT ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to terminate sessions"})
		return
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
		"ADMIN_FORCE_LOGOUT",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{"target_user": userID, "name": fullName, "mobile": mobile},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "All active sessions have been terminated successfully"})
}

// UpdateUserPermissions updates the permissions JSONB object for an admin — SUPER_ADMIN only
func (h *AdminHandler) UpdateUserPermissions(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can update permissions."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	ctx := c.Request.Context()

	var req struct {
		Permissions struct {
			CanReview  bool `json:"can_review"`
			CanApprove bool `json:"can_approve"`
			CanReject  bool `json:"can_reject"`
			CanExport  bool `json:"can_export"`
		} `json:"permissions" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid permissions object with boolean fields is required"})
		return
	}

	var targetRole, mobile, fullName string
	var oldPermBytes []byte
	err := h.DB.QueryRow(ctx, `SELECT role, mobile_number, COALESCE(full_name, ''), COALESCE(permissions, '{}'::jsonb) FROM users WHERE id = $1`, userID).Scan(&targetRole, &mobile, &fullName, &oldPermBytes)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if targetRole == "SUPER_ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Root SUPER_ADMIN permissions cannot be altered"})
		return
	}

	newBytes, err := json.Marshal(req.Permissions)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permissions payload"})
		return
	}

	_, err = h.DB.Exec(ctx, `UPDATE users SET permissions = $1 WHERE id = $2`, newBytes, userID)
	if err != nil {
		log.Printf("[UPDATE PERMISSIONS ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permissions"})
		return
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
		"ADMIN_PERMISSIONS_UPDATED",
		&userID,
		"users",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		map[string]any{"permissions": string(oldPermBytes)},
		map[string]any{"permissions": req.Permissions},
		map[string]any{"target_user": userID, "name": fullName, "mobile": mobile},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, gin.H{"message": "Permissions updated successfully", "permissions": req.Permissions})
}

// GetUserActivity retrieves recent audit records and administrative actions performed by or affecting this user
func (h *AdminHandler) GetUserActivity(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can view user activity logs."})
		return
	}

	userID := c.Param("id")
	if !isValidUUID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	ctx := c.Request.Context()

	rows, err := h.DB.Query(ctx, `
		SELECT id, action, COALESCE(ip_address, '') AS ip_address, status,
		       COALESCE(details, '{}'::jsonb) AS details, created_at
		FROM audit_log
		WHERE actor_id = $1 OR admin_id = $1 OR target_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		log.Printf("[USER ACTIVITY ERROR] user=%s err=%v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query activity logs"})
		return
	}
	defer rows.Close()

	var logs []gin.H
	for rows.Next() {
		var (
			id           int64
			action, ip   string
			status       string
			detailsBytes []byte
			createdAt    time.Time
		)
		if err := rows.Scan(&id, &action, &ip, &status, &detailsBytes, &createdAt); err != nil {
			continue
		}
		var detailsMap map[string]any
		_ = json.Unmarshal(detailsBytes, &detailsMap)
		logs = append(logs, gin.H{
			"id":         id,
			"action":     action,
			"ip_address": ip,
			"status":     status,
			"details":    detailsMap,
			"created_at": createdAt,
		})
	}
	if logs == nil {
		logs = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": len(logs),
	})
}
