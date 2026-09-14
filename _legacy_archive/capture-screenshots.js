const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\gogz9\\.gemini\\antigravity-ide\\brain\\a562a6ae-25bc-47d8-8fb5-984017449b4e';

async function main() {
  console.log('Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Summer Live Session Delivery unlock
  console.log('Navigating to http://localhost:8080/summer-live-session ...');
  await page.goto('http://localhost:8080/summer-live-session', { waitUntil: 'networkidle2' });

  console.log('Submitting password SessionPass2026! ...');
  await page.type('input[name="post_password"]', 'SessionPass2026!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  const deliveryScreenshot = path.join(ARTIFACT_DIR, 'unlocked_client_delivery.png');
  await page.screenshot({ path: deliveryScreenshot, fullPage: false });
  console.log(`[✓] Captured: ${deliveryScreenshot}`);

  // 2. Admin Login and Gear Pool Tracker view
  console.log('Logging in to WordPress Admin ...');
  await page.goto('http://localhost:8080/wp-login.php', { waitUntil: 'networkidle2' });
  await page.type('#user_login', 'admin');
  await page.type('#user_pass', 'AdminPassword123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('#wp-submit')
  ]);

  console.log('Navigating to Gear Pool items list ...');
  await page.goto('http://localhost:8080/wp-admin/edit.php?post_type=gear_item', { waitUntil: 'networkidle2' });

  const gearScreenshot = path.join(ARTIFACT_DIR, 'gear_pool_admin.png');
  await page.screenshot({ path: gearScreenshot, fullPage: false });
  console.log(`[✓] Captured: ${gearScreenshot}`);

  await browser.close();
  console.log('Browser verification completed successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
