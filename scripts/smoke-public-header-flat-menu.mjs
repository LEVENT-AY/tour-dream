import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { chromium } from 'playwright';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const EXPECTED_LABELS = [
  'Home',
  'Flight',
  'Hotel',
  'Car',
  'Resort',
  'Chalet',
  'Cruise',
  'Tour',
  'Bus',
  'Activity',
  'Visa',
  'Guide',
  'Pricing Plan',
  'Contact',
];

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
  return { auth: getAuth() };
}

async function verifyDemoAdmin(email) {
  const { auth } = initAdminSdk();
  await auth.getUserByEmail(email);
}

async function readHeaderState(page) {
  await page.locator('#loader-wrapper').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const header = page.locator('header').first();
  await header.waitFor({ state: 'visible', timeout: 15000 });
  const topNavLabels = await header.locator('.main-nav > li > a:visible').evaluateAll((links) =>
    links.map((link) => (link.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
  );
  const dropdownToggleCount = await header.locator('.main-nav a[href="#"], .main-nav .fa-angle-down').count();
  const fluidContainerCount = await header.locator('.container-fluid').count();
  const hasSubmenuCount = await header.locator('.main-nav .has-submenu').count();
  const homeTemplateRouteCount = await header.locator('a[href^="/index-"]').count();
  return {
    path: new URL(page.url()).pathname,
    topNavLabels,
    dropdownToggleCount,
    fluidContainerCount,
    hasSubmenuCount,
    homeTemplateRouteCount,
  };
}

async function main() {
  const adminEmail = requireEnv('DEMO_ADMIN_EMAIL');
  requireEnv('DEMO_ADMIN_PASSWORD');

  await ensureDemoAccounts();
  await verifyDemoAdmin(adminEmail);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));

  let rootOk = false;
  let rootLabelsOk = false;
  let rootNoDropdowns = false;
  let rootFluid = false;
  let localTemplateDropdownsKept = false;
  let previewRoutesOk = false;
  let hiddenHomeTemplatesOk = false;

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    const rootState = await readHeaderState(page);
    rootOk = rootState.path === '/';
    rootLabelsOk =
      rootState.topNavLabels.length === EXPECTED_LABELS.length &&
      rootState.topNavLabels.every((label, index) => label === EXPECTED_LABELS[index]);
    rootNoDropdowns = rootState.dropdownToggleCount === 0;
    rootFluid = rootState.fluidContainerCount > 0;
    hiddenHomeTemplatesOk = rootState.homeTemplateRouteCount === 0;

    await page.goto(`${BASE_URL}/index-10`, { waitUntil: 'domcontentloaded' });
    const localState = await readHeaderState(page);
    localTemplateDropdownsKept = localState.hasSubmenuCount > 0 || localState.dropdownToggleCount > 0;

    await page.goto(`${BASE_URL}/index-3`, { waitUntil: 'domcontentloaded' });
    const previewOne = await readHeaderState(page);
    await page.goto(`${BASE_URL}/index-12`, { waitUntil: 'domcontentloaded' });
    const previewTwo = await readHeaderState(page);
    previewRoutesOk = previewOne.path === '/index-3' && previewTwo.path === '/index-12';

    const success =
      rootOk &&
      rootLabelsOk &&
      rootNoDropdowns &&
      rootFluid &&
      hiddenHomeTemplatesOk &&
      localTemplateDropdownsKept &&
      previewRoutesOk &&
      errors.length === 0;

    console.log(JSON.stringify({
      success,
      rootOk,
      rootLabelsOk,
      rootNoDropdowns,
      rootFluid,
      hiddenHomeTemplatesOk,
      localTemplateDropdownsKept,
      previewRoutesOk,
      rootTopNavLabels: rootState.topNavLabels,
      localPath: localState.path,
      errors,
    }));
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      rootOk,
      rootLabelsOk,
      rootNoDropdowns,
      rootFluid,
      hiddenHomeTemplatesOk,
      localTemplateDropdownsKept,
      previewRoutesOk,
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
