package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CategorySeed struct {
	Code  string
	Title string
	Limit int
}

var categories = []CategorySeed{
	{"MER.01", "Merchandiser – Fashion, Made-Ups & Home Furnishings", 800},
	{"EMB.02", "Traditional Hand Embroiderer", 400},
	{"JQW.03", "Jacquard Weaver (TSC/Q7306)", 360},
	{"LLW.04", "Loin Loom Weaver (TSC/Q7307)", 350},
	{"BWA.05", "Bamboo Work Artisan", 300},
	{"APA.06", "Applique Artisan", 290},
	{"TPM.07", "Traditional Painting Maker-Artisan", 240},
	{"CPW.08", "Carpet Weaver", 220},
	{"PPM.09", "Puppet Maker", 60},
}

func SeedCategories(ctx context.Context, pool *pgxpool.Pool) error {
	for _, c := range categories {
		_, err := pool.Exec(ctx,
			`INSERT INTO job_categories (code, title, approval_limit)
             VALUES ($1, $2, $3)
             ON CONFLICT (code) DO NOTHING`,
			c.Code, c.Title, c.Limit,
		)
		if err != nil {
			return err
		}
	}
	log.Println("Categories seeded.")
	return nil
}
