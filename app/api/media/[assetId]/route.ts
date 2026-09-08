import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { resolveSafeNasPath, resolveSafeCachePath, getCacheBasePath } from "@/lib/storage";

import { getAdminSession } from "@/lib/admin-session";
import { getProofingSession, isAlbumAuthorized } from "@/lib/session";

export const dynamic = "force-dynamic";

const SIZES: Record<string, number> = {
  thumb: 600,
  preview: 1800,
};

/**
 * GET /api/media/[assetId]?size=thumb|preview
 *
 * Transcodes media assets from NAS storage on-demand with Sharp:
 * - Validates access authorization: private proofing assets require an active admin or proofing session.
 * - Checks local SSD cache (cache hit -> streams directly from SSD)
 * - Cache miss -> reads from NAS, auto-rotates, resizes, converts to WebP,
 *   atomically writes to SSD cache, and streams to client.
 * - Adds immutable 1-year cache headers for public assets, or strict private headers for proofing photos.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await context.params;

    if (!assetId || typeof assetId !== "string") {
      return new NextResponse("Asset ID is required", { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const sizeParam = searchParams.get("size")?.toLowerCase();
    const wParam = searchParams.get("w");
    const qParam = searchParams.get("q");

    let targetWidth: number;
    let quality = 85;
    let cacheFilename: string;

    if (wParam) {
      const parsedWidth = parseInt(wParam, 10);
      if (isNaN(parsedWidth) || parsedWidth < 50 || parsedWidth > 4000) {
        return new NextResponse("Invalid width parameter (50-4000px).", { status: 400 });
      }
      targetWidth = parsedWidth;
      if (qParam) {
        const parsedQ = parseInt(qParam, 10);
        if (!isNaN(parsedQ) && parsedQ >= 20 && parsedQ <= 100) {
          quality = parsedQ;
        }
      }
      cacheFilename = `${assetId}-w${targetWidth}-q${quality}.webp`;
    } else {
      const effectiveSize = sizeParam ?? "preview";
      if (!SIZES[effectiveSize]) {
        return new NextResponse("Invalid size parameter. Valid options: 'thumb', 'preview', or custom 'w' and 'q'.", {
          status: 400,
        });
      }
      targetWidth = SIZES[effectiveSize];
      quality = effectiveSize === "thumb" ? 80 : 85;
      cacheFilename = `${assetId}-${effectiveSize}.webp`;
    }

    // Look up media asset in SQLite including associated albums
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      include: {
        albumItems: {
          include: {
            album: {
              select: {
                id: true,
                slug: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      return new NextResponse("Media asset not found in library.", { status: 404 });
    }

    // Check if asset belongs to any private CLIENT_PROOFING albums
    const proofingAlbums = asset.albumItems
      .map((item) => item.album)
      .filter((album) => album.type === "CLIENT_PROOFING");

    const isPrivate = proofingAlbums.length > 0;

    if (isPrivate) {
      // 1. Check if user is authenticated admin/co-owner
      const adminSession = await getAdminSession();
      const isAdmin = !!adminSession?.user;

      // 2. Check if client has unlocked any of the proofing albums this photo belongs to
      let isProofingAuthorized = false;
      if (!isAdmin) {
        const proofingSession = await getProofingSession();
        isProofingAuthorized = proofingAlbums.some((album) =>
          isAlbumAuthorized(proofingSession, album.slug)
        );
      }

      if (!isAdmin && !isProofingAuthorized) {
        return new NextResponse(
          "Access denied. Private client proofing assets require an authorized session.",
          { status: 401 }
        );
      }
    }

    // Resolve safe NAS file path (guarded against traversal)
    let nasFilePath: string;
    try {
      nasFilePath = resolveSafeNasPath(asset.originalPath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Access denied.";
      return new NextResponse(message, { status: 403 });
    }

    if (!fs.existsSync(nasFilePath)) {
      return new NextResponse("Underlying file not found on NAS storage.", { status: 404 });
    }

    // Cache key: <assetId>-<size>.webp or <assetId>-w<width>-q<quality>.webp
    const cacheFilePath = resolveSafeCachePath(cacheFilename);

    const headers = new Headers();
    headers.set("Content-Type", "image/webp");

    if (isPrivate) {
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    // =========================================================================
    // 1. SSD Cache Hit
    // =========================================================================
    if (fs.existsSync(cacheFilePath)) {
      headers.set("X-Cache-Status", "HIT");
      const nodeStream = fs.createReadStream(cacheFilePath);
      const webStream = Readable.toWeb(nodeStream) as ReadableStream;
      return new Response(webStream, { headers });
    }

    // =========================================================================
    // 2. SSD Cache Miss: Transcode via Sharp & write atomically
    // =========================================================================
    headers.set("X-Cache-Status", "MISS");

    const cacheBase = getCacheBasePath();
    await fs.promises.mkdir(cacheBase, { recursive: true });

    const tempFilePath = path.join(
      cacheBase,
      `${cacheFilename}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
    );

    // Transcode: rotate based on EXIF orientation, resize, and convert to WebP
    const webpBuffer = await sharp(nasFilePath)
      .rotate()
      .resize({
        width: targetWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 4,
      })
      .toBuffer();

    // Atomic write to SSD cache: write to temp file then rename
    try {
      if (!fs.existsSync(cacheFilePath)) {
        await fs.promises.writeFile(tempFilePath, webpBuffer);
        try {
          await fs.promises.rename(tempFilePath, cacheFilePath);
        } catch {
          // If concurrent request already wrote it or Windows locked target, cleanup temp
          if (fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath).catch(() => {});
          }
        }
      }
    } catch {
      // Non-fatal cache write failure: client still receives generated buffer
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath).catch(() => {});
        }
      } catch {
        // Non-fatal
      }
    }

    return new Response(new Uint8Array(webpBuffer), { headers });
  } catch (error: unknown) {
    console.error("Transcoder error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
