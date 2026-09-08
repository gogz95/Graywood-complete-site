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
    const gear = await prisma.gearItem.findUnique({
      where: { id: gearId },
    });

    if (!gear) {
      return { success: false, message: "Gear item not found." };
    }

    if (gear.status === "CHECKED_OUT") {
      return { success: false, message: "This item is already checked out." };
    }

    const returnDate = new Date(expectedReturn);

    // Run transaction: create checkout log and update gear status
    await prisma.$transaction([
      prisma.gearCheckoutLog.create({
        data: {
          gearItemId: gearId,
          custodian: userId,
          action: "CHECKOUT",
          notes: notes?.trim() || null,
        },
      }),
      prisma.gearItem.update({
        where: { id: gearId },
        data: {
          status: "CHECKED_OUT",
          custodian: userId,
          checkedOutAt: new Date(),
          expectedReturn: returnDate,
          notes: notes?.trim() || gear.notes,
        },
      }),
    ]);

    return {
      success: true,
      message: `Successfully checked out ${gear.name}.`,
    };
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

  const { gearId, returnNotes, condition } = parsed.data;

  try {
    const gear = await prisma.gearItem.findUnique({
      where: { id: gearId },
    });

    if (!gear) {
      return { success: false, message: "Gear item not found." };
    }

    const nextStatus =
      condition.toLowerCase().includes("damaged") ||
      condition.toLowerCase().includes("maintenance")
        ? "MAINTENANCE"
        : "AVAILABLE";

    await prisma.$transaction([
      prisma.gearCheckoutLog.create({
        data: {
          gearItemId: gearId,
          custodian: gear.custodian || "Unknown",
          action: "CHECKIN",
          notes: returnNotes?.trim() || null,
        },
      }),
      prisma.gearItem.update({
        where: { id: gearId },
        data: {
          status: nextStatus,
          custodian: null,
          checkedOutAt: null,
          expectedReturn: null,
          notes: returnNotes?.trim() || gear.notes,
        },
      }),
    ]);

    return {
      success: true,
      message: `Successfully checked in ${gear.name} (Status: ${nextStatus}).`,
    };
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

  const { name, brand, category, serialNumber, storageLocation, notes } =
    parsed.data;

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
