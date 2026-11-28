package config

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          string
	Port               string
	UploadDir          string
	AuditLogDir        string
	AllowedOrigins     []string
	AllowRenderOrigins bool
	EnforceHTTPS       bool
}

const insecureDefaultSecret = "change-me-in-production-use-32-chars-min"

func Load() *Config {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" || jwtSecret == insecureDefaultSecret || len(jwtSecret) < 32 {
		if os.Getenv("GIN_MODE") == "release" {
			// Generate a cryptographically random ephemeral secret rather than booting with a predictable key
			buf := make([]byte, 32)
			_, _ = rand.Read(buf)
			jwtSecret = hex.EncodeToString(buf)
			log.Println("[SECURITY WARNING] JWT_SECRET is missing, weak (<32 chars), or uses the default placeholder in release mode. Generated an ephemeral 256-bit secret; set JWT_SECRET explicitly for persistent sessions.")
		} else if jwtSecret == "" {
			jwtSecret = insecureDefaultSecret
		}
	}

	isRender := os.Getenv("RENDER") != "" || os.Getenv("RENDER_EXTERNAL_URL") != ""
	explicitFrontendConfigured := os.Getenv("ALLOWED_ORIGINS") != "" || os.Getenv("FRONTEND_URL") != ""

	return &Config{
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/handloom_portal?sslmode=disable"),
		JWTSecret:          jwtSecret,
		Port:               getEnv("PORT", "8080"),
		UploadDir:          getEnv("UPLOAD_DIR", "./uploads"),
		AuditLogDir:        getEnv("AUDIT_LOG_DIR", "./logs/audit"),
		AllowedOrigins:     parseAllowedOrigins(),
		AllowRenderOrigins: isRender && !explicitFrontendConfigured,
		EnforceHTTPS:       strings.EqualFold(os.Getenv("ENFORCE_HTTPS"), "true"),
	}
}

func normalizeOrigin(raw string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(raw), "/")
	if trimmed == "" {
		return ""
	}
	if !strings.Contains(trimmed, "://") {
		if strings.HasPrefix(strings.ToLower(trimmed), "localhost") || strings.HasPrefix(trimmed, "127.0.0.1") {
			return "http://" + trimmed
		}
		return "https://" + trimmed
	}
	return trimmed
}

func parseAllowedOrigins() []string {
	originsMap := make(map[string]bool)
	addOrigin := func(raw string) {
		if normalized := normalizeOrigin(raw); normalized != "" {
			originsMap[normalized] = true
		}
	}

	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		for _, part := range strings.Split(envOrigins, ",") {
			addOrigin(part)
		}
	}
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		for _, part := range strings.Split(frontendURL, ",") {
			addOrigin(part)
		}
	}
	if renderExternalURL := os.Getenv("RENDER_EXTERNAL_URL"); renderExternalURL != "" {
		addOrigin(renderExternalURL)
	}

	// Include local development origins when not explicitly overridden in release mode
	if os.Getenv("GIN_MODE") != "release" || len(originsMap) == 0 {
		addOrigin("http://localhost:5173")
		addOrigin("http://127.0.0.1:5173")
		addOrigin("http://localhost:4173")
		addOrigin("http://127.0.0.1:4173")
	}

	isRender := os.Getenv("RENDER") != "" || os.Getenv("RENDER_EXTERNAL_URL") != ""
	explicitFrontendConfigured := os.Getenv("ALLOWED_ORIGINS") != "" || os.Getenv("FRONTEND_URL") != ""
	if isRender && !explicitFrontendConfigured {
		log.Println("[SECURITY WARNING] ALLOWED_ORIGINS / FRONTEND_URL not set on Render; allowing single-label https://*.onrender.com origins. Set ALLOWED_ORIGINS=https://<your-frontend>.onrender.com to pin a single origin.")
	} else if os.Getenv("GIN_MODE") == "release" && !explicitFrontendConfigured {
		log.Println("[SECURITY WARNING] ALLOWED_ORIGINS / FRONTEND_URL not set in release mode; cross-origin browser requests will only allow local dev origins until configured.")
	}

	res := make([]string, 0, len(originsMap))
	for o := range originsMap {
		res = append(res, o)
	}
	return res
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
