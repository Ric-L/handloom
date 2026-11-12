package config

import "os"

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	UploadDir   string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/handloom_portal?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production-use-32-chars-min"),
		Port:        getEnv("PORT", "8080"),
		UploadDir:   getEnv("UPLOAD_DIR", "./uploads"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
