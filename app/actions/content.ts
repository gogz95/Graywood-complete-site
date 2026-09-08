"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";

const FeatureSchema = z.object({
  id: z.string().optional(),
  scope: z.enum(["PHOTOGRAPHY", "MEDIA"]),
  icon: z.string().min(1, "Icon identifier is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  order: z.number().int().default(0),
});

/**
 * Server Action: updateSiteContent / saveSiteContent
 * Upserts a batch of section.key copy values for a given scope.
 * Directly revalidates public page cache ('/', 'layout') on mutation.
 */
export async function updateSiteContent(
  scope: string,
  entries: Record<string, string>
) {
  await requireAdminSession(["ADMIN"]);

  if (!scope || typeof scope !== "string") {
    return { success: false, message: "Valid scope is required." };
  }

  try {
    for (const [compositeKey, value] of Object.entries(entries)) {
      const parts = compositeKey.split(".");
      if (parts.length !== 2) continue;
      const [section, key] = parts;

      await prisma.siteContent.upsert({
        where: {
          scope_section_key: {
            scope,
            section,
            key,
          },
        },
        update: { value: value ?? "" },
        create: {
          scope,
          section,
          key,
          value: value ?? "",
        },
      });
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/photography");
      revalidatePath("/hub");
    } catch {
      // Safe fallback outside Next request context
    }

    return {
      success: true,
      message: `Site copy for ${scope} updated successfully.`,
    };
  } catch (error: unknown) {
    console.error("updateSiteContent error:", error);
    return { success: false, message: "Failed to update site copy." };
  }
}

/**
 * Server Action: saveSiteContent
 * Accepts FormData or a structured object to upsert key-value pairs into prisma.siteContent.
 */
export async function saveSiteContent(
  input: FormData | { scope: string; entries: Record<string, string> }
) {
  if (input instanceof FormData) {
    const scope = (input.get("scope") as string) || "PHOTOGRAPHY";
    const entries: Record<string, string> = {};
    for (const [key, value] of input.entries()) {
      if (key !== "scope" && typeof value === "string") {
        entries[key] = value;
      }
    }
    return updateSiteContent(scope, entries);
  }
  return updateSiteContent(input.scope, input.entries);
}

/**
 * Server Action: upsertStudioFeature
 * Creates or updates a dynamic highlight callout card.
 */
export async function upsertStudioFeature(rawInput: z.infer<typeof FeatureSchema>) {
  await requireAdminSession(["ADMIN"]);

  const validation = FeatureSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Invalid feature data.",
    };
  }

  const { id, scope, icon, title, description, order } = validation.data;

  try {
    if (id) {
      await prisma.studioFeature.update({
        where: { id },
        data: { scope, icon, title, description, order },
      });
    } else {
      await prisma.studioFeature.create({
        data: { scope, icon, title, description, order },
      });
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/photography");
      revalidatePath("/hub");
    } catch {
      // Safe fallback
    }

    return {
      success: true,
      message: `Studio highlight "${title}" saved successfully.`,
    };
  } catch (error: unknown) {
    console.error("upsertStudioFeature error:", error);
    return { success: false, message: "Failed to save studio highlight." };
  }
}

/**
 * Server Action: deleteStudioFeature
 * Removes a highlight callout card.
 */
export async function deleteStudioFeature(id: string) {
  await requireAdminSession(["ADMIN"]);

  if (!id) {
    return { success: false, message: "Feature ID is required." };
  }

  try {
    await prisma.studioFeature.delete({
      where: { id },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/photography");
      revalidatePath("/hub");
    } catch {
      // Safe fallback
    }

    return {
      success: true,
      message: "Studio highlight removed successfully.",
    };
  } catch (error: unknown) {
    console.error("deleteStudioFeature error:", error);
    return { success: false, message: "Failed to delete studio highlight." };
  }
}
