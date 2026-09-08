import fs from "node:fs";
import path from "node:path";

/**
 * Next.js output: "standalone" does not automatically copy public/ and .next/static/
 * into .next/standalone/. When running "node .next/standalone/server.js", missing
 * static assets cause 404s and unrendered client pages.
 *
 * This script ensures the required static assets are mirrored into standalone.
 */
function copyStandaloneAssets() {
  const rootDir = process.cwd();
  const standaloneDir = path.join(rootDir, ".next", "standalone");
  const publicSrc = path.join(rootDir, "public");
  const publicDest = path.join(standaloneDir, "public");
  const staticSrc = path.join(rootDir, ".next", "static");
  const staticDest = path.join(standaloneDir, ".next", "static");

  if (!fs.existsSync(standaloneDir)) {
    console.log("[copy-standalone-assets] Standalone directory not found; skipping copy.");
    return;
  }

  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log("[copy-standalone-assets] Successfully copied public/ -> .next/standalone/public");
  }

  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log("[copy-standalone-assets] Successfully copied .next/static/ -> .next/standalone/.next/static");
  }
}

copyStandaloneAssets();
