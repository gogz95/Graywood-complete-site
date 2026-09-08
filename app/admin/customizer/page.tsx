import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { CustomizerView } from "@/components/admin/CustomizerView";

export const dynamic = "force-dynamic";

export default async function AdminCustomizerPage() {
  await requireAdminSession(["ADMIN"]);

  const [modules, brands, contentEntries, features] = await Promise.all([
    prisma.systemModule.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.brandSettings.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.siteContent.findMany({
      orderBy: [{ scope: "asc" }, { section: "asc" }, { key: "asc" }],
    }),
    prisma.studioFeature.findMany({
      orderBy: [{ scope: "asc" }, { order: "asc" }],
    }),
  ]);

  return (
    <CustomizerView
      initialModules={modules}
      initialBrands={brands}
      initialContent={contentEntries}
      initialFeatures={features}
    />
  );
}
