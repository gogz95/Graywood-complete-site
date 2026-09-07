import { runIncrementalScan } from "../lib/indexer";
import { prisma } from "../lib/prisma";

async function test() {
  console.log("Starting incremental scanner test...");
  
  const result = await runIncrementalScan((prog) => {
    if (prog.currentFile) {
      console.log(`  [SCAN PROGRESS] Scanned: ${prog.scanned}, Indexed: ${prog.indexed} -> ${prog.currentFile}`);
    }
  });

  console.log("First scan result:", result);

  const assets = await prisma.mediaAsset.findMany();
  console.log(`Total MediaAsset count in DB: ${assets.length}`);
  if (assets.length > 0) {
    const sample = assets[0];
    console.log("Sample asset in DB:", {
      id: sample.id,
      filePath: sample.filePath,
      fileName: sample.fileName,
      width: sample.width,
      height: sample.height,
      cameraModel: sample.cameraModel,
      lensModel: sample.lensModel,
    });
  }

  // Second scan should diff against SQLite and index 0 new items
  console.log("\nTesting incremental diff (second run)...");
  const secondResult = await runIncrementalScan();
  console.log("Second scan result (should index 0):", secondResult);

  if (secondResult.totalIndexed !== 0) {
    throw new Error(`Expected 0 newly indexed assets on second run, got ${secondResult.totalIndexed}`);
  }
  console.log("Incremental diffing verified successfully!");
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
