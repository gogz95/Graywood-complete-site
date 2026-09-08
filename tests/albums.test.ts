/**
 * tests/albums.test.ts
 *
 * Automated Integration Test Suite for Priority 1:
 * 1. Public Portfolio creation & slugification.
 * 2. Private Client Proofing Vault creation with bcrypt PIN hashing.
 * 3. Unique slug collision resolution.
 * 4. Batch asset assignment (assignAssetsToAlbum).
 * 5. Asset removal from album (removeAssetFromAlbum).
 * 6. Vault PIN update (updateAlbumPin).
 * 7. Client Proofing portal authorization via verifyAlbumPin.
 * 8. Safe album deletion with asset preservation.
 */

import "dotenv/config";
import assert from "node:assert";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLogin } from "@/app/actions/admin";
import {
  createAlbum,
  deleteAlbum,
  assignAssetsToAlbum,
  removeAssetFromAlbum,
  updateAlbumPin,
} from "@/app/actions/albums";
import { verifyAlbumPin } from "@/app/actions/portal";

async function runAlbumTests() {
  console.log("=== PRIORITY 1: ALBUM & CLIENT PROOFING INTEGRATION TESTS ===\n");

  // Ensure admin user exists and authenticate
  const adminPassword = "admin-change-me-123!";
  const adminHash = await bcrypt.hash(adminPassword, 10);
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

  const loginRes = await adminLogin({
    email: "admin@graywood.no",
    password: adminPassword,
  });
  assert.strictEqual(loginRes.success, true, "Admin authentication required for album management");
  console.log("1. Admin authenticated successfully.");

  // Ensure test media assets exist for batch testing
  let asset1 = await prisma.mediaAsset.findFirst({ where: { originalPath: "test/album_asset_1.jpg" } });
  if (!asset1) {
    asset1 = await prisma.mediaAsset.create({
      data: {
        originalPath: "test/album_asset_1.jpg",
        filename: "album_asset_1.jpg",
        hash: "hash_album_test_1_" + Date.now(),
        mimeType: "image/jpeg",
        sizeBytes: BigInt(204800),
        width: 3840,
        height: 2160,
        isPublic: true,
      },
    });
  }

  let asset2 = await prisma.mediaAsset.findFirst({ where: { originalPath: "test/album_asset_2.jpg" } });
  if (!asset2) {
    asset2 = await prisma.mediaAsset.create({
      data: {
        originalPath: "test/album_asset_2.jpg",
        filename: "album_asset_2.jpg",
        hash: "hash_album_test_2_" + Date.now(),
        mimeType: "image/jpeg",
        sizeBytes: BigInt(409600),
        width: 3840,
        height: 2160,
        isPublic: true,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 2. Public Portfolio Creation
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Public Portfolio Creation...");
  const pubTitle = "Lofoten Winter Series " + Date.now();
  const pubRes = await createAlbum({
    title: pubTitle,
    type: "PORTFOLIO",
  });
  assert.strictEqual(pubRes.success, true, "Public portfolio must be created successfully");
  assert.ok(pubRes.album, "Returned album payload must be defined");
  assert.strictEqual(pubRes.album.type, "PORTFOLIO");
  assert.ok(pubRes.album.slug.startsWith("lofoten-winter-series"), "Slug must be normalized");

  const pubDbAlbum = await prisma.album.findUnique({
    where: { id: pubRes.album.id },
  });
  assert.strictEqual(pubDbAlbum?.pinHash, null, "Public portfolio must not have a PIN hash");
  console.log(`   [PASS] Created Public Portfolio: '${pubDbAlbum?.title}' (slug: ${pubDbAlbum?.slug})`);

  // -------------------------------------------------------------------------
  // 3. Private Client Proofing Vault Creation & PIN Hashing
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Private Client Proofing Vault Creation & PIN Hashing...");
  const proofTitle = "Snøhetta Headquarters Commission " + Date.now();
  const vaultPin = "9876";

  const vaultRes = await createAlbum({
    title: proofTitle,
    type: "CLIENT_PROOFING",
    clientName: "Snøhetta Architects",
    pin: vaultPin,
  });
  assert.strictEqual(vaultRes.success, true, "Client proofing vault must be created");
  assert.ok(vaultRes.album);
  assert.strictEqual(vaultRes.album.type, "CLIENT_PROOFING");
  assert.strictEqual(vaultRes.album.clientName, "Snøhetta Architects");

  const vaultDbAlbum = await prisma.album.findUnique({
    where: { id: vaultRes.album.id },
  });
  assert.ok(vaultDbAlbum?.pinHash, "Vault must store a pinHash");
  assert.notStrictEqual(vaultDbAlbum?.pinHash, vaultPin, "Vault PIN must be cryptographically hashed, not plaintext");
  const isPinValid = await bcrypt.compare(vaultPin, vaultDbAlbum?.pinHash || "");
  assert.strictEqual(isPinValid, true, "Stored bcrypt pinHash must match original PIN");
  console.log(`   [PASS] Created Client Proofing Vault: '${vaultDbAlbum?.title}' with verified bcrypt hash.`);

  // -------------------------------------------------------------------------
  // 4. Duplicate Slug Collision Handling
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Slug Collision Resolution...");
  const dupTitle = "Unique Campaign Title " + Date.now();
  const firstAlbum = await createAlbum({
    title: dupTitle,
    type: "PORTFOLIO",
  });
  assert.strictEqual(firstAlbum.success, true);

  const secondAlbum = await createAlbum({
    title: dupTitle,
    type: "PORTFOLIO",
  });
  assert.strictEqual(secondAlbum.success, true);
  assert.notStrictEqual(firstAlbum.album?.slug, secondAlbum.album?.slug, "Colliding slug must be disambiguated");
  assert.ok(secondAlbum.album?.slug.includes("-2"), "Duplicate slug must have incremental suffix");
  console.log(`   [PASS] Collision resolved: '${firstAlbum.album?.slug}' vs '${secondAlbum.album?.slug}'`);

  // -------------------------------------------------------------------------
  // 5. Batch Asset Assignment (assignAssetsToAlbum)
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Batch Asset Assignment...");
  const batchRes = await assignAssetsToAlbum({
    albumId: vaultDbAlbum!.id,
    assetIds: [asset1.id, asset2.id],
  });
  assert.strictEqual(batchRes.success, true, "Batch asset assignment must succeed");

  const albumItems = await prisma.albumItem.findMany({
    where: { albumId: vaultDbAlbum!.id },
  });
  assert.strictEqual(albumItems.length, 2, "Album must now contain exactly 2 assigned assets");
  console.log("   [PASS] Batch assigned 2 media assets to private client vault.");

  // -------------------------------------------------------------------------
  // 6. Asset Removal from Album (removeAssetFromAlbum)
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Asset Removal from Album...");
  const removeRes = await removeAssetFromAlbum({
    albumId: vaultDbAlbum!.id,
    assetId: asset1.id,
  });
  assert.strictEqual(removeRes.success, true, "Asset removal must succeed");

  const remainingItems = await prisma.albumItem.findMany({
    where: { albumId: vaultDbAlbum!.id },
  });
  assert.strictEqual(remainingItems.length, 1, "Album must now contain exactly 1 asset");
  assert.strictEqual(remainingItems[0].assetId, asset2.id);
  console.log("   [PASS] Single asset successfully unlinked from album.");

  // -------------------------------------------------------------------------
  // 7. Update Vault PIN (updateAlbumPin)
  // -------------------------------------------------------------------------
  console.log("\n7. Testing Vault PIN Update...");
  const newPin = "4321";
  const pinUpdateRes = await updateAlbumPin({
    albumId: vaultDbAlbum!.id,
    newPin,
  });
  assert.strictEqual(pinUpdateRes.success, true);

  const updatedVault = await prisma.album.findUnique({
    where: { id: vaultDbAlbum!.id },
  });
  const isNewPinValid = await bcrypt.compare(newPin, updatedVault?.pinHash || "");
  assert.strictEqual(isNewPinValid, true, "New PIN must verify against updated pinHash");
  console.log("   [PASS] Vault PIN updated and re-verified with bcrypt.");

  // -------------------------------------------------------------------------
  // 8. Client Portal Authorization via verifyAlbumPin
  // -------------------------------------------------------------------------
  console.log("\n8. Testing Client Portal PIN Authorization...");
  // Test invalid PIN
  const badAuthRes = await verifyAlbumPin({
    albumSlug: vaultDbAlbum!.slug,
    pin: "0000",
  });
  assert.strictEqual(badAuthRes.success, false, "Incorrect PIN must be rejected");

  // Test valid PIN
  const goodAuthRes = await verifyAlbumPin({
    albumSlug: vaultDbAlbum!.slug,
    pin: newPin,
  });
  assert.strictEqual(goodAuthRes.success, true, "Valid PIN must be accepted");
  console.log("   [PASS] Client portal PIN verification correctly gates private vault.");

  // -------------------------------------------------------------------------
  // 9. Safe Album Deletion (Media Assets Preserved)
  // -------------------------------------------------------------------------
  console.log("\n9. Testing Safe Album Deletion & Asset Preservation...");
  const deleteRes = await deleteAlbum(vaultDbAlbum!.id);
  assert.strictEqual(deleteRes.success, true, "Album deletion must succeed");

  const deletedAlbumCheck = await prisma.album.findUnique({
    where: { id: vaultDbAlbum!.id },
  });
  assert.strictEqual(deletedAlbumCheck, null, "Album record must be deleted");

  // Verify assets are still safe in DB
  const asset1Check = await prisma.mediaAsset.findUnique({ where: { id: asset1.id } });
  const asset2Check = await prisma.mediaAsset.findUnique({ where: { id: asset2.id } });
  assert.ok(asset1Check, "Asset 1 must remain intact after album deletion");
  assert.ok(asset2Check, "Asset 2 must remain intact after album deletion");
  console.log("   [PASS] Album deleted safely; all underlying media assets were preserved.");

  // Clean up test albums
  await deleteAlbum(pubDbAlbum!.id);
  await deleteAlbum(firstAlbum.album!.id);
  await deleteAlbum(secondAlbum.album!.id);

  console.log("\n🎉 ALL PRIORITY 1 ALBUM & CLIENT PROOFING TESTS PASSED SUCCESSFULLY!");
}

runAlbumTests()
  .catch((err) => {
    console.error("Album test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
