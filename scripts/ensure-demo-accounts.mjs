import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'tour-tunisi';
export const DEMO_PASSWORD = '123123123';
const REQUIRED_ENV_VARS = [
  'DEMO_ADMIN_EMAIL',
  'DEMO_AGENT_EMAIL',
  'DEMO_CUSTOMER_EMAIL',
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
  return { auth: getAuth(), db: getFirestore() };
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'hidden';
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

async function ensureAuthUser(auth, { email, password, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });
    return { user: await auth.getUser(existing.uid), created: false };
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }

    const created = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });
    return { user: created, created: true };
  }
}

async function ensureFirestoreProfile(db, user, profilePatch) {
  const profileRef = db.collection('users').doc(user.uid);
  const existing = await profileRef.get();
  const now = new Date().toISOString();

  const baseProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || profilePatch.displayName || '',
    createdAt: existing.exists ? existing.data().createdAt || now : now,
    updatedAt: now,
  };

  await profileRef.set({
    ...baseProfile,
    ...profilePatch,
  }, { merge: true });
}

export async function ensureDemoAccounts() {
  for (const envVar of REQUIRED_ENV_VARS) {
    requireEnv(envVar);
  }

  const { auth, db } = initAdminSdk();

  const accounts = [
    {
      key: 'admin',
      email: requireEnv('DEMO_ADMIN_EMAIL'),
      password: DEMO_PASSWORD,
      displayName: 'Demo Admin',
      claims: { role: 'admin' },
      profile: {
        role: 'admin',
        suspended: false,
      },
    },
    {
      key: 'agent',
      email: requireEnv('DEMO_AGENT_EMAIL'),
      password: DEMO_PASSWORD,
      displayName: 'Demo Agent',
      claims: { role: 'agent' },
      profile: {
        role: 'agent',
        agentStatus: 'approved',
        approved: true,
        suspended: false,
        approvedAt: new Date().toISOString(),
      },
    },
    {
      key: 'customer',
      email: requireEnv('DEMO_CUSTOMER_EMAIL'),
      password: DEMO_PASSWORD,
      displayName: 'Demo Customer',
      claims: { role: 'customer' },
      profile: {
        role: 'customer',
        suspended: false,
      },
    },
  ];

  const results = [];

  for (const account of accounts) {
    const { user, created } = await ensureAuthUser(auth, account);
    await auth.setCustomUserClaims(user.uid, account.claims);
    await ensureFirestoreProfile(db, user, account.profile);

    results.push({
      key: account.key,
      email: maskEmail(account.email),
      uid: user.uid,
      created,
      ensured: true,
    });
  }

  return results;
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('ensure-demo-accounts.mjs');

if (isDirectRun) {
  ensureDemoAccounts()
    .then((results) => {
      console.log(JSON.stringify({
        ensured: true,
        accounts: results.map(({ key, email, created }) => ({ key, email, created })),
      }));
    })
    .catch((error) => {
      const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
      console.error(JSON.stringify({
        ensured: false,
        missingEnvVars: missing,
        reason: error.message || String(error),
      }));
      process.exit(1);
    });
}
