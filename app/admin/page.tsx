import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const session = await getAdminSession();
  if (!session.user) {
    redirect("/admin/login");
  }

  if (session.user.role === "CO_OWNER") {
    redirect("/admin/gear");
  }

  redirect("/admin/dashboard");
}
