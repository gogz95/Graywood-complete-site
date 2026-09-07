/**
 * prisma/seed.ts — Bootstrap baseline data.
 *
 * Run with: npm run db:seed
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱  Seeding database...");

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------
  const adminHash = await bcrypt.hash("admin-change-me-123!", 12);
  const coOwnerHash = await bcrypt.hash("coowner-change-me-123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@graywood.no" },
    update: {},
    create: {
      email: "admin@graywood.no",
      passwordHash: adminHash,
      name: "Graywood Admin",
      role: "ADMIN",
    },
  });

  const coOwner = await prisma.user.upsert({
    where: { email: "partner@graywood.no" },
    update: {},
    create: {
      email: "partner@graywood.no",
      passwordHash: coOwnerHash,
      name: "Co-Owner",
      role: "CO_OWNER",
    },
  });

  console.log(`  ✅ Users: ${admin.email}, ${coOwner.email}`);

  // -------------------------------------------------------------------------
  // System Modules
  // -------------------------------------------------------------------------
  const modules = [
    { id: "GEAR_DESK", name: "Gear Desk" },
    { id: "CLIENT_PORTAL", name: "Client Portal" },
    { id: "MANGA_READER", name: "Manga Reader" },
    { id: "GAME_SERVERS", name: "Game Servers" },
  ];

  for (const mod of modules) {
    await prisma.systemModule.upsert({
      where: { id: mod.id },
      update: {},
      create: { id: mod.id, name: mod.name, enabled: true },
    });
  }
  console.log(`  ✅ System modules: ${modules.map((m) => m.id).join(", ")}`);

  // -------------------------------------------------------------------------
  // Brand Settings
  // -------------------------------------------------------------------------
  const brands = [
    {
      id: "GLOBAL",
      siteTitle: "Graywood",
      primaryColor: "#18181b",
      accentColor: "#3b82f6",
      backgroundColor: "#09090b",
    },
    {
      id: "PHOTOGRAPHY",
      siteTitle: "Graywood Photography",
      primaryColor: "#18181b",
      accentColor: "#f59e0b",
      backgroundColor: "#09090b",
    },
    {
      id: "MEDIA",
      siteTitle: "Graywood Media",
      primaryColor: "#18181b",
      accentColor: "#8b5cf6",
      backgroundColor: "#09090b",
    },
  ];

  for (const brand of brands) {
    await prisma.brandSettings.upsert({
      where: { id: brand.id },
      update: {},
      create: brand,
    });
  }
  console.log(`  ✅ Brand settings: ${brands.map((b) => b.id).join(", ")}`);

  // -------------------------------------------------------------------------
  // Artist Profiles (Creative Collective)
  // -------------------------------------------------------------------------
  const artists = [
    {
      slug: "astrid-solberg",
      name: "Astrid Solberg",
      bio: "Editorial & architectural photographer based in Oslo. Specialized in medium format visual narratives.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "eirik-lund",
      name: "Eirik Lund",
      bio: "Commercial director and DP focused on cinematic brand films, high-energy automotive, and outdoor documentaries.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "henrik-dahl",
      name: "Henrik Dahl",
      bio: "Motion designer, VFX supervisor, and immersive 3D specialist crafting tactile visual identities.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
      featured: true,
      sortOrder: 3,
    },
  ];

  for (const artist of artists) {
    await prisma.artistProfile.upsert({
      where: { slug: artist.slug },
      update: {
        name: artist.name,
        bio: artist.bio,
        avatarUrl: artist.avatarUrl,
        featured: artist.featured,
        sortOrder: artist.sortOrder,
      },
      create: artist,
    });
  }
  console.log(`  ✅ Artist profiles: ${artists.map((a) => a.name).join(", ")}`);

  // -------------------------------------------------------------------------
  // Client Proofing Album (Phase 3)
  // -------------------------------------------------------------------------
  const proofingPinHash = await bcrypt.hash("1234", 10);
  const proofingAlbum = await prisma.album.upsert({
    where: { slug: "nordic-campaign-2026" },
    update: {
      title: "Nordic Campaign 2026",
      type: "CLIENT_PROOFING",
      isUnlisted: true,
      pinHash: proofingPinHash,
      allowDownload: true,
    },
    create: {
      slug: "nordic-campaign-2026",
      title: "Nordic Campaign 2026",
      type: "CLIENT_PROOFING",
      isUnlisted: true,
      pinHash: proofingPinHash,
      allowDownload: true,
    },
  });

  // Attach all existing indexed MediaAssets to this album
  const allAssets = await prisma.mediaAsset.findMany();
  for (let i = 0; i < allAssets.length; i++) {
    await prisma.albumItem.upsert({
      where: {
        albumId_assetId: {
          albumId: proofingAlbum.id,
          assetId: allAssets[i].id,
        },
      },
      update: { sortOrder: i + 1 },
      create: {
        albumId: proofingAlbum.id,
        assetId: allAssets[i].id,
        sortOrder: i + 1,
      },
    });
  }
  // -------------------------------------------------------------------------
  // Gear Items (Phase 4)
  // -------------------------------------------------------------------------
  const gearItems = [
    {
      name: "Hasselblad H6D-100c Medium Format Body",
      category: "BODY",
      serialNumber: "H6D-100C-98421",
      condition: "Mint",
      status: "AVAILABLE",
      storageLocation: "Studio Locker A1",
      notes: "100 Megapixel CMOS sensor. Dual CFast/SD slots.",
    },
    {
      name: "ARRI Alexa Mini LF Cinema Camera",
      category: "BODY",
      serialNumber: "ARRI-LF-44012",
      condition: "Good",
      status: "AVAILABLE",
      storageLocation: "Vault Safe B",
      notes: "LPL Mount with PL adapter. Full Frame 4.5K sensor.",
    },
    {
      name: "Cooke S4/i 35mm T2.0 Prime Lens",
      category: "LENS",
      serialNumber: "COOKE-S4-35-12",
      condition: "Mint",
      status: "AVAILABLE",
      storageLocation: "Optics Case 03",
      notes: "PL Mount. Calibrated /i Technology lens metadata.",
    },
    {
      name: "Profoto Pro-11 2400 AirTTL Power Pack",
      category: "LIGHTING",
      serialNumber: "PF-PRO11-8890",
      condition: "Good",
      status: "AVAILABLE",
      storageLocation: "Grip Room Bay 2",
      notes: "2400Ws studio generator. AirX Bluetooth enabled.",
    },
    {
      name: "Sennheiser MKH 416 Shotgun Microphone",
      category: "AUDIO",
      serialNumber: "SEN-416-55319",
      condition: "Good",
      status: "AVAILABLE",
      storageLocation: "Audio Case 01",
      notes: "Supercardioid interference tube shotgun mic.",
    },
  ];

  for (const gear of gearItems) {
    await prisma.gearItem.upsert({
      where: { serialNumber: gear.serialNumber },
      update: gear,
      create: gear,
    });
  }
  console.log(`  ✅ Gear items seeded: ${gearItems.length} pieces of hardware`);

  // -------------------------------------------------------------------------
  // Dedicated Game Clusters (Phase 4)
  // -------------------------------------------------------------------------
  const gameServers = [
    {
      name: "Graywood Nordics #01 [EU-North]",
      host: "play.graywood.no",
      queryPort: 27015,
      gameType: "Assetto Corsa Dedicated",
      sortOrder: 1,
    },
    {
      name: "Studio Creative Sim #02",
      host: "sim.graywood.no",
      queryPort: 7777,
      gameType: "Unreal 5.4 Testbed",
      sortOrder: 2,
    },
  ];

  for (const s of gameServers) {
    const existing = await prisma.gameServer.findFirst({
      where: { host: s.host, queryPort: s.queryPort },
    });
    if (!existing) {
      await prisma.gameServer.create({ data: s });
    }
  }
  console.log(`  ✅ Game servers registered: ${gameServers.length} cluster nodes`);

  console.log("🎉  Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
