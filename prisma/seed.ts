/**
 * prisma/seed.ts — Production Baseline Bootstrapper
 *
 * ONLY ensures foundational SystemModule flags, default Scandinavian BrandSettings,
 * baseline SiteContent copy, and default StudioFeature entries. Contains zero sample
 * accounts, mock photos, dummy inquiries, or fake checkouts.
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
      accentColor: "#C86D51",
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

  // -------------------------------------------------------------------------
  // 3. Baseline SiteContent Copy (PHOTOGRAPHY)
  // -------------------------------------------------------------------------
  const siteCopy = [
    {
      scope: "PHOTOGRAPHY",
      section: "HERO",
      key: "badge",
      value: "GRAYWOOD PHOTOGRAPHY STUDIO",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "HERO",
      key: "title",
      value: "Visual narratives across the Nordic landscape.",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "HERO",
      key: "description",
      value:
        "Specialized in commercial campaigns, architectural documentation, and editorial storytelling. Captured with medium-format precision and authentic atmospheric light.",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "ARCHIVE",
      key: "title",
      value: "Visual Archive",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "ARCHIVE",
      key: "description",
      value: "Curated master files and commissions.",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "COMMISSION",
      key: "title",
      value: "Initiate a Commission",
    },
    {
      scope: "PHOTOGRAPHY",
      section: "COMMISSION",
      key: "description",
      value:
        "Available for editorial campaigns, architectural documentation, and select commercial projects throughout the Nordic region.",
    },
  ];

  for (const item of siteCopy) {
    await prisma.siteContent.upsert({
      where: {
        scope_section_key: {
          scope: item.scope,
          section: item.section,
          key: item.key,
        },
      },
      update: { value: item.value },
      create: item,
    });
  }
  console.log(`  ✅ Baseline SiteContent copy seeded (${siteCopy.length} keys)`);

  // -------------------------------------------------------------------------
  // 4. Default StudioFeature Highlights (PHOTOGRAPHY)
  // -------------------------------------------------------------------------
  const features = [
    {
      scope: "PHOTOGRAPHY",
      icon: "Camera",
      title: "Medium Format Rig",
      description: "Ultra high-fidelity sensor captures up to 100 megapixels.",
      order: 1,
    },
    {
      scope: "PHOTOGRAPHY",
      icon: "Compass",
      title: "Extreme Locations",
      description: "Fjord, sub-zero Arctic, and architectural remote access.",
      order: 2,
    },
    {
      scope: "PHOTOGRAPHY",
      icon: "Award",
      title: "Color Grading Mastery",
      description: "Bespoke LUTs tailored for editorial print and high-res web.",
      order: 3,
    },
  ];

  // Clean out existing photography features and seed default order
  await prisma.studioFeature.deleteMany({ where: { scope: "PHOTOGRAPHY" } });
  for (const feature of features) {
    await prisma.studioFeature.create({
      data: feature,
    });
  }
  console.log(`  ✅ Default StudioFeature highlights seeded (${features.length} features)`);

  console.log("🎉  Baseline seed complete. All mock data eradicated.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
