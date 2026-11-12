package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/models"
)

type CategoryHandler struct {
	DB *pgxpool.Pool
}

func (h *CategoryHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(context.Background(),
		`SELECT id, code, title, approval_limit, approved_count, is_approval_open FROM job_categories ORDER BY id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	defer rows.Close()

	var cats []models.JobCategory
	for rows.Next() {
		var cat models.JobCategory
		if err := rows.Scan(&cat.ID, &cat.Code, &cat.Title, &cat.ApprovalLimit, &cat.ApprovedCount, &cat.IsApprovalOpen); err != nil {
			continue
		}
		cats = append(cats, cat)
	}
	if cats == nil {
		cats = []models.JobCategory{}
	}
	c.JSON(http.StatusOK, cats)
}
