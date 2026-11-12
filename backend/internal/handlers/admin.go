package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

func (h *AdminHandler) Metrics(c *gin.Context) {
	var total, pending, approved, rejected int
	h.DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM applications`).Scan(&total)
	h.DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM applications WHERE status='PENDING'`).Scan(&pending)
	h.DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM applications WHERE status='APPROVED'`).Scan(&approved)
	h.DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM applications WHERE status='REJECTED'`).Scan(&rejected)

	rows, _ := h.DB.Query(context.Background(), `
		SELECT jc.id, jc.code, jc.title, jc.approval_limit, jc.approved_count, jc.is_approval_open,
		       COUNT(a.id) FILTER (WHERE a.status = 'PENDING') AS pending_count
		FROM job_categories jc
		LEFT JOIN applications a ON a.category_id = jc.id
		GROUP BY jc.id ORDER BY jc.id`)
	defer rows.Close()

	var cats []gin.H
	for rows.Next() {
		var id, limit, appCount, pendingCount int
		var code, title string
		var isOpen bool
		rows.Scan(&id, &code, &title, &limit, &appCount, &isOpen, &pendingCount)
		cats = append(cats, gin.H{
			"category_id": id, "code": code, "title": title,
			"approval_limit": limit, "approved_count": appCount,
			"pending_count": pendingCount, "is_approval_open": isOpen,
		})
	}
	if cats == nil {
		cats = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_applied": total, "pending": pending, "approved": approved, "rejected": rejected,
		"categories": cats,
	})
}

func (h *AdminHandler) ListApplications(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	status := c.Query("status")
	query := `SELECT a.id, a.registration_no, a.user_id, a.category_id, a.full_name, a.district_state_pin, a.status, a.rejection_reason, a.submitted_at
	           FROM applications a WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += ` AND a.status = $` + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}

	var total int
	countQ := `SELECT COUNT(*) FROM applications a WHERE 1=1`
	if status != "" {
		countQ += ` AND a.status = $1`
		h.DB.QueryRow(context.Background(), countQ, status).Scan(&total)
	} else {
		h.DB.QueryRow(context.Background(), countQ).Scan(&total)
	}

	query += ` ORDER BY a.submitted_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := h.DB.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}
	defer rows.Close()

	var apps []gin.H
	for rows.Next() {
		var id, regNo, userID, fullName, district, status string
		var catID int
		var rejReason *string
		var submittedAt string
		rows.Scan(&id, &regNo, &userID, &catID, &fullName, &district, &status, &rejReason, &submittedAt)
		apps = append(apps, gin.H{
			"id": id, "registration_no": regNo, "user_id": userID, "category_id": catID,
			"full_name": fullName, "district_state_pin": district,
			"status": status, "rejection_reason": rejReason, "submitted_at": submittedAt,
		})
	}
	if apps == nil {
		apps = []gin.H{}
	}

	c.JSON(http.StatusOK, gin.H{"data": apps, "total": total, "page": page, "page_size": pageSize})
}

func (h *AdminHandler) Approve(c *gin.Context) {
	appID := c.Param("id")
	adminID := c.GetString("user_id")

	tx, err := h.DB.Begin(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction start failed"})
		return
	}
	defer tx.Rollback(context.Background())

	// Get category for this application with lock
	var categoryID int
	tx.QueryRow(context.Background(),
		`SELECT category_id FROM applications WHERE id = $1 AND status = 'PENDING'`, appID,
	).Scan(&categoryID)
	if categoryID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found or not pending"})
		return
	}

	// Lock category row
	var approvalLimit, approvedCount int
	var isOpen bool
	err = tx.QueryRow(context.Background(),
		`SELECT approval_limit, approved_count, is_approval_open FROM job_categories WHERE id = $1 FOR UPDATE`,
		categoryID,
	).Scan(&approvalLimit, &approvedCount, &isOpen)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock category"})
		return
	}

	if !isOpen || approvedCount >= approvalLimit {
		c.JSON(http.StatusConflict, gin.H{"error": "Category approval quota has been reached"})
		return
	}

	now := time.Now()
	newCount := approvedCount + 1
	_, err = tx.Exec(context.Background(),
		`UPDATE applications SET status='APPROVED', reviewed_by=$1, reviewed_at=$2 WHERE id=$3`,
		adminID, now, appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update application"})
		return
	}

	newIsOpen := newCount < approvalLimit
	_, err = tx.Exec(context.Background(),
		`UPDATE job_categories SET approved_count=$1, is_approval_open=$2 WHERE id=$3`,
		newCount, newIsOpen, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category quota"})
		return
	}

	// Audit log
	tx.Exec(context.Background(),
		`INSERT INTO audit_log (admin_id, action, target_id) VALUES ($1, 'APPROVE', $2)`,
		adminID, appID)

	if err := tx.Commit(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application approved"})
}

func (h *AdminHandler) Reject(c *gin.Context) {
	appID := c.Param("id")
	adminID := c.GetString("user_id")

	var body struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required"})
		return
	}

	now := time.Now()
	tag, err := h.DB.Exec(context.Background(),
		`UPDATE applications SET status='REJECTED', rejection_reason=$1, reviewed_by=$2, reviewed_at=$3
		 WHERE id=$4 AND status='PENDING'`,
		body.Reason, adminID, now, appID)
	if err != nil || tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found or not pending"})
		return
	}

	h.DB.Exec(context.Background(),
		`INSERT INTO audit_log (admin_id, action, target_id) VALUES ($1, 'REJECT', $2)`, adminID, appID)

	c.JSON(http.StatusOK, gin.H{"message": "Application rejected"})
}
