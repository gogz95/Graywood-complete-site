import { prisma } from "@/lib/prisma";
import { HubPillars } from "@/components/hub/HubPillars";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const [photoCount, artistCount, proofingCount, photoBrand, mediaBrand] =
    await Promise.all([
      prisma.mediaAsset.count(),
      prisma.artistProfile.count(),
      prisma.album.count({ where: { type: "CLIENT_PROOFING" } }),
      prisma.brandSettings.findUnique({
        where: { id: "PHOTOGRAPHY" },
        select: { siteTitle: true },
      }),
      prisma.brandSettings.findUnique({
        where: { id: "MEDIA" },
        select: { siteTitle: true },
      }),
    ]);

  const photographyDomain =
    process.env.NEXT_PUBLIC_PHOTOGRAPHY_DOMAIN || "graywoodphotography.no";
  const mediaDomain =
    process.env.NEXT_PUBLIC_MEDIA_DOMAIN || "graywoodmedia.no";

  return (
    <div className="flex flex-col min-h-screen bg-nordic-canvas text-nordic-ink">
      <HubPillars
        photoCount={photoCount}
        artistCount={artistCount}
        proofingCount={proofingCount}
        photoTitle={photoBrand?.siteTitle || "Graywood Photography"}
        mediaTitle={mediaBrand?.siteTitle || "Graywood Media"}
        photographyDomain={photographyDomain}
        mediaDomain={mediaDomain}
      />
    </div>
  );
}
