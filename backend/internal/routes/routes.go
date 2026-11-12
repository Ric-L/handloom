package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/config"
	"handloom-portal/internal/handlers"
	"handloom-portal/internal/middleware"
)

func Register(r *gin.Engine, pool *pgxpool.Pool, cfg *config.Config) {
	v1 := r.Group("/api/v1")

	// Handlers
	authH := &handlers.AuthHandler{DB: pool, JWTSecret: cfg.JWTSecret}
	catH := &handlers.CategoryHandler{DB: pool}
	appH := &handlers.ApplicationHandler{DB: pool, UploadDir: cfg.UploadDir}
	adminH := &handlers.AdminHandler{DB: pool}

	authM := middleware.Auth(cfg.JWTSecret)
	adminM := middleware.Auth(cfg.JWTSecret, "REVIEWER_ADMIN", "SUPER_ADMIN")

	// Public
	v1.GET("/categories", catH.List)
	v1.GET("/applications/track", appH.Track)

	// Auth
	v1.POST("/auth/register", authH.Register)
	v1.POST("/auth/login", authH.Login)

	// Applicant (authenticated)
	v1.POST("/applications", authM, appH.Submit)
	v1.GET("/applications/my", authM, appH.MyApplications)

	// Admin
	admin := v1.Group("/admin", adminM)
	admin.GET("/metrics", adminH.Metrics)
	admin.GET("/applications", adminH.ListApplications)
	admin.PATCH("/applications/:id/approve", adminH.Approve)
	admin.PATCH("/applications/:id/reject", adminH.Reject)
}
