# NAS Storage Integration — Production Setup Guide

This document covers **Priority 3.1**: mounting the NAS into the Graywood platform for all supported deployment environments, then wiring the automated ingestion pipeline.

---

## Overview

The platform reads master image files from a configured NAS path via the following environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `NAS_STORAGE_PATH` | `./storage/nas` | Absolute or relative path to NAS root |
| `LOCAL_CACHE_PATH` | `./cache/previews` | SSD path where Sharp writes WebP thumbnails |

All NAS access is **read-only at the application layer** — `lib/storage.ts` enforces a strict path jail and blocks directory traversal. The NAS share itself should also be mounted read-only where possible.

---

## 1. Windows Development / Local Server

### Option A — UNC Path (no drive letter needed)

Set in `.env`:
```env
NAS_STORAGE_PATH=\\\\192.168.1.50\\media\\photography
```

No mount required — Windows accesses SMB shares via UNC paths natively. Make sure the current user has read access to the share.

### Option B — Mapped Network Drive

Map the NAS share to a local drive letter (e.g. `Z:`):

```powershell
# In PowerShell (or via Windows Explorer > Map Network Drive)
net use Z: \\192.168.1.50\media /user:studio <password> /persistent:yes
```

Then set in `.env`:
```env
NAS_STORAGE_PATH=Z:\photography
```

---

## 2. Linux Production Host (bare-metal or VM)

Install CIFS utilities if not already present:

```bash
sudo apt-get install -y cifs-utils
# or for NFS:
sudo apt-get install -y nfs-common
```

### SMB/CIFS Mount (read-only)

```bash
# Create mount point
sudo mkdir -p /mnt/nas/graywood

# Mount the share read-only
sudo mount -t cifs //192.168.1.50/media /mnt/nas/graywood \
  -o username=studio,password=<secret>,ro,iocharset=utf8,vers=3.0

# Verify
ls /mnt/nas/graywood
```

To make it **persistent across reboots**, add to `/etc/fstab`:
```fstab
//192.168.1.50/media  /mnt/nas/graywood  cifs  username=studio,password=<secret>,ro,iocharset=utf8,vers=3.0,_netdev  0  0
```

For secure credential storage, use a credentials file instead of inline password:
```bash
# /etc/cifs-credentials (chmod 600)
username=studio
password=<secret>
```
```fstab
//192.168.1.50/media  /mnt/nas/graywood  cifs  credentials=/etc/cifs-credentials,ro,_netdev  0  0
```

### NFS Mount (read-only)

```bash
sudo mount -t nfs 192.168.1.50:/volume1/media /mnt/nas/graywood -o ro,_netdev
```

Set in `.env` or production environment:
```env
NAS_STORAGE_PATH=/mnt/nas/graywood
LOCAL_CACHE_PATH=/app/cache/previews
```

---

## 3. Docker Deployment

The `docker-compose.yml` already wires the NAS as a host volume bind-mount. Update the NAS path to match your actual mount point:

```yaml
# docker-compose.yml
volumes:
  - /mnt/nas/photography:/mnt/storage:ro   # change left side to your NAS mount
  - ./data:/app/data:rw
  - ./cache:/app/cache:rw
```

The container reads `NAS_STORAGE_PATH=/mnt/storage` (already set in `docker-compose.yml`).

**Important**: Mount the NAS on the **host** first (`sudo mount ...`), then start Docker. The `:ro` flag in the volume prevents the container from writing to the NAS even if the host mount is read-write.

---

## 4. Automated NAS Ingestion Pipeline

Once the NAS is mounted, trigger indexing:

### Manual Scan (on-demand)

```bash
npm run nas:index
```

Runs `scripts/index-nas.ts` — performs an incremental SHA-256 scan, skips already-indexed files, extracts EXIF, and inserts new `MediaAsset` records into SQLite.

### Cache Maintenance CLI

```bash
# Flush all WebP preview caches (forces re-transcode on next request)
npm run cache:flush

# Warm-up thumbnails for all currently indexed assets
npm run cache:warm

# Dry-run: show what would be flushed without deleting
npm run cache:flush -- --dry-run
```

### Scheduled Cron (Linux / Production Host)

```bash
# Open crontab for the service user
crontab -e

# Scan NAS every 30 minutes, log output
*/30 * * * * cd /srv/graywood && npm run nas:index >> /var/log/graywood-nas-index.log 2>&1
```

### Docker Cron Sidecar

A dedicated `cron` service in `docker-compose.yml` handles scheduled indexing in Docker deployments — see the `cron` service definition in `docker-compose.yml`.

---

## 5. Storage Directory Structure

The platform expects (but does not enforce) this layout inside the NAS root:

```
NAS_STORAGE_PATH/
├── landscape/          → auto-categorised as LANDSCAPE
├── portrait/           → auto-categorised as PORTRAIT
├── arch/               → auto-categorised as ARCHITECTURE
├── proofing/           → private client proofing assets (isPublic=false)
│   └── client-name/
└── editorial/          → public editorial work
```

The indexer in `lib/indexer.ts` infers `category` and `isPublic` from the directory name. Any path containing `proofing` or `client` is treated as private and requires an active session to serve.
