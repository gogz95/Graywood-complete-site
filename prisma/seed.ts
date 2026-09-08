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
    {
      key: "GEAR_DESK",
      label: "Co-Owner Gear Desk",
      description: "Hardware inventory, custodian custody tracking, and return logs.",
    },
    {
      key: "CLIENT_PORTAL",
      label: "Client Proofing Portal",
      description: "Private PIN-protected client proofing vaults and high-resolution delivery.",
    },
    {
      key: "MANGA_READER",
      label: "Manga Reader Integration",
      description: "Direct gateway to native Graywood-Reader sister subservice.",
    },
    {
      key: "GAME_SERVERS",
      label: "Game Server Monitors",
      description: "Live UDP telemetry and player counts for Gamehosting-by-Graywood-2 clusters.",
    },
  ];

  for (const mod of modules) {
    await prisma.systemModule.upsert({
      where: { key: mod.key },
      update: { label: mod.label, description: mod.description },
      create: {
        key: mod.key,
        label: mod.label,
        description: mod.description,
        enabled: true,
      },
    });
  }
  console.log(`  ✅ Base system modules ensured: ${modules.map((m) => m.key).join(", ")}`);

  // -------------------------------------------------------------------------
  // 2. Scandinavian BrandSettings Defaults
  // -------------------------------------------------------------------------
  const brands = [
    {
      scope: "GLOBAL",
      studioTitle: "Graywood",
      tagline: "Visual Craft & Shared Infrastructure",
      canvasColor: "#F9F8F6",
      surfaceColor: "#FFFFFF",
      borderColor: "#E8E5DF",
      inkColor: "#1C1B19",
      pineColor: "#2D3B36",
    },
    {
      scope: "PHOTOGRAPHY",
      studioTitle: "Graywood Photography",
      tagline: "Nordic Landscape & Commercial Photography",
      canvasColor: "#F9F8F6",
      surfaceColor: "#FFFFFF",
      borderColor: "#E8E5DF",
      inkColor: "#1C1B19",
      pineColor: "#2D3B36",
    },
    {
      scope: "MEDIA",
      studioTitle: "Graywood Media",
      tagline: "High-Resolution Production & Digital Media",
      canvasColor: "#F9F8F6",
      surfaceColor: "#FFFFFF",
      borderColor: "#E8E5DF",
      inkColor: "#1C1B19",
      pineColor: "#2D3B36",
    },
  ];

  for (const brand of brands) {
    await prisma.brandSettings.upsert({
      where: { scope: brand.scope },
      update: {
        studioTitle: brand.studioTitle,
        tagline: brand.tagline,
        canvasColor: brand.canvasColor,
        surfaceColor: brand.surfaceColor,
        borderColor: brand.borderColor,
        inkColor: brand.inkColor,
        pineColor: brand.pineColor,
      },
      create: brand,
    });
  }
  console.log(`  ✅ Scandinavian Brand Settings seeded: ${brands.map((b) => b.scope).join(", ")}`);

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
      value:
        "Selected editorial collections captured across Svalbard, Lofoten, Oslofjord, and bespoke studio environments.",
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
  console.log(`  ✅ Baseline SiteContent seeded: ${siteCopy.length} entries`);

  // -------------------------------------------------------------------------
  // 4. Baseline StudioFeature Highlights (PHOTOGRAPHY)
  // -------------------------------------------------------------------------
  const studioFeatures = [
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

  const existingCount = await prisma.studioFeature.count({
    where: { scope: "PHOTOGRAPHY" },
  });

  if (existingCount === 0) {
    for (const feat of studioFeatures) {
      await prisma.studioFeature.create({ data: feat });
    }
    console.log(`  ✅ Baseline StudioFeatures created: ${studioFeatures.length} highlights`);
  } else {
    console.log(`  ℹ️  StudioFeatures already configured (${existingCount} found), skipping creation.`);
  }

  console.log("\n🚀 System configuration successfully seeded with Scandinavian editorial defaults!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
