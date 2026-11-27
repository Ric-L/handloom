# Security Audit & Hardening Report

**Application:** PM VIKAS / Handloom Cooperation Imphal Portal  
**Baseline Standards:** OWASP Top 10 (2021) & OWASP ASVS v4.0  
**Audit Date:** 2026-11-27

---

## 1. Executive Summary

A full-stack security audit was conducted across the Go (`Gin` + `pgx/v5`) backend, PostgreSQL schema/migrations, and React + TypeScript frontend. Identified vulnerabilities across CORS, PII document access control, RBAC permission enforcement, JWT verification, CSV formula injection, error/data exposure, rate limiting, and frontend dependencies were remediated and covered by automated unit and live-PostgreSQL penetration tests.

---

## 2. Findings & Remediations

| Severity | Finding | OWASP / CWE | Remediation Implemented | File(s) |
|---|---|---|---|---|
| **High** | **Permissive Arbitrary-Origin CORS with Credentials:** `corsMiddleware` previously echoed any `Origin` header alongside `Access-Control-Allow-Credentials: true`, enabling cross-origin authenticated reads/actions from untrusted sites. | A01 / A05 (CWE-942) | Replaced reflection with an explicit `ALLOWED_ORIGINS` / `FRONTEND_URL` allowlist (`Vary: Origin`), rejecting untrusted preflights with `403`. | `backend/cmd/server/main.go`, `backend/internal/config/config.go` |
| **High** | **Unauthenticated Public Access to Uploaded PII Documents:** `r.Static("/uploads", ...)` exposed uploaded Aadhaar cards, passport photos, address proofs, and bank passbooks without auth or ownership checks. | A01 (CWE-284, CWE-639) | Replaced static file serving with authenticated `ServeUploadedFile` on `/uploads/:filename` and `/api/v1/uploads/:filename`. Tracked file ownership in `uploaded_files` table; enforced strict regex (`safeUploadFileRegex`), path traversal confinement, `nosniff`, `Cache-Control: no-store`, and owner/admin RBAC. Updated frontend viewers to fetch blobs via authenticated Axios calls. | `backend/internal/routes/routes.go`, `backend/internal/handlers/applications.go`, `backend/internal/db/migrations.go`, `frontend/src/api/index.ts`, `frontend/src/components/FileUploadField.tsx`, `frontend/src/components/admin/ApplicationReviewDrawer.tsx`, `frontend/src/pages/admin/AdminApplicationDetailPage.tsx` |
| **High** | **Granular RBAC Permissions Not Enforced on Backend & Disabled Admin Login Gap:** `users.permissions` (`can_review`, `can_approve`, `can_reject`, `can_export`) was editable in admin UI but unchecked in handlers; `AdminLogin` did not reject `is_disabled` accounts. | A01 / A07 (CWE-285, CWE-269) | Enforced `checkAdminPermission` in `ListApplications`, `GetApplication`, `Approve`, `Reject`, `ExportCSV`, and `ListCandidates`. Added `is_disabled` check in `AdminLogin`. Hardened `UpdateUserPermissions` with strict boolean struct, blocked modifying `SUPER_ADMIN` accounts, and prevented self-disable/revoke. | `backend/internal/handlers/security_helpers.go`, `backend/internal/handlers/admin.go`, `backend/internal/handlers/admin_extra.go`, `backend/internal/handlers/auth.go` |
| **High** | **JWT Algorithm & Session Validation Gap in `CategoryHandler.List` + Weak Default Release Secret:** `CategoryHandler.List` parsed Bearer JWT without enforcing `SigningMethodHMAC` or DB session/disabled checks; release mode kept fallback `JWT_SECRET`. | A02 / A07 (CWE-347, CWE-798) | Enforced `SigningMethodHMAC`, `auth_token` cookie support, `session.ValidateAndTouch`, and `is_disabled` check in `CategoryHandler.List`. In `GIN_MODE=release`, `config.Load()` refuses the default placeholder and generates a 256-bit random secret if unset/weak. `seed.go` uses `ON CONFLICT DO NOTHING` and supports env password overrides. | `backend/internal/handlers/categories.go`, `backend/internal/config/config.go`, `backend/internal/db/seed.go` |
| **High** | **Frontend Dependency Vulnerabilities (`canvg` & `fflate`):** `npm audit` identified High Prototype Pollution in `canvg <3.0.11` (`GHSA-v2mw-5mch-w8c5`) and Moderate DoS in `fflate 0.8.0-0.8.2` (`GHSA-px8p-9vwx-vf98`). | A06 (CWE-1321, CWE-400) | Ran `npm audit fix`; subsequent `npm audit` reported `0` vulnerabilities. | `frontend/package.json`, `frontend/package-lock.json` |
| **Medium** | **CSV Formula Injection (`CWE-1236`) & Unmasked Bank Account Numbers in APIs:** `ExportCSV` wrote raw user text; `GetApplication`, `GetApplicationDossier`, `GetApprovedSlip`, and `ExportCSV` returned full `account_number`. | A03 / A02 (CWE-1236, CWE-200) | Added `sanitizeCSVCell` prefixing `=`, `+`, `-`, `@`, `\t`, `\r` with `'`; masked `account_number` server-side via `maskAccountNumber` (`•••• •••• <last4>`). | `backend/internal/handlers/security_helpers.go`, `backend/internal/handlers/admin.go`, `backend/internal/handlers/applications.go` |
| **Medium** | **CSRF Timing & Header Gaps + Cross-Subdomain Cookie Mode:** `CSRFProtection` used non-constant-time comparison and skipped check when `X-CSRF-Token` was supplied with Bearer auth. | A01 / A05 (CWE-352, CWE-208) | Switched comparison to `subtle.ConstantTimeCompare`, enforced check whenever cookie auth or `X-CSRF-Token` is present, and set `SameSite=None; Secure` on HTTPS requests (`CookieSameSiteMode`). | `backend/internal/middleware/security.go`, `backend/internal/middleware/auth.go`, `backend/internal/handlers/auth.go` |
| **Medium** | **Stored XSS URLs in Document Payloads, Missing Enum/UUID Validation & Error Leaks:** Raw `err.Error()` leaked DB internals; `documents` accepted arbitrary URLs (`javascript:...`); `:id` params weren't pre-validated as UUIDs. | A03 / A05 (CWE-79, CWE-20, CWE-209) | Added strict `safeUploadURLRegex` validation on `documents`, `isValidUUID` checks, enum allowlists, IFSC/email regex validation, `sanitizeInputMax` control-char/HTML stripping, password length bounds (`8..72` for bcrypt), and removed raw `err.Error()` responses. | `backend/internal/handlers/security_helpers.go`, `backend/internal/handlers/applications.go`, `backend/internal/handlers/admin_extra.go`, `backend/internal/handlers/admin_audit.go`, `backend/internal/handlers/auth.go` |
| **Medium** | **Rate Limiting, Body Size DoS, HTTP Timeouts & CSP/HSTS Hardening:** Public `track`, `register`, `upload`, `submit` lacked endpoint rate limits; `Retry-After` emitted Go duration strings instead of integer seconds; server lacked `ReadHeaderTimeout`. | A04 / A05 (CWE-400, CWE-770) | Added `EndpointRateLimiter`, fixed `Retry-After` to RFC integer seconds, added `RequestBodyLimit(2MB)` + `MaxMultipartMemory(8MB)`, tightened API `Content-Security-Policy` (`default-src 'none'`, `frame-ancestors 'none'`), added HSTS (`Strict-Transport-Security`) & optional `EnforceHTTPS`, and configured `http.Server` timeouts. | `backend/internal/middleware/ratelimit.go`, `backend/internal/middleware/security.go`, `backend/internal/routes/routes.go`, `backend/cmd/server/main.go` |

