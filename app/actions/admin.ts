"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

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

/**
 * Server Action: adminLogin
 *
 * Verifies credentials against the User model and issues an encrypted admin session.
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

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid credentials or unauthorized account.",
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return {
        success: false,
        message: "Invalid credentials or unauthorized account.",
      };
    }

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
