"use server";

import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";

const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export interface AdminActionResult {
  success: boolean;
  message: string;
  role?: "ADMIN" | "CO_OWNER";
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Server Action: adminLogin
 *
 * Verifies credentials against the User model and issues an encrypted admin session.
 * Enforces per-IP and per-account rate limiting against credential stuffing.
 */
export async function adminLogin(
  rawInput: AdminLoginInput
): Promise<AdminActionResult> {
  const validation = AdminLoginSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid input parameters.",
    };
  }

  const { email, password } = validation.data;
  const normalizedEmail = email.toLowerCase().trim();

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

  const rateLimitKey = `login:${ip}:${normalizedEmail}`;
  const limitCheck = checkRateLimit(rateLimitKey, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: `Too many failed login attempts. Locked out for ${limitCheck.retryAfterSeconds} seconds.`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      recordFailedAttempt(rateLimitKey, LOGIN_WINDOW_MS);
      return {
        success: false,
        message: "Invalid credentials or unauthorized account.",
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(rateLimitKey, LOGIN_WINDOW_MS);
      return {
        success: false,
        message: "Invalid credentials or unauthorized account.",
      };
    }

    // Success — clear rate limit
    resetRateLimit(rateLimitKey);

    const session = await getAdminSession();
    session.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "CO_OWNER",
    };
    await session.save();

    return {
      success: true,
      message: `Authenticated as ${user.name}`,
      role: user.role as "ADMIN" | "CO_OWNER",
    };
  } catch (error: unknown) {
    console.error("adminLogin error:", error);
    return {
      success: false,
      message: "An unexpected error occurred during authentication.",
    };
  }
}

/**
 * Server Action: adminLogout
 *
 * Destroys the administrative session.
 */
export async function adminLogout(): Promise<{ success: boolean }> {
  try {
    const session = await getAdminSession();
    session.destroy();
    return { success: true };
  } catch (error: unknown) {
    console.error("adminLogout error:", error);
    return { success: false };
  }
}
