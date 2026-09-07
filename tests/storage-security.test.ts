import { resolveSafeNasPath } from "../lib/storage";

function runTests() {
  console.log("Testing resolveSafeNasPath...");

  // Valid paths should succeed
  const valid1 = resolveSafeNasPath("landscapes/norway_fjords.jpg");
  console.log("  [PASS] Valid path 1:", valid1);

  const valid2 = resolveSafeNasPath("weddings/2026/couple_01.jpg");
  console.log("  [PASS] Valid path 2:", valid2);

  // Directory traversal attacks must throw
  const traversalCases = [
    "../secret.env",
    "../../etc/passwd",
    "landscapes/../../../windows/system32",
    "foo/bar/../..",
    "..\\evil.txt",
    "foo/..\\bar",
    "foo\0bar.jpg",
  ];

  for (const malicious of traversalCases) {
    let threw = false;
    try {
      resolveSafeNasPath(malicious);
    } catch (e: unknown) {
      threw = true;
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  [PASS] Successfully blocked '${malicious}': ${msg}`);
    }
    if (!threw) {
      throw new Error(`SECURITY FAILURE: Did not block directory traversal in '${malicious}'`);
    }
  }

  console.log("All storage security tests passed!");
}

runTests();
