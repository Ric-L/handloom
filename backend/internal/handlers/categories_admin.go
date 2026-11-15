package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"handloom-portal/internal/audit"
)

// CreateCategory creates a new job category (SUPER_ADMIN only)
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can create categories."})
		return
	}

	var req struct {
		Code          string `json:"code"`
		Title         string `json:"title"`
		ApprovalLimit int    `json:"approval_limit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	req.Code = strings.TrimSpace(req.Code)
	req.Title = strings.TrimSpace(req.Title)

	if req.Code == "" || req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code and title are required"})
		return
	}
	if req.ApprovalLimit <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "approval_limit must be greater than 0"})
		return
	}

	ctx := context.Background()

	// Check code uniqueness
	var exists bool
	_ = h.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM job_categories WHERE code = $1)`, req.Code).Scan(&exists)
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "A category with this code already exists"})
		return
	}

	var (
		id             int
		code, title    string
		approvalLimit  int
		approvedCount  int
		isApprovalOpen bool
	)

	err := h.DB.QueryRow(ctx, `
		INSERT INTO job_categories (code, title, approval_limit, approved_count, is_approval_open)
		VALUES ($1, $2, $3, 0, true)
		RETURNING id, code, title, approval_limit, approved_count, is_approval_open
	`, req.Code, req.Title, req.ApprovalLimit).Scan(
		&id, &code, &title, &approvalLimit, &approvedCount, &isApprovalOpen,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, userRole, audit.ActionCategoryCreated, nil, c.ClientIP(), nil, map[string]any{
		"id":    id,
		"code":  code,
		"title": title,
		"limit": approvalLimit,
	}, map[string]any{"code": code}, "SUCCESS")

	c.JSON(http.StatusCreated, gin.H{
		"id":               id,
		"code":             code,
		"title":            title,
		"approval_limit":   approvalLimit,
		"approved_count":   approvedCount,
		"is_approval_open": isApprovalOpen,
	})
}

// UpdateCategory updates a category's title and/or approval_limit (SUPER_ADMIN only)
func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can update categories."})
		return
	}

	catIDStr := c.Param("id")
	catID, err := strconv.Atoi(catIDStr)
	if err != nil || catID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var req struct {
		Title         *string `json:"title"`
		ApprovalLimit *int    `json:"approval_limit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	ctx := context.Background()

	// Fetch existing
	var (
		code, title    string
		approvalLimit  int
		approvedCount  int
		isApprovalOpen bool
	)
	err = h.DB.QueryRow(ctx, `
		SELECT code, title, approval_limit, approved_count, is_approval_open
		FROM job_categories WHERE id = $1
	`, catID).Scan(&code, &title, &approvalLimit, &approvedCount, &isApprovalOpen)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Apply updates
	if req.Title != nil {
		trimmed := strings.TrimSpace(*req.Title)
		if trimmed != "" {
			title = trimmed
		}
	}
	if req.ApprovalLimit != nil {
		if *req.ApprovalLimit < approvedCount {
			c.JSON(http.StatusConflict, gin.H{
				"error": "approval_limit cannot be less than the current approved_count",
			})
			return
		}
		approvalLimit = *req.ApprovalLimit
		isApprovalOpen = approvalLimit > approvedCount
	}

	_, err = h.DB.Exec(ctx, `
		UPDATE job_categories
		SET title = $1, approval_limit = $2, is_approval_open = $3
		WHERE id = $4
	`, title, approvalLimit, isApprovalOpen, catID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, userRole, audit.ActionCategoryUpdated, nil, c.ClientIP(), map[string]any{
		"title":          title,
		"approval_limit": approvalLimit,
	}, map[string]any{
		"id":             catID,
		"code":           code,
		"title":          title,
		"approval_limit": approvalLimit,
	}, map[string]any{"cat_id": catID}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"id":               catID,
		"code":             code,
		"title":            title,
		"approval_limit":   approvalLimit,
		"approved_count":   approvedCount,
		"is_approval_open": isApprovalOpen,
	})
}

// ToggleCategory toggles the is_approval_open field (SUPER_ADMIN only)
func (h *AdminHandler) ToggleCategory(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can toggle categories."})
		return
	}

	catIDStr := c.Param("id")
	catID, err := strconv.Atoi(catIDStr)
	if err != nil || catID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	ctx := context.Background()

	var id int
	var code, title string
	var isApprovalOpen bool

	err = h.DB.QueryRow(ctx, `
		UPDATE job_categories
		SET is_approval_open = NOT is_approval_open
		WHERE id = $1
		RETURNING id, code, title, is_approval_open
	`, catID).Scan(&id, &code, &title, &isApprovalOpen)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, userRole, audit.ActionCategoryToggled, nil, c.ClientIP(), nil, map[string]any{
		"id":               id,
		"code":             code,
		"is_approval_open": isApprovalOpen,
	}, map[string]any{"cat_id": id}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{
		"id":               id,
		"code":             code,
		"title":            title,
		"is_approval_open": isApprovalOpen,
	})
}

// DeleteCategory hard-deletes a category if no applications reference it (SUPER_ADMIN only)
func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can delete categories."})
		return
	}

	catIDStr := c.Param("id")
	catID, err := strconv.Atoi(catIDStr)
	if err != nil || catID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	ctx := context.Background()

	// Check for existing applications
	var appCount int
	_ = h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM applications WHERE category_id = $1`, catID).Scan(&appCount)
	if appCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete category with existing applications"})
		return
	}

	res, err := h.DB.Exec(ctx, `DELETE FROM job_categories WHERE id = $1`, catID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}
	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("role")
	var uID *string
	if userID != "" {
		uID = &userID
	}
	audit.Log(ctx, h.DB, uID, userRole, audit.ActionCategoryDeleted, nil, c.ClientIP(), nil, nil, map[string]any{"cat_id": catID}, "SUCCESS")

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}
