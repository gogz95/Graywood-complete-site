# Graywood Visual Platform — Master Product Roadmap

> **Ecosystem Architecture**: A unified multi-brand visual studio platform serving **Graywood Photography** (Medium-Format Still Imagery), **Graywood Media** (Motion & Sound Collective), and **Graywood Studio Hub** (Ecosystem & Shared Infrastructure).

---

## 🧭 Roadmap Priority Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CURRENT DEVELOPMENT CYCLE                                    │
├───────────────────────┬───────────────────────┬─────────────────────────┬───────────────────────┤
│      PRIORITY 1       │      PRIORITY 2       │       PRIORITY 3        │      PRIORITY 4       │
│  Portfolio & Albums   │   Gated Gear Desk     │     NAS Integration     │   Hub Interconnect    │
│  • Public Portfolios  │   • Owner Attribution │     • Production Mount  │   • Live Telemetry    │
│  • Client Proofing    │   • "My Gear" Filter  │     • SSD Cache Tuning  │   • Brand Routing     │
│  • Batch Assignment   │   • Custody Auditing  │     • Ingestion Cron    │   • Inquiries Ledger  │
└───────────────────────┴───────────────────────┴─────────────────────────┴───────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 DEFERRED ROADMAP (NOT IN ACTIVE DEV)                            │
├───────────────────────────────────────────────┬─────────────────────────────────────────────────┤
│                  TRACK A                      │                     TRACK B                     │
│        Reader Suite Integration               │          Game Server Hosting & Telemetry        │
│        • reader.graywood.no CSP               │          • GameDig UDP Query Engine             │
│        • Digital Comic / Manga Archive        │          • Assetto Corsa & Dedicated Nodes      │
└───────────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 🔥 Active Priority 1: Portfolio Engine, Albums & Client Proofing

### 1.1 Admin Album Management & Provisioning
- [x] **Album Creation Engine (`app/actions/albums.ts`)**:
  - Server action to create both **Public Portfolio** albums and **Client Proofing** vaults.
  - Automatic URL slugification with duplicate-collision handling (e.g., `nordic-campaign-2026`).
  - Cryptographic PIN hashing using `bcryptjs` for proofing vaults.
- [x] **Admin Album Manager UI (`app/admin/library`)**:
  - Dedicated **Albums Tab** inside the Virtual Library.
  - Album cards displaying title, client name, item count, type badge, and created date.
  - One-click **"Copy Client Vault Link"** button (`https://graywood.no/portal/{slug}`).
  - Quick PIN reset and safe album deletion (strictly preserving underlying media assets).

### 1.2 Gallery Overview & Batch Photo Assignment
- [x] **Multi-Select Asset Assignment**:
  - Checkbox selection mode in `LibraryManager.tsx` to select multiple indexed plates.
  - Sticky batch action bar: assign multiple assets to target album in one click.
- [x] **Single-Asset Quick Inspector**:
  - View full EXIF telemetry (Camera, Lens, Focal Length, Shutter, Aperture, ISO).
  - Album membership badges displayed on every media card.

### 1.3 Client Proofing Vaults (`/portal/[albumSlug]`)
- [x] **Zero-Discovery Lockout**: `/portal` direct access throws `404 Not Found`; crawlers blocked via `robots.txt`.
- [x] **Edge-Safe PIN Verification**: Encrypted HTTP-only iron-session authorization cookie.
- [x] **Memory-Safe Streaming ZIP**: Instant full-resolution asset pack download directly from storage without RAM buffering.
- [x] **Client Access Link Distribution**: One-click direct link copy with instant verification.

### 1.4 Public Portfolio Showcasing
- [x] **Editorial Photography Masonry**: Responsive grid with WebP thumbnail transcoding and full-screen lightbox.
- [x] **Cinematic Media Showreel**: Interactive 2026 motion reel player with custom transport controls.
- [x] **Portfolio Collection Filter Strips**: Live dynamic album filtering in the public photography gallery.

---

## ⚡ Priority 2: Gated Gear Desk & Owner Attribution
- [x] **Equipment Owner & Studio Attribution**:
  - `ownerId` and `ownerName` integrated into `model GearItem` in `prisma/schema.prisma`.
  - Distinguishes studio-owned shared equipment (`ownerId: null`, `ownerName: "Studio Shared"`) from individual co-owner gear (`ownerId: user.id`, `ownerName: user.name`).
- [x] **Owner-Specific View Filtering**:
  - `ALL ({total})`: Global studio inventory.
  - `STUDIO ({studioCount})`: Common pool equipment.
  - `MY GEAR ({myGearCount})`: Equipment owned by authenticated co-owner/admin.
