package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"handloom-portal/internal/audit"
	"handloom-portal/internal/config"
	"handloom-portal/internal/db"
	"handloom-portal/internal/middleware"
	"handloom-portal/internal/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()
	audit.Init(cfg.AuditLogDir)

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(context.Background(), pool); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	if err := db.SeedCategories(context.Background(), pool); err != nil {
		log.Printf("Warning: seed categories failed: %v", err)
	}

	if err := db.SeedDefaultAdmins(context.Background(), pool); err != nil {
		log.Printf("Warning: seed default admins failed: %v", err)
	}

	r := NewRouter(pool, cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
	}
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MB
	}

	log.Printf("Server starting on :%s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

// NewRouter constructs the hardened Gin engine.
func NewRouter(pool *pgxpool.Pool, cfg *config.Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.MaxMultipartMemory = 8 << 20 // 8 MB max multipart memory

	r.Use(middleware.EnforceHTTPS(cfg.EnforceHTTPS))
	r.Use(corsMiddleware(cfg.AllowedOrigins))
	r.Use(middleware.SecurityHeaders())
	routes.Register(r, pool, cfg)
	return r
}

func corsMiddleware(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		cleaned := strings.TrimRight(strings.ToLower(strings.TrimSpace(o)), "/")
		if cleaned != "" {
			allowed[cleaned] = true
		}
	}

	return func(c *gin.Context) {
		c.Header("Vary", "Origin")
		origin := strings.TrimRight(strings.TrimSpace(c.GetHeader("Origin")), "/")
		if origin != "" && allowed[strings.ToLower(origin)] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-CSRF-Token,X-Requested-With")
			c.Header("Access-Control-Expose-Headers", "X-CSRF-Token,Retry-After")
			if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusNoContent)
				return
			}
		} else if c.Request.Method == http.MethodOptions && origin != "" {
			// Reject preflight from untrusted origins
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		c.Next()
	}
}
