import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import { HubPillars } from "@/components/hub/HubPillars";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const [photoCount, proofingCount, photoBrand, mediaBrand, userCount, content] =
    await Promise.all([
      prisma.mediaAsset.count(),
      prisma.album.count({ where: { type: "CLIENT_PROOFING" } }),
      prisma.brandSettings.findUnique({
        where: { scope: "PHOTOGRAPHY" },
        select: { studioTitle: true },
      }),
      prisma.brandSettings.findUnique({
        where: { scope: "MEDIA" },
        select: { studioTitle: true },
      }),
      prisma.user.count(),
      getSiteContent("GLOBAL"),
    ]);

  const photographyDomain =
    process.env.NEXT_PUBLIC_PHOTOGRAPHY_DOMAIN || "graywoodphotography.no";
  const mediaDomain =
    process.env.NEXT_PUBLIC_MEDIA_DOMAIN || "graywoodmedia.no";

  return (
    <main className="w-full min-h-screen bg-nordic-canvas text-nordic-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col space-y-20">
        <HubPillars
          photoCount={photoCount}
          artistCount={userCount}
          proofingCount={proofingCount}
          photoTitle={photoBrand?.studioTitle || "Graywood Photography"}
          mediaTitle={mediaBrand?.studioTitle || "Graywood Media"}
          photographyDomain={photographyDomain}
          mediaDomain={mediaDomain}
          content={content}
        />
      </div>
    </main>
  );
}
