/**
 * prisma/seed.ts — Production Baseline Bootstrapper
 *
 * ONLY ensures foundational SystemModule flags and default Scandinavian
 * BrandSettings exist. Contains zero sample accounts, mock photos, dummy inquiries,
 * or fake checkouts.
 *
 * Run with: npm run db:seed
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱  Seeding baseline system configuration...");

  // -------------------------------------------------------------------------
  // 1. Core System Modules
  // -------------------------------------------------------------------------
  const modules = [
    { id: "GEAR_DESK", name: "Co-Owner Gear Desk" },
    { id: "CLIENT_PORTAL", name: "Client Proofing Portal" },
    { id: "MANGA_READER", name: "Manga Reader Integration" },
    { id: "GAME_SERVERS", name: "Game Server Monitors" },
  ];

  for (const mod of modules) {
    await prisma.systemModule.upsert({
      where: { id: mod.id },
      update: { name: mod.name },
      create: { id: mod.id, name: mod.name, enabled: true },
    });
  }
  console.log(`  ✅ Base system modules ensured: ${modules.map((m) => m.id).join(", ")}`);

  // -------------------------------------------------------------------------
  // 2. Scandinavian BrandSettings Defaults
  // -------------------------------------------------------------------------
  // Palette Tokens:
  // Canvas / Background: #F9F8F6 (Warm limestone)
  // Ink / Typography:    #1C1B19 (Charcoal ink)
  // Pine / Accent:       #2D3B36 (Deep nordic pine)
  const brands = [
    {
      id: "GLOBAL",
      siteTitle: "Graywood",
      primaryColor: "#1C1B19",
      accentColor: "#2D3B36",
      backgroundColor: "#F9F8F6",
    },
    {
      id: "PHOTOGRAPHY",
      siteTitle: "Graywood Photography",
      primaryColor: "#1C1B19",
      accentColor: "#2D3B36",
      backgroundColor: "#F9F8F6",
    },
    {
      id: "MEDIA",
      siteTitle: "Graywood Media",
      primaryColor: "#1C1B19",
      accentColor: "#C86D51", // Nordic terracotta accent for media entity
      backgroundColor: "#F9F8F6",
    },
  ];

  for (const brand of brands) {
    await prisma.brandSettings.upsert({
      where: { id: brand.id },
      update: {
        siteTitle: brand.siteTitle,
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
      },
      create: brand,
    });
  }
  console.log(`  ✅ Scandinavian Brand Settings seeded: ${brands.map((b) => b.id).join(", ")}`);

  console.log("🎉  Baseline seed complete. All mock data eradicated.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
