#!/usr/bin/env bash
# ==============================================================================
# Graywood Safe Deployment Script (Linux / macOS Bash)
# Backs up database, updates containers, flushes template overrides,
# and verifies site health.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_BACKUP="${1:-}"

echo "========================================================"
echo "  Graywood Digital Ecosystem - Production Deployment"
echo "========================================================"

# 1. Run preliminary safety backup
if [ "${SKIP_BACKUP}" != "--skip-backup" ]; then
    echo "[+] Creating preliminary database backup..."
    if [ -f "${SCRIPT_DIR}/backup.sh" ]; then
        bash "${SCRIPT_DIR}/backup.sh" "pre_deploy"
    fi
else
    echo "[i] Skipping preliminary backup as requested."
fi

# 2. Refresh container stack cleanly without deleting volumes
echo "[+] Refreshing containers via Docker Compose..."
docker compose down --remove-orphans
docker compose up -d

# 3. Wait for database health
echo "[+] Waiting for stack initialization..."
sleep 5

# 4. Flush stale database template overrides to guarantee fresh theme files
echo "[+] Flushing cached database template overrides..."
docker compose run --rm --entrypoint /bin/sh wp-auto-install -c '
IDS=$(wp post list --post_type=wp_template_part,wp_template --format=ids 2>/dev/null || true)
if [ -n "$IDS" ]; then
    wp post delete $IDS --force
    echo "[+] Flushed stale template overrides from database."
else
    echo "[i] No database template overrides found. Filesystem active."
fi
'

# 5. Verify HTTP 200 health
echo "[+] Performing HTTP health check on running site..."
HEALTH_OK=false
for i in $(seq 1 10); do
    if curl -s -I http://localhost:8080 | grep -q "200 OK"; then
        HEALTH_OK=true
        break
    fi
    sleep 2
done

if [ "${HEALTH_OK}" = true ]; then
    echo "========================================================"
    echo "  Deployment succeeded! Site is healthy (HTTP 200 OK)."
    echo "  URL: http://localhost:8080"
    echo "========================================================"
else
    echo "[-] Warning: Health check timed out or did not return HTTP 200." >&2
    echo "    Run 'docker compose logs' to inspect service output."
fi
