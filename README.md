# 🧵 Handloom & Skilled Artisan Portal

Government-sponsored skill development registration portal for traditional handloom, weaving, and artisan crafts. Manages 3,020 seats across 9 job roles with atomic quota enforcement and real-time public application tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Go (Gin) + JWT + RBAC |
| Database | PostgreSQL 18 |
| Cache | Redis (optional) |
| Proxy | Nginx |

---

## Project Structure

```
handloom/
├── backend/               # Go API server
│   ├── cmd/server/        # Entry point
│   ├── internal/
│   │   ├── config/        # Environment config
│   │   ├── db/            # DB pool, migrations, seed
│   │   ├── handlers/      # HTTP handler functions
│   │   ├── middleware/    # JWT auth & RBAC middleware
│   │   ├── models/        # Data models
│   │   └── routes/        # Route registration
│   ├── uploads/           # Uploaded files (outside web root)
│   └── .env               # Backend environment variables
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api/           # Axios client + API calls
│   │   ├── components/    # Shared UI components
│   │   ├── layouts/       # Page layout wrappers
│   │   ├── lib/           # Utilities & constants
│   │   ├── pages/         # Route-level pages
│   │   └── types/         # TypeScript interfaces
│   └── .env               # Frontend environment variables
├── nginx/
│   └── nginx.conf         # Nginx reverse proxy config
├── scripts/
│   └── setup_db.ps1       # Database initialization script
└── .env.example           # Environment variable template
```

---

## Quick Start (Development)

### Prerequisites
- Go 1.27+ — ✅ installed
- Node.js 24 + npm — ✅ installed
- PostgreSQL 18 — ✅ installed (running locally)

### 1. Database Setup

```powershell
# Create the database
powershell -File scripts\setup_db.ps1

# Or manually:
psql -U postgres -c "CREATE DATABASE handloom_portal;"
```

### 2. Backend

```powershell
cd backend

# Copy and edit environment variables
Copy-Item .env.example .env   # already done — edit if needed

# Run the server (auto-runs migrations + seeds categories)
go run cmd/server/main.go
```

Backend starts at **http://localhost:8080**

### 3. Frontend

```powershell
cd frontend
npm install       # if not already done
npm run dev
```

Frontend starts at **http://localhost:5173**

---

## API Reference

### Public (no auth)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/categories` | List all 9 job roles + quota status |
| `GET` | `/api/v1/applications/track?reg_no=&dob=` | Public status lookup |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Applicant registration |
| `POST` | `/api/v1/auth/login` | Login → JWT token |

### Applicant (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/applications` | Submit application (multipart/form-data) |
| `GET` | `/api/v1/applications/my` | My submitted applications |
| `GET` | `/api/v1/applications/my/{id}/receipt` | Download acknowledgement slip (PDF) |

### Admin (Admin JWT required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/admin/metrics` | Live dashboard counters |
| `GET` | `/api/v1/admin/applications` | Paginated applications with filters |
| `PATCH` | `/api/v1/admin/applications/{id}/approve` | Approve (atomic quota enforcement) |
| `PATCH` | `/api/v1/admin/applications/{id}/reject` | Reject with mandatory reason |
| `GET` | `/api/v1/admin/export/csv` | Export approved batches |

---

## Job Roles & Quotas

| Code | Role | Seats |
|---|---|---|
| MER.01 | Merchandiser – Fashion, Made-Ups & Home Furnishings | 800 |
| EMB.02 | Traditional Hand Embroiderer | 400 |
| JQW.03 | Jacquard Weaver (TSC/Q7306) | 360 |
| LLW.04 | Loin Loom Weaver (TSC/Q7307) | 350 |
| BWA.05 | Bamboo Work Artisan | 300 |
| APA.06 | Applique Artisan | 290 |
| TPM.07 | Traditional Painting Maker-Artisan | 240 |
| CPW.08 | Carpet Weaver | 220 |
| PPM.09 | Puppet Maker | 60 |
| **Total** | | **3,020** |

---

## Creating an Admin User

After starting the backend, create an admin directly in the DB:

```sql
-- Connect to handloom_portal database
\c handloom_portal

-- Insert a super admin (replace password hash — use bcrypt cost 12)
INSERT INTO users (mobile_number, password_hash, role)
VALUES ('9999999999', '<bcrypt_hash>', 'SUPER_ADMIN');
```

Or use a small Go one-liner to hash a password:
```powershell
cd backend
go run -e 'package main; import ("fmt";"golang.org/x/crypto/bcrypt"); func main(){h,_:=bcrypt.GenerateFromPassword([]byte("yourpassword"),12);fmt.Println(string(h))}'
```

---

## Security Notes

- PII: Only last 4 digits of Aadhaar/Government ID stored
- Bank account numbers encrypted at rest (implement in production via pgcrypto `pgp_sym_encrypt`)
- Files stored outside web root with randomized UUID filenames
- Nginx rate-limiting on public tracking and auth endpoints
- All admin actions logged to `audit_log` table
- JWT tokens expire in 72 hours

---

## Production Deployment

1. Set strong `JWT_SECRET` (32+ random characters)
2. Use a proper `DATABASE_URL` with SSL (`sslmode=require`)
3. Enable Nginx HTTPS block with TLS 1.3 cert
4. Set `GIN_MODE=release` environment variable
5. Configure Redis for caching and OTP rate-limits
6. Use S3-compatible storage for file uploads

