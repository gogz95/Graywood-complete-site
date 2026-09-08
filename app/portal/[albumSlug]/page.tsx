import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProofingSession, isAlbumAuthorized } from "@/lib/session";
import { PinEntryForm } from "@/components/portal/PinEntryForm";
import { ProofingGallery } from "@/components/portal/ProofingGallery";

export const dynamic = "force-dynamic";

export async function generateMetadata(props?: {
  params?: Promise<{ albumSlug: string }>;
}) {
  void props;
  return {
    title: "Client Proofing Portal | Graywood",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProofingAlbumPage({
  params,
}: {
  params: Promise<{ albumSlug: string }>;
}) {
  const { albumSlug } = await params;

  if (!albumSlug) {
    notFound();
  }

  const album = await prisma.album.findFirst({
    where: {
      slug: albumSlug,
      type: "CLIENT_PROOFING",
    },
    include: {
      items: {
        include: {
          asset: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!album) {
    notFound();
  }

  // Check if current client session has unlocked this specific album
  const session = await getProofingSession();
  const authorized = isAlbumAuthorized(session, albumSlug);

  if (!authorized) {
    return <PinEntryForm albumSlug={album.slug} albumTitle={album.title} />;
  }

  const mappedAssets = album.items.map((item) => ({
    id: item.asset.id,
    filePath: item.asset.originalPath,
    fileName: item.asset.filename,
    width: item.asset.width,
    height: item.asset.height,
    cameraModel: item.asset.cameraModel,
    lensModel: item.asset.lensModel,
    focalLength: item.asset.focalLength,
    aperture: item.asset.aperture,
    shutterSpeed: item.asset.shutterSpeed,
    iso: item.asset.iso,
    capturedAt: item.asset.capturedAt
      ? item.asset.capturedAt.toISOString()
      : null,
  }));

  return (
    <main className="w-full min-h-screen bg-nordic-canvas text-nordic-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col space-y-20">
        <ProofingGallery
          album={{
            id: album.id,
            slug: album.slug,
            title: album.title,
            allowDownload: true,
          }}
          assets={mappedAssets}
        />
      </div>
    </main>
  );
}
