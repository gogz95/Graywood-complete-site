import fs from "fs";
import path from "path";
import crypto from "crypto";
import exifr from "exifr";
import sharp from "sharp";
import { prisma } from "./prisma";
import { getNasBasePath, resolveSafeNasPath } from "./storage";

export interface ScanProgress {
  scanned: number;
  indexed: number;
  currentFile?: string;
  totalEstimated?: number;
}

export interface ScanResult {
  totalScanned: number;
  totalIndexed: number;
  durationMs: number;
}

const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tiff",
  ".tif",
]);

function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".tiff":
    case ".tif":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}

/**
 * Recursively walks a directory using non-blocking fs.promises.readdir.
 * Yields relative subpaths (using forward slashes) for supported media files.
 */
export async function* walkDirectory(
  rootDir: string,
  subDir = ""
): AsyncGenerator<string> {
  const currentDir = path.join(rootDir, subDir);
  let entries: fs.Dirent[] = [];

  try {
    entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "ENOENT") {
      return;
    }
    throw err;
  }

  for (const entry of entries) {
    const entrySubPath = subDir ? `${subDir}/${entry.name}` : entry.name;
    const normalised = entrySubPath.replace(/\\/g, "/");

    if (entry.isDirectory()) {
      // Ignore hidden or system directories
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
        continue;
      }
      yield* walkDirectory(rootDir, normalised);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        yield normalised;
      }
    }
  }
}

/**
 * Extracts EXIF and dimensional metadata from an image buffer.
 */
interface ParsedExif {
  Make?: string;
  Model?: string;
  LensModel?: string;
  FocalLength?: number | string;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number | string;
  DateTimeOriginal?: Date;
  ExifImageWidth?: number;
  ExifImageHeight?: number;
  ImageWidth?: number;
  ImageHeight?: number;
}

export async function extractMediaMetadata(
  buffer: Buffer,
  fallbackDate: Date
): Promise<{
  width?: number;
  height?: number;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  capturedAt?: Date;
}> {
  let exif: ParsedExif | null = null;
  try {
    exif = await exifr.parse(buffer, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
        "ExifImageWidth",
        "ExifImageHeight",
      ],
    });
  } catch {
    // If EXIF parsing fails, fall back to sharp
  }

  let width: number | undefined = exif?.ExifImageWidth ?? exif?.ImageWidth;
  let height: number | undefined = exif?.ExifImageHeight ?? exif?.ImageHeight;

  if (!width || !height) {
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      // If sharp cannot read metadata, leave dimensions undefined
    }
  }

  // Camera model
  let cameraModel: string | undefined = undefined;
  if (exif?.Make || exif?.Model) {
    const make = exif.Make ? String(exif.Make).trim() : "";
    const model = exif.Model ? String(exif.Model).trim() : "";
    if (model.toLowerCase().includes(make.toLowerCase())) {
      cameraModel = model;
    } else {
      cameraModel = `${make} ${model}`.trim();
    }
  }

  // Lens model
  const lensModel = exif?.LensModel ? String(exif.LensModel).trim() : undefined;

  // Focal length
  let focalLength: string | undefined = undefined;
  if (typeof exif?.FocalLength === "number") {
    focalLength = `${Math.round(exif.FocalLength)}mm`;
  } else if (typeof exif?.FocalLength === "string") {
    focalLength = exif.FocalLength.includes("mm")
      ? exif.FocalLength
      : `${exif.FocalLength}mm`;
  }

  // Aperture (f-stop)
  let aperture: string | undefined = undefined;
  if (typeof exif?.FNumber === "number") {
    aperture = `f/${exif.FNumber.toFixed(1).replace(/\.0$/, "")}`;
  }

  // Shutter speed
  let shutterSpeed: string | undefined = undefined;
  if (typeof exif?.ExposureTime === "number") {
    if (exif.ExposureTime < 1) {
      shutterSpeed = `1/${Math.round(1 / exif.ExposureTime)}s`;
    } else {
      shutterSpeed = `${exif.ExposureTime}s`;
    }
  }

  // ISO
  let iso: number | undefined = undefined;
  if (typeof exif?.ISO === "number") {
    iso = exif.ISO;
  } else if (typeof exif?.ISO === "string") {
    const parsed = parseInt(exif.ISO, 10);
    if (!isNaN(parsed)) iso = parsed;
  }

  // Capture timestamp
  let capturedAt: Date | undefined = undefined;
  if (exif?.DateTimeOriginal instanceof Date && !isNaN(exif.DateTimeOriginal.getTime())) {
    capturedAt = exif.DateTimeOriginal;
  } else {
    capturedAt = fallbackDate;
  }

  return {
    width,
    height,
    cameraModel,
    lensModel,
    focalLength,
    aperture,
    shutterSpeed,
    iso,
    capturedAt,
  };
}

