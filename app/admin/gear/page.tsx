import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { GearDeskView } from "@/components/admin/GearDeskView";

export const dynamic = "force-dynamic";

export default async function AdminGearPage() {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const [rawItems, rawUsers, rawLogs] = await Promise.all([
    prisma.gearItem.findMany({
      orderBy: { name: "asc" },
      include: {
        checkoutLogs: {
          where: { actualReturn: null },
          include: { user: true },
          orderBy: { checkoutDate: "desc" },
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
      orderBy: { checkoutDate: "desc" },
      include: {
        gear: true,
        user: true,
      },
      take: 50,
    }),
  ]);

  const items = rawItems.map((item) => {
    const active = item.checkoutLogs[0];
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      serialNumber: item.serialNumber,
      condition: item.condition,
      status: item.status,
      storageLocation: item.storageLocation,
      notes: item.notes,
      activeCheckout: active
        ? {
            id: active.id,
            userId: active.userId,
            userName: active.user.name,
            checkoutDate: active.checkoutDate.toISOString(),
            expectedReturn: active.expectedReturn.toISOString(),
            checkoutNotes: active.checkoutNotes,
          }
        : null,
    };
  });

  const logs = rawLogs.map((log) => ({
    id: log.id,
    gearId: log.gearId,
    gearName: log.gear.name,
    serialNumber: log.gear.serialNumber,
    userId: log.userId,
    userName: log.user.name,
    checkoutDate: log.checkoutDate.toISOString(),
    expectedReturn: log.expectedReturn.toISOString(),
    actualReturn: log.actualReturn ? log.actualReturn.toISOString() : null,
    checkoutNotes: log.checkoutNotes,
    returnNotes: log.returnNotes,
  }));

  return <GearDeskView initialItems={items} users={rawUsers} logs={logs} />;
}
