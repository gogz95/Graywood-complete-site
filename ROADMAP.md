# Graywood Visual Platform — WordPress Ecosystem Roadmap

> **Ecosystem Architecture**: A unified multi-brand visual studio platform serving **Graywood Photography** (Medium-Format Still Imagery), **Graywood Media** (Motion & Sound Collective), and **Graywood Studio Hub** (Ecosystem & Shared Infrastructure), built on **WordPress 6.x Full Site Editing (FSE)**.

---

## 🧭 Architecture & Delivery Tracks

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   WORDPRESS 6.x PLATFORM TRACKS                                 │
├───────────────────────┬───────────────────────┬─────────────────────────┬───────────────────────┤
│       TRACK 1         │        TRACK 2        │         TRACK 3         │        TRACK 4        │
│    FSE Block Theme    │   Client Proofing     │     Gutenberg Blocks    │    Production VPS     │
│  • Nordic Palette     │   • PIN Security Gate │     • Editorial Hero    │    • MariaDB 10.11    │
│  • Fluid Typography   │   • Encrypted Vaults  │     • Split Pillar Card │    • Docker Compose   │
│  • Self-Hosted Fonts  │   • ZIP Asset Pack    │     • Tech Spec Grid    │    • Nginx / Let's    │
│  • Template Parts     │   • Expiry Tracking   │     • Services Matrix   │      Encrypt Proxy    │
└───────────────────────┴───────────────────────┴─────────────────────────┴───────────────────────┘
```

---

## 🌲 Track 1: Native WordPress 6.x Block Theme (`graywood-theme`)
- [x] **Theme Core Specification**:
  - `style.css` matching Scandinavian aesthetic and resets.
  - `theme.json` (v3 schema) implementing full 10-color Nordic palette, typography scale, spacing tokens, and layout width constraints.
- [x] **Self-Hosted Variable Typography**:
  - `Playfair Display` (Variable: Serif Headlines).
  - `Inter` (Variable: Sans-serif Body & Interface).
  - `JetBrains Mono` (Regular: Technical Metadata & Code).
- [x] **Gutenberg Template Engine**:
  - `parts/header.html`: Glassmorphic fixed navigation with brand insignia and primary CTA.
  - `parts/footer.html`: 4-column studio layout with platform telemetry and live status.
  - `templates/front-page.html`: Editorial studio hub showcase.
  - `templates/index.html`, `templates/page.html`, `templates/single.html`: Standard editorial layouts.

---

## 🔐 Track 2: Client Proofing & Vault Deliveries
- [x] **Nordic Password Security Gate**:
  - Customized WordPress password form filter via `the_password_form` hook in `functions.php`.
  - Zero-discovery client proofing vaults (`templates/page-client-delivery.html`).
- [ ] **Extended Client Vault Features (Planned Companion Plugin)**:
  - Custom Post Type `client_vault` with client name, shooting date, and expiration telemetry.
  - Instant high-resolution ZIP asset bundle streamer.
  - Granular client selection and favorites flagging.

---

## 🧩 Track 3: Modular Gutenberg Block Patterns
- [ ] **Reusable Block Patterns**:
  - `patterns/hero.php`: Configurable editorial hero.
  - `patterns/dual-pillars.php`: Photography vs. Motion media split presentation.
  - `patterns/services-grid.php`: 3-column competencies matrix.
  - `patterns/tech-banner.php`: Infrastructure and gear metrics strip.

---

## 🚀 Track 4: Containerized Production & Local Runtime
- [x] **Local Standalone Runtime**:
  - Self-contained PHP 8.2 + SQLite engine (`.wp-env/`) for instantaneous zero-dependency local development on Windows.
- [x] **Docker Compose Architecture**:
  - MariaDB 10.11 + WordPress latest + WP-CLI auto-installer (`docker-compose.yml`, `setup-wp.sh`).
- [x] **Documentation & Deployment Runbook**:
  - Production VPS instructions with SSL reverse proxy in `README.md`.
