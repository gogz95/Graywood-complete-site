/**
 * tests/gear-owner.test.ts
 *
 * Automated Integration Test Suite for Priority 2:
 * 1. Studio Shared equipment item creation (ownerId: null, ownerName: "Studio Shared").
 * 2. Co-Owner attributed equipment item creation (ownerId: user.id, ownerName: user.name).
 * 3. Prevention of duplicate hardware serial numbers.
 * 4. Equipment custody checkout flow with custodian attribution.
 * 5. Equipment checkin return flow with condition inspection.
 * 6. Ownership reallocation (updateGearOwner).
 * 7. Studio vs My Gear ownership query filtering accuracy.
 * 8. Equipment deletion (deleteGearItem).
 */

import "dotenv/config";
import assert from "node:assert";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLogin } from "@/app/actions/admin";
import {
  createGearItem,
  checkoutGearItem,
  checkinGearItem,
  updateGearOwner,
  deleteGearItem,
} from "@/app/actions/gear";

async function runGearOwnerTests() {
  console.log("=== PRIORITY 2: GATED GEAR DESK WITH OWNER ATTRIBUTION TESTS ===\n");

  const adminPassword = "admin-change-me-123!";
  const hash = await bcrypt.hash(adminPassword, 10);

  // Setup Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@graywood.no" },
    update: { passwordHash: hash, role: "ADMIN" },
    create: {
      email: "admin@graywood.no",
      name: "Graywood Superadmin",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  // Setup Co-Owner user
  const coOwner = await prisma.user.upsert({
    where: { email: "coowner@graywood.no" },
    update: { passwordHash: hash, role: "CO_OWNER", name: "Alexander Graywood" },
    create: {
      email: "coowner@graywood.no",
      name: "Alexander Graywood",
      passwordHash: hash,
      role: "CO_OWNER",
    },
  });

  // Authenticate as Admin
  const loginRes = await adminLogin({
    email: "admin@graywood.no",
    password: adminPassword,
  });
  assert.strictEqual(loginRes.success, true, "Authentication must succeed for gear management");
  console.log("1. Authenticated administrator session established.");

  const uniqueSuffix = Date.now().toString().slice(-6);
  const studioSerial = `SN-STUDIO-${uniqueSuffix}`;
  const coOwnerSerial = `SN-OWNER-${uniqueSuffix}`;

  // 1. Create Studio Shared equipment
  const studioItemRes = await createGearItem({
    name: `Sony FX6 Cinema Camera ${uniqueSuffix}`,
    brand: "Sony",
    category: "BODY",
    serialNumber: studioSerial,
    ownerId: "STUDIO",
    ownerName: "Studio Shared",
    storageLocation: "Studio Vault Shelf 1",
    condition: "Mint",
    notes: "Common production camera body",
  });
  assert.strictEqual(studioItemRes.success, true, `Failed to create studio item: ${studioItemRes.message}`);
  assert.ok(studioItemRes.item, "Expected created item object");
  assert.strictEqual(studioItemRes.item.ownerId, null, "Studio shared items must have ownerId = null");
  assert.strictEqual(studioItemRes.item.ownerName, "Studio Shared");
  console.log("2. Studio Shared equipment item successfully cataloged.");

  // 2. Create Co-Owner attributed equipment
  const ownerItemRes = await createGearItem({
    name: `Leica Summilux-C 35mm T1.4 ${uniqueSuffix}`,
    brand: "Leica",
    category: "LENS",
    serialNumber: coOwnerSerial,
    ownerId: coOwner.id,
    ownerName: coOwner.name,
    storageLocation: "Alexander Personal Pelicase",
    condition: "Mint",
    notes: "Personal prime optic for commercial productions",
  });
  assert.strictEqual(ownerItemRes.success, true, `Failed to create co-owner item: ${ownerItemRes.message}`);
  assert.ok(ownerItemRes.item, "Expected created item object");
  assert.strictEqual(ownerItemRes.item.ownerId, coOwner.id, "Owner ID must match co-owner user ID");
  assert.strictEqual(ownerItemRes.item.ownerName, coOwner.name);
  console.log("3. Co-Owner attributed equipment item successfully cataloged.");

  // 3. Duplicate serial number validation
  const duplicateRes = await createGearItem({
    name: "Duplicate Serial Test",
    brand: "Sony",
    category: "BODY",
    serialNumber: studioSerial,
    ownerId: "STUDIO",
    ownerName: "Studio Shared",
    storageLocation: "Vault",
    condition: "Good",
  });
  assert.strictEqual(duplicateRes.success, false, "Duplicate serial numbers must be rejected");
  console.log("4. Duplicate serial number rejection verified.");

  // 4. Custody checkout flow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);

  const checkoutRes = await checkoutGearItem({
    gearId: studioItemRes.item.id,
    userId: coOwner.id,
    expectedReturn: tomorrow.toISOString().split("T")[0],
    notes: "Field test in Tromsø",
  });
  assert.strictEqual(checkoutRes.success, true, `Checkout failed: ${checkoutRes.message}`);

  const checkedOutItem = await prisma.gearItem.findUnique({
    where: { id: studioItemRes.item.id },
  });
  assert.strictEqual(checkedOutItem?.status, "CHECKED_OUT");
  assert.strictEqual(checkedOutItem?.custodian, coOwner.id);
  console.log("5. Gear checkout transaction verified with custodian assignment.");

  // 5. Checkin return flow
  const checkinRes = await checkinGearItem({
    gearId: studioItemRes.item.id,
    condition: "Good",
    returnNotes: "Cleaned and returned to shelf 1",
  });
  assert.strictEqual(checkinRes.success, true, `Checkin failed: ${checkinRes.message}`);

  const returnedItem = await prisma.gearItem.findUnique({
    where: { id: studioItemRes.item.id },
  });
  assert.strictEqual(returnedItem?.status, "AVAILABLE");
  assert.strictEqual(returnedItem?.custodian, null);
  console.log("6. Gear checkin return transaction verified.");

  // 6. Update equipment ownership (reassign Alexander's item to Studio Shared)
  const updateOwnerRes = await updateGearOwner({
    gearId: ownerItemRes.item.id,
    ownerId: "STUDIO",
    ownerName: "Studio Shared",
  });
  assert.strictEqual(updateOwnerRes.success, true, `Ownership update failed: ${updateOwnerRes.message}`);
  assert.strictEqual(updateOwnerRes.item?.ownerId, null);
  assert.strictEqual(updateOwnerRes.item?.ownerName, "Studio Shared");
  console.log("7. Gear ownership reassignment verified.");

  // 7. Ownership query filtering simulation
  const allTestItems = await prisma.gearItem.findMany({
    where: {
      id: { in: [studioItemRes.item.id, ownerItemRes.item.id] },
    },
  });

  const studioFiltered = allTestItems.filter(
    (item) => !item.ownerId || item.ownerName === "Studio Shared"
  );
  // Both are now studio shared after reallocation
  assert.strictEqual(studioFiltered.length, 2, "Expected both items to match Studio Shared filter");

  // Re-assign one back to coOwner to test MY_GEAR filter
  await updateGearOwner({
    gearId: ownerItemRes.item.id,
    ownerId: coOwner.id,
    ownerName: coOwner.name,
  });

  const myGearFiltered = (await prisma.gearItem.findMany({
    where: { id: { in: [studioItemRes.item.id, ownerItemRes.item.id] } },
  })).filter((item) => item.ownerId === coOwner.id || item.ownerName === coOwner.name);

  assert.strictEqual(myGearFiltered.length, 1, "Expected exactly 1 item under My Gear filter");
  assert.strictEqual(myGearFiltered[0].id, ownerItemRes.item.id);
  console.log("8. Studio vs Personal ownership filter calculations verified.");

  // 8. Delete equipment items
  const deleteStudioRes = await deleteGearItem(studioItemRes.item.id);
  assert.strictEqual(deleteStudioRes.success, true, `Delete studio item failed: ${deleteStudioRes.message}`);

  const deleteOwnerRes = await deleteGearItem(ownerItemRes.item.id);
  assert.strictEqual(deleteOwnerRes.success, true, `Delete owner item failed: ${deleteOwnerRes.message}`);

  const checkDeleted = await prisma.gearItem.findMany({
    where: { id: { in: [studioItemRes.item.id, ownerItemRes.item.id] } },
  });
  assert.strictEqual(checkDeleted.length, 0, "All test gear items should be cleaned up");
  console.log("9. Equipment deletion verified and cleanup completed.");

  console.log("\n>>> ALL PRIORITY 2 GEAR OWNER ATTRIBUTION TESTS PASSED SUCCESSFULLY! <<<\n");
}

runGearOwnerTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
