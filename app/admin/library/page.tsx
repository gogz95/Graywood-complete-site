import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { LibraryManager } from "@/components/admin/LibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  await requireAdminSession(["ADMIN"]);

  const [rawAssets, rawAlbums] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { indexedAt: "desc" },
      take: 100,
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
    fileName: a.filename,
    filePath: a.originalPath,
    fileSize: Number(a.sizeBytes),
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
      artists={[]}
      albums={rawAlbums}
    />
  );
}
