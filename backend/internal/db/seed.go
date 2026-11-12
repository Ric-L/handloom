package db

import (
	"context"
	"log"

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
	defaultAdmins := []struct {
		Mobile   string
		Email    string
		Password string
		Role     string
	}{
		{"9999999999", "superadmin@handloom.gov.in", "Admin@12345", "SUPER_ADMIN"},
		{"8888888888", "reviewer@handloom.gov.in", "Reviewer@12345", "REVIEWER_ADMIN"},
	}

	for _, a := range defaultAdmins {
		hash, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		_, err = pool.Exec(ctx,
			`INSERT INTO users (mobile_number, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (mobile_number) DO UPDATE SET role = EXCLUDED.role`,
			a.Mobile, a.Email, string(hash), a.Role,
		)
		if err != nil {
			return err
		}
	}
	log.Println("Default administrator accounts seeded (9999999999 & 8888888888).")
	return nil
}
