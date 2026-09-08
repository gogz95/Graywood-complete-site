"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { revalidatePath } from "next/cache";

export async function updateInquiryStatus(
  inquiryId: string,
  status: "NEW" | "REVIEWED" | "ARCHIVED"
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminSession(["ADMIN"]);

    await prisma.contactInquiry.update({
      where: { id: inquiryId },
      data: { status },
    });

    revalidatePath("/admin/inquiries");
    revalidatePath("/admin/dashboard");

    return { success: true, message: `Inquiry marked as ${status}.` };
  } catch (error: unknown) {
    console.error("Failed to update inquiry status:", error);
    return { success: false, message: "Failed to update inquiry status." };
  }
}

export async function deleteInquiry(
  inquiryId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdminSession(["ADMIN"]);

    await prisma.contactInquiry.delete({
      where: { id: inquiryId },
    });

    revalidatePath("/admin/inquiries");
    revalidatePath("/admin/dashboard");

    return { success: true, message: "Inquiry deleted." };
  } catch (error: unknown) {
    console.error("Failed to delete inquiry:", error);
    return { success: false, message: "Failed to delete inquiry." };
  }
}
