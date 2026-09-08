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
  studioTitle: z.string().optional(),
  siteTitle: z.string().optional(),
  tagline: z.string().optional(),
  canvasColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  borderColor: z.string().optional(),
  inkColor: z.string().optional(),
  pineColor: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
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
    // Try updating by id, or fallback to key if id equals key
    const moduleRecord = await prisma.systemModule.findFirst({
      where: {
        OR: [{ id }, { key: id }],
      },
    });

    if (!moduleRecord) {
      return { success: false, message: "Module not found." };
    }

    const updated = await prisma.systemModule.update({
      where: { id: moduleRecord.id },
      data: { enabled },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/customizer");
    } catch {
      // Safe fallback when executed outside Next.js request context
    }

    return {
      success: true,
      message: `System module "${updated.label}" is now ${
        enabled ? "ACTIVE" : "OFFLINE"
      }.`,
    };
  } catch (err: unknown) {
    console.error("toggleSystemModule error:", err);
    return { success: false, message: "Failed to update module state." };
  }
}

export async function updateBrandSettings(rawInput: z.infer<typeof UpdateBrandSchema>) {
  await requireAdminSession(["ADMIN"]);
  const parsed = UpdateBrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: "Invalid brand settings." };
  }

  const {
    id,
    studioTitle,
    siteTitle,
    tagline,
    canvasColor,
    surfaceColor,
    borderColor,
    inkColor,
    pineColor,
    primaryColor,
    accentColor,
    backgroundColor,
  } = parsed.data;

  try {
    const brandRecord = await prisma.brandSettings.findFirst({
      where: {
        OR: [{ id }, { scope: id }],
      },
    });

    if (!brandRecord) {
      return { success: false, message: "Brand setting record not found." };
    }

    await prisma.brandSettings.update({
      where: { id: brandRecord.id },
      data: {
        studioTitle: studioTitle || siteTitle || brandRecord.studioTitle,
        tagline: tagline ?? brandRecord.tagline,
        canvasColor: canvasColor || backgroundColor || brandRecord.canvasColor,
        surfaceColor: surfaceColor || brandRecord.surfaceColor,
        borderColor: borderColor || brandRecord.borderColor,
        inkColor: inkColor || primaryColor || brandRecord.inkColor,
        pineColor: pineColor || accentColor || brandRecord.pineColor,
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin/customizer");
    } catch {
      // Safe fallback
    }

    return {
      success: true,
      message: `Brand settings for portal [${brandRecord.scope}] saved successfully.`,
    };
  } catch (err: unknown) {
    console.error("updateBrandSettings error:", err);
    return { success: false, message: "Failed to save brand settings." };
  }
}
