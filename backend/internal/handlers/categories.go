package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/models"
	"handloom-portal/internal/session"
)

type CategoryHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

type PublicCategory struct {
	ID             int    `json:"id"`
	Code           string `json:"code"`
	Title          string `json:"title"`
	IsApprovalOpen bool   `json:"is_approval_open"`
}

func (h *CategoryHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	// Check if the caller is an authenticated, active Admin (validates HMAC algo, session, and disabled state)
	isAdmin := false
	tokenStr, err := c.Cookie("auth_token")
	if err != nil || tokenStr == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenStr != "" {
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(h.JWTSecret), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				userID, _ := claims["user_id"].(string)
				role, _ := claims["role"].(string)
				sessTok, _ := claims["session_token"].(string)
				if (role == "SUPER_ADMIN" || role == "REVIEWER_ADMIN") && userID != "" {
					sessionValid := sessTok == ""
					if sessTok != "" && h.DB != nil {
						if _, sErr := session.ValidateAndTouch(ctx, h.DB, sessTok); sErr == nil {
							sessionValid = true
						}
					}
					if sessionValid && h.DB != nil {
						var isDisabled bool
						if dErr := h.DB.QueryRow(ctx, `SELECT COALESCE(is_disabled, FALSE) FROM users WHERE id = $1`, userID).Scan(&isDisabled); dErr == nil && !isDisabled {
							isAdmin = true
						}
					} else if sessionValid && h.DB == nil {
						isAdmin = true
					}
				}
			}
		}
	}

	rows, err := h.DB.Query(ctx,
		`SELECT id, code, title, approval_limit, approved_count, is_approval_open 
		 FROM job_categories ORDER BY id ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	defer rows.Close()

	if isAdmin {
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
		return
	}

	// For regular users / public: strictly hide quota numbers (approval_limit & approved_count)
	var publicCats []PublicCategory
	for rows.Next() {
		var cat models.JobCategory
		if err := rows.Scan(&cat.ID, &cat.Code, &cat.Title, &cat.ApprovalLimit, &cat.ApprovedCount, &cat.IsApprovalOpen); err != nil {
			continue
		}
		publicCats = append(publicCats, PublicCategory{
			ID:             cat.ID,
			Code:           cat.Code,
			Title:          cat.Title,
			IsApprovalOpen: cat.IsApprovalOpen,
		})
	}
	if publicCats == nil {
		publicCats = []PublicCategory{}
	}
	c.JSON(http.StatusOK, publicCats)
}
