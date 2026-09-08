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
  // 3. Baseline SiteContent Copy (PHOTOGRAPHY, MEDIA, GLOBAL)
  // -------------------------------------------------------------------------
  const siteCopy = [
    // PHOTOGRAPHY
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

    // MEDIA
    {
      scope: "MEDIA",
      section: "HERO",
      key: "badge",
      value: "Nordic Motion Collective",
    },
    {
      scope: "MEDIA",
      section: "HERO",
      key: "title",
      value: "Motion, sound, and story in harmonious tension.",
    },
    {
      scope: "MEDIA",
      section: "HERO",
      key: "description",
      value:
        "Graywood Media is a collaborative studio crafting commercial brand films, high-end motion design, and immersive digital artifacts for visionary brands across Northern Europe.",
    },
    {
      scope: "MEDIA",
      section: "HERO",
      key: "ctaPrimary",
      value: "Watch 2026 Reel",
    },
    {
      scope: "MEDIA",
      section: "HERO",
      key: "ctaSecondary",
      value: "Explore Production Services",
    },
    {
      scope: "MEDIA",
      section: "SHOWREEL",
      key: "badge",
      value: "Official Showreel · 2026 Edition",
    },
    {
      scope: "MEDIA",
      section: "SHOWREEL",
      key: "title",
      value: "Visual Cadence 2026",
    },
    {
      scope: "MEDIA",
      section: "SHOWREEL",
      key: "description",
      value:
        "Click to launch high-fidelity 4K stream with directional sound design and original score.",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "badge",
      value: "Full-Spectrum Production",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "title",
      value: "End-to-End Craft",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "description",
      value:
        "From concept development and treatment pitch decks through extreme on-location principal photography to master finishing and digital distribution.",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s1_title",
      value: "Commercial Brand Films",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s1_desc",
      value:
        "High-concept short films and broadcast-ready advertisements crafted for Nordic architecture, mobility, and luxury goods brands.",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s2_title",
      value: "Motion Graphics & 3D",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s2_desc",
      value:
        "Algorithmic simulations, typographic animation, and 3D architectural visualizations crafted in Houdini and Unreal Engine.",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s3_title",
      value: "Editorial Color & Sound",
    },
    {
      scope: "MEDIA",
      section: "SERVICES",
      key: "s3_desc",
      value:
        "Precise color-science grading on reference displays and immersive bespoke sound design tuned for cinema and high-end digital.",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m1_title",
      value: "8K RAW",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m1_sub",
      value: "RED & ARRI Capture",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m2_title",
      value: "Davinci",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m2_sub",
      value: "ACES Color Pipeline",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m3_title",
      value: "Spatial",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m3_sub",
      value: "Dolby Atmos Audio",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m4_title",
      value: "Oslo & Arctic",
    },
    {
      scope: "MEDIA",
      section: "METRICS",
      key: "m4_sub",
      value: "Extreme Field Readiness",
    },
    {
      scope: "MEDIA",
      section: "COMMISSION",
      key: "title",
      value: "Initiate a Motion Commission",
    },
    {
      scope: "MEDIA",
      section: "COMMISSION",
      key: "description",
      value:
        "Accepting commercial campaigns, documentary productions, and interactive installations for the 2026/2027 seasons across Scandinavia and Europe.",
    },
    {
      scope: "MEDIA",
      section: "COMMISSION",
      key: "email",
      value: "productions@graywood.no",
    },

    // GLOBAL
    {
      scope: "GLOBAL",
      section: "HERO",
      key: "badge",
      value: "Graywood Unified Visual Platform",
    },
    {
      scope: "GLOBAL",
      section: "HERO",
      key: "title",
      value: "Two specialized studios. One coherent standard.",
    },
    {
      scope: "GLOBAL",
      section: "HERO",
      key: "description",
      value:
        "Select an entity to explore our medium-format still archives, cinematic motion productions, or private client proofing vaults.",
    },
    {
      scope: "GLOBAL",
      section: "TELEMETRY",
      key: "status",
      value: "All Ecosystem Nodes Operational",
    },
    {
      scope: "GLOBAL",
      section: "TELEMETRY",
      key: "location",
      value: "59.9139° N, 10.7522° E",
    },
    {
      scope: "GLOBAL",
      section: "PILLAR_PHOTO",
      key: "description",
      value:
        "Nordic editorial commissions, architectural documentation, and commercial still photography. Engineered around Hasselblad medium-format precision and authentic atmospheric light.",
    },
    {
      scope: "GLOBAL",
      section: "PILLAR_MEDIA",
      key: "description",
      value:
        "Creative motion collective specializing in high-impact brand films, 3D motion design, and spatial soundscapes. Built on ARRI cinema workflows, Unreal Engine 5.4, and DaVinci color mastering.",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "brand",
      value: "GRAYWOOD",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "description",
      value:
        "Unified Norwegian visual production monolith serving high-end still photography, cinematic motion, and client galleries.",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "status",
      value: "OSLO STUDIO · ACTIVE OPERATIONS",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "address",
      value: "Dronning Eufemias gate 16, 0191 Oslo, Norway",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "org",
      value: "Organization NO: 934 102 481 MVA",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "inquiries",
      value: "Inquiries: contact@graywood.no",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "arch_title",
      value: "Hardened SQLite WAL",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "arch_desc",
      value:
        "Autonomous multi-domain container with memory-safe edge streaming & AES-256 encrypted proofing.",
    },
    {
      scope: "GLOBAL",
      section: "FOOTER",
      key: "copyright",
      value:
        "© 2026 Graywood Digital Ecosystem. All photographic and cinematic assets protected by international copyright law.",
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
  // 4. Baseline StudioFeature Highlights (PHOTOGRAPHY & MEDIA)
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
    {
      scope: "MEDIA",
      icon: "Camera",
      title: "8K Cinema Rig",
      description: "RED V-Raptor and ARRI camera packages with anamorphic glass.",
      order: 1,
    },
    {
      scope: "MEDIA",
      icon: "Aperture",
      title: "Unreal Engine 5.4",
      description: "Real-time virtual production stages and procedural VFX.",
      order: 2,
    },
    {
      scope: "MEDIA",
      icon: "Sparkles",
      title: "Spatial Atmos Sound",
      description: "Directional sound design and custom cinematic scores.",
      order: 3,
    },
  ];

  for (const feat of studioFeatures) {
    const existing = await prisma.studioFeature.findFirst({
      where: { scope: feat.scope, title: feat.title },
    });
    if (!existing) {
      await prisma.studioFeature.create({ data: feat });
    }
  }
  console.log(`  ✅ Baseline StudioFeatures verified: ${studioFeatures.length} highlights across scopes`);

  // -------------------------------------------------------------------------
  // 5. Baseline GameServer Telemetry Nodes (Gamehosting-by-Graywood-2)
  // -------------------------------------------------------------------------
  const baselineGameServers = [
    {
      name: "Assetto Corsa Sim Cluster",
      gameType: "Assetto Corsa",
      protocolType: "assettocorsa",
      endpoint: "play.graywood.no:9600",
      enabled: true,
    },
    {
      name: "Unreal 5.4 Dedicated Testbed",
      gameType: "Unreal 5.4 Dedicated",
      protocolType: "protocol-valve",
      endpoint: "play.graywood.no:7777",
      enabled: true,
    },
  ];

  for (const srv of baselineGameServers) {
    const existing = await prisma.gameServer.findFirst({
      where: { endpoint: srv.endpoint },
    });
    if (!existing) {
      await prisma.gameServer.create({ data: srv });
    }
  }
  console.log(`  ✅ Baseline GameServers verified: ${baselineGameServers.length} nodes`);

  // -------------------------------------------------------------------------
  // 6. Ensure existing public media assets are marked isPublic: true
  // -------------------------------------------------------------------------
  const publicAssets = await prisma.mediaAsset.findMany({
    where: {
      albumItems: {
        none: {
          album: {
            type: "CLIENT_PROOFING",
          },
        },
      },
    },
  });

  for (const asset of publicAssets) {
    const inferredCategory = asset.originalPath.toLowerCase().includes("arch")
      ? "ARCHITECTURE"
      : asset.originalPath.toLowerCase().includes("portrait")
      ? "PORTRAIT"
      : "LANDSCAPE";

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        isPublic: true,
        category: asset.category ?? inferredCategory,
      },
    });
  }
  console.log(`  ✅ Verified ${publicAssets.length} public media assets marked isPublic: true`);

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
