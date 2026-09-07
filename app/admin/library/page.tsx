import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { LibraryManager } from "@/components/admin/LibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  await requireAdminSession(["ADMIN"]);

  const [rawAssets, rawArtists, rawAlbums] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.artistProfile.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.album.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
      },
    }),
  ]);

  const assets = rawAssets.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    filePath: a.filePath,
    fileSize: a.fileSize,
    width: a.width,
    height: a.height,
    cameraModel: a.cameraModel,
    lensModel: a.lensModel,
    focalLength: a.focalLength,
    aperture: a.aperture,
    iso: a.iso,
  }));

  return (
    <LibraryManager
      assets={assets}
      artists={rawArtists}
      albums={rawAlbums}
    />
  );
}
