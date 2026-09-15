# ==============================================================================
# Graywood Safe Deployment Script (Windows PowerShell)
# Backs up database, updates containers, flushes template overrides,
# and verifies site health.
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Graywood Digital Ecosystem - Production Deployment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Run preliminary safety backup
if (-not $SkipBackup) {
    Write-Host "[+] Creating preliminary database backup..." -ForegroundColor Yellow
    $backupScript = Join-Path $PSScriptRoot "backup.ps1"
    if (Test-Path $backupScript) {
        & $backupScript -CustomName "pre_deploy"
    }
} else {
    Write-Host "[i] Skipping preliminary backup as requested." -ForegroundColor Gray
}

# 2. Restart and recreate container stack cleanly (preserves volumes)
Write-Host "[+] Refreshing containers via Docker Compose..." -ForegroundColor Yellow
docker compose down --remove-orphans
docker compose up -d

# 3. Wait for database and app to become ready
Write-Host "[+] Waiting for stack initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Flush stale database template overrides to guarantee fresh theme files
Write-Host "[+] Flushing cached database template overrides..." -ForegroundColor Yellow
docker compose run --rm --entrypoint /bin/sh wp-auto-install -c '
IDS=$(wp post list --post_type=wp_template_part,wp_template --format=ids 2>/dev/null || true)
if [ -n "$IDS" ]; then
    wp post delete $IDS --force
    echo "[+] Flushed stale template overrides from database."
else
    echo "[i] No database template overrides found. Filesystem active."
fi
'

# 5. Verify HTTP 200 health check
Write-Host "[+] Performing HTTP health check on running site..." -ForegroundColor Yellow
$healthOk = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $healthOk = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($healthOk) {
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  Deployment succeeded! Site is healthy (HTTP 200 OK)." -ForegroundColor Green
    Write-Host "  URL: http://localhost:8080" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Warning "Health check returned non-200 status or timed out. Please check 'docker compose logs'."
}
