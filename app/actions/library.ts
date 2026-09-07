"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";

const AssignArtistSchema = z.object({
  assetId: z.string().min(1, "Asset ID required"),
  artistId: z.string().min(1, "Artist ID required"),
});

const AssignAlbumSchema = z.object({
  assetId: z.string().min(1, "Asset ID required"),
  albumId: z.string().min(1, "Album ID required"),
});

export async function assignAssetToArtist(rawInput: {
  assetId: string;
  artistId: string;
}) {
  await requireAdminSession(["ADMIN"]);
  const parsed = AssignArtistSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: "Invalid parameters." };
  }

  const { assetId, artistId } = parsed.data;

  try {
    await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        photos: {
          connect: { id: assetId },
        },
      },
    });

    return {
      success: true,
      message: "Asset successfully attributed to artist portfolio.",
    };
  } catch (err: unknown) {
    console.error("assignAssetToArtist error:", err);
    return { success: false, message: "Failed to link asset to artist." };
  }
}

export async function assignAssetToAlbum(rawInput: {
  assetId: string;
  albumId: string;
}) {
  await requireAdminSession(["ADMIN"]);
  const parsed = AssignAlbumSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, message: "Invalid parameters." };
  }

  const { assetId, albumId } = parsed.data;

  try {
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
      },
    });

    return {
      success: true,
      message: "Asset successfully assigned to album.",
    };
  } catch (err: unknown) {
    console.error("assignAssetToAlbum error:", err);
    return { success: false, message: "Failed to assign asset to album." };
  }
}
