# Graywood — Scandinavian Visual Production Theme & Docker Stack

A full-stack WordPress Full Site Editing (FSE) block theme and containerized production architecture engineered for high-end photography studios, cinematic motion collectives, and private client delivery vaults.

---

## Architecture Overview

Graywood couples a native Gutenberg FSE block theme with an automated containerized environment:

- **Theme Code on Disk (`wp-theme/graywood-theme/`):** Contains template files (`templates/*.html`), template parts (`parts/*.html`), global tokens (`theme.json`), and design system rules (`style.css`). This folder is mounted into the container live, so changes to code are immediately visible.
- **Database Content (MariaDB & Named Volumes):** All user pages, posts, media references, and settings are preserved in persistent Docker volumes (`wp_data`, `db_data`, `nas_storage`). Containers can be stopped, rebuilt, or upgraded without data loss.

```
┌─────────────────────────────────────────────────────────────┐
│                    Host Browser / Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Reverse Proxy / Port 8080
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    WordPress App Container                  │
│  - Apache 2.4 + PHP 8.3                                     │
│  - Live Bind Mount: ./wp-theme/graywood-theme               │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ MariaDB Protocol             │ Media & Deliveries
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     MariaDB 10.11 Database  ││      Persistent Vault        │
│     (Named Volume: db_data) ││  (Named Volume / NAS Mount)  │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## Multi-Domain Routing Model

The platform can host multiple specialized studio portals through a single unified WordPress installation:

| Portal | Role | Placeholder Domain |
| :--- | :--- | :--- |
| **Central Hub** | Studio directory, overview, and gateway | `hub.example.com` |
| **Still Imagery** | Editorial photography & archives | `photography.example.com` |
| **Motion & Sound** | Commercial video & cinematic reels | `media.example.com` |
| **Client Portal** | Password-gated client deliverable vault | `/client-deliveries/` |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine with Docker Compose v2+ (Linux).
- [Git](https://git-scm.com/) installed on your host machine.
- A modern web browser.

---

## Quick Start (One Command)

### Windows (PowerShell)
```powershell
# 1. Clone the repository
git clone https://github.com/example/graywood-complete-site.git
cd graywood-complete-site

# 2. Run automated setup
.\setup.ps1
```

### Linux / macOS (Bash)
```bash
# 1. Clone the repository
git clone https://github.com/example/graywood-complete-site.git
cd graywood-complete-site

# 2. Make scripts executable and run setup
chmod +x *.sh
./setup.sh
```

### Manual Startup
```bash
cp .env.example .env
docker compose up -d
```

Once running, access your local environment:
- **Public Front Page:** [http://localhost:8080](http://localhost:8080)
- **Client Delivery Vault:** [http://localhost:8080/client-deliveries/](http://localhost:8080/client-deliveries/) (Default Password: `ClientPass2026!`)
- **WordPress Admin:** [http://localhost:8080/wp-admin](http://localhost:8080/wp-admin)

---

## Operational Scripts

| Script | Purpose |
| :--- | :--- |
| `setup.ps1` / `setup.sh` | Initializes `.env`, generates randomized passwords, starts containers, and activates theme. |
| `backup.ps1` / `backup.sh` | Creates an instant, dated SQL database snapshot in `backups/`. |
| `deploy.ps1` / `deploy.sh` | Creates a preliminary backup, refreshes containers, flushes template cache, and checks site health. |

---

## Repository Standards & Privacy

This repository complies with strict open-source privacy standards:
- **Zero Real Credentials:** All defaults use safe development placeholders.
- **Zero Real Domains:** All examples use RFC 2606 reserved domains (`hub.example.com`, `media.example.com`, `photography.example.com`).
- **No Uploaded Client Media:** Named volumes isolate user data outside the git tree.

For in-depth administrative guides, NAS configuration, reverse proxies, and backup restoration, read the [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md).

---

## License

This project is open source and released under the terms of the [GNU General Public License v2 (GPL-2.0-or-later)](LICENSE).
