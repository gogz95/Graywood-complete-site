# ==============================================================================
# Graywood Database Backup Script (Windows PowerShell)
# Exports a clean, dated SQL snapshot of MariaDB to the backups/ folder.
# ==============================================================================

[CmdletBinding()]
param(
    [string]$CustomName = ""
)

$ErrorActionPreference = "Stop"

$backupDir = Join-Path $PSScriptRoot "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "[+] Created backups directory at: $backupDir" -ForegroundColor Cyan
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ($CustomName) {
    $filename = "db_backup_${CustomName}_${timestamp}.sql"
} else {
    $filename = "db_backup_${timestamp}.sql"
}

$targetPath = Join-Path $backupDir $filename
$containerTargetPath = "/tmp/$filename"

Write-Host "[+] Initiating database export via WP-CLI..." -ForegroundColor Yellow

# Export inside container to /tmp, then copy out cleanly
docker compose run --rm --entrypoint wp wp-auto-install db export $containerTargetPath

# Find the volume or run container export to stdout
$exportResult = docker compose run --rm --entrypoint /bin/sh wp-auto-install -c "wp db export - | cat"

if ($exportResult) {
    Set-Content -Path $targetPath -Value $exportResult -Encoding UTF8
    $size = (Get-Item $targetPath).Length / 1KB
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  Backup completed successfully!" -ForegroundColor Green
    Write-Host "  File: $targetPath" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($size, 2)) KB" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Error "Database export failed or generated empty output."
}
