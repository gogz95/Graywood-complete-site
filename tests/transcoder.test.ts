import fs from "fs";
import { prisma } from "../lib/prisma";
import { GET } from "../app/api/media/[assetId]/route";
import { NextRequest } from "next/server";
import { resolveSafeCachePath } from "../lib/storage";

async function test() {
  console.log("Testing image transcoding and SSD caching...");

  const asset = await prisma.mediaAsset.findFirst({
    where: {
      albumItems: {
        none: {
          album: {
            type: "CLIENT_PROOFING",
          },
        },
      },
    },
  });
  if (!asset) {
    throw new Error("No media asset found in database. Run indexer first!");
  }
  console.log(`Testing with asset: ${asset.id} (${asset.originalPath})`);

  const pathModule = await import("path");
  const sharpModule = (await import("sharp")).default;
  const { resolveSafeNasPath } = await import("../lib/storage");
  const nasFilePath = resolveSafeNasPath(asset.originalPath);
  const dir = pathModule.dirname(nasFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(nasFilePath)) {
    await sharpModule({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 200, g: 200, b: 200 },
      },
    })
      .jpeg()
      .toFile(nasFilePath);
  }

  // Clean any previous test cache
  const thumbCache = resolveSafeCachePath(`${asset.id}-thumb.webp`);
  const previewCache = resolveSafeCachePath(`${asset.id}-preview.webp`);
  if (fs.existsSync(thumbCache)) fs.unlinkSync(thumbCache);
  if (fs.existsSync(previewCache)) fs.unlinkSync(previewCache);

  // 1. First request -> MISS
  const req1 = new NextRequest(`http://localhost:3000/api/media/${asset.id}?size=thumb`);
  const res1 = await GET(req1, { params: Promise.resolve({ assetId: asset.id }) });

  console.log("Response 1 status:", res1.status);
  console.log("Response 1 Content-Type:", res1.headers.get("Content-Type"));
  console.log("Response 1 Cache-Control:", res1.headers.get("Cache-Control"));
  console.log("Response 1 X-Cache-Status (expect MISS):", res1.headers.get("X-Cache-Status"));

  if (res1.status !== 200) throw new Error(`Expected 200, got ${res1.status}`);
  if (res1.headers.get("Content-Type") !== "image/webp") throw new Error("Expected image/webp");
  if (!res1.headers.get("Cache-Control")?.includes("immutable")) throw new Error("Expected immutable cache");
  if (res1.headers.get("X-Cache-Status") !== "MISS") throw new Error("Expected MISS on first call");

  const buf1 = Buffer.from(await res1.arrayBuffer());
  console.log("Received WebP buffer size:", buf1.length, "bytes");

  // Verify file exists on SSD cache
  if (!fs.existsSync(thumbCache)) throw new Error("SSD cache file was not written!");
  console.log("  [PASS] Cache file written to disk:", thumbCache);

  // 2. Second request -> HIT
  const req2 = new NextRequest(`http://localhost:3000/api/media/${asset.id}?size=thumb`);
  const res2 = await GET(req2, { params: Promise.resolve({ assetId: asset.id }) });

  console.log("Response 2 X-Cache-Status (expect HIT):", res2.headers.get("X-Cache-Status"));
  if (res2.headers.get("X-Cache-Status") !== "HIT") throw new Error("Expected HIT on second call");

  // 3. Preview size request -> MISS
  const req3 = new NextRequest(`http://localhost:3000/api/media/${asset.id}?size=preview`);
  const res3 = await GET(req3, { params: Promise.resolve({ assetId: asset.id }) });

  console.log("Response 3 (preview) X-Cache-Status:", res3.headers.get("X-Cache-Status"));
  if (res3.headers.get("X-Cache-Status") !== "MISS") throw new Error("Expected preview MISS on first call");
  if (!fs.existsSync(previewCache)) throw new Error("Preview cache file was not written!");

  // 4. Dynamic width & quality parameters: ?w=1200&q=85
  const req4 = new NextRequest(`http://localhost:3000/api/media/${asset.id}?w=1200&q=85`);
  const res4 = await GET(req4, { params: Promise.resolve({ assetId: asset.id }) });
  if (res4.status !== 200) throw new Error(`Expected 200 for ?w=1200&q=85, got ${res4.status}`);
  if (res4.headers.get("Content-Type") !== "image/webp") throw new Error("Expected image/webp for ?w=1200&q=85");
  const customCache = resolveSafeCachePath(`${asset.id}-w1200-q85.webp`);
  if (!fs.existsSync(customCache)) throw new Error("Custom w/q cache file was not written!");
  console.log("  [PASS] Dynamic ?w=1200&q=85 transcode & caching verified.");

  console.log("Transcoding & SSD caching verified successfully!");
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
