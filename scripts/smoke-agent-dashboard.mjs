import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isPermissionDeniedError(message) {
  return /missing or insufficient permissions|permission[- ]denied/i.test(message);
}

async function main() {
  const demoAgentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const demoAgentPassword = requireEnv('DEMO_AGENT_PASSWORD');

  await ensureDemoAccounts();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByPlaceholder('Enter Email').fill(demoAgentEmail);
    await page.getByPlaceholder('Enter Password').fill(demoAgentPassword);
    await page.getByRole('button', { name: /login|signing in/i }).click();
    await page.waitForURL((url) => url.toString().includes('/agent/agent-dashboard'), { timeout: 30000 });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(4000);

    const dashboardUrl = page.url();
    const dashboardBody = (await page.textContent('body')) || '';
    const dashboardPermissionErrors = consoleErrors.filter(isPermissionDeniedError);

    await page.goto(`${BASE_URL}/agent/agent-booking-requests`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(4000);

    const bookingRequestsUrl = page.url();
    const bookingRequestsBody = (await page.textContent('body')) || '';
    const bookingRequestsLoaded =
      bookingRequestsUrl.includes('/agent/agent-booking-requests') &&
      /booking requests|no booking requests found/i.test(bookingRequestsBody);

    const success =
      dashboardUrl.includes('/agent/agent-dashboard') &&
      /total bookings|total listings|total earnings|total reviews/i.test(dashboardBody) &&
      dashboardPermissionErrors.length === 0 &&
      bookingRequestsLoaded;

    console.log(JSON.stringify({
      success,
      dashboardUrl,
      bookingRequestsUrl,
      dashboardPermissionErrors,
      bookingRequestsLoaded,
      allConsoleErrors: consoleErrors,
    }));
    process.exitCode = success ? 0 : 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    reason: error.message || String(error),
  }));
  process.exit(1);
});
