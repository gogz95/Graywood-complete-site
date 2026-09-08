import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runIncrementalScan } from "@/lib/indexer";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

let isScanning = false;

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request.cookies);
  if (!session.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 401 }
    );
  }

  if (isScanning) {
    return NextResponse.json(
      { error: "A NAS synchronization scan is already in progress. Please wait." },
      { status: 409 }
    );
  }

  isScanning = true;
  try {
    const result = await runIncrementalScan();

    try {
      revalidatePath("/photography");
      revalidatePath("/admin/library");
      revalidatePath("/admin/dashboard");
    } catch {
      // Outside Next render loop
    }

    return NextResponse.json({
      success: true,
      totalScanned: result.totalScanned,
      totalUpserted: result.totalIndexed,
      durationMs: result.durationMs,
    });
  } catch (error: unknown) {
    console.error("NAS scan error:", error);
    const message = error instanceof Error ? error.message : "Failed to scan NAS storage.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    isScanning = false;
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to trigger a NAS scan." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