---

## 3. Verification & Test Results

All checks below were executed after the final code changes:

1. **Go Unit, Security & Live PostgreSQL Penetration Suite:**
   - Executed `go test -count=1 -v ./...` against an isolated `handloom_security_test` PostgreSQL database (`HANDLOOM_TEST_DSN`) covering:
     - `TestLiveDBSecurityPenetrationSuite` (PASS): Live registration, upload, cross-user file & dossier IDOR blocks (`403`), `GENERAL` category & `javascript:` URL rejection (`400`), XSS stripping & account masking in API/CSV responses, parameterized SQLi probes on `/applications/track` & `/admin/applications`, granular `can_approve`/`can_export` RBAC blocking (`403`), and disabled admin login rejection (`403`).
     - `TestCORSBlocksUntrustedOrigins`, `TestSecurityHeadersAndHSTS`, `TestUploadsRequireAuthAndRejectTraversal`, `TestRBACBlocksPrivilegeEscalation`, `TestCSRFRejectsMismatchedOrMissingTokenWithCookieAuth`, `TestRateLimitersBlockBruteForceAndBursts` (all PASS).
     - `TestReleaseModeNeverUsesDefaultJWTSecret`, `TestParseAllowedOriginsNormalizesTrailingSlashes` (all PASS).
     - `TestSanitizeInputStripsHTMLAndControlChars`, `TestSanitizeCSVCellPreventsFormulaInjection`, `TestMaskAccountNumberAndUUIDValidation`, `TestAuditRedactMasksSensitiveKeys`, `TestUploadFileSecurityValidations`, `TestTrackRejectsInvalidDOBFormat` (all PASS).
2. **Go Static Analysis:** `go vet ./...` — **PASS** (0 issues).
3. **Frontend Dependency Audit:** `npm audit` after `npm audit fix` — **0 vulnerabilities**.
4. **Frontend TypeScript & Production Build:** `npm run build` (`tsc && vite build`) — **PASS** (`✓ built in 11.01s`).

---

## 4. Remaining Operational Risks & Production Checklist

1. **Configure Production Environment Variables on Render (Required):**
   - Set `ALLOWED_ORIGINS=https://<your-frontend-domain>.onrender.com` on the backend Web Service so CORS permits your deployed frontend origin while blocking untrusted sites.
   - Set a strong random `JWT_SECRET` (32+ characters) and `GIN_MODE=release`.
   - Set `ENFORCE_HTTPS=true` if you want plain HTTP requests redirected to HTTPS at the app layer.
2. **Rotate Default Bootstrap Admin Credentials:**
   - Immediately change passwords for seeded `9999999999` (`SUPER_ADMIN`) and `8888888888` (`REVIEWER_ADMIN`) via the Admin console or `DEFAULT_SUPER_ADMIN_PASSWORD` / `DEFAULT_REVIEWER_ADMIN_PASSWORD` before initial provisioning.
3. **Go Dependency Vulnerability Scanner (`govulncheck`):**
   - `govulncheck` was not installed in the local test environment; run `go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./...` in CI or locally with Go toolchain network access to continuously verify Go stdlib and module CVEs.
4. **In-Memory Rate Limiter & Ephemeral Storage on Render Free Plan:**
   - `LoginRateLimiter` and `EndpointRateLimiter` store counters in process memory (single instance works fine; multi-instance horizontal scaling would require Redis-backed counters).
   - Uploaded documents on Render Free Web Services reside on ephemeral local disk; migrate `UPLOAD_DIR` to encrypted object storage (S3/R2) for persistent production retention.
