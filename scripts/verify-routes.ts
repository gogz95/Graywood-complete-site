async function verify() {
  const routes = [
    {
      url: "http://localhost:3000/",
      expectedStatus: 200,
      checks: ['id="gallery"', 'id="about"', 'id="contact"', "Graywood Photography"],
    },
    {
      url: "http://localhost:3000/photography",
      expectedStatus: 200,
      checks: ['id="about"', 'id="gallery"', 'id="contact"', "Graywood Photography", "Still Studio"],
    },
    {
      url: "http://localhost:3000/media",
      expectedStatus: 200,
      checks: [
        'id="showreel"',
        'id="services"',
        'id="portfolios"',
        'id="contact"',
        "Graywood Media",
        "Motion Collective",
      ],
    },
    {
      url: "http://localhost:3000/hub",
      expectedStatus: 200,
      checks: [
        "Graywood Studio",
        "Ecosystem Hub",
        "Enter Photography Studio",
        "Enter Media Collective",
      ],
    },
    {
      url: "http://localhost:3000/portal",
      expectedStatus: 404,
      checks: ["Plate Not Located", "Client Proofing Vault Notice"],
    },
    {
      url: "http://localhost:3000/missing-random-page",
      expectedStatus: 404,
      checks: ["Plate Not Located", "Error 404"],
    },
  ];

  let allPassed = true;
  for (const r of routes) {
    try {
      const res = await fetch(r.url);
      const text = await res.text();
      const statusOk = res.status === r.expectedStatus;
      if (!statusOk) {
        console.error(`FAIL ${r.url}: Expected status ${r.expectedStatus} got ${res.status}`);
        allPassed = false;
        continue;
      }
      const missingChecks = r.checks.filter((c) => !text.includes(c));
      if (missingChecks.length > 0) {
        console.error(`FAIL ${r.url}: Missing content substrings: ${JSON.stringify(missingChecks)}`);
        allPassed = false;
      } else {
        console.log(`PASS ${r.url} (HTTP ${res.status}) - all ${r.checks.length} checks verified`);
      }
    } catch (e: any) {
      console.error(`ERROR ${r.url}: ${e.message}`);
      allPassed = false;
    }
  }
  if (!allPassed) {
    process.exit(1);
  }
  console.log("\nALL VERIFICATION CHECKS PASSED!");
}

verify();
