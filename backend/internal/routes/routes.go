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
	catH := &handlers.CategoryHandler{DB: pool, JWTSecret: cfg.JWTSecret}
	appH := &handlers.ApplicationHandler{DB: pool, UploadDir: cfg.UploadDir}
	adminH := &handlers.AdminHandler{DB: pool}

	// Middleware
	authM := middleware.Auth(cfg.JWTSecret)
	adminM := middleware.Auth(cfg.JWTSecret, "REVIEWER_ADMIN", "SUPER_ADMIN")

	// Static uploads directory serving
	r.Static("/uploads", cfg.UploadDir)

	// 1. Public Endpoints
	v1.GET("/categories", catH.List)
	v1.GET("/applications/track", appH.Track)

	// 2. Auth Endpoints
	v1.POST("/auth/register", authH.Register)
	v1.POST("/auth/login", authH.Login)
	v1.POST("/auth/admin-login", authH.AdminLogin)
	v1.POST("/admin/auth/login", authH.AdminLogin)

	// 3. Applicant Endpoints (Authenticated Applicant)
	v1.POST("/applications", authM, appH.Submit)
	v1.GET("/applications/my", authM, appH.MyApplications)
	v1.GET("/applications/:id/dossier", authM, appH.GetApplicationDossier)
	v1.PUT("/applications/:id", authM, appH.UpdateApplication)
	v1.GET("/applications/:id/approved-slip", authM, appH.GetApprovedSlip)
	v1.POST("/upload", authM, appH.UploadFile)

	// 4. Admin Moderation & Atomic Quota API (Authenticated Reviewer / Super Admin)
	admin := v1.Group("/admin", adminM)
	{
		admin.GET("/metrics", adminH.Metrics)
		admin.GET("/applications", adminH.ListApplications)
		admin.GET("/applications/:id", adminH.GetApplication)
		admin.PATCH("/applications/:id/approve", adminH.Approve)
		admin.PATCH("/applications/:id/reject", adminH.Reject)
		admin.PATCH("/categories/:id/quota", adminH.UpdateCategoryQuota)
		admin.GET("/export/csv", adminH.ExportCSV)
		admin.GET("/candidates", adminH.ListCandidates)
		admin.GET("/users", adminH.ListUsers)
		admin.PUT("/users/:id/role", adminH.UpdateUserRole)
		admin.POST("/categories", adminH.CreateCategory)
		admin.PUT("/categories/:id", adminH.UpdateCategory)
		admin.PATCH("/categories/:id/toggle", adminH.ToggleCategory)
		admin.DELETE("/categories/:id", adminH.DeleteCategory)
	}
}
