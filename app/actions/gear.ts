"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";

const CheckoutSchema = z.object({
  gearId: z.string().min(1, "Gear item is required"),
  userId: z.string().min(1, "Assignee is required"),
  expectedReturn: z
    .string()
    .min(1, "Expected return date is required")
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      "Invalid date format for expected return"
    ),
  notes: z.string().optional(),
});

const CheckinSchema = z.object({
  gearId: z.string().min(1, "Gear item is required"),
  logId: z.string().optional(),
  returnNotes: z.string().optional(),
  condition: z.string().default("Good"),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type CheckinInput = z.infer<typeof CheckinSchema>;

export async function checkoutGearItem(rawInput: CheckoutInput) {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const parsed = CheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid checkout details.",
    };
  }

  const { gearId, userId, expectedReturn, notes } = parsed.data;

  try {
    const returnDate = new Date(expectedReturn);

    // Atomically conditionalize checkout within transaction to eliminate check-then-write races
    const checkoutResult = await prisma.$transaction(async (tx) => {
      const updateRes = await tx.gearItem.updateMany({
        where: {
          id: gearId,
          status: "AVAILABLE",
        },
        data: {
          status: "CHECKED_OUT",
          custodian: userId,
          checkedOutAt: new Date(),
          expectedReturn: returnDate,
          notes: notes?.trim() || null,
        },
      });

      if (updateRes.count === 0) {
        const current = await tx.gearItem.findUnique({ where: { id: gearId } });
        if (!current) {
          return { success: false, message: "Gear item not found." };
        }
        return {
          success: false,
          message: "This item is already checked out or undergoing maintenance.",
        };
      }

      await tx.gearCheckoutLog.create({
        data: {
          gearItemId: gearId,
          custodian: userId,
          action: "CHECKOUT",
          notes: notes?.trim() || null,
        },
      });

      const gear = await tx.gearItem.findUnique({ where: { id: gearId } });
      return {
        success: true,
        message: `Successfully checked out ${gear?.name || "gear item"}.`,
      };
    });

    return checkoutResult;
  } catch (error: unknown) {
    console.error("checkoutGearItem error:", error);
    return { success: false, message: "Failed to process checkout transaction." };
  }
}

export async function checkinGearItem(rawInput: CheckinInput) {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const parsed = CheckinSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid check-in details.",
    };
  }

  const { gearId, logId, returnNotes, condition } = parsed.data;

  try {
    const nextStatus =
      condition.toLowerCase().includes("damaged") ||
      condition.toLowerCase().includes("maintenance")
        ? "MAINTENANCE"
        : "AVAILABLE";

    const checkinResult = await prisma.$transaction(async (tx) => {
      // Validate logId belongs strictly to this gear item and is a CHECKOUT action
      if (logId) {
        const specificLog = await tx.gearCheckoutLog.findFirst({
          where: {
            id: logId,
            gearItemId: gearId,
            action: "CHECKOUT",
          },
        });
        if (!specificLog) {
          return {
            success: false,
            message: "Invalid or mismatched checkout log ID for this gear item.",
          };
        }
      }

      // Check current status
      const current = await tx.gearItem.findUnique({ where: { id: gearId } });
      if (!current) {
        return { success: false, message: "Gear item not found." };
      }
      if (current.status !== "CHECKED_OUT") {
        return { success: false, message: "This item is not currently checked out." };
      }

      // Conditional atomic status transition
      const updateRes = await tx.gearItem.updateMany({
        where: {
          id: gearId,
          status: "CHECKED_OUT",
        },
        data: {
          status: nextStatus,
          custodian: null,
          checkedOutAt: null,
          expectedReturn: null,
          notes: returnNotes?.trim() || current.notes,
        },
      });

      if (updateRes.count === 0) {
        return { success: false, message: "This item is not currently checked out." };
      }

      await tx.gearCheckoutLog.create({
        data: {
          gearItemId: gearId,
          custodian: current.custodian || "Unknown",
          action: "CHECKIN",
          notes: returnNotes?.trim() || null,
        },
      });

      return {
        success: true,
        message: `Successfully checked in ${current.name} (Status: ${nextStatus}).`,
      };
    });

    return checkinResult;
  } catch (error: unknown) {
    console.error("checkinGearItem error:", error);
    return { success: false, message: "Failed to process check-in transaction." };
  }
}

const CreateGearSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional().default("Sony"),
  category: z.string().min(1, "Category is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  storageLocation: z.string().default("Main Studio Locker"),
  condition: z.string().default("Good"),
  notes: z.string().optional(),
});

export type CreateGearInput = z.infer<typeof CreateGearSchema>;

export async function createGearItem(rawInput: CreateGearInput) {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const parsed = CreateGearSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid equipment parameters.",
    };
  }

  const {
    name,
    brand,
    category,
    serialNumber,
    ownerId,
    ownerName,
    storageLocation,
    notes,
  } = parsed.data;

  try {
    const existing = await prisma.gearItem.findFirst({
      where: { serialNumber: serialNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        message: `An item with serial number "${serialNumber}" already exists.`,
      };
    }

    const item = await prisma.gearItem.create({
      data: {
        name: name.trim(),
        brand: brand?.trim() || "Sony",
        category,
        serialNumber: serialNumber.trim(),
        ownerId: ownerId && ownerId !== "STUDIO" ? ownerId : null,
        ownerName: ownerName?.trim() || "Studio Shared",
        storageLocation: storageLocation.trim() || "Main Studio Locker",
        notes: notes?.trim() || null,
        status: "AVAILABLE",
      },
    });

    return {
      success: true,
      message: `Successfully cataloged "${item.name}" into inventory.`,
      item,
    };
  } catch (error: unknown) {
    console.error("createGearItem error:", error);
    return { success: false, message: "Failed to create equipment item." };
  }
}

export async function updateGearOwner(input: {
  gearId: string;
  ownerId?: string | null;
  ownerName: string;
}) {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  const { gearId, ownerId, ownerName } = input;
  if (!gearId) {
    return { success: false, message: "Gear item ID is required." };
  }

  try {
    const updated = await prisma.gearItem.update({
      where: { id: gearId },
      data: {
        ownerId: ownerId && ownerId !== "STUDIO" ? ownerId : null,
        ownerName: ownerName?.trim() || "Studio Shared",
      },
    });

    return {
      success: true,
      message: `Equipment ownership updated to "${updated.ownerName}".`,
      item: updated,
    };
  } catch (error: unknown) {
    console.error("updateGearOwner error:", error);
    return { success: false, message: "Failed to update equipment owner." };
  }
}

export async function deleteGearItem(gearId: string) {
  await requireAdminSession(["ADMIN", "CO_OWNER"]);

  if (!gearId) {
    return { success: false, message: "Gear ID is required." };
  }

  try {
    await prisma.gearItem.delete({
      where: { id: gearId },
    });

    return {
      success: true,
      message: "Gear item removed from inventory.",
    };
  } catch (error: unknown) {
    console.error("deleteGearItem error:", error);
    return { success: false, message: "Failed to delete equipment item." };
  }
}
