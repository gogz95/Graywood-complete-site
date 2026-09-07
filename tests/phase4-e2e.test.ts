/**
 * tests/phase4-e2e.test.ts
 *
 * Comprehensive End-to-End Integration Test Suite for Phase 4:
 * 1. RBAC Authentication (Admin & Co-Owner credentials).
 * 2. Gated Gear Desk (Check Out, Duplicate Check Out Prevention, Check In, Audit Log).
 * 3. Virtual Library (Artist attribution & Album attachment).
 * 4. System Customizer (Module toggle & Brand settings).
 * 5. Security Headers & CSP (Manga frame-src verification).
 * 6. Containerization Artifacts (Dockerfile & docker-compose.yml validation).
 */

import "dotenv/config";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { adminLogin, adminLogout } from "@/app/actions/admin";
import { checkoutGearItem, checkinGearItem } from "@/app/actions/gear";
import { assignAssetToArtist, assignAssetToAlbum } from "@/app/actions/library";
import { toggleSystemModule, updateBrandSettings } from "@/app/actions/customizer";
import { getAdminSession, requireAdminSession } from "@/lib/admin-session";
import nextConfig from "@/next.config";

async function runPhase4Tests() {
  console.log("=== PHASE 4 E2E INTEGRATION TEST SUITE ===\n");

  // -------------------------------------------------------------------------
  // 1. RBAC Authentication
  // -------------------------------------------------------------------------
  console.log("1. Testing Administrative Authentication & Sessions...");

  // 1a. Invalid password
  const badLogin = await adminLogin({
    email: "admin@graywood.no",
    password: "wrong-password-999",
  });
  assert.strictEqual(badLogin.success, false, "Invalid password must be rejected");
  console.log("   [PASS] Bad password rejected properly.");

  // 1b. Valid Admin login
  const adminLoginRes = await adminLogin({
    email: "admin@graywood.no",
    password: "admin-change-me-123!",
  });
  assert.strictEqual(adminLoginRes.success, true, "Admin credentials must be accepted");
  assert.strictEqual(adminLoginRes.role, "ADMIN", "Admin role must be returned");
  console.log("   [PASS] Admin authenticated with role ADMIN.");

  // 1c. Valid Co-Owner login
  const coOwnerLoginRes = await adminLogin({
    email: "partner@graywood.no",
    password: "coowner-change-me-123!",
  });
  assert.strictEqual(coOwnerLoginRes.success, true, "Co-owner credentials must be accepted");
  assert.strictEqual(coOwnerLoginRes.role, "CO_OWNER", "Co-owner role must be returned");
  console.log("   [PASS] Co-Owner authenticated with role CO_OWNER.");

  // 1d. Session reflection
  const session = await getAdminSession();
  assert.ok(session.user, "Session user must exist");
  assert.strictEqual(session.user?.role, "CO_OWNER");
  console.log("   [PASS] Session cookie verified for:", session.user?.email);

  // 1e. RBAC Guard: Co-Owner accessing ADMIN-only action/page
  let redirectCaught = false;
  try {
    await requireAdminSession(["ADMIN"]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      redirectCaught = true;
    }
  }
  assert.strictEqual(redirectCaught, true, "Co-Owner must be redirected away from ADMIN-only gate");
  console.log("   [PASS] RBAC guard successfully redirected CO_OWNER away from ADMIN route.");

  // Log back in as ADMIN for remainder of administrative actions
  await adminLogin({
    email: "admin@graywood.no",
    password: "admin-change-me-123!",
  });

  // -------------------------------------------------------------------------
  // 2. Gated Gear Desk Lifecycle
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Gated Gear Desk Lifecycle & Audit Logging...");

  // Find a test gear item and user
  const testGear = await prisma.gearItem.findFirst({
    where: { status: "AVAILABLE" },
  });
  assert.ok(testGear, "Must have an AVAILABLE gear item to test");

  const partner = await prisma.user.findUnique({
    where: { email: "partner@graywood.no" },
  });
  assert.ok(partner, "Must find partner user");

  // 2a. Check Out Gear
  const checkoutRes = await checkoutGearItem({
    gearId: testGear.id,
    userId: partner.id,
    expectedReturn: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    notes: "E2E automated test checkout in Oslo studio",
  });
  assert.strictEqual(checkoutRes.success, true, "Checkout transaction must succeed");

  const checkedOutGear = await prisma.gearItem.findUnique({
    where: { id: testGear.id },
  });
  assert.strictEqual(checkedOutGear?.status, "CHECKED_OUT", "Status must become CHECKED_OUT");
  console.log(`   [PASS] Gear checked out successfully: ${testGear.name}`);

  // 2b. Prevent duplicate checkouts
  const duplicateCheckout = await checkoutGearItem({
    gearId: testGear.id,
    userId: partner.id,
    expectedReturn: new Date().toISOString().split("T")[0],
  });
  assert.strictEqual(duplicateCheckout.success, false, "Duplicate checkout must be rejected");
  console.log("   [PASS] Duplicate checkout prevented correctly.");

  // 2c. Check In Gear
  const checkinRes = await checkinGearItem({
    gearId: testGear.id,
    condition: "Mint",
    returnNotes: "Returned in mint condition after test run",
  });
  assert.strictEqual(checkinRes.success, true, "Check-in transaction must succeed");

  const returnedGear = await prisma.gearItem.findUnique({
    where: { id: testGear.id },
  });
  assert.strictEqual(returnedGear?.status, "AVAILABLE", "Status must revert to AVAILABLE");
  assert.strictEqual(returnedGear?.condition, "Mint");

  // 2d. Audit log check
  const latestLog = await prisma.gearCheckoutLog.findFirst({
    where: { gearId: testGear.id },
    orderBy: { checkoutDate: "desc" },
  });
  assert.ok(latestLog?.actualReturn, "Audit log must contain actualReturn timestamp");
  assert.strictEqual(latestLog?.returnNotes, "Returned in mint condition after test run");
  console.log("   [PASS] Gear checked in and audit log verified.");

  // -------------------------------------------------------------------------
  // 3. Virtual Library Operations
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Virtual Library Operations...");

  const testAsset = await prisma.mediaAsset.findFirst();
  const testArtist = await prisma.artistProfile.findFirst();
  const testAlbum = await prisma.album.findFirst();

  assert.ok(testAsset && testArtist && testAlbum, "Must have asset, artist, and album");

  // 3a. Assign Asset to Artist Profile
  const assignArtistRes = await assignAssetToArtist({
    assetId: testAsset.id,
    artistId: testArtist.id,
  });
  assert.strictEqual(assignArtistRes.success, true);

  const artistWithPhoto = await prisma.artistProfile.findUnique({
    where: { id: testArtist.id },
    include: { photos: true },
  });
  assert.ok(
    artistWithPhoto?.photos.some((p) => p.id === testAsset.id),
    "Asset must be linked to artist portfolio"
  );
  console.log(`   [PASS] Asset linked to Artist Profile: ${testArtist.name}`);

  // 3b. Assign Asset to Album
  const assignAlbumRes = await assignAssetToAlbum({
    assetId: testAsset.id,
    albumId: testAlbum.id,
  });
  assert.strictEqual(assignAlbumRes.success, true);

  const albumItem = await prisma.albumItem.findUnique({
    where: {
      albumId_assetId: {
        albumId: testAlbum.id,
        assetId: testAsset.id,
      },
    },
  });
  assert.ok(albumItem, "AlbumItem link must exist in database");
  console.log(`   [PASS] Asset assigned to Album: ${testAlbum.title}`);

  // -------------------------------------------------------------------------
  // 4. System Customizer Operations
  // -------------------------------------------------------------------------
  console.log("\n4. Testing System Customizer Actions...");

  // 4a. Toggle Module
  const toggleRes = await toggleSystemModule({
    id: "GAME_SERVERS",
    enabled: false,
  });
  assert.strictEqual(toggleRes.success, true);

  const toggledModule = await prisma.systemModule.findUnique({
    where: { id: "GAME_SERVERS" },
  });
  assert.strictEqual(toggledModule?.enabled, false);

  // Toggle back to true
  await toggleSystemModule({ id: "GAME_SERVERS", enabled: true });
  console.log("   [PASS] SystemModule toggle verified.");

  // 4b. Update Brand Settings
  const updateBrandRes = await updateBrandSettings({
    id: "GLOBAL",
    siteTitle: "Graywood Digital Hub",
    primaryColor: "#18181b",
    accentColor: "#3b82f6",
    backgroundColor: "#09090b",
  });
  assert.strictEqual(updateBrandRes.success, true);

  const updatedBrand = await prisma.brandSettings.findUnique({
    where: { id: "GLOBAL" },
  });
  assert.strictEqual(updatedBrand?.siteTitle, "Graywood Digital Hub");
  console.log("   [PASS] BrandSettings update verified.");

  // -------------------------------------------------------------------------
  // 5. Security Headers & CSP Validation
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Security Headers & Next.js Standalone Config...");

  assert.strictEqual(
    nextConfig.output,
    "standalone",
    "next.config.ts must configure output: 'standalone'"
  );

  assert.ok(typeof nextConfig.headers === "function", "nextConfig must define headers()");
  const headersList = await nextConfig.headers!();
  const mangaHeader = headersList.find((h) => h.source === "/admin/manga");
  assert.ok(mangaHeader, "CSP rule for /admin/manga must exist");

  const cspHeader = mangaHeader.headers.find(
    (h) => h.key === "Content-Security-Policy"
  );
  assert.ok(
    cspHeader?.value.includes("frame-src 'self' https://reader.graywood.no;"),
    "CSP must permit https://reader.graywood.no iframe framing"
  );
  console.log("   [PASS] Next.js standalone output and Manga CSP headers verified.");

  // -------------------------------------------------------------------------
  // 6. Containerization Artifacts Validation
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Production Containerization Artifacts...");

  const dockerfilePath = path.join(process.cwd(), "Dockerfile");
  assert.ok(fs.existsSync(dockerfilePath), "Dockerfile must exist");
  const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8");
  assert.ok(dockerfileContent.includes("node:20-alpine"), "Dockerfile must use Node 20 Alpine");
  assert.ok(dockerfileContent.includes("libc6-compat"), "Dockerfile must install libc6-compat for sharp");
  assert.ok(dockerfileContent.includes("standalone"), "Dockerfile must copy standalone build");
  console.log("   [PASS] Dockerfile verified.");

  const composePath = path.join(process.cwd(), "docker-compose.yml");
  assert.ok(fs.existsSync(composePath), "docker-compose.yml must exist");
  const composeContent = fs.readFileSync(composePath, "utf-8");
  assert.ok(composeContent.includes("graywood-platform"), "Compose must define graywood-platform service");
  assert.ok(composeContent.includes("./data:/app/data"), "Compose must mount persistent data volume");
  assert.ok(composeContent.includes("./cache:/app/cache"), "Compose must mount preview cache volume");
  assert.ok(composeContent.includes("/mnt/storage"), "Compose must mount NAS storage volume");
  console.log("   [PASS] docker-compose.yml verified.");

  // Clean logout
  await adminLogout();
  console.log("\n🎉 ALL PHASE 4 E2E TESTS PASSED SUCCESSFULLY!");
}

runPhase4Tests().catch((err) => {
  console.error("\n❌ PHASE 4 TEST SUITE FAILED:", err);
  process.exit(1);
});
