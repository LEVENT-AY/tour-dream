import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: 'tour-tunisi' });
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
  const customRole = user.customClaims?.role;

  if (profile.role !== expectedRole) {
    throw new Error(`Firestore role mismatch for ${expectedRole} demo account.`);
  }

  if (customRole !== expectedRole) {
    throw new Error(`Custom claim mismatch for ${expectedRole} demo account.`);
  }

  if (requiresApprovedAgent) {
    if (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true) {
      throw new Error('Agent demo account is not approved for dashboard access.');
    }
  }

  return { uid: user.uid, role: profile.role };
}

async function loginThroughPage(browser, { email, password, expectedUrlPart }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const loginCard = page.locator('.authentication-card');
    await loginCard.waitFor({ state: 'visible', timeout: 15000 });
    await loginCard.locator('input[placeholder="Enter Email"]').first().fill(email);
    await loginCard.locator('input[placeholder="Enter Password"]').first().fill(password);
    await loginCard.getByRole('button', { name: /login|signing in/i }).click();
    await page.waitForURL((url) => url.toString().includes(expectedUrlPart), { timeout: 30000 });
    await page.waitForTimeout(2000);

    return {
      success: page.url().includes(expectedUrlPart),
      finalUrl: page.url(),
      errors,
    };
  } finally {
    await context.close();
  }
}

async function verifyWrongPasswordModal(browser, { email }) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const loginCard = page.locator('.authentication-card');
    await loginCard.waitFor({ state: 'visible', timeout: 15000 });
    await loginCard.locator('input[placeholder="Enter Email"]').first().fill(email);
    await loginCard.locator('input[placeholder="Enter Password"]').first().fill('definitely-wrong-password');
    await loginCard.getByRole('button', { name: /login|signing in/i }).click();

    const errorAlert = loginCard.locator('.alert-danger');
    await errorAlert.waitFor({ state: 'attached', timeout: 15000 });
    const errorText = (await errorAlert.textContent()) || '';

    return {
      success: /invalid email or password/i.test(errorText) && page.url().includes('/login'),
      errorText,
      modalStillOpen: true,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const demoAdminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  const demoAdminPassword = requireEnv('DEMO_ADMIN_PASSWORD');
  const demoAgentEmail = requireEnv('DEMO_AGENT_EMAIL');
  const demoAgentPassword = requireEnv('DEMO_AGENT_PASSWORD');
  const demoCustomerEmail = requireEnv('DEMO_CUSTOMER_EMAIL');
  const demoCustomerPassword = requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();

  await Promise.all([
    verifyDemoAccount({ email: demoAdminEmail, expectedRole: 'admin' }),
    verifyDemoAccount({ email: demoAgentEmail, expectedRole: 'agent', requiresApprovedAgent: true }),
    verifyDemoAccount({ email: demoCustomerEmail, expectedRole: 'customer' }),
  ]);

  const browser = await chromium.launch({ headless: true });

  try {
    const adminResult = await loginThroughPage(browser, {
      email: demoAdminEmail,
      password: demoAdminPassword,
      expectedUrlPart: '/admin/dashboard',
    });
    const agentResult = await loginThroughPage(browser, {
      email: demoAgentEmail,
      password: demoAgentPassword,
      expectedUrlPart: '/agent/agent-dashboard',
    });
    const customerResult = await loginThroughPage(browser, {
      email: demoCustomerEmail,
      password: demoCustomerPassword,
      expectedUrlPart: '/user/dashboard',
    });
    const wrongPasswordResult = await verifyWrongPasswordModal(browser, {
      email: demoCustomerEmail,
    });

    const success =
      adminResult.success &&
      agentResult.success &&
      customerResult.success &&
      wrongPasswordResult.success;

    console.log(JSON.stringify({
      success,
      admin: adminResult,
      agent: agentResult,
      customer: customerResult,
      wrongPassword: wrongPasswordResult,
    }));
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
