import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { LibraryManager } from "@/components/admin/LibraryManager";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  await requireAdminSession(["ADMIN"]);

  const [rawAssets, rawAlbums] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { indexedAt: "desc" },
      include: {
        albumItems: {
          select: { albumId: true },
        },
      },
      take: 200,
    }),
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        clientName: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
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
    albumIds: a.albumItems.map((ai) => ai.albumId),
  }));

  const albums = rawAlbums.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    type: a.type,
    clientName: a.clientName,
    createdAt: a.createdAt.toISOString(),
    itemCount: a._count.items,
  }));

  return (
    <LibraryManager
      assets={assets}
      artists={[]}
      albums={albums}
    />
  );
}
