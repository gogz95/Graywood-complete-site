import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { CustomizerView } from "@/components/admin/CustomizerView";

export const dynamic = "force-dynamic";

export default async function AdminCustomizerPage() {
  await requireAdminSession(["ADMIN"]);

  const [rawModules, rawBrands, contentEntries, features] = await Promise.all([
    prisma.systemModule.findMany({
      orderBy: { key: "asc" },
    }),
    prisma.brandSettings.findMany({
      orderBy: { scope: "asc" },
    }),
    prisma.siteContent.findMany({
      orderBy: [{ scope: "asc" }, { section: "asc" }, { key: "asc" }],
    }),
    prisma.studioFeature.findMany({
      orderBy: [{ scope: "asc" }, { order: "asc" }],
    }),
  ]);

  const modules = rawModules.map((m) => ({
    id: m.id,
    key: m.key,
    name: m.label,
    description: m.description,
    enabled: m.enabled,
  }));

  const brands = rawBrands.map((b) => ({
    id: b.id,
    scope: b.scope,
    siteTitle: b.studioTitle,
    studioTitle: b.studioTitle,
    tagline: b.tagline,
    primaryColor: b.inkColor,
    accentColor: b.pineColor,
    backgroundColor: b.canvasColor,
    canvasColor: b.canvasColor,
    surfaceColor: b.surfaceColor,
    borderColor: b.borderColor,
    inkColor: b.inkColor,
    pineColor: b.pineColor,
  }));

  return (
    <CustomizerView
      initialModules={modules}
      initialBrands={brands}
      initialContent={contentEntries}
      initialFeatures={features}
    />
  );
}
