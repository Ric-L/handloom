package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
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
	uid := uuid.New().String()[:6]
	return fmt.Sprintf("HND-%d-%s-%s", year, categoryCode[:3], uid)
}

func (h *ApplicationHandler) Track(c *gin.Context) {
	regNo := c.Query("reg_no")
	dob := c.Query("dob")
	if regNo == "" || dob == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reg_no and dob are required"})
		return
	}

	var result struct {
		RegistrationNo  string  `json:"registration_no"`
		FullName        string  `json:"full_name"`
		Category        string  `json:"category"`
		SubmittedAt     string  `json:"submitted_at"`
		Status          string  `json:"status"`
		RejectionReason *string `json:"rejection_reason,omitempty"`
	}

	err := h.DB.QueryRow(context.Background(), `
		SELECT a.registration_no, a.full_name, jc.title, a.submitted_at, a.status, a.rejection_reason
		FROM applications a
		JOIN job_categories jc ON jc.id = a.category_id
		WHERE a.registration_no = $1 AND a.dob = $2::date
	`, regNo, dob).Scan(
		&result.RegistrationNo, &result.FullName, &result.Category,
		&result.SubmittedAt, &result.Status, &result.RejectionReason,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ApplicationHandler) Submit(c *gin.Context) {
	userID := c.GetString("user_id")

	categoryIDStr := c.PostForm("category_id")
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valid category_id is required"})
		return
	}

	// Fetch category code for registration number
	var catCode string
	var isOpen bool
	err = h.DB.QueryRow(context.Background(),
		`SELECT code, is_approval_open FROM job_categories WHERE id = $1`, categoryID,
	).Scan(&catCode, &isOpen)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category"})
		return
	}

	regNo := generateRegistrationNo(catCode)

	_, err = h.DB.Exec(context.Background(), `
		INSERT INTO applications (
			registration_no, user_id, category_id, full_name, guardian_name, dob, gender,
			gov_id_type, gov_id_last4, social_category, address_full, district_state_pin,
			highest_qual, occupation, training_mode
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		regNo, userID, categoryID,
		c.PostForm("full_name"), c.PostForm("guardian_name"), c.PostForm("dob"),
		c.PostForm("gender"), c.PostForm("gov_id_type"), c.PostForm("gov_id_last4"),
		c.PostForm("social_category"), c.PostForm("address_full"), c.PostForm("district_state_pin"),
		c.PostForm("highest_qual"), c.PostForm("occupation"),
		c.DefaultPostForm("training_mode", "CLASSROOM"),
	)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already applied for this category"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"registration_no": regNo})
}

func (h *ApplicationHandler) MyApplications(c *gin.Context) {
	userID := c.GetString("user_id")

	rows, err := h.DB.Query(context.Background(), `
		SELECT a.id, a.registration_no, a.user_id, a.category_id, a.full_name, a.guardian_name,
		       a.dob, a.gender, a.social_category, a.status, a.rejection_reason, a.submitted_at
		FROM applications a WHERE a.user_id = $1 ORDER BY a.submitted_at DESC`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}
	defer rows.Close()

	var apps []gin.H
	for rows.Next() {
		var (
			id, regNo, uid, fullName, guardianName, gender, socialCat, status string
			catID                                                               int
			dob, submittedAt                                                    string
			rejectionReason                                                     *string
		)
		if err := rows.Scan(&id, &regNo, &uid, &catID, &fullName, &guardianName, &dob, &gender, &socialCat, &status, &rejectionReason, &submittedAt); err != nil {
			continue
		}
		apps = append(apps, gin.H{
			"id": id, "registration_no": regNo, "user_id": uid, "category_id": catID,
			"full_name": fullName, "guardian_name": guardianName, "dob": dob,
			"gender": gender, "social_category": socialCat, "status": status,
			"rejection_reason": rejectionReason, "submitted_at": submittedAt,
		})
	}
	if apps == nil {
		apps = []gin.H{}
	}
	c.JSON(http.StatusOK, apps)
}
