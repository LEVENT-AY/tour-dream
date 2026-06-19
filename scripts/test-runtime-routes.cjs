const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5176';

(async () => {
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

  // Public pages accessible to visitor
  await test('Public homepage loads', async () => {
    const res = await page.goto(`${BASE_URL}/index`);
    if (!res || !res.ok()) throw new Error(`Status: ${res ? res.status() : 'no response'}`);
  });

  await test('Login page loads', async () => {
    const res = await page.goto(`${BASE_URL}/login`);
    if (!res || !res.ok()) throw new Error(`Status: ${res ? res.status() : 'no response'}`);
  });

  await test('Tour grid page is public', async () => {
    const res = await page.goto(`${BASE_URL}/tour/tour-grid`);
    if (!res || !res.ok()) throw new Error(`Status: ${res ? res.status() : 'no response'}`);
  });

  // Protected routes redirect unauthenticated visitor to login
  await test('Unauthenticated visitor to /user/dashboard redirects to login', async () => {
    await page.goto(`${BASE_URL}/user/dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  await test('Unauthenticated visitor to /agent/agent-dashboard redirects to login', async () => {
    await page.goto(`${BASE_URL}/agent/agent-dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  await test('Unauthenticated visitor to /admin/dashboard redirects to login', async () => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  // Refreshing protected routes does not 404
  await test('Direct URL to /user/dashboard returns SPA (no 404)', async () => {
    const res = await page.goto(`${BASE_URL}/user/dashboard`);
    if (res && res.status() === 404) throw new Error('Received 404');
  });

  await test('Direct URL to /admin/dashboard returns SPA (no 404)', async () => {
    const res = await page.goto(`${BASE_URL}/admin/dashboard`);
    if (res && res.status() === 404) throw new Error('Received 404');
  });

  // Unauthorized page exists
  await test('Unauthorized page exists', async () => {
    const res = await page.goto(`${BASE_URL}/unauthorized`);
    if (!res || !res.ok()) throw new Error(`Status: ${res ? res.status() : 'no response'}`);
    const body = await page.textContent('body');
    if (!body || !body.includes('Unauthorized')) throw new Error('Unauthorized text not found');
  });

  // Console errors
  await test('No critical console errors on homepage', async () => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE_URL}/index`);
    await page.waitForLoadState('networkidle');
    // Filter out non-critical errors (e.g., missing images, fonts)
    const critical = errors.filter(e => !e.includes('404') && !e.includes('favicon'));
    if (critical.length > 0) throw new Error(`Critical errors: ${critical.join('; ')}`);
  });

  await browser.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
