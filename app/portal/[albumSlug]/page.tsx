import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProofingSession, isAlbumAuthorized } from "@/lib/session";
import { PinEntryForm } from "@/components/portal/PinEntryForm";
import { ProofingGallery } from "@/components/portal/ProofingGallery";

export const dynamic = "force-dynamic";

interface PortalPageProps {
  params: Promise<{
    albumSlug: string;
  }>;
}

/**
 * Zero-Discovery Crawler Lockout:
 * Strict robots meta preventing any search engine discovery or caching.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Client Proofing Vault | Graywood",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function ClientProofingPage({ params }: PortalPageProps) {
  const { albumSlug } = await params;

  // Query private client proofing album
  const album = await prisma.album.findFirst({
    where: {
      slug: albumSlug,
      type: "CLIENT_PROOFING",
    },
    include: {
      photos: {
        include: {
          asset: true,
        },
        orderBy: {
          sortOrder: "asc",
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

  const mappedAssets = album.photos.map((item: {
    asset: {
      id: string;
      filePath: string;
      fileName: string;
      width: number | null;
      height: number | null;
      cameraModel: string | null;
      lensModel: string | null;
      focalLength: string | null;
      aperture: string | null;
      shutterSpeed: string | null;
      iso: number | null;
      capturedAt: Date | null;
    };
  }) => ({
    id: item.asset.id,
    filePath: item.asset.filePath,
    fileName: item.asset.fileName,
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
    <ProofingGallery
      album={{
        id: album.id,
        slug: album.slug,
        title: album.title,
        allowDownload: album.allowDownload,
      }}
      assets={mappedAssets}
    />
  );
}
