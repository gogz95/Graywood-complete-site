import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { CustomizerView } from "@/components/admin/CustomizerView";

export const dynamic = "force-dynamic";

export default async function AdminCustomizerPage() {
  await requireAdminSession(["ADMIN"]);

  const [modules, brands] = await Promise.all([
    prisma.systemModule.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.brandSettings.findMany({
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <CustomizerView
      initialModules={modules}
      initialBrands={brands}
    />
  );
}
