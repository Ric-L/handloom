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

func TestRenderEnvEnablesRenderOriginsWhenUnset(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("ALLOWED_ORIGINS", "")
	t.Setenv("FRONTEND_URL", "")
	t.Setenv("RENDER", "true")
	t.Setenv("RENDER_EXTERNAL_URL", "https://handloom-api.onrender.com/")

	cfg := Load()
	if !cfg.AllowRenderOrigins {
		t.Fatalf("expected AllowRenderOrigins=true on Render when ALLOWED_ORIGINS/FRONTEND_URL unset")
	}
	foundExternal := false
	for _, o := range cfg.AllowedOrigins {
		if o == "https://handloom-api.onrender.com" {
			foundExternal = true
		}
	}
	if !foundExternal {
		t.Fatalf("expected RENDER_EXTERNAL_URL in AllowedOrigins, got %v", cfg.AllowedOrigins)
	}
}

func TestExplicitFrontendURLDisablesWildcardRenderOrigins(t *testing.T) {
	t.Setenv("GIN_MODE", "release")
	t.Setenv("ALLOWED_ORIGINS", "")
	t.Setenv("FRONTEND_URL", "handloom-web.onrender.com")
	t.Setenv("RENDER", "true")

	cfg := Load()
	if cfg.AllowRenderOrigins {
		t.Fatalf("expected AllowRenderOrigins=false when FRONTEND_URL is explicitly set")
	}
	foundFrontend := false
	for _, o := range cfg.AllowedOrigins {
		if o == "https://handloom-web.onrender.com" {
			foundFrontend = true
		}
	}
	if !foundFrontend {
		t.Fatalf("expected https-normalized FRONTEND_URL in AllowedOrigins, got %v", cfg.AllowedOrigins)
	}
}
