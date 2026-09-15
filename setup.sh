#!/usr/bin/env bash
# ==============================================================================
# Graywood Environment Setup Script (Linux / macOS Bash)
# Initializes environment, generates secure secrets, starts containers,
# and verifies WordPress bootstrap.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
ENV_EXAMPLE="${SCRIPT_DIR}/.env.example"

echo "========================================================"
echo "  Graywood Digital Ecosystem - Environment Setup"
echo "========================================================"

# 1. Generate .env if missing
if [ ! -f "${ENV_FILE}" ]; then
    echo "[+] Generating fresh .env from .env.example..."
    if [ -f "${ENV_EXAMPLE}" ]; then
        cp "${ENV_EXAMPLE}" "${ENV_FILE}"
        
        # Generate random secrets
        DB_PASS=$(openssl rand -hex 12 2>/dev/null || head -c 16 /dev/urandom | xxd -p | head -n 1)
        ROOT_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 20 /dev/urandom | xxd -p | head -n 1)
        ADMIN_PASS=$(openssl rand -hex 12 2>/dev/null || head -c 16 /dev/urandom | xxd -p | head -n 1)
        CLIENT_PASS="ClientPass$((1000 + RANDOM % 9000))!"

        sed -i.bak "s/MYSQL_PASSWORD=change_me_in_production/MYSQL_PASSWORD=${DB_PASS}/" "${ENV_FILE}"
        sed -i.bak "s/MYSQL_ROOT_PASSWORD=change_root_in_production/MYSQL_ROOT_PASSWORD=${ROOT_PASS}/" "${ENV_FILE}"
        sed -i.bak "s/WORDPRESS_ADMIN_PASSWORD=change_admin_pass_in_production/WORDPRESS_ADMIN_PASSWORD=${ADMIN_PASS}/" "${ENV_FILE}"
        sed -i.bak "s/CLIENT_PORTAL_PASSWORD=change_client_pass_in_production/CLIENT_PORTAL_PASSWORD=${CLIENT_PASS}/" "${ENV_FILE}"
        rm -f "${ENV_FILE}.bak"

        echo "[+] .env generated with unique randomized credentials."
    else
        echo "[-] Error: .env.example missing. Cannot generate .env" >&2
        exit 1
    fi
else
    echo "[i] Existing .env file detected. Keeping current credentials."
fi

# 2. Check Docker
echo "[+] Checking Docker daemon status..."
if ! docker info >/dev/null 2>&1; then
    echo "[-] Error: Docker engine is not running. Please start Docker." >&2
    exit 1
fi
echo "[+] Docker engine is active."

# 3. Start containers
echo "[+] Starting container stack via Docker Compose..."
docker compose up -d

# 4. Wait for database health
echo "[+] Waiting for MariaDB service to report healthy..."
ATTEMPTS=0
MAX_ATTEMPTS=30
while [ ${ATTEMPTS} -lt ${MAX_ATTEMPTS} ]; do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' wp_db 2>/dev/null || true)
    if [ "${STATUS}" = '"healthy"' ]; then
        echo "[+] MariaDB is healthy."
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "    Waiting for MariaDB (${ATTEMPTS}/${MAX_ATTEMPTS})..."
    sleep 2
done

# 5. Ensure theme activation and permalink structure
echo "[+] Ensuring graywood-theme is active via WP-CLI..."
docker compose run --rm --entrypoint wp wp-auto-install theme activate graywood-theme || true
docker compose run --rm --entrypoint wp wp-auto-install rewrite structure '/%postname%/' || true

echo "========================================================"
echo "  Setup complete! Graywood stack is running."
echo "  Site URL:      http://localhost:8080"
echo "  WP Admin:      http://localhost:8080/wp-admin"
echo "  Client Portal: http://localhost:8080/client-deliveries"
echo "========================================================"
