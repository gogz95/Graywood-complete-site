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

  console.log("🎉  Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
