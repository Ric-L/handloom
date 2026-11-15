$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " GOVERNMENT APPLICATION PORTAL: AUDIT SYSTEM TEST SUITE   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api/v1"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Step 1: CSRF Token Fetch
Write-Host "`n[1] Fetching CSRF Token..." -ForegroundColor Yellow
$csrfRes = Invoke-RestMethod -Uri "$baseUrl/auth/csrf-token" -Method Get -WebSession $session
$csrfToken = $csrfRes.csrf_token
if (-not $csrfToken) { throw "Failed to obtain CSRF token" }
Write-Host " -> CSRF Token obtained: $csrfToken" -ForegroundColor Green

# Step 2: Super Admin Login
Write-Host "`n[2] Logging in as Super Administrator (9999999999)..." -ForegroundColor Yellow
$loginBody = @{
    mobile_number = "9999999999"
    password      = "Admin@12345"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-CSRF-Token" = $csrfToken
}

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/admin-login" -Method Post -Body $loginBody -Headers $headers -WebSession $session
$token = $loginRes.token
$superAdminId = $loginRes.user.id
Write-Host " -> Super Admin authenticated. User ID: $superAdminId, Role: $($loginRes.user.role)" -ForegroundColor Green

$authHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
    "X-CSRF-Token"  = $csrfToken
}

# Step 3: Trigger Applications List View (Audited Action)
Write-Host "`n[3] Calling GET /admin/applications (Action: APPLICATIONS_LIST_VIEWED)..." -ForegroundColor Yellow
$appsRes = Invoke-RestMethod -Uri "$baseUrl/admin/applications?page=1&page_size=5" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Successfully fetched $($appsRes.data.Count) applications (Total: $($appsRes.total))" -ForegroundColor Green

# Step 4: Trigger Candidate List View (Audited Action)
Write-Host "`n[4] Calling GET /admin/candidates (Action: CANDIDATES_LIST_VIEWED)..." -ForegroundColor Yellow
$candsRes = Invoke-RestMethod -Uri "$baseUrl/admin/candidates?page=1&page_size=5" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Successfully fetched $($candsRes.data.Count) candidates (Total: $($candsRes.total))" -ForegroundColor Green

# Step 5: Trigger Users List View (Audited Action)
Write-Host "`n[5] Calling GET /admin/users (Action: USERS_LIST_VIEWED)..." -ForegroundColor Yellow
$usersRes = Invoke-RestMethod -Uri "$baseUrl/admin/users?page=1&page_size=5" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Successfully fetched $($usersRes.data.Count) users (Total: $($usersRes.total))" -ForegroundColor Green

# Step 6: Trigger CSV Export (Audited Action)
Write-Host "`n[6] Calling GET /admin/export/csv (Action: DATA_EXPORTED)..." -ForegroundColor Yellow
$exportRes = Invoke-WebRequest -Uri "$baseUrl/admin/export/csv?status=APPROVED" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Successfully received CSV export, status: $($exportRes.StatusCode), bytes: $($exportRes.RawContentLength)" -ForegroundColor Green

# Step 7: Trigger Category Quota Update (Audited Action with Before/After State)
Write-Host "`n[7] Calling PATCH /admin/categories/:id/quota (Action: CATEGORY_QUOTA_UPDATED)..." -ForegroundColor Yellow
$catsRes = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get -WebSession $session
$firstCat = $catsRes[0]
$firstCatId = $firstCat.id
$newLimit = 825
$quotaBody = @{ approval_limit = $newLimit } | ConvertTo-Json
$quotaRes = Invoke-RestMethod -Uri "$baseUrl/admin/categories/$firstCatId/quota" -Method Patch -Body $quotaBody -Headers $authHeaders -WebSession $session
Write-Host " -> Quota updated: Category $($quotaRes.code) limit set to $($quotaRes.approval_limit)" -ForegroundColor Green

# Step 8: Trigger Application Approve / Reject if an application exists
if ($appsRes.data.Count -gt 0) {
    $firstAppId = $appsRes.data[0].id
    Write-Host "`n[8] Calling GET /admin/applications/$firstAppId (Action: APPLICATION_INSPECTED)..." -ForegroundColor Yellow
    $appDetail = Invoke-RestMethod -Uri "$baseUrl/admin/applications/$firstAppId" -Method Get -Headers $authHeaders -WebSession $session
    Write-Host " -> Successfully inspected dossier for applicant: $($appDetail.full_name)" -ForegroundColor Green
}

