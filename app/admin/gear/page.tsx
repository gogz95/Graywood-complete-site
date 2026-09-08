import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { GearDeskView } from "@/components/admin/GearDeskView";

export const dynamic = "force-dynamic";

export default async function AdminGearPage() {
  const adminUser = await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const [rawItems, rawUsers, rawLogs] = await Promise.all([
    prisma.gearItem.findMany({
      orderBy: { name: "asc" },
      include: {
        checkoutLogs: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.gearCheckoutLog.findMany({
      orderBy: { timestamp: "desc" },
      include: {
        gearItem: true,
      },
      take: 50,
    }),
  ]);

  const userMap = new Map(rawUsers.map((u) => [u.id, u.name]));

  const items = rawItems.map((item) => {
    const custodianName = item.custodian ? (userMap.get(item.custodian) || item.custodian) : "Unknown Custodian";
    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      serialNumber: item.serialNumber || "",
      ownerId: item.ownerId,
      ownerName: item.ownerName || "Studio Shared",
      condition: "Good",
      status: item.status,
      storageLocation: item.storageLocation,
      notes: item.notes,
      activeCheckout: item.status === "CHECKED_OUT"
        ? {
            id: item.id,
            userId: item.custodian || "Unknown",
            userName: custodianName,
            checkoutDate: item.checkedOutAt ? item.checkedOutAt.toISOString() : new Date().toISOString(),
            expectedReturn: item.expectedReturn ? item.expectedReturn.toISOString() : new Date().toISOString(),
            checkoutNotes: item.notes,
          }
        : null,
    };
  });

  const logs = rawLogs.map((log) => ({
    id: log.id,
    gearId: log.gearItemId,
    gearName: log.gearItem?.name || "Equipment Item",
    serialNumber: log.gearItem?.serialNumber || "N/A",
    userId: log.custodian,
    userName: userMap.get(log.custodian) || log.custodian,
    checkoutDate: log.timestamp.toISOString(),
    expectedReturn: log.timestamp.toISOString(),
    actualReturn: log.action === "CHECKIN" ? log.timestamp.toISOString() : null,
    checkoutNotes: log.notes,
    returnNotes: log.notes,
  }));

  return (
    <GearDeskView
      initialItems={items}
      users={rawUsers}
      logs={logs}
      currentUser={{
        id: adminUser.userId,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      }}
    />
  );
}
