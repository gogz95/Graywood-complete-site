import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import exifr from "exifr";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".arw"]);

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".arw": "image/x-sony-arw",
};

interface FileScanResult {
  fullPath: string;
  relativePath: string;
  filename: string;
  sizeBytes: number;
}

function scanDirectoryRecursively(dir: string, baseDir: string): FileScanResult[] {
  const results: FileScanResult[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanDirectoryRecursively(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        results.push({
          fullPath,
          relativePath,
          filename: entry.name,
          sizeBytes: stat.size,
        });
      }
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request.cookies);
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const rawNasPath = process.env.NAS_STORAGE_PATH || "./storage/nas";
  const nasRoot = path.resolve(/*turbopackIgnore: true*/ process.cwd(), rawNasPath);

  if (!fs.existsSync(nasRoot)) {
    fs.mkdirSync(nasRoot, { recursive: true });
  }

  const scannedFiles = scanDirectoryRecursively(nasRoot, nasRoot);
  let upsertedCount = 0;

  for (const file of scannedFiles) {
    try {
      const buffer = fs.readFileSync(file.fullPath);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      const ext = path.extname(file.filename).toLowerCase();
      const mimeType = MIME_MAP[ext] || "image/jpeg";

      let width = 0;
      let height = 0;
      let cameraModel: string | null = null;
      let lensModel: string | null = null;
      let focalLength: string | null = null;
      let iso: number | null = null;
      let aperture: string | null = null;
      let shutterSpeed: string | null = null;
      let capturedAt: Date | null = null;

      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;
      } catch {
        // Fallback or non-raster
      }

      try {
        const exif = await exifr.parse(buffer, {
          pick: ["Make", "Model", "LensModel", "FocalLength", "ISO", "FNumber", "ExposureTime", "DateTimeOriginal"],
        });

        if (exif) {
          if (exif.Model) cameraModel = String(exif.Model).trim();
          if (exif.LensModel) lensModel = String(exif.LensModel).trim();
          if (exif.FocalLength) focalLength = `${exif.FocalLength}mm`;
          if (exif.ISO) iso = Number(exif.ISO);
          if (exif.FNumber) aperture = `f/${exif.FNumber}`;
          if (exif.ExposureTime) {
            shutterSpeed = exif.ExposureTime < 1
              ? `1/${Math.round(1 / exif.ExposureTime)}s`
              : `${exif.ExposureTime}s`;
          }
          if (exif.DateTimeOriginal) {
            const parsed = new Date(exif.DateTimeOriginal);
            if (!isNaN(parsed.getTime())) capturedAt = parsed;
          }
        }
      } catch {
        // EXIF extraction is best-effort
      }

      await prisma.mediaAsset.upsert({
        where: { originalPath: file.relativePath },
        update: {
          filename: file.filename,
          hash,
          mimeType,
          sizeBytes: BigInt(file.sizeBytes),
          width,
          height,
          cameraModel,
          lensModel,
          focalLength,
          iso,
          aperture,
          shutterSpeed,
          capturedAt,
        },
        create: {
          filename: file.filename,
          originalPath: file.relativePath,
          hash,
          mimeType,
          sizeBytes: BigInt(file.sizeBytes),
          width,
          height,
          cameraModel,
          lensModel,
          focalLength,
          iso,
          aperture,
          shutterSpeed,
          capturedAt,
        },
      });

      upsertedCount++;
    } catch (fileErr) {
      console.error(`Failed to ingest asset ${file.relativePath}:`, fileErr);
    }
  }

  try {
    revalidatePath("/photography");
    revalidatePath("/admin/library");
    revalidatePath("/admin/dashboard");
  } catch {
    // Outside Next render loop
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    totalScanned: scannedFiles.length,
    totalUpserted: upsertedCount,
    durationMs,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