# Wait 500ms for async database insert
Start-Sleep -Milliseconds 500

# Step 9: Query Audit Logs API (Action: AUDIT_LOGS_VIEWED)
Write-Host "`n[9] Calling GET /admin/audit-logs..." -ForegroundColor Yellow
$auditRes = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs?page=1&page_size=20" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Retrieved $($auditRes.entries.Count) audit ledger records (Total matching: $($auditRes.total))" -ForegroundColor Green

Write-Host "`nRecent 5 Audit Entries in Database:" -ForegroundColor Cyan
$auditRes.entries | Select-Object -First 5 | ForEach-Object {
    Write-Host (" [{0}] Action: {1,-26} | ActorRole: {2,-14} | Resource: {3,-14} | Status: {4}" -f $_.created_at, $_.action, $_.actor_role, $_.resource_type, $_.status)
}

# Step 10: Query Daily Audit Files API
Write-Host "`n[10] Calling GET /admin/audit-logs/files..." -ForegroundColor Yellow
$filesRes = Invoke-RestMethod -Uri "$baseUrl/admin/audit-logs/files" -Method Get -Headers $authHeaders -WebSession $session
Write-Host " -> Found $($filesRes.count) daily audit log file(s) on server:" -ForegroundColor Green
$filesRes.files | ForEach-Object {
    Write-Host ("    File: {0} ({1} bytes, Modified: {2})" -f $_.filename, $_.size_bytes, $_.last_modified)
}

# Step 11: Verify Persistent File on Disk
Write-Host "`n[11] Verifying Physical Disk Log File..." -ForegroundColor Yellow
$todayStr = (Get-Date).ToString("yyyy-MM-dd")
$expectedFile = "d:\handloom\backend\logs\audit\audit-$todayStr.log"
if (-not (Test-Path $expectedFile)) {
    throw "Expected audit log file $expectedFile does not exist!"
}
$fileLines = Get-Content -Path $expectedFile
Write-Host " -> File exists: $expectedFile ($($fileLines.Count) entries recorded today)" -ForegroundColor Green

# Parse last line to verify structure
$lastLine = $fileLines[-1] | ConvertFrom-Json
Write-Host " -> Sample entry verified: ID=$($lastLine.id), Action=$($lastLine.action), Checksum=$($lastLine.checksum)" -ForegroundColor Green
if (-not $lastLine.checksum -or -not ($lastLine.checksum.StartsWith("sha256:"))) {
    throw "Audit entry missing SHA-256 integrity checksum!"
}

# Verify redaction: check that password or secret doesn't appear
$fileRaw = Get-Content -Raw -Path $expectedFile
if ($fileRaw -match "Admin@12345" -or $fileRaw -match "Reviewer@12345") {
    throw "CRITICAL SECURITY LEAK: Passwords found unredacted in audit log file!"
}
Write-Host " -> Redaction verified: Zero plaintext credentials in audit logs." -ForegroundColor Green

# Step 12: Verify Database Tamper-Resistance (Hardware/Trigger Prohibits UPDATE & DELETE)
Write-Host "`n[12] Testing Database Tamper Resistance Trigger..." -ForegroundColor Yellow
$env:PGPASSWORD = "1234"
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$tamperUpdateOutput = (& "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d handloom_portal -c "UPDATE audit_log SET action = 'MALICIOUS_TAMPER' WHERE id = 1;" 2>&1) | Out-String
if ($tamperUpdateOutput -match "tamper-resistant") {
    Write-Host " -> UPDATE blocked by trigger: Tamper protection active!" -ForegroundColor Green
} else {
    throw "FAILED: UPDATE was not blocked by tamper trigger! Output: $tamperUpdateOutput"
}

$tamperDeleteOutput = (& "D:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d handloom_portal -c "DELETE FROM audit_log WHERE id = 1;" 2>&1) | Out-String
if ($tamperDeleteOutput -match "tamper-resistant") {
    Write-Host " -> DELETE blocked by trigger: Tamper protection active!" -ForegroundColor Green
} else {
    throw "FAILED: DELETE was not blocked by tamper trigger! Output: $tamperDeleteOutput"
}

$ErrorActionPreference = $prevEAP

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL AUDIT LOGGING & SECURITY CHECKS PASSED SUCCESSFULLY! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
