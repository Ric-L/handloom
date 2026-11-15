package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/session"
)

// ListCandidates lists all users with role='APPLICANT', paginated, with optional mobile search
func (h *AdminHandler) ListCandidates(c *gin.Context) {
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
	search := strings.TrimSpace(c.Query("search"))

	baseWhere := " WHERE u.role = 'APPLICANT'"
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		baseWhere += fmt.Sprintf(" AND u.mobile_number ILIKE $%d", argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Count
	var total int
	countQuery := "SELECT COUNT(*) FROM users u" + baseWhere
	if err := h.DB.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count candidates"})
		return
	}

	// Data
	dataQuery := fmt.Sprintf(`
		SELECT u.id, u.mobile_number, COALESCE(u.email, '') AS email, u.created_at,
		       COUNT(a.id) AS application_count
		FROM users u
		LEFT JOIN applications a ON a.user_id = u.id
		%s
		GROUP BY u.id, u.mobile_number, u.email, u.created_at
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, baseWhere, argIdx, argIdx+1)

	queryArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(ctx, dataQuery, queryArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query candidates"})
		return
	}
	defer rows.Close()

	var candidates []gin.H
	for rows.Next() {
		var (
			id, mobileNumber, email string
			createdAt               time.Time
			applicationCount        int
		)
		if err := rows.Scan(&id, &mobileNumber, &email, &createdAt, &applicationCount); err != nil {
			continue
		}
		candidates = append(candidates, gin.H{
			"id":                id,
			"mobile_number":     mobileNumber,
			"email":             email,
			"created_at":        createdAt,
			"application_count": applicationCount,
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
			"page":          page,
			"page_size":     pageSize,
			"search":        search,
			"total_matches": total,
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

// ListUsers lists ALL users (all roles), paginated — SUPER_ADMIN only
func (h *AdminHandler) ListUsers(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can list all users."})
		return
	}

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

	var total int
	if err := h.DB.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	rows, err := h.DB.Query(ctx, `
		SELECT id, mobile_number, COALESCE(email, '') AS email, role, created_at
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var (
			id, mobileNumber, email, role string
			createdAt                     time.Time
		)
		if err := rows.Scan(&id, &mobileNumber, &email, &role, &createdAt); err != nil {
			continue
		}
		users = append(users, gin.H{
			"id":            id,
			"mobile_number": mobileNumber,
			"email":         email,
			"role":          role,
			"created_at":    createdAt,
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
	if newRole != "REVIEWER_ADMIN" && newRole != "APPLICANT" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be REVIEWER_ADMIN or APPLICANT"})
		return
	}

	ctx := context.Background()

	// Capture previous role for audit ledger
	var oldRole string
	err := h.DB.QueryRow(ctx, `SELECT role FROM users WHERE id = $1`, userID).Scan(&oldRole)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
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
