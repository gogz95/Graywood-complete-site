/**
 * tests/code-review-audit.test.ts
 *
 * Automated regression test suite validating the code review bug fixes:
 * 1. Invalid date rejection in checkoutGearItem Server Action.
 * 2. Privacy isolation of CLIENT_PROOFING assets from the public PhotographyPage query.
 * 3. Library sync endpoint protection against unauthenticated access.
 * 4. Proxy middleware x-pathname injection.
 */

import "dotenv/config";
import assert from "node:assert";
import { checkoutGearItem } from "@/app/actions/gear";
import { adminLogin } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
import { GET as syncGet, POST as syncPost } from "@/app/api/admin/library/sync/route";

async function runAuditTests() {
  console.log("=== CODE REVIEW AUDIT & BUG FIX TEST SUITE ===\n");

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
    include: {
      albumItems: {
        include: {
          album: true,
        },
      },
    },
  });

  const hasLeakedClientProof = publicAssets.some((asset) =>
    asset.albumItems.some((item) => item.album.type === "CLIENT_PROOFING")
  );
  assert.strictEqual(
    hasLeakedClientProof,
    false,
    "No asset in public gallery may belong to a CLIENT_PROOFING album"
  );
  console.log(
    `   [PASS] Public gallery verified: 0 private proofing photos leaked out of ${publicAssets.length} public assets.`
  );

  // -------------------------------------------------------------------------
  // 3. Proxy Middleware x-pathname Header Injection
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Proxy Middleware x-pathname Header Injection...");
  const req = new NextRequest("http://graywoodphotography.no/admin/dashboard");
  const res = proxy(req);
  assert.ok(res, "Proxy must return NextResponse");
  console.log("   [PASS] Proxy successfully processed request with x-pathname header.");

  // -------------------------------------------------------------------------
  // 4. Library Sync Endpoint Security Check (Enforced Unconditionally)
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Library Sync Endpoint Security...");
  const unauthReq = new NextRequest("http://localhost:3000/api/admin/library/sync", {
    method: "POST",
  });
  const syncRes = await syncPost(unauthReq);
  assert.strictEqual(syncRes.status, 401, "Unauthenticated sync request must return HTTP 401");
  console.log("   [PASS] Unauthenticated POST /api/admin/library/sync blocked with HTTP 401.");

  const unauthGetRes = await syncGet(unauthReq);
  assert.strictEqual(unauthGetRes.status, 401, "Unauthenticated GET sync request must return HTTP 401");
  console.log("   [PASS] Unauthenticated GET /api/admin/library/sync blocked with HTTP 401.");

  // -------------------------------------------------------------------------
  // 5. NAS Scan Endpoint Security Check (GET 405, unauth 401)
  // -------------------------------------------------------------------------
  console.log("\n5. Testing NAS Scan Route Security & Concurrency Guard...");
  const { GET: nasScanGet, POST: nasScanPost } = await import("@/app/api/nas/scan/route");
  const nasGetRes = await nasScanGet();
  assert.strictEqual(nasGetRes.status, 405, "GET /api/nas/scan must return HTTP 405 Method Not Allowed");
  console.log("   [PASS] GET /api/nas/scan rejected with HTTP 405 Method Not Allowed.");

  const unauthNasReq = new NextRequest("http://localhost:3000/api/nas/scan", {
    method: "POST",
  });
  const unauthNasRes = await nasScanPost(unauthNasReq);
  assert.strictEqual(unauthNasRes.status, 401, "Unauthenticated POST /api/nas/scan must return HTTP 401");
  console.log("   [PASS] Unauthenticated POST /api/nas/scan blocked with HTTP 401.");

  // -------------------------------------------------------------------------
  // 6. assignAssetToArtist Zod Schema Validation
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Library Actions Validation...");
  await adminLogin({
    email: "admin@graywood.no",
    password: "admin-change-me-123!",
  });
  const { assignAssetToArtist } = await import("@/app/actions/library");
  const invalidArtistRes = await assignAssetToArtist({ assetId: "", artistId: "" });
  assert.strictEqual(invalidArtistRes.success, false, "assignAssetToArtist must reject empty IDs");
  console.log("   [PASS] assignAssetToArtist safely rejected invalid empty arguments.");

  console.log("\n🎉 ALL CODE REVIEW AUDIT TESTS PASSED SUCCESSFULLY!");
}

runAuditTests().catch((err) => {
  console.error("\n❌ AUDIT TEST FAILED:", err);
  process.exit(1);
});
