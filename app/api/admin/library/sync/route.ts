import { NextRequest } from "next/server";
import { runIncrementalScan, type ScanProgress } from "@/lib/indexer";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/library/sync
 *
 * Scans NAS storage incrementally, diffs against SQLite in batches of 50,
 * extracts EXIF metadata, and streams real-time Server-Sent Events (SSE)
 * detailing { indexed, scanned } back to the client.
 * Protected by admin iron-session authentication.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession(request.cookies);
  if (!session.user || session.user.role !== "ADMIN") {
    return new Response("Unauthorized: Admin authentication required.", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: object) {
        try {
          const message = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Client disconnected
        }
      }

      try {
        send({ type: "start", message: "Initiating NAS media synchronization..." });

        const result = await runIncrementalScan((progress: ScanProgress) => {
          send({
            type: "progress",
            scanned: progress.scanned,
            indexed: progress.indexed,
            currentFile: progress.currentFile,
          });
        });

        send({
          type: "complete",
          scanned: result.totalScanned,
          indexed: result.totalIndexed,
          durationMs: result.durationMs,
        });

        controller.close();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Sync failed unexpectedly.";
        send({
          type: "error",
          message: errorMsg,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Convenience GET handler for easy manual testing or EventSource consumption
export async function GET(request: NextRequest) {
  return POST(request);
}