- [x] **Custody Auditing & Lifecycle Management**:
  - Role-gated checkouts (`ADMIN`, `CO_OWNER`) with atomic double-checkout protection.
  - Immutable transaction logs recording custodian, checkout notes, and return conditions.
  - Custody overdue alerts: Real-time `OVERDUE` status indicators for hardware past scheduled return.
  - Deletion & ownership reassignment actions (`updateGearOwner`, `deleteGearItem`).

---

## 💾 Active Priority 3: NAS Storage Integration & Media Pipeline

### 3.1 Production Network Storage Connection
- [x] **Read-Only Ingestion Security**: `lib/storage.ts` strictly enforces directory jail and traversal (`..`) blocks.
- [x] **Path Config via Environment**: `NAS_STORAGE_PATH` and `LOCAL_CACHE_PATH` configured in `.env`.
- [x] **Production Mount Procedures**: Full runbook in [`docs/NAS_SETUP.md`](./docs/NAS_SETUP.md) covering Windows UNC/drive-letter, Linux CIFS/NFS with `/etc/fstab` persistence, and Docker read-only volume bind-mounts.

### 3.2 High-Speed NVMe/SSD Preview Cache & Transcoder
- [x] **On-Demand WebP Transcoder (`/api/media/[assetId]`)**:
  - Sharp streams master file from NAS on first access, writes optimized WebP to `cache/previews/`, and serves it.
  - Subsequent hits serve from SSD cache with `X-Cache-Status: HIT` and immutable caching headers.
- [x] **Cache Maintenance CLI** (`scripts/cache-maintenance.ts`): `npm run cache:stats`, `npm run cache:flush [--dry-run]`, `npm run cache:warm`.

### 3.3 Automated Ingestion Sync
- [x] **Incremental SHA-256 Scanner**: `lib/indexer.ts` skips unchanged files and indexes new additions with EXIF parsing.
- [x] **Admin Trigger**: *"Sync Storage"* button in Admin Library triggers `POST /api/nas/scan`.
- [x] **Scheduled Cron Job** (`scripts/cron-nas-index.ts`): Lock-file-protected daemon with structured JSON logging. `npm run nas:index:cron` (one-shot for system cron) or `npm run nas:cron:daemon` (loop). Docker sidecar service `graywood-cron` in `docker-compose.yml`.

---

## 🌐 Active Priority 4: Landing Hub & Ecosystem Interconnect

### 4.1 Multi-Brand Landing Hub (`/hub` & `/`)
- [x] **Dual-Pillar Interface**: Visual routing into *Graywood Photography* and *Graywood Media*.
- [x] **Real-Time Telemetry**: Oslo CET clock, coordinate telemetry, and asset counts.
- [x] **Path-Aware Navigation**: Instant domain switcher supporting local/preview sub-paths and live production domains.
- [x] **Custom Nordic 404 Experience**: Coherent error page with guidance for unlisted client vaults.

### 4.2 Client Commission & Booking Ledger
- [x] **Public Inquiries Form**: Zod-validated commission request form with project type and budget selection.
- [x] **Database Ledger**: Inquiries captured in SQLite `ContactInquiry` table.
- [x] **Admin Inquiries Inbox**: Review, archive, or reply to incoming client requests inside `app/admin/inquiries`.

---

## ⏸️ Deferred Roadmap (Not in Active Development)

*These modules are architecturally defined in the schema and dependencies, but active development is paused per platform priorities.*

### Track A: Digital Manga & Comic Reader Suite (`reader.graywood.no`)
- **Current Status**:
  - Next.js CSP header pre-configured: `frame-src 'self' https://reader.graywood.no;`.
  - Capability toggle `MANGA_READER` exists in `SystemModule` schema.
  - Admin placeholder view configured at `app/admin/manga`.
- **Future Implementation Scope**:
  - Secure iframe embedding or single-sign-on (SSO) token handoff.
  - Archive reading progress synchronization with client accounts.
  - Dynamic volume indexing from NAS storage partition.

### Track B: Game Server Telemetry & Hosting Nodes (`play.graywood.no`)
- **Current Status**:
  - Prisma model `GameServer` implemented with `name`, `gameType`, `protocolType`, `endpoint`, and `enabled`.
  - GameDig UDP prober implemented in `lib/gameServers.ts`.
  - Live status cards displayed in Admin Operations Dashboard.
- **Future Implementation Scope**:
  - **Admin Node Management**: CRUD interface to register, update, and remove gaming nodes.
  - **Real-Time Probing Engine**: Test connection button displaying live player names, map name, and ping before saving.
  - **Public Community Widget**: Status strip on Hub showing active multiplayer clusters (Assetto Corsa, Counter-Strike 2, Unreal Engine dedicated testbeds).
