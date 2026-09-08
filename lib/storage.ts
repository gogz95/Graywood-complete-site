import path from "path";
import fs from "fs";

/**
 * Returns the absolute base path for NAS storage.
 * Defaults to ./storage/nas in the project root.
 */
export function getNasBasePath(): string {
  const envPath = process.env.NAS_STORAGE_PATH || "./storage/nas";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), envPath);
}

/**
 * Returns the absolute base path for preview/thumbnail cache.
 * Defaults to ./cache/previews in the project root.
 */
export function getCacheBasePath(): string {
  const envPath = process.env.LOCAL_CACHE_PATH || "./cache/previews";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), envPath);
}

/**
 * Resolves a relative subpath against the configured NAS storage path.
 * Strictly throws an error if directory traversal is detected or if the resolved
 * path escapes the NAS base directory.
 *
 * @param relativeSubPath Relative path inside the NAS storage
 * @returns Absolute filesystem path safely verified to reside within NAS storage
 */
export function resolveSafeNasPath(relativeSubPath: string): string {
  if (!relativeSubPath || typeof relativeSubPath !== "string") {
    throw new Error("Invalid path parameter: path must be a non-empty string.");
  }

  // Detect null byte poisoning
  if (relativeSubPath.includes("\0")) {
    throw new Error("Security violation: null byte detected in path.");
  }

  // Normalise separators for traversal pattern inspection
  const normalised = relativeSubPath.replace(/\\/g, "/");

  // Explicit check for directory traversal segments
  const segments = normalised.split("/");
  if (segments.some((seg) => seg === "..")) {
    throw new Error(`Security violation: directory traversal ('..') detected in path '${relativeSubPath}'.`);
  }

  const basePath = getNasBasePath();
  // Strip any leading slashes so path.resolve doesn't treat it as filesystem root
  const cleanSubPath = relativeSubPath.replace(/^[/\\]+/, "");
  const targetPath = path.resolve(/*turbopackIgnore: true*/ basePath, cleanSubPath);

  // Enforce jail: targetPath must reside strictly within basePath
  const relativeFromBase = path.relative(basePath, targetPath);
  if (
    relativeFromBase.startsWith("..") ||
    path.isAbsolute(relativeFromBase)
  ) {
    throw new Error(`Security violation: resolved path escapes NAS jail '${relativeSubPath}'.`);
  }

  return targetPath;
}

/**
 * Resolves a safe cache path inside the SSD preview cache folder.
 */
export function resolveSafeCachePath(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new Error("Invalid cache filename.");
  }

  if (filename.includes("\0") || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    throw new Error(`Security violation: invalid cache filename '${filename}'.`);
  }

  const cacheBase = getCacheBasePath();
  return path.join(/*turbopackIgnore: true*/ cacheBase, filename);
}

/**
 * Ensures storage directories exist on disk.
 */
export async function ensureStorageDirs(): Promise<void> {
  const nasBase = getNasBasePath();
  const cacheBase = getCacheBasePath();

  await fs.promises.mkdir(nasBase, { recursive: true });
  await fs.promises.mkdir(cacheBase, { recursive: true });
}