/**
 * Generates a cuid-like unique identifier for new media assets.
 */
function generateAssetId(): string {
  return "c" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

/**
 * Runs incremental scanning on the NAS storage directory.
 * Diffs discovered paths against SQLite in batches of 50.
 * Extracts EXIF and inserts new records via prisma.mediaAsset.createMany().
 *
 * @param onProgress Callback invoked as files are scanned and indexed
 * @returns Summary of scanned and indexed items
 */
export async function runIncrementalScan(
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult> {
  const startTime = Date.now();
  const nasBase = getNasBasePath();

  let totalScanned = 0;
  let totalIndexed = 0;

  const BATCH_SIZE = 50;
  let currentBatch: string[] = [];

  async function processBatch(batch: string[]) {
    if (batch.length === 0) return;

    // Check which files already exist in SQLite
    const existing = await prisma.mediaAsset.findMany({
      where: {
        originalPath: { in: batch },
      },
      select: { originalPath: true },
    });

    const existingSet = new Set(
      existing.map((e: { originalPath: string }) => e.originalPath)
    );
    const newFilePaths = batch.filter((p) => !existingSet.has(p));

    if (newFilePaths.length === 0) {
      return;
    }

    const recordsToCreate = [];

    for (const relPath of newFilePaths) {
      const fullPath = resolveSafeNasPath(relPath);
      let stat: fs.Stats;
      let buffer: Buffer;

      try {
        stat = await fs.promises.stat(fullPath);
        buffer = await fs.promises.readFile(fullPath);
      } catch (err) {
        console.error(`Error reading file ${relPath}:`, err);
        continue;
      }

      const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
      const ext = path.extname(relPath);
      const mimeType = getMimeType(ext);
      const fileName = path.basename(relPath);

      const meta = await extractMediaMetadata(buffer, stat.birthtime || stat.mtime);

      recordsToCreate.push({
        id: generateAssetId(),
        originalPath: relPath,
        hash: fileHash,
        filename: fileName,
        sizeBytes: BigInt(stat.size),
        mimeType,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        cameraModel: meta.cameraModel ?? null,
        lensModel: meta.lensModel ?? null,
        focalLength: meta.focalLength ?? null,
        aperture: meta.aperture ?? null,
        shutterSpeed: meta.shutterSpeed ?? null,
        iso: meta.iso ?? null,
        capturedAt: meta.capturedAt ?? new Date(),
      });

      totalIndexed++;
      if (onProgress) {
        onProgress({
          scanned: totalScanned,
          indexed: totalIndexed,
          currentFile: relPath,
        });
      }
    }

    if (recordsToCreate.length > 0) {
      await prisma.mediaAsset.createMany({
        data: recordsToCreate,
      });
    }
  }

  // Iterate directory stream
  for await (const relPath of walkDirectory(nasBase)) {
    totalScanned++;
    currentBatch.push(relPath);

    if (onProgress && totalScanned % 10 === 0) {
      onProgress({
        scanned: totalScanned,
        indexed: totalIndexed,
        currentFile: relPath,
      });
    }

    if (currentBatch.length >= BATCH_SIZE) {
      await processBatch(currentBatch);
      currentBatch = [];
    }
  }

  // Process any remaining files
  if (currentBatch.length > 0) {
    await processBatch(currentBatch);
  }

  const durationMs = Date.now() - startTime;

  if (onProgress) {
    onProgress({
      scanned: totalScanned,
      indexed: totalIndexed,
    });
  }

  return {
    totalScanned,
    totalIndexed,
    durationMs,
  };
}
