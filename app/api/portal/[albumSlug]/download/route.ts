import { NextRequest, NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "node:stream";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { getProofingSession, isAlbumAuthorized } from "@/lib/session";
import { resolveSafeNasPath } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    albumSlug: string;
  }>;
}

/**
 * Memory-Safe Streaming ZIP Endpoint
 *
 * GET /api/portal/[albumSlug]/download
 *
 * 1. Validates iron-session cookie. Returns 401 if unauthorized.
 * 2. Queries MediaAsset paths for this client album.
 * 3. Streams zip chunks via archiver piped through Readable.toWeb() directly to client response.
 * 4. Listens to req.signal abort to terminate NAS reads instantly if client cancels download.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { albumSlug } = await params;

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
    return new NextResponse("Album not found", { status: 404 });
  }

  if (!album.allowDownload) {
    return new NextResponse("ZIP download is disabled for this gallery", {
      status: 403,
    });
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

  archive.on("error", (err) => {
    console.error("Archive streaming error:", err);
    archive.abort();
    passthrough.destroy(err);
  });

  // 5. Pipe assets into archiver
  for (const item of album.photos) {
    try {
      const safePath = resolveSafeNasPath(item.asset.filePath);
      if (fs.existsSync(safePath)) {
        archive.file(safePath, { name: item.asset.fileName });
      }
    } catch (err) {
      console.warn(
        `Skipping invalid/unreadable asset ${item.asset.filePath}:`,
        err
      );
    }
  }

  // Finalize archive stream
  archive.finalize().catch((err) => {
    console.error("Error finalizing archive:", err);
  });

  // 6. Bridge Node stream to Web ReadableStream
  const webStream = Readable.toWeb(passthrough);

  return new Response(webStream as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${album.slug}-gallery.zip"`,
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
