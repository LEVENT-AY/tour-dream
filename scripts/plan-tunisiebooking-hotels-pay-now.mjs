import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const root = process.cwd();
const tmpDir = path.join(root, 'tmp');
const jsonPath = path.join(tmpDir, 'tunisiebooking-hotels-pay-now-plan.json');
const mdPath = path.join(tmpDir, 'tunisiebooking-hotels-pay-now-plan.md');
const shouldWrite = process.argv.includes('--write');

const ensureTmpDir = () => {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const isTunisieBookingDoc = (doc) => {
  const importSource = String(doc.importSource || '').toLowerCase();
  const sourceName = String(doc.sourceName || '').toLowerCase();
  const sourceUrl = String(doc.sourceUrl || doc.sourceListingUrl || '').toLowerCase();
  return importSource === 'tunisiebooking' || sourceName === 'tunisiebooking' || sourceUrl.includes('tunisiebooking');
};

const priceFromNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const priceCurrencyValue = (doc) => clean(doc.priceCurrency || doc.currency || (String(doc.importSource || doc.sourceName || '').toLowerCase().includes('tunisiebooking') ? 'EUR' : ''));

if (admin.getApps().length === 0) {
  admin.initializeApp({ projectId: 'tour-tunisi' });
}

const db = getFirestore();
const snapshot = await db.collection('hotels').get();
const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const tunisieBookingDocs = docs.filter(isTunisieBookingDoc);

const proposedUpdates = tunisieBookingDocs.map((doc) => {
  const priceFrom = priceFromNumber(doc.priceFrom);
  const priceCurrency = priceCurrencyValue(doc);
  const paymentReady = priceFrom !== null && Boolean(priceCurrency);
  return {
    id: doc.id,
    title: clean(doc.title || doc.hotelName || ''),
    published: doc.published === true,
    bookingMode: 'pay_now',
    paymentMode: 'manual_payment',
    priceFrom,
    priceCurrency,
    paymentReady,
    needsAdminPrice: !paymentReady,
    proposedUpdate: {
      bookingMode: 'pay_now',
      paymentMode: 'manual_payment',
      bookingEnabled: paymentReady,
      paymentReady,
      priceCurrency,
      ...(paymentReady
        ? {}
        : {
            paymentDisabledReason: 'missing_price',
            adminActionRequired: 'add_price',
          }),
    },
  };
});

const totalImported = tunisieBookingDocs.length;
const publishedCount = proposedUpdates.filter((item) => item.published).length;
const withPriceCount = proposedUpdates.filter((item) => item.priceFrom !== null).length;
const withoutPriceCount = totalImported - withPriceCount;
const paymentReadyCount = proposedUpdates.filter((item) => item.paymentReady).length;
const needsAdminPriceCount = proposedUpdates.filter((item) => item.needsAdminPrice).length;
const payNowModeCount = totalImported;
const proposedPayNowCount = totalImported;
const wouldUpdate = totalImported;
const paymentReadyHotels = proposedUpdates.filter((item) => item.paymentReady);
const needsAdminPriceHotels = proposedUpdates.filter((item) => item.needsAdminPrice);

const report = {
  totalImported,
  publishedCount,
  payNowModeCount,
  proposedPayNowCount,
  withPriceCount,
  withoutPriceCount,
  paymentReadyCount,
  needsAdminPriceCount,
  wouldUpdate,
  proposedUpdates,
  paymentReadyHotels,
  needsAdminPriceHotels,
};

if (shouldWrite) {
  const batchSize = 400;
  const chunks = [];
  for (let i = 0; i < proposedUpdates.length; i += batchSize) {
    chunks.push(proposedUpdates.slice(i, i + batchSize));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    for (const item of chunk) {
      const ref = db.collection('hotels').doc(item.id);
      const update = {
        bookingMode: 'pay_now',
        paymentMode: 'manual_payment',
        bookingEnabled: item.paymentReady,
        paymentReady: item.paymentReady,
      };
      if (item.paymentReady) {
        update.paymentDisabledReason = FieldValue.delete();
        update.adminActionRequired = FieldValue.delete();
      } else {
        update.paymentDisabledReason = 'missing_price';
        update.adminActionRequired = 'add_price';
      }
      batch.update(ref, update);
    }
    await batch.commit();
  }
  report.writeResult = {
    updatedDocs: proposedUpdates.length,
    paymentReadyDocs: paymentReadyHotels.length,
    needsAdminPriceDocs: needsAdminPriceHotels.length,
  };
}

ensureTmpDir();
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(
  mdPath,
  [
    '# TunisieBooking Pay Now Plan',
    '',
    `- Total imported hotels: ${totalImported}`,
    `- Published hotels: ${publishedCount}`,
    `- Pay now mode count: ${payNowModeCount}`,
    `- Proposed pay_now count: ${proposedPayNowCount}`,
    `- Hotels with priceFrom: ${withPriceCount}`,
    `- Hotels missing priceFrom: ${withoutPriceCount}`,
    `- Payment-ready hotels: ${paymentReadyCount}`,
    `- Need admin price first: ${needsAdminPriceCount}`,
    `- Would update: ${wouldUpdate}`,
    shouldWrite ? `- Write result: updated ${proposedUpdates.length} docs` : '',
    '',
    '## Proposed updates',
    ...proposedUpdates.map((item) =>
      `- ${item.title || item.id} (${item.id}) => pay_now${item.paymentReady ? ' [payment ready]' : ' [needs price]'}`),
    '',
    '## Payment-ready hotels',
    ...paymentReadyHotels.map((item) => `- ${item.title || item.id} (${item.id})`),
    '',
    '## Hotels needing admin price',
    ...needsAdminPriceHotels.map((item) => `- ${item.title || item.id} (${item.id})`),
    '',
  ].join('\n'),
);

console.log(JSON.stringify(report, null, 2));
