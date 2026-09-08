/**
 * Cache Maintenance CLI — scripts/cache-maintenance.ts
 *
 * Commands:
 *   npm run cache:flush              Deletes all WebP files in LOCAL_CACHE_PATH
 *   npm run cache:flush -- --dry-run Lists files that would be deleted
 *   npm run cache:warm               Transcodes thumbnails for all DB assets that
 *                                    don't yet have a cached preview file
 *   npm run cache:stats              Prints cache directory stats
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import {
  getCacheBasePath,
  getNasBasePath,
  resolveSafeNasPath,
  resolveSafeCachePath,
  ensureStorageDirs,
} from "../lib/storage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function parseDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

// ---------------------------------------------------------------------------
// stats — Print cache directory info
// ---------------------------------------------------------------------------
async function runStats() {
  const cacheBase = getCacheBasePath();
  const nasBase = getNasBasePath();

  console.log("📊 Graywood Cache Statistics\n");
  console.log(`   NAS_STORAGE_PATH  → ${nasBase}`);
  console.log(`   LOCAL_CACHE_PATH  → ${cacheBase}\n`);

  let cacheFiles: string[] = [];
  let totalCacheBytes = 0;

  try {
    cacheFiles = await fs.promises.readdir(cacheBase);
    cacheFiles = cacheFiles.filter((f) => f.endsWith(".webp"));
    for (const f of cacheFiles) {
      const stat = await fs.promises.stat(path.join(cacheBase, f));
      totalCacheBytes += stat.size;
    }
  } catch {
    console.log("   ⚠️  Cache directory does not exist or is empty.");
  }

  const totalAssets = await prisma.mediaAsset.count();

  console.log(`   Cached WebP files : ${cacheFiles.length}`);
  console.log(`   Cache size on disk : ${formatBytes(totalCacheBytes)}`);
  console.log(`   Indexed DB assets  : ${totalAssets}`);

  // Count how many assets have at least one cache entry
  const cachedIds = new Set(
    cacheFiles.map((f) => f.split("-")[0]).filter(Boolean)
  );
  const assetsWithCache = totalAssets > 0
    ? Math.min(cachedIds.size, totalAssets)
    : 0;
  const coverage =
    totalAssets > 0
      ? `${assetsWithCache}/${totalAssets} (${Math.round((assetsWithCache / totalAssets) * 100)}%)`
      : "N/A";

  console.log(`   Cache coverage     : ${coverage}\n`);
}

// ---------------------------------------------------------------------------
// flush — Delete cached WebP files
// ---------------------------------------------------------------------------
async function runFlush() {
  const dryRun = parseDryRun();
  const cacheBase = getCacheBasePath();

  console.log(
    `🗑️  ${dryRun ? "[DRY RUN] " : ""}Flushing WebP preview cache at: ${cacheBase}\n`
  );

  let files: string[] = [];
  try {
    files = await fs.promises.readdir(cacheBase);
  } catch {
    console.log("   Cache directory does not exist. Nothing to flush.");
    return;
  }

  const webpFiles = files.filter((f) => f.endsWith(".webp") || f.endsWith(".tmp"));

  if (webpFiles.length === 0) {
    console.log("   ✅ Cache is already empty.");
    return;
  }

  let deleted = 0;
  let totalBytes = 0;

  for (const f of webpFiles) {
    const fullPath = path.join(cacheBase, f);
    try {
      const stat = await fs.promises.stat(fullPath);
      totalBytes += stat.size;

      if (dryRun) {
        console.log(`   [DRY RUN] Would delete: ${f} (${formatBytes(stat.size)})`);
      } else {
        await fs.promises.unlink(fullPath);
        console.log(`   ✓ Deleted: ${f}`);
      }
      deleted++;
    } catch (err) {
      console.warn(`   ⚠️  Could not delete ${f}:`, err);
    }
  }

  console.log(
    `\n${dryRun ? "[DRY RUN] " : ""}${deleted} file(s) ${dryRun ? "would be" : "deleted"} (${formatBytes(totalBytes)} freed).`
  );
}

// ---------------------------------------------------------------------------
// warm — Pre-generate WebP thumbnails for all indexed assets
// ---------------------------------------------------------------------------
async function runWarm() {
  const cacheBase = getCacheBasePath();
  await ensureStorageDirs();

  const SIZE_PARAM = "thumb";
  const TARGET_WIDTH = 600;
  const QUALITY = 80;

  console.log("🔥 Warming thumbnail cache...\n");
  console.log(`   Cache dir : ${cacheBase}`);
  console.log(`   Size      : ${SIZE_PARAM} (${TARGET_WIDTH}px wide, q${QUALITY})\n`);

  const assets = await prisma.mediaAsset.findMany({
    select: { id: true, originalPath: true, filename: true },
  });

  if (assets.length === 0) {
    console.log("   ℹ️  No indexed assets found. Run `npm run nas:index` first.");
    return;
  }

  let warmed = 0;
  let skipped = 0;
  let failed = 0;

  for (const asset of assets) {
    const cacheFilename = `${asset.id}-${SIZE_PARAM}.webp`;
    let cacheFilePath: string;

    try {
      cacheFilePath = resolveSafeCachePath(cacheFilename);
    } catch {
      failed++;
      continue;
    }

    // Skip if already cached
    if (fs.existsSync(cacheFilePath)) {
      skipped++;
      continue;
    }

    // Resolve NAS source
    let nasFilePath: string;
    try {
      nasFilePath = resolveSafeNasPath(asset.originalPath);
    } catch (err) {
      console.warn(`   ⚠️  Path jail violation for ${asset.filename}: ${err}`);
      failed++;
      continue;
    }

    if (!fs.existsSync(nasFilePath)) {
      console.warn(`   ⚠️  NAS file not found: ${asset.originalPath}`);
      failed++;
      continue;
    }

    // Transcode
    try {
      const tempPath = path.join(
        cacheBase,
        `${cacheFilename}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`
      );

      await sharp(nasFilePath)
        .rotate()
        .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 4 })
        .toFile(tempPath);

      // Atomic rename
      await fs.promises.rename(tempPath, cacheFilePath);

      warmed++;
      process.stdout.write(`   ✓ [${warmed}/${assets.length - skipped}] ${asset.filename}\r`);
    } catch (err) {
      console.warn(`\n   ✗ Failed to transcode ${asset.filename}:`, err);
      failed++;
    }
  }

  process.stdout.write("\n");
  console.log(`\n✅ Cache warm-up complete:`);
  console.log(`   Warmed  : ${warmed}`);
  console.log(`   Skipped : ${skipped} (already cached)`);
  console.log(`   Failed  : ${failed}`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
const command = process.argv[2];

async function main() {
  switch (command) {
    case "flush":
      await runFlush();
      break;
    case "warm":
      await runWarm();
      break;
    case "stats":
      await runStats();
      break;
    default:
      console.log("Graywood Cache Maintenance CLI\n");
      console.log("Usage:");
      console.log("  npm run cache:stats              Print cache statistics");
      console.log("  npm run cache:flush              Delete all cached WebP files");
      console.log("  npm run cache:flush -- --dry-run Preview what would be deleted");
      console.log("  npm run cache:warm               Pre-generate thumbnails for all indexed assets");
      process.exit(0);
  }
}

main()
  .catch((err) => {
    console.error("\n❌ Cache maintenance failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
