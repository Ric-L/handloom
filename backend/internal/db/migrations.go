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
    full_name       VARCHAR(150),
    is_disabled     BOOLEAN NOT NULL DEFAULT FALSE,
    disabled_reason VARCHAR(255),
    disabled_at     TIMESTAMPTZ,
    permissions     JSONB NOT NULL DEFAULT '{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    admin_id    UUID REFERENCES users(id),
    actor_id    UUID REFERENCES users(id),
    actor_role  VARCHAR(30),
    action      VARCHAR(100) NOT NULL,
    target_id   UUID,
    ip_address  VARCHAR(45),
    before_state JSONB,
    after_state  JSONB,
    details      JSONB DEFAULT '{}',
    status       VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token   VARCHAR(128) UNIQUE NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    last_activity   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason  VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id           BIGSERIAL PRIMARY KEY,
    identifier   VARCHAR(100) NOT NULL,
    ip_address   VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success      BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_registration_no ON applications(registration_no);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_category_id ON applications(category_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_revoked, expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON login_attempts(identifier, ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
`

const schemaUpdates = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);

-- Seed administrator full names if not set
UPDATE users SET full_name = 'Super Administrator' WHERE role = 'SUPER_ADMIN' AND (full_name IS NULL OR full_name = '');
UPDATE users SET full_name = 'Reviewer Admin' WHERE role = 'REVIEWER_ADMIN' AND (full_name IS NULL OR full_name = '');

-- Populate applicant names from latest submitted applications if blank
UPDATE users u
SET full_name = a.full_name
FROM (
    SELECT DISTINCT ON (user_id) user_id, full_name
    FROM applications
    WHERE full_name IS NOT NULL AND full_name != ''
    ORDER BY user_id, submitted_at DESC
) a
WHERE u.id = a.user_id AND (u.full_name IS NULL OR u.full_name = '');

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{"can_review": true, "can_approve": true, "can_reject": true, "can_export": true}';

ALTER TABLE audit_log ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS actor_role VARCHAR(30);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS';

CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records are immutable and tamper-resistant; UPDATE and DELETE operations are strictly prohibited by Government Cyber Security Controls.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON audit_log;
CREATE TRIGGER trg_prevent_audit_tampering
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
`

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("Running database migrations...")
	if _, err := pool.Exec(ctx, schema); err != nil {
		return err
	}
	// Run non-destructive schema updates for existing tables
	if _, err := pool.Exec(ctx, schemaUpdates); err != nil {
		log.Printf("Notice on schema updates: %v", err)
	}
	log.Println("Migrations complete.")
	return nil
}
