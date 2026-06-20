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

async function loginAndVerify(browser, { label, email, password, expectedUrlPart }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Enter Email').fill(email);
    await page.getByPlaceholder('Enter Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL((url) => url.toString().includes(expectedUrlPart), { timeout: 30000 });
    await page.waitForTimeout(3000);

    return {
      label,
      success: page.url().includes(expectedUrlPart),
      finalUrl: page.url(),
      errors,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  await ensureDemoAccounts();

  const browser = await chromium.launch({ headless: true });

  try {
    const results = await Promise.all([
      loginAndVerify(browser, {
        label: 'admin',
        email: requireEnv('DEMO_ADMIN_EMAIL'),
        password: requireEnv('DEMO_ADMIN_PASSWORD'),
        expectedUrlPart: '/admin/dashboard',
      }),
      loginAndVerify(browser, {
        label: 'agent',
        email: requireEnv('DEMO_AGENT_EMAIL'),
        password: requireEnv('DEMO_AGENT_PASSWORD'),
        expectedUrlPart: '/agent/agent-dashboard',
      }),
      loginAndVerify(browser, {
        label: 'customer',
        email: requireEnv('DEMO_CUSTOMER_EMAIL'),
        password: requireEnv('DEMO_CUSTOMER_PASSWORD'),
        expectedUrlPart: '/user/dashboard',
      }),
    ]);

    const success = results.every((result) => result.success);
    console.log(JSON.stringify({ success, results }));
    process.exitCode = success ? 0 : 1;
  } finally {
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
