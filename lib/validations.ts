import { z } from "zod";

// ---------------------------------------------------------------------------
// Contact Inquiry Validation Schema
// ---------------------------------------------------------------------------

export const ContactInquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional(),
  discipline: z.string().optional(),
  budgetTier: z.string().optional(),
  details: z.string().optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
  domainSource: z.enum(["PHOTOGRAPHY", "MEDIA", "MAIN"]).default("PHOTOGRAPHY"),
});

export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;
