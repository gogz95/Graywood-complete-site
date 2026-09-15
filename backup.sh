#!/usr/bin/env bash
# ==============================================================================
# Graywood Database Backup Script (Linux / macOS Bash)
# Exports a clean, dated SQL snapshot of MariaDB to the backups/ folder.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
CUSTOM_NAME="${1:-}"

mkdir -p "${BACKUP_DIR}"

if [ -n "${CUSTOM_NAME}" ]; then
    FILENAME="db_backup_${CUSTOM_NAME}_${TIMESTAMP}.sql"
else
    FILENAME="db_backup_${TIMESTAMP}.sql"
fi

TARGET_PATH="${BACKUP_DIR}/${FILENAME}"

echo "[+] Initiating database export via WP-CLI..."

docker compose run --rm --entrypoint /bin/sh wp-auto-install -c "wp db export - | cat" > "${TARGET_PATH}"

if [ -s "${TARGET_PATH}" ]; then
    FILESIZE=$(du -h "${TARGET_PATH}" | cut -f1)
    echo "========================================================"
    echo "  Backup completed successfully!"
    echo "  File: ${TARGET_PATH}"
    echo "  Size: ${FILESIZE}"
    echo "========================================================"
else
    echo "[-] Error: Backup failed or produced empty file." >&2
    rm -f "${TARGET_PATH}"
    exit 1
fi
