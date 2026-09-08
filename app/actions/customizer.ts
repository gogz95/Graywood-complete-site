"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";

const ToggleModuleSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
});

const UpdateBrandSchema = z.object({
  id: z.string().min(1),
  siteTitle: z.string().min(1, "Site title is required"),
  primaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  backgroundColor: z.string().min(1),
});

export async function toggleSystemModule(rawInput: {
  id: string;
  enabled: boolean;
}) {
  await requireAdminSession(["ADMIN"]);
  const parsed = ToggleModuleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: "Invalid parameters." };
  }

  const { id, enabled } = parsed.data;

  try {
    const updated = await prisma.systemModule.update({
      where: { id },
      data: { enabled },
    });

    try {
      revalidatePath("/", "layout");
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. CLI/tests)
    }

    return {
      success: true,
      message: `System module "${updated.name}" is now ${
        enabled ? "ACTIVE" : "OFFLINE"
      }.`,
    };
  } catch (err: unknown) {
    console.error("toggleSystemModule error:", err);
    return { success: false, message: "Failed to update module state." };
  }
}

export async function updateBrandSettings(rawInput: {
  id: string;
  siteTitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}) {
  await requireAdminSession(["ADMIN"]);
  const parsed = UpdateBrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: "Invalid brand settings." };
  }

  const { id, siteTitle, primaryColor, accentColor, backgroundColor } =
    parsed.data;

  try {
    await prisma.brandSettings.update({
      where: { id },
      data: {
        siteTitle,
        primaryColor,
        accentColor,
        backgroundColor,
      },
    });

    try {
      revalidatePath("/", "layout");
    } catch {
      // Safe fallback when executed outside Next.js request context (e.g. CLI/tests)
    }

    return {
      success: true,
      message: `Brand settings for portal [${id}] saved successfully.`,
    };
  } catch (err: unknown) {
    console.error("updateBrandSettings error:", err);
    return { success: false, message: "Failed to save brand settings." };
  }
}
