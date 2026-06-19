const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('https://tour-tunisi.web.app/login');
  await page.fill('input[type="email"]', 'manager.emtilek@gmail.com');
  await page.fill('input[type="password"]', 'ChangeMe123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('After login URL:', page.url());

  const routes = ['/admin/dashboard', '/agent/agent-dashboard', '/tour/add-tour', '/hotel/add-hotel', '/edit-hotel'];
  for (const r of routes) {
    await page.goto('https://tour-tunisi.web.app' + r);
    await page.waitForTimeout(1500);
    console.log('Route ' + r + ' -> ' + page.url());
  }

  console.log('Console errors:', errors.length > 0 ? errors.join(' | ') : 'none');
  await browser.close();
})();
