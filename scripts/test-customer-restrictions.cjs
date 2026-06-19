const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5177';
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL || 'test-customer-phase1@example.com';
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'TestCustomer123!';

(async () => {
  if (!CUSTOMER_PASSWORD) {
    console.error('CUSTOMER_PASSWORD environment variable is required');
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

  await test('Customer can log in and reach /user/dashboard', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', CUSTOMER_EMAIL);
    await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    if (!url.includes('/user/dashboard')) throw new Error(`Expected /user/dashboard but got ${url}`);
  });

  await test('Customer cannot access /admin/dashboard', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForURL(/(\/unauthorized|\/login)/, { timeout: 5000 });
  });

  await test('Customer cannot access /agent/agent-dashboard', async () => {
    await page.goto(`${BASE_URL}/agent/agent-dashboard`);
    await page.waitForURL(/(\/unauthorized|\/login)/, { timeout: 5000 });
  });

  await test('Customer cannot access management route /tour/add-tour', async () => {
    await page.goto(`${BASE_URL}/tour/add-tour`);
    await page.waitForURL(/(\/unauthorized|\/login)/, { timeout: 5000 });
  });

  await test('Customer cannot access management route /hotel/add-hotel', async () => {
    await page.goto(`${BASE_URL}/hotel/add-hotel`);
    await page.waitForURL(/(\/unauthorized|\/login)/, { timeout: 5000 });
  });

  await test('Customer cannot access management route /edit-hotel', async () => {
    await page.goto(`${BASE_URL}/edit-hotel`);
    await page.waitForURL(/(\/unauthorized|\/login)/, { timeout: 5000 });
  });

  await browser.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
