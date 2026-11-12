package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

const schema = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    email         VARCHAR(255),
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'APPLICANT' CHECK (role IN ('APPLICANT','REVIEWER_ADMIN','SUPER_ADMIN')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_categories (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(150) NOT NULL,
    approval_limit  INT NOT NULL,
    approved_count  INT NOT NULL DEFAULT 0,
    is_approval_open BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS applications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_no  VARCHAR(30) UNIQUE NOT NULL,
    user_id          UUID NOT NULL REFERENCES users(id),
    category_id      INT NOT NULL REFERENCES job_categories(id),
    full_name        VARCHAR(150) NOT NULL,
    guardian_name    VARCHAR(150) NOT NULL,
    dob              DATE NOT NULL,
    gender           VARCHAR(10) NOT NULL CHECK (gender IN ('MALE','FEMALE','OTHER')),
    alt_mobile       VARCHAR(15),
    gov_id_type      VARCHAR(50) NOT NULL,
    gov_id_last4     CHAR(4) NOT NULL,
    social_category  VARCHAR(10) NOT NULL CHECK (social_category IN ('GENERAL','SC','ST','OBC','OTHER')),
    address_full     TEXT NOT NULL,
    district_state_pin VARCHAR(150) NOT NULL,
    emergency_contact JSONB NOT NULL DEFAULT '{}',
    highest_qual     VARCHAR(20) NOT NULL,
    institution_name VARCHAR(200),
    occupation       VARCHAR(20) NOT NULL,
    prev_training    TEXT,
    prior_experience JSONB NOT NULL DEFAULT '{}',
    disability_req   JSONB NOT NULL DEFAULT '{}',
    preferred_centre VARCHAR(150),
    training_mode    VARCHAR(30) NOT NULL DEFAULT 'CLASSROOM',
    bank_holder_name VARCHAR(150),
    bank_name_branch VARCHAR(200),
    account_number   TEXT,
    ifsc_code        VARCHAR(20),
    documents        JSONB NOT NULL DEFAULT '{}',
    status           VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    rejection_reason TEXT,
    reviewed_by      UUID REFERENCES users(id),
    reviewed_at      TIMESTAMPTZ,
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_category UNIQUE(user_id, category_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,
    target_id   UUID,
    ip_address  VARCHAR(45),
    before_state JSONB,
    after_state  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_registration_no ON applications(registration_no);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_category_id ON applications(category_id);
`

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("Running database migrations...")
	_, err := pool.Exec(ctx, schema)
	if err != nil {
		return err
	}
	log.Println("Migrations complete.")
	return nil
}
