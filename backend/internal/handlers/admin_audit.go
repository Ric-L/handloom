package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"handloom-portal/internal/audit"
)

// ListAuditLogs provides Super Administrators with a paginated, filterable view of the tamper-resistant audit ledger.
func (h *AdminHandler) ListAuditLogs(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators have authorization to inspect audit ledgers."})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "25"))
	action := strings.TrimSpace(c.Query("action"))
	actorRole := strings.TrimSpace(c.Query("actor_role"))
	resourceType := strings.TrimSpace(c.Query("resource_type"))
	search := strings.TrimSpace(c.Query("search"))
	startDate := strings.TrimSpace(c.Query("start_date"))
	endDate := strings.TrimSpace(c.Query("end_date"))

	filter := audit.AuditLogFilter{
		Page:         page,
		PageSize:     pageSize,
		Action:       action,
		ActorRole:    actorRole,
		ResourceType: resourceType,
		Search:       search,
		StartDate:    startDate,
		EndDate:      endDate,
	}

	result, err := audit.ListLogs(c.Request.Context(), h.DB, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve audit log records."})
		return
	}

	// Audit the audit inspection itself (Super Admins are also subject to full accountability)
	adminID := c.GetString("user_id")
	var aID *string
	if adminID != "" {
		aID = &adminID
	}
	audit.LogDetailed(
		c.Request.Context(),
		h.DB,
		aID,
		c.GetString("role"),
		audit.ActionAuditLogsViewed,
		nil,
		"audit_log",
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		nil,
		nil,
		map[string]any{
			"page":            page,
			"page_size":       pageSize,
			"action_filter":   action,
			"role_filter":     actorRole,
			"resource_filter": resourceType,
			"search":          search,
			"total_matches":   result.Total,
		},
		"SUCCESS",
	)

	c.JSON(http.StatusOK, result)
}

// ListAuditFiles returns an inventory of the daily persistent log files stored on disk.
func (h *AdminHandler) ListAuditFiles(c *gin.Context) {
	if c.GetString("role") != "SUPER_ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Administrators can inspect audit file metadata."})
		return
	}

	files, err := audit.ListLogFiles()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enumerate daily audit log files."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"files": files,
		"count": len(files),
	})
}
