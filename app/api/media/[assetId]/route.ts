import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { resolveSafeNasPath, resolveSafeCachePath, getCacheBasePath } from "@/lib/storage";

export const dynamic = "force-dynamic";

const SIZES: Record<string, number> = {
  thumb: 600,
  preview: 1800,
};

/**
 * GET /api/media/[assetId]?size=thumb|preview
 *
 * Transcodes media assets from NAS storage on-demand with Sharp:
 * - Checks local SSD cache first (cache hit -> streams directly from SSD)
 * - Cache miss -> reads from NAS, auto-rotates, resizes, converts to WebP,
 *   atomically writes to SSD cache, and streams to client.
 * - Adds immutable 1-year cache headers.
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
    const sizeParam = searchParams.get("size")?.toLowerCase() ?? "preview";

    if (!SIZES[sizeParam]) {
      return new NextResponse("Invalid size parameter. Valid options: 'thumb', 'preview'.", {
        status: 400,
      });
    }

    const targetWidth = SIZES[sizeParam];

    // Look up media asset in SQLite
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return new NextResponse("Media asset not found in library.", { status: 404 });
    }

    // Resolve safe NAS file path (guarded against traversal)
    let nasFilePath: string;
    try {
      nasFilePath = resolveSafeNasPath(asset.filePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Access denied.";
      return new NextResponse(message, { status: 403 });
    }

    if (!fs.existsSync(nasFilePath)) {
      return new NextResponse("Underlying file not found on NAS storage.", { status: 404 });
    }

    // Cache key: <assetId>-<size>.webp
    const cacheFilename = `${assetId}-${sizeParam}.webp`;
    const cacheFilePath = resolveSafeCachePath(cacheFilename);

    const headers = new Headers();
    headers.set("Content-Type", "image/webp");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

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
        quality: sizeParam === "thumb" ? 80 : 85,
        effort: 4,
      })
      .toBuffer();

    // Atomic write to SSD cache: write to temp file then rename
    try {
      await fs.promises.writeFile(tempFilePath, webpBuffer);
      await fs.promises.rename(tempFilePath, cacheFilePath);
    } catch {
      // If concurrent request already wrote it or temp cleanup is needed
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
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
