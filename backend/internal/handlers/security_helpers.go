package handlers

import (
	"context"
	"encoding/json"
	"regexp"
	"strings"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	htmlTagRegex        = regexp.MustCompile(`<[^>]*>`)
	emailRegex          = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	safeUploadFileRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$`)
	safeUploadURLRegex  = regexp.MustCompile(`^/uploads/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$`)
	ifscRegex           = regexp.MustCompile(`^[A-Z]{4}0[A-Z0-9]{6}$`)
)

// sanitizeInput strips HTML tags, control characters, and trims surrounding whitespace.
func sanitizeInput(s string) string {
	trimmed := strings.TrimSpace(s)
	noHTML := htmlTagRegex.ReplaceAllString(trimmed, "")
	var b strings.Builder
	b.Grow(len(noHTML))
	for _, r := range noHTML {
		if r == '\n' || r == '\t' || !unicode.IsControl(r) {
			b.WriteRune(r)
		}
	}
	return strings.TrimSpace(b.String())
}

// sanitizeInputMax sanitizes text and truncates to maxLen runes.
func sanitizeInputMax(s string, maxLen int) string {
	clean := sanitizeInput(s)
	runes := []rune(clean)
	if len(runes) > maxLen {
		return strings.TrimSpace(string(runes[:maxLen]))
	}
	return clean
}

// sanitizeCSVCell mitigates CSV formula injection (CWE-1236) in Excel/Calc exports.
func sanitizeCSVCell(s string) string {
	if s == "" {
		return ""
	}
	trimmed := strings.TrimLeft(s, " ")
	if trimmed != "" {
		switch trimmed[0] {
		case '=', '+', '-', '@', '\t', '\r':
			return "'" + s
		}
	}
	return s
}

// maskAccountNumber masks all digits of a bank account except the last 4.
func maskAccountNumber(acct *string) *string {
	if acct == nil || strings.TrimSpace(*acct) == "" {
		return acct
	}
	trimmed := strings.TrimSpace(*acct)
	if len(trimmed) <= 4 {
		masked := "••••"
		return &masked
	}
	masked := "•••• •••• " + trimmed[len(trimmed)-4:]
	return &masked
}

func isValidUUID(id string) bool {
	_, err := uuid.Parse(strings.TrimSpace(id))
	return err == nil
}

func isValidEmail(email string) bool {
	return emailRegex.MatchString(strings.TrimSpace(email))
}

func isAllowedValue(val string, allowed ...string) bool {
	for _, a := range allowed {
		if val == a {
			return true
		}
	}
	return false
}

// checkAdminPermission enforces granular RBAC permissions stored in users.permissions for REVIEWER_ADMIN.
// SUPER_ADMIN always holds full administrative permissions.
func checkAdminPermission(ctx context.Context, db *pgxpool.Pool, userID, role, permKey string) bool {
	if role == "SUPER_ADMIN" {
		return true
	}
	if role != "REVIEWER_ADMIN" || userID == "" || db == nil {
		return false
	}

	var permBytes []byte
	err := db.QueryRow(ctx, `SELECT COALESCE(permissions, '{}'::jsonb) FROM users WHERE id = $1`, userID).Scan(&permBytes)
	if err != nil {
		return false
	}

	var perms map[string]bool
	if err := json.Unmarshal(permBytes, &perms); err != nil {
		return false
	}

	val, exists := perms[permKey]
	if !exists {
		return true // default true if key omitted on legacy user row
	}
	return val
}
