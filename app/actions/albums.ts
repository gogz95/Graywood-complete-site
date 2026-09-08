"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";

const CreateAlbumSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Album title must be at least 2 characters")
    .max(100, "Album title cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .optional(),
  type: z.enum(["PORTFOLIO", "CLIENT_PROOFING"]),
  clientName: z
    .string()
    .trim()
    .max(100)
    .optional(),
  pin: z
    .string()
    .trim()
    .optional(),
});

export type CreateAlbumInput = z.infer<typeof CreateAlbumSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

async function resolveUniqueSlug(desiredSlug: string): Promise<string> {
  let baseSlug = desiredSlug || "album";
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.album.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

/**
 * Server Action: createAlbum
 * Allows administrators to provision public portfolio albums or private,
 * zero-discovery client proofing vaults with bcrypt PIN protection.
 */
export async function createAlbum(rawInput: CreateAlbumInput) {
  await requireAdminSession(["ADMIN"]);

  const parsed = CreateAlbumSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid album parameters.",
    };
  }

  const { title, slug: customSlug, type, clientName, pin } = parsed.data;

  if (type === "CLIENT_PROOFING") {
    if (!pin || pin.length < 4) {
      return {
        success: false,
        message: "Client proofing vaults require an access PIN of at least 4 digits/characters.",
      };
    }
  }

  try {
    const cleanBaseSlug = customSlug && customSlug.length > 0 ? slugify(customSlug) : slugify(title);
    const uniqueSlug = await resolveUniqueSlug(cleanBaseSlug);

    let pinHash: string | null = null;
    if (type === "CLIENT_PROOFING" && pin) {
      pinHash = await bcrypt.hash(pin, 10);
    }

    const album = await prisma.album.create({
      data: {
        title,
        slug: uniqueSlug,
        type,
        clientName: clientName || null,
        pinHash,
      },
    });

    try {
      revalidatePath("/admin/library");
      revalidatePath("/photography");
      revalidatePath("/media");
    } catch {
      // Ignored outside Next render cycle
    }

    return {
      success: true,
      message:
        type === "CLIENT_PROOFING"
          ? `Private client vault '${album.title}' created successfully.`
          : `Public portfolio '${album.title}' created successfully.`,
      album: {
        id: album.id,
        title: album.title,
        slug: album.slug,
        type: album.type,
        clientName: album.clientName,
      },
    };
  } catch (error: unknown) {
    console.error("createAlbum error:", error);
    return { success: false, message: "Failed to create album. Database error." };
  }
}

/**
 * Server Action: deleteAlbum
 * Deletes an album while strictly preserving all underlying MediaAsset records.
 */
export async function deleteAlbum(albumId: string) {
  await requireAdminSession(["ADMIN"]);

  if (!albumId) {
    return { success: false, message: "Album ID is required." };
  }

  try {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, title: true },
    });

    if (!album) {
      return { success: false, message: "Album not found." };
    }

    await prisma.album.delete({
      where: { id: albumId },
    });

    try {
      revalidatePath("/admin/library");
      revalidatePath("/photography");
      revalidatePath("/media");
    } catch {
      // Ignored outside Next render cycle
    }

    return {
      success: true,
      message: `Album '${album.title}' deleted successfully. All media files were preserved.`,
    };
  } catch (error: unknown) {
    console.error("deleteAlbum error:", error);
    return { success: false, message: "Failed to delete album." };
  }
}

/**
 * Server Action: assignAssetsToAlbum
 * Batch-assigns multiple media assets to a designated album.
 */
export async function assignAssetsToAlbum(input: {
  albumId: string;
  assetIds: string[];
}) {
  await requireAdminSession(["ADMIN"]);

  const { albumId, assetIds } = input;
  if (!albumId || !Array.isArray(assetIds) || assetIds.length === 0) {
    return { success: false, message: "Album ID and at least one asset ID are required." };
  }

  try {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      select: { id: true, title: true },
    });

    if (!album) {
      return { success: false, message: "Target album not found." };
    }

    // Upsert items into album
    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i];
      await prisma.albumItem.upsert({
        where: {
          albumId_assetId: {
            albumId,
            assetId,
          },
        },
        update: {},
        create: {
          albumId,
          assetId,
          order: i,
        },
      });
    }

    try {
      revalidatePath("/admin/library");
      revalidatePath("/photography");
      revalidatePath("/media");
    } catch {
      // Ignored outside Next render cycle
    }

    return {
      success: true,
      message: `Successfully added ${assetIds.length} asset${assetIds.length === 1 ? "" : "s"} to '${album.title}'.`,
    };
  } catch (error: unknown) {
    console.error("assignAssetsToAlbum error:", error);
    return { success: false, message: "Failed to assign assets to album." };
  }
}

/**
 * Server Action: removeAssetFromAlbum
 * Unlinks a single media asset from an album.
 */
export async function removeAssetFromAlbum(input: {
  albumId: string;
  assetId: string;
}) {
  await requireAdminSession(["ADMIN"]);

  const { albumId, assetId } = input;
  if (!albumId || !assetId) {
    return { success: false, message: "Both album ID and asset ID are required." };
  }

  try {
    await prisma.albumItem.deleteMany({
      where: {
        albumId,
        assetId,
      },
    });

    try {
      revalidatePath("/admin/library");
      revalidatePath("/photography");
    } catch {
      // Ignored outside Next render cycle
    }

    return {
      success: true,
      message: "Asset removed from album.",
    };
  } catch (error: unknown) {
    console.error("removeAssetFromAlbum error:", error);
    return { success: false, message: "Failed to remove asset from album." };
  }
}

/**
 * Server Action: updateAlbumPin
 * Updates the access PIN for an existing client proofing vault.
 */
export async function updateAlbumPin(input: {
  albumId: string;
  newPin: string;
}) {
  await requireAdminSession(["ADMIN"]);

  const { albumId, newPin } = input;
  if (!albumId || !newPin || newPin.length < 4) {
    return { success: false, message: "New PIN must be at least 4 characters." };
  }

  try {
    const pinHash = await bcrypt.hash(newPin, 10);
    await prisma.album.update({
      where: { id: albumId },
      data: { pinHash },
    });

    return {
      success: true,
      message: "Client vault PIN updated successfully.",
    };
  } catch (error: unknown) {
    console.error("updateAlbumPin error:", error);
    return { success: false, message: "Failed to update vault PIN." };
  }
}
