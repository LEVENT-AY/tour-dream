import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return { auth: getAuth(), db: getFirestore() };
}

async function verifyDemoAccount({ email, expectedRole, requiresApprovedAgent = false }) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();

  if (!profileSnap.exists) {
    throw new Error(`Missing Firestore profile for ${expectedRole} demo account.`);
  }

  const profile = profileSnap.data();
  if (profile.role !== expectedRole || user.customClaims?.role !== expectedRole) {
    throw new Error(`Role mismatch for ${expectedRole} demo account.`);
  }

  if (requiresApprovedAgent && (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true)) {
    throw new Error('Agent demo account is not approved.');
  }

  return { uid: user.uid, role: expectedRole };
}

async function login(page, email, password, dashboardPath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.getByPlaceholder('Enter Email').fill(email);
  await page.getByPlaceholder('Enter Password').fill(password);
  await page.getByRole('button', { name: /login|signing in/i }).click();
  await page.waitForURL((url) => url.toString().includes(dashboardPath), { timeout: 30000 });
}

async function readBodyText(page) {
  return (await page.locator('body').textContent()) || '';
}

async function waitForRoute(page, expectedPath) {
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 30000 });
  return new URL(page.url()).pathname;
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const adminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const agentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const customerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const customerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();
  await Promise.all([
    verifyDemoAccount({ email: adminEmail, expectedRole: 'admin' }),
    verifyDemoAccount({ email: agentEmail, expectedRole: 'agent', requiresApprovedAgent: true }),
    verifyDemoAccount({ email: customerEmail, expectedRole: 'customer' }),
  ]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('Missing or insufficient permissions')) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let adminRoutesSafe = false;
  let customerRoutesSafe = false;
  let agentRoutesSafe = false;
  let debugTextRemoved = false;

  try {
    await login(page, adminEmail, adminPassword, '/admin/dashboard');
    await page.goto(`${BASE_URL}/user/my-profile`, { waitUntil: 'domcontentloaded' });
    const adminPath = await waitForRoute(page, '/admin/dashboard');
    adminRoutesSafe = adminPath === '/admin/dashboard';

    await login(page, customerEmail, customerPassword, '/user/dashboard');
    await page.goto(`${BASE_URL}/user/my-profile`, { waitUntil: 'domcontentloaded' });
    const customerPath = await waitForRoute(page, '/user/my-profile');
    customerRoutesSafe = customerPath === '/user/my-profile';
    const customerText = (await readBodyText(page)).toLowerCase();
    debugTextRemoved = !customerText.includes('profile data is read from') && !customerText.includes('role missing');

    await login(page, agentEmail, agentPassword, '/agent/agent-dashboard');
    await page.goto(`${BASE_URL}/user/my-profile`, { waitUntil: 'domcontentloaded' });
    const agentPath = await waitForRoute(page, '/agent/agent-dashboard');
    agentRoutesSafe = agentPath === '/agent/agent-dashboard';
    const agentText = (await readBodyText(page)).toLowerCase();
    debugTextRemoved = debugTextRemoved && !agentText.includes('profile data is read from') && !agentText.includes('role missing');

    const success = adminRoutesSafe && customerRoutesSafe && agentRoutesSafe && debugTextRemoved;

    console.log(JSON.stringify({
      success,
      adminRoutesSafe,
      customerRoutesSafe,
      agentRoutesSafe,
      debugTextRemoved,
      errors,
    }));
    process.exitCode = success && errors.length === 0 ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      adminRoutesSafe,
      customerRoutesSafe,
      agentRoutesSafe,
      debugTextRemoved,
      errors,
      reason: error.message || String(error),
    }));
    process.exitCode = 1;
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
