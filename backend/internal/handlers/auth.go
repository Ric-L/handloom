package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"handloom-portal/internal/models"
)

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

type RegisterRequest struct {
	MobileNumber string  `json:"mobile_number" binding:"required"`
	Password     string  `json:"password" binding:"required,min=8"`
	Email        *string `json:"email"`
}

type LoginRequest struct {
	MobileNumber string `json:"mobile_number" binding:"required"`
	Password     string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var user models.User
	err = h.DB.QueryRow(context.Background(),
		`INSERT INTO users (mobile_number, email, password_hash) VALUES ($1, $2, $3) RETURNING id, mobile_number, email, role, created_at`,
		req.MobileNumber, req.Email, string(hash),
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Mobile number already registered"})
		return
	}

	token, err := h.generateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := h.DB.QueryRow(context.Background(),
		`SELECT id, mobile_number, email, password_hash, role, created_at FROM users WHERE mobile_number = $1`,
		req.MobileNumber,
	).Scan(&user.ID, &user.MobileNumber, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := h.generateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func (h *AuthHandler) generateToken(userID, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}
