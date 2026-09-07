import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
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

  // If no user and not on login page, let page/action handle or redirect
  // Note: in Next.js Server Components, we inspect user session
  if (!session.user) {
    // If the child is not login, we must redirect
    // We can safely allow the login route to render without sidebar
    return (
      <div className="min-h-screen bg-[#09090b] text-foreground">
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#09090b] text-foreground">
      <AdminSidebar user={session.user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
