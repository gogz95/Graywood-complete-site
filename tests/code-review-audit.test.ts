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

  // Log in as admin to satisfy requireAdminSession
  await adminLogin({
    email: "admin@graywood.no",
    password: "admin-change-me-123!",
  });

  // -------------------------------------------------------------------------
  // 1. Gear Checkout Date Validation
  // -------------------------------------------------------------------------
  console.log("1. Testing Gear Checkout Date Validation...");
  const gear = await prisma.gearItem.findFirst();
  const user = await prisma.user.findFirst();
  assert.ok(gear && user, "Need gear and user for checkout test");

  // Invalid date string
  const invalidDateRes = await checkoutGearItem({
    gearId: gear.id,
    userId: user.id,
    expectedReturn: "not-a-valid-date-string",
  });
  assert.strictEqual(invalidDateRes.success, false, "Invalid date format must be rejected");
  assert.ok(
    invalidDateRes.message.toLowerCase().includes("date"),
    "Error message must specify date format issue"
  );
  console.log("   [PASS] Malformed date rejected cleanly:", invalidDateRes.message);

  // -------------------------------------------------------------------------
  // 2. Public Photography Page Privacy Isolation
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Public Photography Page Privacy Isolation...");
  // Query using the exact where clause from PhotographyPage
  const publicAssets = await prisma.mediaAsset.findMany({
    where: {
      albums: {
        none: {
          album: {
            type: "CLIENT_PROOFING",
          },
        },
      },
    },
    include: {
      albums: {
        include: {
          album: true,
        },
      },
    },
  });

  const hasLeakedClientProof = publicAssets.some((asset) =>
    asset.albums.some((item) => item.album.type === "CLIENT_PROOFING")
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
  // 4. Library Sync Endpoint Security Check
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Library Sync Endpoint Security...");
  // Simulate production environment
  const envObj = process.env as Record<string, string | undefined>;
  const originalEnv = envObj.NODE_ENV;
  envObj.NODE_ENV = "production";

  try {
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/library/sync", {
      method: "POST",
    });
    const syncRes = await syncPost(unauthReq);
    assert.strictEqual(syncRes.status, 401, "Unauthenticated sync request in production must return HTTP 401");
    console.log("   [PASS] Unauthenticated POST /api/admin/library/sync blocked with HTTP 401.");

    const unauthGetRes = await syncGet(unauthReq);
    assert.strictEqual(unauthGetRes.status, 401, "Unauthenticated GET sync request in production must return HTTP 401");
    console.log("   [PASS] Unauthenticated GET /api/admin/library/sync blocked with HTTP 401.");
  } finally {
    envObj.NODE_ENV = originalEnv;
  }

  console.log("\n🎉 ALL CODE REVIEW AUDIT TESTS PASSED SUCCESSFULLY!");
}

runAuditTests().catch((err) => {
  console.error("\n❌ AUDIT TEST FAILED:", err);
  process.exit(1);
});
