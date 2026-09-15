# Graywood Studio Platform — Operations & Maintenance Manual

This guide provides practical instructions for operating, configuring, and maintaining the Graywood WordPress platform without technical jargon.

---

## Table of Contents
1. [Account Security & Administrator Credentials](#1-account-security--administrator-credentials)
2. [User Registration & Client Portal Architecture](#2-user-registration--client-portal-architecture)
3. [Editing Pages & Baking Template Changes to Disk](#3-editing-pages--baking-template-changes-to-disk)
4. [NAS & Network Storage Integration](#4-nas--network-storage-integration)
5. [Multi-Domain DNS & Reverse Proxy Setup](#5-multi-domain-dns--reverse-proxy-setup)
6. [Backups, Restores & Troubleshooting](#6-backups-restores--troubleshooting)

---

## 1. Account Security & Administrator Credentials

### How Credentials Are Set During First Boot
When the containers start for the first time, WordPress is automatically initialized using the variables defined in your `.env` file:
```env
WORDPRESS_ADMIN_USER=admin
WORDPRESS_ADMIN_PASSWORD=change_admin_pass_in_production
WORDPRESS_ADMIN_EMAIL=admin@example.com
```

### Resetting or Changing Admin Password via WP-CLI
If you ever lose access to your administrator account, you can reset the password directly through the container command line:

**Windows (PowerShell):**
```powershell
docker compose run --rm --entrypoint wp wp-auto-install user update 1 --user_pass="YourNewSecurePassword123!"
```

**Linux / macOS (Terminal):**
```bash
docker compose run --rm --entrypoint wp wp-auto-install user update 1 --user_pass="YourNewSecurePassword123!"
```

---

## 2. User Registration & Client Portal Architecture

### Closed-Registration Security Model
Public user registration is disabled by default (`users_can_register = 0`). This eliminates registration spam, automated bot attacks, and database bloat. Only studio administrators manage the site.

### How Client Deliveries Work
Instead of requiring clients to create usernames and passwords, client delivery portals utilize native WordPress password protection:
1. Every gallery or delivery package is authored as a standard Page in WordPress.
2. The page is assigned a secret access password under **Page Settings → Visibility → Password Protected**.
3. When clients visit the delivery link (e.g., `/client-deliveries/`), they are greeted by an editorial unlock screen asking for their key.
4. Once unlocked, their browser receives a secure cookie granting access to high-resolution asset downloads, video embeds, and contact forms.

### Step-by-Step: Creating a New Client Delivery Page
1. Log in to your dashboard at `http://localhost:8080/wp-admin`.
2. Navigate to **Pages → Add New Page**.
3. In the right sidebar under **Page**, find **Visibility** and click **Public**.
4. Select **Password Protected** and enter the client's custom password (e.g., `BrandName2026!`).
5. Choose **Template → Client Deliveries**.
6. Insert your delivery content: galleries, Vimeo/YouTube embeds, client notes, or archive download links.
7. Click **Publish**. Send the URL and password to your client.

---

## 3. Editing Pages & Baking Template Changes to Disk

### Understanding File System vs. Database Changes
- **Standard Pages & Posts:** Content edited in **WP Admin → Pages** is saved into MariaDB (`db_data`).
- **Site Layouts & Headers:** Edited in **Appearance → Editor** (Site Editor). When you modify a template inside the browser, WordPress saves a copy to MariaDB.

### Baking Changes Permanently to Disk
To ensure visual layout changes made in the Site Editor are committed permanently to `wp-theme/graywood-theme/` (and survive deployment flushes):
1. Install the free official WordPress plugin **Create Block Theme** via **Plugins → Add New**.
2. Go to **Appearance → Create Block Theme**.
3. Choose **Save Changes** or **Export Theme**.
4. This writes your editor tweaks directly into `wp-theme/graywood-theme/templates/` and `wp-theme/graywood-theme/parts/`.

---

## 4. NAS & Network Storage Integration

To store heavy master RAW photographs, ProRes video masters, or large deliverable archives on external network storage (such as a Synology, QNAP, or TrueNAS), use a `docker-compose.override.yml` file.

Create a file named `docker-compose.override.yml` in your project root (this file is automatically ignored by Git):

### Example for Windows (Mapped Network Drive)
```yaml
services:
  wordpress:
    volumes:
      # Map a Windows local drive or network share to the deliverable path
      - Z:\StudioVault\Deliveries:/mnt/nas_deliveries
      # Map WordPress uploads directly to high-capacity storage
      - Z:\StudioVault\WordPressUploads:/var/www/html/wp-content/uploads
```

### Example for Linux (NFS / SMB Mount)
```yaml
services:
  wordpress:
    volumes:
      - /mnt/nas/deliveries:/mnt/nas_deliveries
      - /mnt/nas/wp_uploads:/var/www/html/wp-content/uploads
```

Restart your containers to apply the mount:
```bash
docker compose down && docker compose up -d
```

### Proxmox VE LXC Container Deployment Notes
If deploying this Docker stack inside an unprivileged Debian/Ubuntu LXC container on Proxmox VE:
1. **Container Features:** Enable Docker support by checking **Nesting** and **keyctl** in the Proxmox VE Web UI (**Container → Options → Features → Edit → Check Nesting and keyctl**).
   - Alternatively, edit `/etc/pve/lxc/<CTID>.conf` on the Proxmox host:
     ```
     features: nesting=1,keyctl=1
     ```
2. **Storage Bind Mounts:** To pass a ZFS or NFS pool from the Proxmox host to the container:
   - On the Proxmox host in `/etc/pve/lxc/<CTID>.conf`:
     ```
     mp0: /tank/studio_vault,mp=/mnt/nas_deliveries
     ```
   - In `docker-compose.override.yml`, map the LXC mount point directly to the container:
     ```yaml
     services:
       wordpress:
         volumes:
           - /mnt/nas_deliveries:/mnt/nas_deliveries
     ```

---

## 5. Multi-Domain DNS & Reverse Proxy Setup

The Graywood architecture serves three distinct brand experiences from one installation:
- `hub.example.com` → Studio Directory & Admin Gateway
- `photography.example.com` → Commercial Still Photography & Gear Pool
- `media.example.com` → Cinematic Motion & Broadcast Productions

### DNS Configuration
Point all domain A-records to your host server's public IP address (`203.0.113.10`):

| Type | Host / Name | Target Value |
| :--- | :--- | :--- |
| **A** | `hub.example.com` | `203.0.113.10` |
| **A** | `photography.example.com` | `203.0.113.10` |
| **A** | `media.example.com` | `203.0.113.10` |

### Reverse Proxy Configuration (Nginx)
Place this configuration inside `/etc/nginx/sites-available/graywood`:

```nginx
# Upstream to Docker container
upstream graywood_backend {
    server 127.0.0.1:8080;
}

# Single server block handling all 3 studio domains
server {
    listen 80;
    server_name hub.example.com photography.example.com media.example.com;

    # Client payload sizes for high-res deliverables
    client_max_body_size 4096M;

    location / {
        proxy_pass http://graywood_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Byte-range support for video playback
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
    }
}
```

### Obtaining Free SSL Certificates (Let's Encrypt)
Run Certbot once your DNS records propagate:
```bash
sudo certbot --nginx -d hub.example.com -d photography.example.com -d media.example.com
```

---

## 6. Backups, Restores & Troubleshooting

### Creating a Database Backup
Run the backup script before making major edits or performing updates:

**PowerShell:**
```powershell
.\backup.ps1
```

**Bash:**
```bash
./backup.sh
```
Backups are saved to `backups/db_backup_YYYYMMDD_HHMMSS.sql`.

### Restoring a Database Backup
To restore a snapshot:
```bash
docker compose run --rm --entrypoint /bin/sh wp-auto-install -c "wp db import /backups/db_backup_XXXXX.sql"
```

### Fixing Templates That Don't Update (Flushing Database Overrides)
If you update a `.html` template in `wp-theme/graywood-theme/` but the browser continues to show old content, WordPress has saved an override to MariaDB. Run the deployment script to safely clear database overrides and re-bind to the code on disk:

**PowerShell:**
```powershell
.\deploy.ps1
```

**Bash:**
```bash
./deploy.sh
```
