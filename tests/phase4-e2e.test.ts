/**
 * tests/phase4-e2e.test.ts
 *
 * Comprehensive End-to-End Integration Test Suite for Phase 4:
 * 1. Role-Based Access Control (RBAC) & Authentication (Admin vs Co-Owner).
 * 2. Gated Gear Desk Lifecycle (Atomic checkouts, return reconciliation, audit logging).
 * 3. Virtual Library Media Curation (Album assignment).
 * 4. System Customizer Operations (Dynamic capability toggles, Scandinavian BrandSettings).
 * 5. Production Security Headers & Standalone Next.js Deployment Configuration.
 */

import "dotenv/config";
import assert from "node:assert";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLogin } from "@/app/actions/admin";
import { checkoutGearItem, checkinGearItem } from "@/app/actions/gear";
import { assignAssetToAlbum } from "@/app/actions/library";
import { toggleSystemModule, updateBrandSettings } from "@/app/actions/customizer";
import { getAdminSession, requireAdminSession } from "@/lib/admin-session";
import nextConfig from "@/next.config";

async function runPhase4Tests() {
  console.log("=== PHASE 4 E2E INTEGRATION TEST SUITE ===\n");

  // Ensure test accounts exist
  const adminHash = await bcrypt.hash("admin-change-me-123!", 10);
  const coOwnerHash = await bcrypt.hash("coowner-change-me-123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@graywood.no" },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: {
      email: "admin@graywood.no",
      name: "Graywood Superadmin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "partner@graywood.no" },
    update: { passwordHash: coOwnerHash, role: "CO_OWNER" },
    create: {
      email: "partner@graywood.no",
      name: "Studio Partner",
      passwordHash: coOwnerHash,
      role: "CO_OWNER",
    },
  });

  // Ensure test gear item exists
  let testGear = await prisma.gearItem.findFirst({
    where: { status: "AVAILABLE" },
  });
  if (!testGear) {
    testGear = await prisma.gearItem.create({
      data: {
        name: "Sony Alpha 1",
        brand: "Sony",
        category: "BODY",
        serialNumber: "SN-TEST-A1",
        status: "AVAILABLE",
        storageLocation: "Studio Locker A",
      },
    });
  }

  // Ensure test album & media asset exist
  let testAlbum = await prisma.album.findFirst();
  if (!testAlbum) {
    testAlbum = await prisma.album.create({
      data: {
        slug: "phase4-test-portfolio",
        title: "Phase 4 Test Portfolio",
        type: "PORTFOLIO",
      },
    });
  }

  let testAsset = await prisma.mediaAsset.findFirst();
  if (!testAsset) {
    testAsset = await prisma.mediaAsset.create({
      data: {
        filename: "test_phase4.jpg",
        originalPath: "test/test_phase4.jpg",
        hash: "hash_phase4_test_sample",
        mimeType: "image/jpeg",
        sizeBytes: BigInt(1024),
        width: 1920,
        height: 1080,
      },
    });
  }

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

  // 2d. Audit log check
  const latestLog = await prisma.gearCheckoutLog.findFirst({
    where: { gearItemId: testGear.id },
    orderBy: { timestamp: "desc" },
  });
  assert.strictEqual(latestLog?.action, "CHECKIN", "Audit log action must be CHECKIN");
  assert.strictEqual(latestLog?.notes, "Returned in mint condition after test run");
  console.log("   [PASS] Gear checked in and audit log verified.");

  // -------------------------------------------------------------------------
  // 3. Virtual Library Operations
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Virtual Library Operations...");

  // Assign Asset to Album
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
    where: { key: "GAME_SERVERS" },
  });
  assert.strictEqual(toggledModule?.enabled, false);

  // Toggle back to true
  await toggleSystemModule({ id: "GAME_SERVERS", enabled: true });
  console.log("   [PASS] SystemModule toggle verified.");

  // 4b. Update Brand Settings
  const updateBrandRes = await updateBrandSettings({
    id: "GLOBAL",
    studioTitle: "Graywood Digital Hub",
    primaryColor: "#18181b",
    accentColor: "#3b82f6",
    backgroundColor: "#09090b",
  });
  assert.strictEqual(updateBrandRes.success, true);

  const updatedBrand = await prisma.brandSettings.findUnique({
    where: { scope: "GLOBAL" },
  });
  assert.strictEqual(updatedBrand?.studioTitle, "Graywood Digital Hub");
  console.log("   [PASS] BrandSettings update verified.");

  // -------------------------------------------------------------------------
  // 5. Security Headers & CSP Validation
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Security Headers & Next.js Standalone Config...");

  assert.strictEqual(
    nextConfig.output,
    "standalone",
    "next.config.js must specify output: 'standalone' for Docker deployment"
  );
  console.log("   [PASS] Docker standalone output configured.");

  if (typeof nextConfig.headers === "function") {
    const headerRules = await nextConfig.headers();
    const globalRule = headerRules.find((r: { source: string }) => r.source.includes(":path*"));
    assert.ok(globalRule, "Must define global security header rule");

    const headerMap = new Map(
      globalRule.headers.map((h: { key: string; value: string }) => [h.key, h.value])
    );

    assert.ok(headerMap.has("Content-Security-Policy"), "CSP header must be present");
    assert.ok(headerMap.has("X-Frame-Options"), "X-Frame-Options must be present");
    assert.ok(headerMap.has("X-Content-Type-Options"), "X-Content-Type-Options must be present");
    assert.ok(headerMap.has("Referrer-Policy"), "Referrer-Policy must be present");
    assert.ok(
      headerMap.has("Strict-Transport-Security"),
      "HSTS header must be present"
    );

    console.log("   [PASS] Security headers verified: CSP, X-Frame-Options, HSTS, Sniffing protection.");
  }

  console.log("\n🎉 ALL PHASE 4 TESTS PASSED SUCCESSFULLY!");
}

runPhase4Tests().catch((err) => {
  console.error("\n❌ PHASE 4 TEST SUITE FAILED:", err);
  process.exit(1);
});
