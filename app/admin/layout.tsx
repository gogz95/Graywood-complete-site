import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // Bypass layout guard for the login page
  const session = await getAdminSession();

  // Enforce layout-level guard for unauthenticated users
  if (!session.user) {
    if (pathname && !pathname.startsWith("/admin/login")) {
      redirect("/admin/login");
    }
    return (
      <div className="min-h-screen bg-nordic-canvas text-nordic-ink">
        {children}
      </div>
    );
  }

  // If user is CO_OWNER, verify access
  if (session.user.role === "CO_OWNER") {
    // If attempting to visit a forbidden route, enforce redirect
    if (
      pathname &&
      pathname.startsWith("/admin") &&
      !pathname.startsWith("/admin/gear") &&
      !pathname.startsWith("/admin/login")
    ) {
      redirect("/admin/gear");
    }
  }

  // Fetch unread inquiry count for sidebar badge (admin only)
  const newInquiriesCount =
    session.user?.role === "ADMIN"
      ? await prisma.contactInquiry.count({ where: { status: "NEW" } })
      : 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-nordic-canvas text-nordic-ink">
      <AdminSidebar user={session.user} newInquiriesCount={newInquiriesCount} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col space-y-16">
          {children}
        </div>
      </main>
    </div>
  );
}
