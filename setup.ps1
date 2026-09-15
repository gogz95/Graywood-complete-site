# ==============================================================================
# Graywood Environment Setup Script (Windows PowerShell)
# Initializes environment, generates secure secrets, starts containers,
# and verifies WordPress bootstrap.
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Graywood Digital Ecosystem - Environment Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Ensure .env file exists with secure randomized credentials
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "[+] Generating fresh .env from .env.example..." -ForegroundColor Yellow
    if (Test-Path $envExample) {
        $content = Get-Content $envExample -Raw
        
        # Generate random secure passwords
        $dbPass = [System.Web.Security.Membership]::GeneratePassword(18, 4) -replace '[^a-zA-Z0-9]', 'X'
        $rootPass = [System.Web.Security.Membership]::GeneratePassword(20, 5) -replace '[^a-zA-Z0-9]', 'Z'
        $adminPass = [System.Web.Security.Membership]::GeneratePassword(18, 4) -replace '[^a-zA-Z0-9]', 'A'
        $clientPass = "ClientPass" + (Get-Random -Minimum 1000 -Maximum 9999) + "!"

        $content = $content -replace "MYSQL_PASSWORD=change_me_in_production", "MYSQL_PASSWORD=$dbPass"
        $content = $content -replace "MYSQL_ROOT_PASSWORD=change_root_in_production", "MYSQL_ROOT_PASSWORD=$rootPass"
        $content = $content -replace "WORDPRESS_ADMIN_PASSWORD=change_admin_pass_in_production", "WORDPRESS_ADMIN_PASSWORD=$adminPass"
        $content = $content -replace "CLIENT_PORTAL_PASSWORD=change_client_pass_in_production", "CLIENT_PORTAL_PASSWORD=$clientPass"

        Set-Content -Path $envFile -Value $content -Encoding UTF8
        Write-Host "[+] .env generated with unique randomized credentials." -ForegroundColor Green
    } else {
        Write-Error "Missing .env.example file. Cannot generate .env"
    }
} else {
    Write-Host "[i] Existing .env file detected. Keeping current credentials." -ForegroundColor Gray
}

# 2. Check Docker daemon availability
Write-Host "[+] Verifying Docker engine status..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    Write-Host "[+] Docker engine is active." -ForegroundColor Green
} catch {
    Write-Error "Docker Desktop or Docker daemon is not running. Please launch Docker and re-run this script."
}

# 3. Spin up Docker containers
Write-Host "[+] Starting container stack via Docker Compose..." -ForegroundColor Yellow
docker compose up -d

# 4. Wait for database and WordPress services
Write-Host "[+] Waiting for WordPress services to become healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempt++
    try {
        $status = docker compose ps --format json | ConvertFrom-Json
        $dbStatus = ($status | Where-Object { $_.Service -eq "db" }).Health
        if ($dbStatus -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {
        # continue waiting
    }
    Write-Host "    Waiting for MariaDB (Attempt $attempt of $maxAttempts)..." -ForegroundColor Gray
}

if (-not $healthy) {
    Write-Warning "Database took longer than expected to become healthy. Continuing initialization..."
}

# 5. Execute internal bootstrap & ensure theme is active
Write-Host "[+] Ensuring graywood-theme is active via WP-CLI..." -ForegroundColor Yellow
docker compose run --rm --entrypoint wp wp-auto-install theme activate graywood-theme 2>$null
docker compose run --rm --entrypoint wp wp-auto-install rewrite structure '/%postname%/' 2>$null

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Setup complete! Graywood stack is running." -ForegroundColor Green
Write-Host "  Site URL:      http://localhost:8080" -ForegroundColor White
Write-Host "  WP Admin:      http://localhost:8080/wp-admin" -ForegroundColor White
Write-Host "  Client Portal: http://localhost:8080/client-deliveries" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
