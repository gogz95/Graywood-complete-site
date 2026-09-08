import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { Inbox } from "lucide-react";
import {
  InquiriesInbox,
  type SerializedInquiry,
} from "@/components/admin/InquiriesInbox";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  await requireAdminSession(["ADMIN"]);

  const raw = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const inquiries: SerializedInquiry[] = raw.map((inq) => ({
    id: inq.id,
    name: inq.name,
    email: inq.email,
    phone: inq.phone,
    discipline: inq.discipline,
    budgetTier: inq.budgetTier,
    details: inq.details,
    message: inq.message,
    domainSource: inq.domainSource,
    status: inq.status,
    createdAt: inq.createdAt.toISOString(),
  }));

  const newCount = inquiries.filter((i) => i.status === "NEW").length;

  return (
    <div className="w-full flex flex-col space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-nordic-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
            <Inbox className="h-3.5 w-3.5" />
            <span>Commission &amp; Booking Ledger</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
            Client Inquiries Inbox
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-xl">
            All incoming commission requests, project briefs, and client communications
            captured from the public-facing contact forms.
          </p>
        </div>

        {newCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C5DFD0] bg-[#EAF3EE] px-3.5 py-1.5 text-xs font-mono text-[#2D5A3D]">
              <span className="h-2 w-2 rounded-full bg-[#2D5A3D] animate-ping" />
              <span>{newCount} UNREAD</span>
            </span>
          </div>
        )}
      </div>

      <InquiriesInbox inquiries={inquiries} />
    </div>
  );
}
