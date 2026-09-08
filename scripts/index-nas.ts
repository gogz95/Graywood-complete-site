import "dotenv/config";
import { runIncrementalScan } from "../lib/indexer";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("📸 Scanning storage/nas for authentic media assets...");
  const result = await runIncrementalScan((prog) => {
    if (prog.currentFile) {
      console.log(`  🔍 Found: ${prog.currentFile}`);
    }
  });

  console.log(`✅ Scan completed in ${result.durationMs}ms:`);
  console.log(`   - Scanned: ${result.totalScanned}`);
  console.log(`   - Newly Indexed: ${result.totalIndexed}`);

  const totalAssets = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      filename: true,
      originalPath: true,
      width: true,
      height: true,
      sizeBytes: true,
    },
  });

  console.log(`\n📚 Total MediaAssets currently in database: ${totalAssets.length}`);
  for (const asset of totalAssets) {
    console.log(`   - [${asset.id}] ${asset.filename} (${asset.width}x${asset.height}, ${asset.sizeBytes} bytes)`);
  }
}

main()
  .catch((err) => {
    console.error("Scan failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
