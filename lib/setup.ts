import { prisma } from "./prisma";

/**
 * Checks whether initial first-time ecosystem setup is complete:
 * 1. An Administrator account (role = "ADMIN") exists in User.
 * 2. A GLOBAL BrandSettings record exists.
 *
 * Gracefully handles fresh unmigrated databases or connection delays by returning false.
 */
export async function checkSetupStatus(): Promise<boolean> {
  try {
    const [adminUser, globalBrand] = await Promise.all([
      prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      }),
      prisma.brandSettings.findUnique({
        where: { id: "GLOBAL" },
        select: { id: true },
      }),
    ]);

    return Boolean(adminUser && globalBrand);
  } catch (error: unknown) {
    console.warn("checkSetupStatus check failed (assuming fresh uninitialized DB):", error);
    return false;
  }
}
