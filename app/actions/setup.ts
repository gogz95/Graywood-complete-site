"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkSetupStatus } from "@/lib/setup";
import { getAdminSession } from "@/lib/admin-session";

const BootstrapSchema = z.object({
  // Admin Account
  name: z.string().min(2, "Administrator name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),

  // Brand Identity
  siteTitle: z.string().min(1, "Site title is required"),
  tagline: z.string().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-digit hex color (#RRGGBB)")
    .default("#F9F8F6"),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-digit hex color (#RRGGBB)")
    .default("#2D3B36"),

  // Module Toggles
  enableClientPortal: z.boolean().default(true),
  enableGearDesk: z.boolean().default(true),
  enableMangaReader: z.boolean().default(true),
  enableGameServers: z.boolean().default(true),
});

export type BootstrapInput = z.infer<typeof BootstrapSchema>;

export interface BootstrapResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action: bootstrapSystem
 *
 * Atomically configures the platform upon initial installation:
 * - Guards against unauthorized resets if already setup.
 * - Creates primary Administrator user.
 * - Seeds BrandSettings for GLOBAL, PHOTOGRAPHY, and MEDIA domains.
 * - Seeds SystemModule operational flags.
 * - Issues an authenticated admin session cookie so the administrator lands logged in.
 */
export async function bootstrapSystem(
  rawInput: BootstrapInput
): Promise<BootstrapResult> {
  // 1. Lockout verification: prevent malicious re-initialization
  const isSetupComplete = await checkSetupStatus();
  if (isSetupComplete) {
    return {
      success: false,
      message:
        "Security lockout: The platform has already been initialized. Setup is locked.",
    };
  }

  // 2. Validate input
  const validation = BootstrapSchema.safeParse(rawInput);
  if (!validation.success) {
    const flattened = validation.error.flatten();
    return {
      success: false,
      message: "Please correct the highlighted errors.",
      fieldErrors: flattened.fieldErrors,
    };
  }

  const {
    name,
    email,
    password,
    siteTitle,
    backgroundColor,
    accentColor,
    enableClientPortal,
    enableGearDesk,
    enableMangaReader,
    enableGameServers,
  } = validation.data;

  try {
    // 3. Hash admin password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Atomic Bootstrap Transaction
    const [adminUser] = await prisma.$transaction([
      // Create initial Admin User
      prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "ADMIN",
        },
      }),

      // Seed/Upsert System Modules
      prisma.systemModule.upsert({
        where: { key: "CLIENT_PORTAL" },
        update: { enabled: enableClientPortal },
        create: {
          key: "CLIENT_PORTAL",
          label: "Client Proofing Portal",
          description: "Private PIN-protected client proofing vaults and high-resolution delivery.",
          enabled: enableClientPortal,
        },
      }),
      prisma.systemModule.upsert({
        where: { key: "GEAR_DESK" },
        update: { enabled: enableGearDesk },
        create: {
          key: "GEAR_DESK",
          label: "Co-Owner Gear Desk",
          description: "Hardware inventory, custodian custody tracking, and return logs.",
          enabled: enableGearDesk,
        },
      }),
      prisma.systemModule.upsert({
        where: { key: "MANGA_READER" },
        update: { enabled: enableMangaReader },
        create: {
          key: "MANGA_READER",
          label: "Manga Reader Integration",
          description: "Direct gateway to native Graywood-Reader sister subservice.",
          enabled: enableMangaReader,
        },
      }),
      prisma.systemModule.upsert({
        where: { key: "GAME_SERVERS" },
        update: { enabled: enableGameServers },
        create: {
          key: "GAME_SERVERS",
          label: "Game Server Monitors",
          description: "Live UDP telemetry and player counts for Gamehosting-by-Graywood-2 clusters.",
          enabled: enableGameServers,
        },
      }),

      // Seed/Upsert Brand Settings with Scandinavian tokens
      prisma.brandSettings.upsert({
        where: { scope: "GLOBAL" },
        update: {
          studioTitle: siteTitle,
          canvasColor: backgroundColor,
          pineColor: accentColor,
        },
        create: {
          scope: "GLOBAL",
          studioTitle: siteTitle,
          tagline: "Visual Craft & Shared Infrastructure",
          canvasColor: backgroundColor,
          surfaceColor: "#FFFFFF",
          borderColor: "#E8E5DF",
          inkColor: "#1C1B19",
          pineColor: accentColor,
        },
      }),
      prisma.brandSettings.upsert({
        where: { scope: "PHOTOGRAPHY" },
        update: {
          studioTitle: `${siteTitle} Photography`,
          canvasColor: backgroundColor,
          pineColor: accentColor,
        },
        create: {
          scope: "PHOTOGRAPHY",
          studioTitle: `${siteTitle} Photography`,
          tagline: "Nordic Landscape & Commercial Photography",
          canvasColor: backgroundColor,
          surfaceColor: "#FFFFFF",
          borderColor: "#E8E5DF",
          inkColor: "#1C1B19",
          pineColor: accentColor,
        },
      }),
      prisma.brandSettings.upsert({
        where: { scope: "MEDIA" },
        update: {
          studioTitle: `${siteTitle} Media`,
          canvasColor: backgroundColor,
          pineColor: accentColor,
        },
        create: {
          scope: "MEDIA",
          studioTitle: `${siteTitle} Media`,
          tagline: "High-Resolution Production & Digital Media",
          canvasColor: backgroundColor,
          surfaceColor: "#FFFFFF",
          borderColor: "#E8E5DF",
          inkColor: "#1C1B19",
          pineColor: accentColor,
        },
      }),
    ]);

    // Ensure baseline copy and highlights exist
    const existingContentCount = await prisma.siteContent.count();
    if (existingContentCount === 0) {
      await prisma.siteContent.createMany({
        data: [
          {
            scope: "PHOTOGRAPHY",
            section: "HERO",
            key: "badge",
            value: `${siteTitle.toUpperCase()} PHOTOGRAPHY STUDIO`,
          },
          {
            scope: "PHOTOGRAPHY",
            section: "HERO",
            key: "title",
            value: "Visual narratives across the Nordic landscape.",
          },
          {
            scope: "PHOTOGRAPHY",
            section: "HERO",
            key: "description",
            value:
              "Specialized in commercial campaigns, architectural documentation, and editorial storytelling. Captured with medium-format precision and authentic atmospheric light.",
          },
          {
            scope: "PHOTOGRAPHY",
            section: "ARCHIVE",
            key: "title",
            value: "Visual Archive",
          },
          {
            scope: "PHOTOGRAPHY",
            section: "ARCHIVE",
            key: "description",
            value: "Curated master files and commissions.",
          },
          {
            scope: "PHOTOGRAPHY",
            section: "COMMISSION",
            key: "title",
            value: "Initiate a Commission",
          },
          {
            scope: "PHOTOGRAPHY",
            section: "COMMISSION",
            key: "description",
            value:
              "Available for editorial campaigns, architectural documentation, and select commercial projects throughout the Nordic region.",
          },
        ],
      });
    }

    const existingFeaturesCount = await prisma.studioFeature.count();
    if (existingFeaturesCount === 0) {
      await prisma.studioFeature.createMany({
        data: [
          {
            scope: "PHOTOGRAPHY",
            icon: "Camera",
            title: "Medium Format Rig",
            description: "Ultra high-fidelity sensor captures up to 100 megapixels.",
            order: 1,
          },
          {
            scope: "PHOTOGRAPHY",
            icon: "Compass",
            title: "Extreme Locations",
            description: "Fjord, sub-zero Arctic, and architectural remote access.",
            order: 2,
          },
          {
            scope: "PHOTOGRAPHY",
            icon: "Award",
            title: "Color Grading Mastery",
            description: "Bespoke LUTs tailored for editorial print and high-res web.",
            order: 3,
          },
        ],
      });
    }

    // 5. Automatically issue admin iron-session cookie
    const session = await getAdminSession();
    session.user = {
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: "ADMIN",
    };
    await session.save();

    return {
      success: true,
      message: "Platform successfully bootstrapped! Welcome aboard.",
      redirectUrl: "/admin/dashboard",
    };
  } catch (error: unknown) {
    console.error("bootstrapSystem error:", error);
    return {
      success: false,
      message: "An unexpected error occurred during platform initialization.",
    };
  }
}
