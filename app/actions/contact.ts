"use server";

import { prisma } from "@/lib/prisma";
import { ContactInquirySchema, type ContactInquiryInput } from "@/lib/validations";

export interface ContactActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function submitContactInquiry(
  rawInput: ContactInquiryInput
): Promise<ContactActionResult> {
  try {
    const parseResult = ContactInquirySchema.safeParse(rawInput);

    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      return {
        success: false,
        message: "Please correct the highlighted errors.",
        fieldErrors: flattened.fieldErrors,
      };
    }

    const data = parseResult.data;

    await prisma.contactInquiry.create({
      data: {
        domainSource: data.domainSource,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        status: "NEW",
      },
    });

    return {
      success: true,
      message: "Thank you. Your inquiry has been received. We will respond within 24 hours.",
    };
  } catch (error: unknown) {
    console.error("Failed to submit contact inquiry:", error);
    return {
      success: false,
      message: "An unexpected error occurred while submitting. Please try again later.",
    };
  }
}
