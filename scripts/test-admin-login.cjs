const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5177';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'manager.emtilek@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

(async () => {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is required');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${name}`);
      console.error(err.message || err);
      failed++;
    }
  }

  await test('Admin can log in and reach /admin/dashboard', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`    URL after login: ${url}`);
    const body = await page.textContent('body');
    console.log(`    Body preview: ${body ? body.slice(0, 200).replace(/\s+/g, ' ') : 'empty'}`);
    if (!url.includes('/admin/dashboard')) throw new Error(`Expected /admin/dashboard but got ${url}`);
    if (!body || !body.includes('Admin Dashboard')) throw new Error('Admin Dashboard not rendered');
  });

  await test('Admin can access /agent/agent-dashboard', async () => {
    await page.goto(`${BASE_URL}/agent/agent-dashboard`);
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/agent/agent-dashboard')) throw new Error(`URL is ${url}`);
  });

  await test('Admin can access management route /tour/add-tour', async () => {
    await page.goto(`${BASE_URL}/tour/add-tour`);
    await page.waitForTimeout(2000);
    const url = page.url();
    if (!url.includes('/tour/add-tour')) throw new Error(`URL is ${url}`);
  });

  await test('Admin logout removes access to /admin/dashboard', async () => {
    // Trigger logout via Firebase Auth (clear indexedDB/local state)
    await context.clearCookies();
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('firebaseLocalStorageDb');
        req.onsuccess = resolve;
        req.onerror = resolve;
        req.onblocked = resolve;
        setTimeout(resolve, 500);
      });
    });
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  await browser.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
