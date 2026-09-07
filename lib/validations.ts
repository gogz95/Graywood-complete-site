import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Contact inquiry
// ---------------------------------------------------------------------------

export const ContactInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.email("Invalid email address"),
  phone: z.string().max(30).optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
  domainSource: z.enum(["PHOTOGRAPHY", "MEDIA", "MAIN"]).default("PHOTOGRAPHY"),
});

export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;

// ---------------------------------------------------------------------------
// Gear checkout
// ---------------------------------------------------------------------------

export const GearCheckoutSchema = z.object({
  gearId: z.string().cuid("Invalid gear ID"),
  userId: z.string().cuid("Invalid user ID"),
  expectedReturn: z.coerce
    .date()
    .refine((d) => d > new Date(), "Expected return must be in the future"),
  checkoutNotes: z.string().max(1000).optional(),
});

export type GearCheckoutInput = z.infer<typeof GearCheckoutSchema>;

export const GearReturnSchema = z.object({
  checkoutId: z.string().cuid("Invalid checkout ID"),
  returnNotes: z.string().max(1000).optional(),
});

export type GearReturnInput = z.infer<typeof GearReturnSchema>;

// ---------------------------------------------------------------------------
// Client proofing PIN
// ---------------------------------------------------------------------------

export const AlbumPinSchema = z.object({
  albumSlug: z.string().min(1),
  pin: z.string().min(4, "PIN must be at least 4 characters").max(12),
});

export type AlbumPinInput = z.infer<typeof AlbumPinSchema>;
