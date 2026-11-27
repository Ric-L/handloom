package config

import (
	"testing"
)

func TestReleaseModeNeverUsesDefaultJWTSecret(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("JWT_SECRET", insecureDefaultSecret)
	t.Setenv("ALLOWED_ORIGINS", "https://portal.example.gov.in")

	cfg := Load()
	if cfg.JWTSecret == insecureDefaultSecret {
		t.Fatalf("expected release mode to replace insecure default JWT secret")
	}
	if len(cfg.JWTSecret) < 32 {
		t.Fatalf("expected generated JWT secret >= 32 chars, got %d", len(cfg.JWTSecret))
	}
}

func TestParseAllowedOriginsNormalizesTrailingSlashes(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("ALLOWED_ORIGINS", "https://app.example.com/, https://admin.example.com ")

	cfg := Load()
	foundApp := false
	foundAdmin := false
	for _, o := range cfg.AllowedOrigins {
		if o == "https://app.example.com" {
			foundApp = true
		}
		if o == "https://admin.example.com" {
			foundAdmin = true
		}
	}
	if !foundApp || !foundAdmin {
		t.Fatalf("expected normalized origins, got %v", cfg.AllowedOrigins)
	}
}
