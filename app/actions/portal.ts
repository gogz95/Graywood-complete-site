"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getProofingSession } from "@/lib/session";

const VerifyPinSchema = z.object({
  albumSlug: z.string().min(1, "Album slug is required"),
  pin: z.string().min(1, "Access PIN is required"),
});

export type VerifyPinInput = z.infer<typeof VerifyPinSchema>;

export interface PortalActionResult {
  success: boolean;
  message: string;
}

/**
 * Server Action: verifyAlbumPin
 *
 * Runs strictly in Node.js (Edge-safe bcrypt execution).
 * Verifies bcrypt pinHash for CLIENT_PROOFING albums and issues encrypted iron-session cookie.
 */
export async function verifyAlbumPin(
  rawInput: VerifyPinInput
): Promise<PortalActionResult> {
  const parsed = VerifyPinSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input parameters.",
    };
  }

  const { albumSlug, pin } = parsed.data;

  try {
    const album = await prisma.album.findFirst({
      where: {
        slug: albumSlug,
        type: "CLIENT_PROOFING",
      },
    });

    if (!album || !album.pinHash) {
      return {
        success: false,
        message: "Client proofing album not found or is currently unavailable.",
      };
    }

    const isValid = await bcrypt.compare(pin.trim(), album.pinHash);
    if (!isValid) {
      return {
        success: false,
        message: "Incorrect security PIN. Access denied.",
      };
    }

    // Save authorized album slug into iron-session
    const session = await getProofingSession();
    const authorized = new Set(session.authorizedAlbums ?? []);
    authorized.add(albumSlug);
    session.authorizedAlbums = Array.from(authorized);
    await session.save();

    return {
      success: true,
      message: "Access granted. Loading private gallery...",
    };
  } catch (error: unknown) {
    console.error("verifyAlbumPin error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while verifying credentials.",
    };
  }
}

/**
 * Server Action: lockAlbumSession
 *
 * Revokes client access to the proofing gallery by removing the slug from the session.
 */
export async function lockAlbumSession(
  albumSlug: string
): Promise<PortalActionResult> {
  try {
    const session = await getProofingSession();
    if (session.authorizedAlbums) {
      session.authorizedAlbums = session.authorizedAlbums.filter(
        (slug) => slug !== albumSlug
      );
      await session.save();
    }
    return {
      success: true,
      message: "Gallery session locked.",
    };
  } catch (error: unknown) {
    console.error("lockAlbumSession error:", error);
    return {
      success: false,
      message: "Failed to lock session.",
    };
  }
}
