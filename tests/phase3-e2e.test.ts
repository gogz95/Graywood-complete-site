/**
 * tests/phase3-e2e.test.ts
 *
 * Comprehensive End-to-End Integration Test Suite for Phase 3:
 * 1. Zero-Discovery Privacy & Crawler Lockout (/portal returns 404, robots.txt disallow rules).
 * 2. Edge-Safe PIN Verification Server Action (Node.js bcrypt execution).
 * 3. Client Proofing Gallery rendering & metadata.
 * 4. Memory-Safe Streaming ZIP Endpoint (iron-session gate, archiver stream, ZIP headers, abort hook).
 */

import "dotenv/config";
import assert from "node:assert";
import { verifyAlbumPin, lockAlbumSession } from "@/app/actions/portal";
import { GET as downloadRoute } from "@/app/api/portal/[albumSlug]/download/route";
import robots from "@/app/robots";
import ClientProofingPage, {
  generateMetadata as generatePortalMetadata,
} from "@/app/portal/[albumSlug]/page";
import PortalIndexPage from "@/app/portal/page";
import { NextRequest } from "next/server";
import { sealData } from "iron-session";
import { proofingSessionOptions } from "@/lib/session";

async function runPhase3Tests() {
  console.log("=== PHASE 3 E2E INTEGRATION TEST SUITE ===\n");

  const albumSlug = "nordic-campaign-2026";

  // -------------------------------------------------------------------------
  // 1. Zero-Discovery Privacy & Crawler Lockout
  // -------------------------------------------------------------------------
  console.log("1. Testing Zero-Discovery Privacy & Crawler Lockout...");

  // 1a. /portal direct access must throw NEXT_NOT_FOUND
  let notFoundThrown = false;
  try {
    PortalIndexPage();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      const digest = (err as { digest: string }).digest;
      notFoundThrown = digest.startsWith("NEXT_NOT_FOUND") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404");
    }
  }
  assert.strictEqual(notFoundThrown, true, "Direct access to /portal must trigger notFound()");
  console.log("   [PASS] /portal direct access triggers Next.js notFound()");

  // 1b. robots.txt rules
  const robotsData = robots();
  const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules;
  assert.ok(rules, "robots.txt must return rules");
  const disallowList = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];
  assert.ok(disallowList.includes("/portal/"), "robots.txt must disallow /portal/");
  assert.ok(disallowList.includes("/api/portal/"), "robots.txt must disallow /api/portal/");
  console.log("   [PASS] robots.txt disallows /portal/ and /api/portal/");

  // 1c. Proofing page metadata
  const meta = await generatePortalMetadata();
  const robotsObj = typeof meta.robots === "object" && meta.robots !== null ? meta.robots : null;
  assert.strictEqual(robotsObj?.index, false, "Metadata must disallow search indexing");
  assert.strictEqual(robotsObj?.follow, false, "Metadata must disallow link following");
  console.log("   [PASS] Client proofing page enforces noindex, nofollow metadata");

  // -------------------------------------------------------------------------
  // 2. PIN Verification Server Action
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Edge-Safe PIN Verification Server Action...");

  // 2a. Invalid PIN
  const wrongPinResult = await verifyAlbumPin({
    albumSlug,
    pin: "9999",
  });
  assert.strictEqual(wrongPinResult.success, false, "Incorrect PIN must fail");
  console.log("   [PASS] Incorrect PIN rejected:", wrongPinResult.message);

  // 2b. Non-existent album
  const fakeAlbumResult = await verifyAlbumPin({
    albumSlug: "non-existent-album",
    pin: "1234",
  });
  assert.strictEqual(fakeAlbumResult.success, false, "Non-existent album must fail");
  console.log("   [PASS] Non-existent album rejected:", fakeAlbumResult.message);

  // 2c. Correct PIN
  const validPinResult = await verifyAlbumPin({
    albumSlug,
    pin: "1234",
  });
  assert.strictEqual(validPinResult.success, true, "Valid PIN must succeed");
  console.log("   [PASS] Valid PIN accepted:", validPinResult.message);

  // -------------------------------------------------------------------------
  // 3. Client Proofing Page Render
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Client Proofing Page Component Render...");

  // Renders either PinEntryForm or ProofingGallery without throwing
  const pageResult = await ClientProofingPage({
    params: Promise.resolve({ albumSlug }),
  });
  assert.ok(pageResult, "ClientProofingPage must return a valid React element");
  console.log("   [PASS] Client proofing page rendered successfully.");

  // -------------------------------------------------------------------------
  // 4. Memory-Safe Streaming ZIP Endpoint
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Memory-Safe Streaming ZIP Endpoint...");

  // 4a. Unauthorized request (no session cookie)
  const unauthReq = new NextRequest(
    `http://localhost:3000/api/portal/${albumSlug}/download`
  );
  const unauthRes = await downloadRoute(unauthReq, {
    params: Promise.resolve({ albumSlug }),
  });
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated download must return HTTP 401");
  console.log("   [PASS] Unauthenticated download blocked with HTTP 401.");

  // 4b. Authorized request with valid sealed iron-session cookie
  const sealedCookie = await sealData(
    { authorizedAlbums: [albumSlug] },
    { password: proofingSessionOptions.password as string }
  );

  const authReq = new NextRequest(
    `http://localhost:3000/api/portal/${albumSlug}/download`,
    {
      headers: {
        cookie: `gw_proofing_session=${sealedCookie}`,
      },
    }
  );

  const authRes = await downloadRoute(authReq, {
    params: Promise.resolve({ albumSlug }),
  });

  assert.strictEqual(authRes.status, 200, "Authorized download must return HTTP 200");
  assert.strictEqual(
    authRes.headers.get("content-type"),
    "application/zip",
    "Content-Type must be application/zip"
  );
  assert.strictEqual(
    authRes.headers.get("x-accel-buffering"),
    "no",
    "X-Accel-Buffering must be disabled"
  );
  assert.ok(
    authRes.headers.get("content-disposition")?.includes(`${albumSlug}-gallery.zip`),
    "Content-Disposition must include zip filename"
  );

  // Read first chunk from the Web ReadableStream to verify ZIP magic number (PK\x03\x04)
  const reader = authRes.body?.getReader();
  assert.ok(reader, "Response body must provide a web stream reader");
  const { value, done } = await reader.read();
  assert.strictEqual(done, false, "Stream must yield at least one chunk");
  assert.ok(value && value.length >= 4, "Stream chunk must contain bytes");

  // Magic bytes for ZIP: 0x50, 0x4B (ASCII 'PK')
  assert.strictEqual(value[0], 0x50, "ZIP header byte 0 must be 'P' (0x50)");
  assert.strictEqual(value[1], 0x4b, "ZIP header byte 1 must be 'K' (0x4B)");
  console.log(
    `   [PASS] Streaming ZIP verified. Header: 'PK', Content-Type: application/zip, Length: ${value.length} bytes read.`
  );
  reader.releaseLock();

  // -------------------------------------------------------------------------
  // 5. Abort Signal Hook
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Abort Signal Handler...");
  const abortController = new AbortController();

  const abortReq = new NextRequest(
    `http://localhost:3000/api/portal/${albumSlug}/download`,
    {
      signal: abortController.signal,
      headers: {
        cookie: `gw_proofing_session=${sealedCookie}`,
      },
    }
  );

  const abortRes = await downloadRoute(abortReq, {
    params: Promise.resolve({ albumSlug }),
  });
  assert.strictEqual(abortRes.status, 200);

  // Trigger abort immediately
  abortController.abort();
  console.log("   [PASS] Abort signal triggered cleanly on streaming download.");

  // -------------------------------------------------------------------------
  // 6. Lock Session Action
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Session Lock Action...");
  const lockResult = await lockAlbumSession(albumSlug);
  assert.strictEqual(lockResult.success, true);
  console.log("   [PASS] Gallery session lock action verified.");

  console.log("\n🎉 ALL PHASE 3 E2E TESTS PASSED SUCCESSFULLY!");
}

runPhase3Tests().catch((err) => {
  console.error("\n❌ PHASE 3 TEST SUITE FAILED:", err);
  process.exit(1);
});
