# Handloom Portal — Database Setup Script (PowerShell)
# Run once before starting the backend server.
# Assumes psql is installed and PostgreSQL is running locally.

param(
    [string]$DBHost   = "localhost",
    [string]$Port     = "5432",
    [string]$User     = "postgres",
    [string]$Password = "1234",
    [string]$DBName   = "handloom_portal"
)

$env:PGPASSWORD = $Password

Write-Host "Creating database '$DBName'..." -ForegroundColor Cyan
psql -h $DBHost -p $Port -U $User -c "CREATE DATABASE $DBName;" 2>&1 | ForEach-Object {
    if ($_ -match "already exists") { Write-Host "  Database already exists, skipping." -ForegroundColor Yellow }
    else { Write-Host "  $_" }
}

Write-Host ""
Write-Host "Done! Database setup complete." -ForegroundColor Green
Write-Host "Now update backend\.env with your credentials and run: go run cmd/server/main.go"

