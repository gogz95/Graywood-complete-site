import { NextRequest, NextResponse } from "next/server";
import { PassThrough, Readable } from "stream";
import fs from "fs";
import { ZipArchive } from "archiver";
import { prisma } from "@/lib/prisma";
import { getProofingSession, isAlbumAuthorized } from "@/lib/session";
import { resolveSafeNasPath } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/[albumSlug]/download
 *
 * Memory-safe streaming ZIP generator for high-resolution client proofing deliverables.
 * Streams bytes on-the-fly directly to the HTTP response without buffering the entire archive in RAM.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ albumSlug: string }> }
) {
  const { albumSlug } = await params;

  if (!albumSlug) {
    return new NextResponse("Album slug required", { status: 400 });
  }

  // 1. Validate iron-session
  const session = await getProofingSession(req.cookies);
  if (!isAlbumAuthorized(session, albumSlug)) {
    return new NextResponse("Unauthorized: PIN authentication required", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. Fetch Album & attached assets
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
    return new NextResponse("Album not found", { status: 404 });
  }

  // 3. Create archiver and PassThrough stream
  const archive = new ZipArchive({
    zlib: { level: 5 },
  });

  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // 4. Crucial Abort Hook: Stop NAS reading immediately if client cancels
  req.signal.addEventListener("abort", () => {
    archive.abort();
    passthrough.destroy();
  });

  archive.on("error", (err: Error) => {
    console.error("Archive streaming error:", err);
    archive.abort();
    passthrough.destroy(err);
  });

  // 5. Pipe assets into archiver
  for (const item of album.items) {
    try {
      const safePath = resolveSafeNasPath(item.asset.originalPath);
      if (fs.existsSync(safePath)) {
        archive.file(safePath, { name: item.asset.filename });
      }
    } catch (err) {
      console.warn(
        `Skipping invalid/unreadable asset ${item.asset.originalPath}:`,
        err
      );
    }
  }

  // Finalize archive in background (does not block stream setup)
  archive.finalize().catch((err: unknown) => {
    console.error("Archive finalization error:", err);
  });

  // 6. Return streaming response with optimal caching and headers
  const webStream = Readable.toWeb(passthrough) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${album.slug}-gallery.zip"`,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
