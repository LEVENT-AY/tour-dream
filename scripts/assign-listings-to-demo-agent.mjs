import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { ensureDemoAccounts } from './ensure-demo-accounts.mjs';

const PROJECT_ID = 'tour-tunisi';
const LISTING_COLLECTIONS = ['tours', 'hotels', 'flights', 'cars', 'activities', 'resorts', 'chalets'];
const OWNERSHIP_UID_FIELDS = ['agentId', 'agentUid', 'ownerId', 'userId', 'createdBy', 'listingOwnerId', 'hostId', 'vendorId', 'companyId'];
const OWNERSHIP_EMAIL_FIELDS = ['agentEmail', 'createdByEmail'];

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

async function resolveDemoAgent(email) {
  const { auth, db } = initAdminSdk();
  const user = await auth.getUserByEmail(email);
  const profileSnap = await db.collection('users').doc(user.uid).get();

  if (!profileSnap.exists) {
    throw new Error('Missing Firestore profile for demo agent.');
  }

  const profile = profileSnap.data() || {};
  if (profile.role !== 'agent' || user.customClaims?.role !== 'agent') {
    throw new Error('Demo agent role is invalid.');
  }

  if (profile.agentStatus !== 'approved' || profile.approved !== true || profile.suspended === true) {
    throw new Error('Demo agent is not in an approved active state.');
  }

  return {
    uid: user.uid,
    email: user.email || email,
    displayName: profile.displayName || user.displayName || '',
    role: profile.role || 'agent',
    status: profile.agentStatus || 'approved',
  };
}

function buildOwnershipPayload(documentData, agent) {
  const payload = {
    agentId: agent.uid,
    ownerId: agent.uid,
    userId: agent.uid,
    createdBy: agent.uid,
    updatedAt: new Date().toISOString(),
  };

  for (const field of OWNERSHIP_UID_FIELDS) {
    if (field in documentData) {
      payload[field] = agent.uid;
    }
  }

  for (const field of OWNERSHIP_EMAIL_FIELDS) {
    if (field in documentData) {
      payload[field] = agent.email;
    }
  }

  return payload;
}

function extractObservedOwnershipFields(documentData) {
  return [...OWNERSHIP_UID_FIELDS, ...OWNERSHIP_EMAIL_FIELDS].filter((field) => field in documentData);
}

async function writeCollectionAssignments(db, collectionName, docs, agent) {
  const batchSize = 400;
  let written = 0;

  for (let index = 0; index < docs.length; index += batchSize) {
    const batch = db.batch();
    const chunk = docs.slice(index, index + batchSize);

    chunk.forEach((docSnap) => {
      const data = docSnap.data() || {};
      batch.set(docSnap.ref, buildOwnershipPayload(data, agent), { merge: true });
      written += 1;
    });

    await batch.commit();
  }

  return { collectionName, written };
}

async function inspectCollection(db, collectionName, agent) {
  const snapshot = await db.collection(collectionName).get();
  const docs = snapshot.docs;

  let assignedToAgent = 0;
  const observedOwnershipFields = new Set();
  const sampleIds = [];
  const sampleTitles = [];

  docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const matches =
      data.agentId === agent.uid ||
      data.agentUid === agent.uid ||
      data.ownerId === agent.uid ||
      data.userId === agent.uid ||
      data.createdBy === agent.uid;
    if (matches) assignedToAgent += 1;

    extractObservedOwnershipFields(data).forEach((field) => observedOwnershipFields.add(field));

    if (sampleIds.length < 3) {
      sampleIds.push(docSnap.id);
      sampleTitles.push(String(data.title || data.name || data.itemTitle || 'Untitled'));
    }
  });

  return {
    collectionName,
    totalDocs: docs.length,
    assignedToAgent,
    unassignedDocs: docs.length - assignedToAgent,
    observedOwnershipFields: Array.from(observedOwnershipFields),
    sampleIds,
    sampleTitles,
    docs,
  };
}

async function main() {
  const writeMode = process.argv.includes('--write');
  requireEnv('DEMO_ADMIN_EMAIL');
  const agentEmail = requireEnv('DEMO_AGENT_EMAIL');
  requireEnv('DEMO_ADMIN_PASSWORD');
  requireEnv('DEMO_AGENT_PASSWORD');
  requireEnv('DEMO_CUSTOMER_EMAIL');
  requireEnv('DEMO_CUSTOMER_PASSWORD');

  await ensureDemoAccounts();

  const agent = await resolveDemoAgent(agentEmail);

  const { db } = initAdminSdk();
  const collectionSummaries = [];
  const skippedCollections = [];
  const writeSummaries = [];

  for (const collectionName of LISTING_COLLECTIONS) {
    const summary = await inspectCollection(db, collectionName, agent);
    collectionSummaries.push(summary);

    if (summary.totalDocs === 0) {
      skippedCollections.push({ collectionName, reason: 'No documents found' });
      continue;
    }

    if (writeMode) {
      writeSummaries.push(await writeCollectionAssignments(db, collectionName, summary.docs, agent));
    }
  }

  const output = {
    success: true,
    writeMode,
    agent,
    collections: collectionSummaries.map(({ docs, ...rest }) => rest),
    skippedCollections,
    writeSummaries,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.log(JSON.stringify({
    success: false,
    reason: error.message || String(error),
  }));
  process.exit(1);
});
