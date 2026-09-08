import http from "http";
import { prisma } from "../lib/prisma";
import { submitContactInquiry } from "../app/actions/contact";

function request(path: string, options: http.RequestOptions = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: string }> {
  return new Promise((resolve, reject) => {
    const port = Number(process.env.PORT || 3000);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, headers: res.headers, data });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runE2ETests() {
  console.log("=== PHASE 2 E2E INTEGRATION TEST SUITE ===\n");

  // 1. Test POST /api/admin/library/sync (SSE endpoint)
  console.log("1. Testing SSE Library Sync (POST /api/admin/library/sync)...");
  const sseRes = await request("/api/admin/library/sync", { method: "POST" });
  console.log("   Status:", sseRes.status);
  console.log("   Content-Type:", sseRes.headers["content-type"]);
  console.log("   SSE response preview:", sseRes.data.trim().split("\n").slice(0, 3).join(" | "));
  if (sseRes.status !== 200) throw new Error(`SSE failed with status ${sseRes.status}`);
  if (!sseRes.headers["content-type"]?.includes("text/event-stream")) throw new Error("Expected text/event-stream");
  console.log("   [PASS] SSE sync endpoint verified.\n");

  // 2. Test Media Transcoder on newly indexed asset
  console.log("2. Testing Media Transcoding Endpoint...");
  const asset = await prisma.mediaAsset.findFirst();
  if (!asset) throw new Error("No media asset in database!");
  
  const thumbRes = await request(`/api/media/${asset.id}?size=thumb`);
  console.log("   Thumbnail Status:", thumbRes.status, "| Content-Type:", thumbRes.headers["content-type"], "| Cache-Control:", thumbRes.headers["cache-control"]);
  if (thumbRes.status !== 200 || thumbRes.headers["content-type"] !== "image/webp") {
    throw new Error("Transcoder failed to return WebP image");
  }
  console.log("   [PASS] Media transcoder verified.\n");

  // 3. Test Photography Page
  console.log("3. Testing Photography Page (/photography)...");
  const photoRes = await request("/photography");
  console.log("   Status:", photoRes.status);
  const hasGallery = photoRes.data.includes("Visual Archive");
  const hasForm = photoRes.data.includes("Initiate a Commission");
  console.log("   Contains Visual Archive gallery:", hasGallery);
  console.log("   Contains Contact form:", hasForm);
  if (photoRes.status !== 200 || !hasGallery || !hasForm) {
    throw new Error("Photography page rendering failure");
  }
  console.log("   [PASS] Photography page verified.\n");

  // 4. Test Contact Inquiry Server Action
  console.log("4. Testing Contact Inquiry Submission...");
  const contactResult = await submitContactInquiry({
    name: "Eirik Test Client",
    email: "test@client.no",
    phone: "+47 987 65 432",
    message: "Inquiry for commercial campaign in Lofoten Islands autumn 2026.",
    domainSource: "PHOTOGRAPHY",
  });
  console.log("   Action result:", contactResult);
  if (!contactResult.success) throw new Error("Contact inquiry submission failed");

  const inquiryInDb = await prisma.contactInquiry.findFirst({
    where: { email: "test@client.no" },
  });
  if (!inquiryInDb) throw new Error("Contact inquiry not found in database");
  console.log("   Saved in SQLite ContactInquiry id:", inquiryInDb.id, "status:", inquiryInDb.status);
  console.log("   [PASS] Contact inquiry submission verified.\n");

  // 5. Test Media Page
  console.log("5. Testing Media Page (/media)...");
  const mediaRes = await request("/media");
  console.log("   Status:", mediaRes.status);
  const hasReel = mediaRes.data.includes("Visual Cadence 2026");
  const hasArtists = mediaRes.data.includes("Astrid Solberg");
  console.log("   Contains Showreel section:", hasReel);
  console.log("   Contains Artist Profiles:", hasArtists);
  if (mediaRes.status !== 200 || !hasReel || !hasArtists) {
    throw new Error("Media page rendering failure");
  }
  console.log("   [PASS] Media page verified.\n");

  // 6. Test Hub Page
  console.log("6. Testing Hub Page (/hub)...");
  const hubRes = await request("/hub");
  console.log("   Status:", hubRes.status);
  const hasPhotoPillar = hubRes.data.includes("Studio 01");
  const hasMediaPillar = hubRes.data.includes("Studio 02");
  console.log("   Contains Photography Pillar:", hasPhotoPillar);
  console.log("   Contains Media Pillar:", hasMediaPillar);
  if (hubRes.status !== 200 || !hasPhotoPillar || !hasMediaPillar) {
    throw new Error("Hub page rendering failure");
  }
  console.log("   [PASS] Hub page verified.\n");

  // 7. Test Root Domain Routing
  console.log("7. Testing Multi-Domain Routing via Host headers at root /...");
  
  const rootPhoto = await request("/", { headers: { Host: "graywoodphotography.no" } });
  console.log("   graywoodphotography.no -> contains 'Visual Archive':", rootPhoto.data.includes("Visual Archive"));
  
  const rootMedia = await request("/", { headers: { Host: "graywoodmedia.no" } });
  console.log("   graywoodmedia.no -> contains 'Member Spotlights':", rootMedia.data.includes("Member Spotlights"));
  
  const rootMain = await request("/", { headers: { Host: "graywood.no" } });
  console.log("   graywood.no -> contains 'Studio 01':", rootMain.data.includes("Studio 01"));

  if (!rootPhoto.data.includes("Visual Archive") || !rootMedia.data.includes("Member Spotlights") || !rootMain.data.includes("Studio 01")) {
    throw new Error("Root domain routing dispatch check failed");
  }
  console.log("   [PASS] Multi-domain root routing verified.\n");

  console.log("🎉 ALL PHASE 2 E2E TESTS PASSED SUCCESSFULLY!");
}

runE2ETests()
  .catch((err) => {
    console.error("❌ E2E TEST FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
