package db

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type CategorySeed struct {
	Code  string
	Title string
	Limit int
}

var categories = []CategorySeed{
	{"MER-01", "Merchandiser – Fashion, Made-Ups & Home Furnishings", 800},
	{"EMB-02", "Traditional Hand Embroiderer", 400},
	{"JQW-03", "Jacquard Weaver (TSC/Q7306)", 360},
	{"LLW-04", "Loin Loom Weaver (TSC/Q7307)", 350},
	{"BWA-05", "Bamboo Work Artisan", 300},
	{"APA-06", "Applique Artisan", 290},
	{"TPM-07", "Traditional Painting Maker-Artisan", 240},
	{"CPW-08", "Carpet Weaver", 220},
	{"PPM-09", "Puppet Maker", 60},
}

func SeedCategories(ctx context.Context, pool *pgxpool.Pool) error {
	for _, c := range categories {
		_, err := pool.Exec(ctx,
			`INSERT INTO job_categories (code, title, approval_limit)
             VALUES ($1, $2, $3)
             ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, approval_limit = EXCLUDED.approval_limit`,
			c.Code, c.Title, c.Limit,
		)
		if err != nil {
			return err
		}
	}
	log.Println("Categories seeded successfully.")
	return nil
}

func SeedDefaultAdmins(ctx context.Context, pool *pgxpool.Pool) error {
	if os.Getenv("SKIP_DEFAULT_ADMIN_SEED") == "true" {
		return nil
	}

	superPass := os.Getenv("DEFAULT_SUPER_ADMIN_PASSWORD")
	if superPass == "" {
		superPass = "Admin@12345"
	}
	reviewerPass := os.Getenv("DEFAULT_REVIEWER_ADMIN_PASSWORD")
	if reviewerPass == "" {
		reviewerPass = "Reviewer@12345"
	}

	defaultAdmins := []struct {
		Mobile   string
		Email    string
		Password string
		Role     string
		FullName string
	}{
		{"9999999999", "superadmin@handloom.gov.in", superPass, "SUPER_ADMIN", "Super Administrator"},
		{"8888888888", "reviewer@handloom.gov.in", reviewerPass, "REVIEWER_ADMIN", "Reviewer Admin"},
	}

	for _, a := range defaultAdmins {
		hash, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		// DO NOTHING on conflict so revoked, disabled, or password-rotated admins are never silently reset on boot.
		_, err = pool.Exec(ctx,
			`INSERT INTO users (mobile_number, email, password_hash, role, full_name)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (mobile_number) DO NOTHING`,
			a.Mobile, a.Email, string(hash), a.Role, a.FullName,
		)
		if err != nil {
			return err
		}
	}
	log.Println("Default administrator bootstrap check complete.")
	return nil
}
