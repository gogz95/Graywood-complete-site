// scripts/cron-nas-index.ts
//
// Scheduled NAS ingestion runner — designed to be called from:
//   - System cron:   every 30 min → cd /srv/graywood && npm run nas:index:cron
//   - Docker sidecar: see docker-compose.yml `cron` service
//
// Features:
//   - Lock file prevents concurrent scans from stepping on each other
//   - Configurable run interval via SCAN_INTERVAL_MINUTES (default: 30)
//   - Structured JSON log output for easy ingestion by log aggregators
//   - Graceful SIGTERM / SIGINT shutdown (for Docker stop)
//   - Optional one-shot mode (CRON_ONE_SHOT=true) for system cron invocations

import "dotenv/config";
import fs from "fs";
import path from "path";
import { runIncrementalScan } from "../lib/indexer";
import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const INTERVAL_MINUTES = parseInt(process.env.SCAN_INTERVAL_MINUTES || "30", 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
const ONE_SHOT = process.env.CRON_ONE_SHOT === "true";
const LOCK_FILE = path.join(process.cwd(), ".nas-scan.lock");

// ---------------------------------------------------------------------------
// Structured logger
// ---------------------------------------------------------------------------

function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "graywood-nas-indexer",
    message,
    ...data,
  };
  const out = level === "error" ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + "\n");
}

// ---------------------------------------------------------------------------
// Lock file management — prevents overlapping concurrent scans
// ---------------------------------------------------------------------------

function acquireLock(): boolean {
  try {
    // Check if lock file exists and if the PID inside it is still alive
    if (fs.existsSync(LOCK_FILE)) {
      const content = fs.readFileSync(LOCK_FILE, "utf-8").trim();
      const lockedPid = parseInt(content, 10);

      if (!isNaN(lockedPid)) {
        try {
          // Signal 0 tests if the process is alive without sending a real signal
          process.kill(lockedPid, 0);
          log("warn", "Another scan is already running — skipping this cycle.", {
            locked_by_pid: lockedPid,
          });
          return false;
        } catch {
          // Process is dead — stale lock, safe to overwrite
          log("info", "Removing stale lock file from dead process.", { stale_pid: lockedPid });
        }
      }
    }

    fs.writeFileSync(LOCK_FILE, String(process.pid), "utf-8");
    return true;
  } catch (err) {
    log("error", "Failed to acquire lock file.", { error: String(err) });
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const content = fs.readFileSync(LOCK_FILE, "utf-8").trim();
      // Only delete our own lock
      if (content === String(process.pid)) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Single scan run
// ---------------------------------------------------------------------------

async function performScan(): Promise<void> {
  if (!acquireLock()) return;

  const runStart = Date.now();
  log("info", "NAS incremental scan starting.", { interval_minutes: INTERVAL_MINUTES });

  try {
    const result = await runIncrementalScan((progress) => {
      if (progress.currentFile && progress.scanned % 25 === 0) {
        log("info", "Scan progress.", {
          scanned: progress.scanned,
          indexed: progress.indexed,
          current_file: progress.currentFile,
        });
      }
    });

    const totalAssets = await prisma.mediaAsset.count();

    log("info", "NAS scan completed successfully.", {
      total_scanned: result.totalScanned,
      newly_indexed: result.totalIndexed,
      total_in_db: totalAssets,
      duration_ms: result.durationMs,
    });
  } catch (err) {
    log("error", "NAS scan failed with an error.", { error: String(err) });
  } finally {
    releaseLock();
    log("info", "Lock released.", { duration_ms: Date.now() - runStart });
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

let shutdownRequested = false;

function handleShutdown(signal: string) {
  log("info", `Received ${signal} — shutting down gracefully.`);
  shutdownRequested = true;
  releaseLock();
  prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main() {
  log("info", ONE_SHOT ? "One-shot NAS scan starting." : "NAS indexer cron daemon starting.", {
    mode: ONE_SHOT ? "one-shot" : "daemon",
    interval_minutes: INTERVAL_MINUTES,
    pid: process.pid,
  });

  // Run immediately on startup
  await performScan();

  if (ONE_SHOT) {
    await prisma.$disconnect();
    process.exit(0);
  }

  // Recurring loop
  const interval = setInterval(async () => {
    if (shutdownRequested) {
      clearInterval(interval);
      return;
    }
    await performScan();
  }, INTERVAL_MS);

  log("info", `Next scan scheduled in ${INTERVAL_MINUTES} minutes.`);
}

main().catch((err) => {
  log("error", "Fatal error in NAS indexer cron.", { error: String(err) });
  releaseLock();
  process.exit(1);
});
