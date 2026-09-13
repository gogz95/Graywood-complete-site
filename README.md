# Graywood WordPress Platform 🌲

A self-hosted, Dockerized **Native WordPress 6.x Block Theme (Full Site Editing / FSE)** built with Scandinavian editorial design aesthetics for **Graywood Studio** — featuring zero-discovery password-protected client proofing delivery, dual-pillar studio presentation (Photography & Motion Media), and streamlined operational infrastructure.

---

## 🎨 Architectural Overview

This repository has undergone a complete transition from legacy Node/Next.js hosting to a containerized WordPress 6.x Block Theme with Full Site Editing (FSE):

- **Core CMS**: WordPress 6.7+ (Apache / PHP 8.2+)
- **Database**: MariaDB 10.11 with persistent volumes and healthcheck validation
- **Theme Paradigm**: Native Gutenberg Block Theme (FSE)
- **Design Tokens**: `theme.json` (v3 schema) with 10-color Nordic palette, responsive typography scale, and fluid layout rules
- **Self-Hosted Typography**:
  - `Playfair Display` (Variable: Serif Editorial Headlines)
  - `Inter` (Variable: Sans-serif Body & Interface)
  - `JetBrains Mono` (Monospace: Technical Metadata & Badges)
- **Client Delivery System**: Password-protected proofing vaults using WordPress native encryption gates with customized Nordic PIN interface (`page-client-delivery.html`)
- **Automated Provisioning**: WP-CLI container script (`setup-wp.sh`) that installs WordPress, activates the theme, sets permalinks, and seeds baseline pages upon launch

---

## 📁 Repository Structure

```
.
├── docker-compose.yml              # MariaDB + WordPress + WP-CLI orchestrator
├── setup-wp.sh                     # Automated provisioning and page seeding script
├── README.md                       # Platform documentation and deployment guide
├── ROADMAP.md                      # Product roadmap and architectural tracks
├── .gitignore                      # Git exclusion rules for WordPress & Docker
└── wp-theme/
    └── graywood-theme/             # Standalone WordPress 6.x Block Theme
        ├── style.css               # Theme definition and CSS baseline
        ├── theme.json              # Full Site Editing tokens, fonts, and colors
        ├── functions.php           # Enqueue hooks, pattern categories, password filter
        ├── screenshot.png          # Theme preview image for WP Admin
        ├── assets/
        │   ├── css/
        │   │   └── custom.css      # Nordic styling extensions, glassmorphism & cards
        │   ├── fonts/
        │   │   ├── PlayfairDisplay-Variable.ttf
        │   │   ├── Inter-Variable.ttf
        │   │   └── JetBrainsMono-Regular.ttf
        │   └── images/             # Theme graphic assets
        ├── parts/
        │   ├── header.html         # Fixed glass navbar with brand & actions
        │   └── footer.html         # 4-column studio footer & platform credentials
        └── templates/
            ├── front-page.html     # Editorial hero, pillar cards, services, tech banner
            ├── index.html          # Blog and editorial post query loop
            ├── page.html           # Generic content page
            ├── single.html         # Single article / editorial post
            └── page-client-delivery.html # Password-protected client delivery vault
```

---

## 🚀 Quick Start (Docker Deployment)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with `docker compose` (v2+)
- *On Windows*: WSL 2 backend or Hyper-V enabled

### 1. Launch Services
Run Docker Compose in the project root:
```bash
docker compose up -d
```

This launches three coordinated services:
1. `graywood-db` — MariaDB database initialized with persistent storage.
2. `graywood-wordpress` — WordPress core container mounting the `./wp-theme/graywood-theme` folder into `/var/www/html/wp-content/themes/graywood-theme`.
3. `graywood-wp-cli` — Ephemeral container that executes `setup-wp.sh` to configure WordPress, activate the theme, create pages, and exit cleanly.

### 2. Monitor Auto-Provisioning
Track the automated setup:
```bash
docker compose logs -f wp-auto-install
```

Once completed, the logs will confirm:
```
============================================
  Graywood provisioning complete!

  Site:     http://localhost:8080
  Admin:    http://localhost:8080/wp-admin/
  User:     admin
  Password: AdminPassword123!

  Client Delivery Password: graywood2026
============================================
```

### 3. Access the Studio
- **Public Site**: [http://localhost:8080](http://localhost:8080)
- **WordPress Admin**: [http://localhost:8080/wp-admin/](http://localhost:8080/wp-admin/)
- **Client Delivery Vault**: [http://localhost:8080/client-deliveries/](http://localhost:8080/client-deliveries/) (Password: `graywood2026`)

---

## 🔐 Client Delivery Vaults

The Graywood client delivery system leverages WordPress's native cryptographic post-password mechanism, customized via `functions.php` with the `the_password_form` filter to match Graywood's Nordic aesthetic:

- **Template**: `templates/page-client-delivery.html`
- **Password Form Filter**: Intercepts default WordPress password prompt and renders an encrypted security card with SVG key indicators and PIN entry styling.
- **Post-Authentication Content**: Unlocks full-resolution image galleries and download CTAs upon successful password validation.

---

## 🌐 Production VPS Deployment

To deploy this theme to any production Ubuntu/Debian VPS:

1. **Clone or Copy Repository**:
   ```bash
   git clone https://github.com/gogz95/Graywood-complete-site.git /srv/graywood
   cd /srv/graywood
   ```

2. **Configure Environment Secrets**:
   Update `docker-compose.yml` with strong production credentials:
   - `MYSQL_ROOT_PASSWORD`
   - `MYSQL_PASSWORD`
   - `WORDPRESS_DB_PASSWORD`

3. **Set Production Domain**:
   Update `setup-wp.sh` with your live domain:
   ```bash
   --url="https://graywood.no"
   ```

4. **Add Reverse Proxy (Nginx / Caddy / Traefik)**:
   Point your reverse proxy with SSL termination (Let's Encrypt) to port `8080` (or update the host port in `docker-compose.yml`).

5. **Start Containers**:
   ```bash
   docker compose up -d
   ```
