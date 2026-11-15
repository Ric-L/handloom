package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"handloom-portal/internal/config"
	"handloom-portal/internal/handlers"
	"handloom-portal/internal/middleware"
)

func Register(r *gin.Engine, pool *pgxpool.Pool, cfg *config.Config) {
	v1 := r.Group("/api/v1")

	// Global CSRF Protection on API group
	v1.Use(middleware.CSRFProtection())

	// Login Rate Limiter (5 attempts per 5 minutes lockout)
	loginRateLimiter := middleware.NewLoginRateLimiter(pool, 5, 5*time.Minute, 5*time.Minute)

	// Handlers
	authH := &handlers.AuthHandler{DB: pool, JWTSecret: cfg.JWTSecret, RateLimiter: loginRateLimiter}
	catH := &handlers.CategoryHandler{DB: pool, JWTSecret: cfg.JWTSecret}
	appH := &handlers.ApplicationHandler{DB: pool, UploadDir: cfg.UploadDir}
	adminH := &handlers.AdminHandler{DB: pool}

	// Middleware with DB session validation and 3-minute idle timeout
	authM := middleware.Auth(cfg.JWTSecret, pool)
	adminM := middleware.Auth(cfg.JWTSecret, pool, "REVIEWER_ADMIN", "SUPER_ADMIN")
	superAdminM := middleware.Auth(cfg.JWTSecret, pool, "SUPER_ADMIN")

	// Static uploads directory serving
	r.Static("/uploads", cfg.UploadDir)

	// 1. Public Endpoints
	v1.GET("/categories", catH.List)
	v1.GET("/applications/track", appH.Track)
	v1.GET("/auth/csrf-token", authH.GetCSRFToken)

	// 2. Auth Endpoints (With Brute-force Login Rate Limiter)
	v1.POST("/auth/register", authH.Register)
	v1.POST("/auth/login", loginRateLimiter.Middleware(), authH.Login)
	v1.POST("/auth/admin-login", loginRateLimiter.Middleware(), authH.AdminLogin)
	v1.POST("/admin/auth/login", loginRateLimiter.Middleware(), authH.AdminLogin)

	// Protected Session Management Endpoints
	v1.POST("/auth/logout", authM, authH.Logout)
	v1.POST("/auth/refresh-session", authM, authH.RefreshSession)
	v1.GET("/auth/session-status", authM, authH.SessionStatus)
	v1.GET("/auth/me", authM, authH.Me)

	// 3. Applicant Endpoints (Authenticated Applicant / Reviewer / Super Admin)
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
		admin.GET("/export/csv", adminH.ExportCSV)
		admin.GET("/candidates", adminH.ListCandidates)

		// Super Admin Exclusive Protected Routes
		admin.PATCH("/categories/:id/quota", superAdminM, adminH.UpdateCategoryQuota)
		admin.GET("/users", superAdminM, adminH.ListUsers)
		admin.PUT("/users/:id/role", superAdminM, adminH.UpdateUserRole)
		admin.POST("/categories", superAdminM, adminH.CreateCategory)
		admin.PUT("/categories/:id", superAdminM, adminH.UpdateCategory)
		admin.PATCH("/categories/:id/toggle", superAdminM, adminH.ToggleCategory)
		admin.DELETE("/categories/:id", superAdminM, adminH.DeleteCategory)

		// Super Admin Tamper-Resistant Audit Trail Endpoints
		admin.GET("/audit-logs", superAdminM, adminH.ListAuditLogs)
		admin.GET("/audit-logs/files", superAdminM, adminH.ListAuditFiles)
	}
}
