# Graywood Visual Platform

A unified multi-brand visual studio platform engineered for **Graywood Photography** (Medium-Format Still Imagery), **Graywood Media** (Motion & Sound Collective), and the **Graywood Studio Hub** (Ecosystem & Shared Infrastructure).

Built with **Next.js 16 (Turbopack)**, **React 19**, **Prisma ORM**, **Sharp**, **Iron-Session**, and styled with a bespoke **Scandinavian / Nordic Editorial Design System**.

---

## 🧭 Master Product Roadmap

For the complete prioritized delivery schedule, architectural breakdowns, and integration tracks, please see:

👉 **[Master Product Roadmap (ROADMAP.md)](./ROADMAP.md)**

### Priority Overview:
1. **Priority 1**: Portfolio Engine, Admin Album Creator & Password-Protected Client Proofing Vaults.
2. **Priority 2**: Gated Gear Desk with Equipment Owner Attribution & Custody Auditing.
3. **Priority 3**: NAS Storage Integration (SMB/NFS Read-Only Ingestion) & NVMe/SSD Preview Caching.
4. **Priority 4**: Multi-Brand Landing Hub & Dynamic Hostname/Sub-path Routing.
5. **Deferred Roadmap (Paused)**: Manga/Comic Reader Suite (`reader.graywood.no`) & Game Server Telemetry Nodes (`play.graywood.no`).

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/gogz95/Graywood-complete-site.git
cd Graywood-complete-site

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Database Initialization
```bash
# Run migrations & generate Prisma client
npm run db:migrate

# Seed baseline users, brands, modules, and albums
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the unified studio hub.

---

## 📁 Key Routes

- **`/hub` (or `/`)**: Multi-Brand Landing & Ecosystem Hub.
- **`/photography`**: Photography Studio & Medium-Format Archive.
- **`/media`**: Motion Collective & Cinematic Showreel.
- **`/portal/[albumSlug]`**: Zero-Discovery Password-Protected Client Proofing Vault.
- **`/admin/login`**: Operations Command Suite Login.
- **`/admin/library`**: Virtual Library Asset Browser & NAS Indexer.
- **`/admin/gear`**: Gated Gear Desk & Equipment Custody Logs.

---

## 🧪 Testing & Validation

```bash
# Run full automated test suite (Storage security, Indexer, Transcoder, E2E)
npm run test:all

# Trigger manual NAS storage indexer
npm run nas:index

# Build for standalone production
npm run build
```
