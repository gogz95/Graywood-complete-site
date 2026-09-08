"use server";

import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getProofingSession } from "@/lib/session";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";

const VerifyPinSchema = z.object({
  albumSlug: z.string().min(1, "Album slug is required"),
  pin: z
    .string()
    .min(4, "Access PIN must be at least 4 characters")
    .max(32, "Access PIN cannot exceed 32 characters"),
});

export type VerifyPinInput = z.infer<typeof VerifyPinSchema>;

export interface PortalActionResult {
  success: boolean;
  message: string;
}

const PIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PIN_ATTEMPTS = 5;

/**
 * Server Action: verifyAlbumPin
 *
 * Runs strictly in Node.js (Edge-safe bcrypt execution).
 * Verifies bcrypt pinHash for CLIENT_PROOFING albums and issues encrypted iron-session cookie.
 * Enforces per-IP and per-album rate limiting against brute force attempts.
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

  // Extract client IP for brute-force tracking (safe against test env outside request scope)
  let ip = "direct";
  try {
    const headerList = await headers();
    ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "direct";
  } catch {
    ip = "test-env";
  }

  const rateLimitKey = `pin:${ip}:${albumSlug}`;
  const limitCheck = checkRateLimit(rateLimitKey, MAX_PIN_ATTEMPTS, PIN_WINDOW_MS);
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: `Too many failed PIN attempts. Locked out for ${limitCheck.retryAfterSeconds} seconds.`,
    };
  }

  try {
    const album = await prisma.album.findFirst({
      where: {
        slug: albumSlug,
        type: "CLIENT_PROOFING",
      },
    });

    if (!album || !album.pinHash) {
      recordFailedAttempt(rateLimitKey, PIN_WINDOW_MS);
      return {
        success: false,
        message: "Client proofing album not found or is currently unavailable.",
      };
    }

    const isValid = await bcrypt.compare(pin.trim(), album.pinHash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey, PIN_WINDOW_MS);
      return {
        success: false,
        message: "Incorrect security PIN. Access denied.",
      };
    }

    // Success — clear failure counter
    resetRateLimit(rateLimitKey);

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
