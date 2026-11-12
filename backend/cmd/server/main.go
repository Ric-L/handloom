package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"handloom-portal/internal/config"
	"handloom-portal/internal/db"
	"handloom-portal/internal/routes"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

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

	r := gin.Default()
	r.Use(corsMiddleware())
	routes.Register(r, pool, cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
