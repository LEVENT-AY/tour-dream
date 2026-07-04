import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'tour-tunisi';
const PREVIEW_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-import-preview.json');
const WRITE_REPORT_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-drafts-write-report.json');
const TARGET_COLLECTION = 'hotels';
const REQUIRED_SOURCE_NAME = 'Discover Tunisia';
const REVIEW_IMAGE_MODE_FLAG = '--update-review-images';

const cleanText = (value) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeText = (value) =>
  cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const normalizeWords = (value) =>
  cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const deterministicDraftId = (draft) => {
  const governorate = normalizeText(draft.governorate || draft.city || draft.tourismZone || 'tunisia');
  const hotelName = normalizeText(draft.hotelName || draft.title || 'hotel');
  return `imported-discover-tunisia-${governorate}-${hotelName}`.slice(0, 180);
};

const normalizeUrlList = (value) =>
  [...new Set((Array.isArray(value) ? value : []).map((entry) => cleanText(entry)).filter(Boolean))];

const appendUniqueNote = (existingNotes, addition) => {
  const notes = cleanText(existingNotes);
  const extra = cleanText(addition);
  if (!extra) return notes;
  if (!notes) return extra;
  if (notes.includes(extra)) return notes;
  return `${notes} ${extra}`.trim();
};

const arraysEqual = (left, right) =>
  JSON.stringify(normalizeUrlList(left)) === JSON.stringify(normalizeUrlList(right));

const nameSimilarityScore = (left, right) => {
  const leftWords = normalizeWords(left).split(' ').filter(Boolean);
  const rightWords = normalizeWords(right).split(' ').filter(Boolean);
  if (!leftWords.length || !rightWords.length) return 0;

  const leftSet = new Set(leftWords);
  const rightSet = new Set(rightWords);
  const intersection = [...leftSet].filter((word) => rightSet.has(word)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 0;
};

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore();
}

const ensureFileExists = (filePath, rerunCommand) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}. Run: ${rerunCommand}`);
  }
};

const isTargetImportedDraft = (draft) =>
  draft &&
  draft.isImportedDraft === true &&
  String(draft.importStatus || '').toLowerCase() === 'draft' &&
  String(draft.sourceName || '').toLowerCase() === REQUIRED_SOURCE_NAME.toLowerCase();

const isPreviewReviewCandidate = (draft) =>
  draft &&
  String(draft.sourceName || '').toLowerCase() === REQUIRED_SOURCE_NAME.toLowerCase() &&
  Array.isArray(draft.imageUrlsForReview) &&
  draft.imageUrlsForReview.length > 0;

const sameLocality = (draft, existingData) => {
  const draftLocality = normalizeText(draft.city || draft.tourismZone || '');
  const existingLocality = normalizeText(existingData.city || existingData.tourismZone || '');
  if (draftLocality && existingLocality && draftLocality === existingLocality) return true;

  const draftGovernorate = normalizeText(draft.governorate || '');
  const existingGovernorate = normalizeText(existingData.governorate || '');
  return Boolean(draftGovernorate && existingGovernorate && draftGovernorate === existingGovernorate);
};

const readImportedDraftDocs = async (db) => {
  const snapshot = await db
    .collection(TARGET_COLLECTION)
    .where('isImportedDraft', '==', true)
    .where('sourceName', '==', REQUIRED_SOURCE_NAME)
    .where('importStatus', '==', 'draft')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const findReviewImageMatch = (draft, existingImportedDrafts, deterministicId) => {
  const exactDoc = existingImportedDrafts.find((item) => item.id === deterministicId);
  if (exactDoc) {
    return { type: 'deterministic', doc: exactDoc };
  }

  const normalizedName = normalizeText(draft.hotelName || draft.title || '');
  const normalizedGovernorate = normalizeText(draft.governorate || '');
  const normalizedCity = normalizeText(draft.city || draft.tourismZone || '');

  const safeNameMatches = existingImportedDrafts.filter((item) => {
    const itemName = normalizeText(item.title || item.hotelName || '');
    const itemGovernorate = normalizeText(item.governorate || '');
    const itemCity = normalizeText(item.city || item.tourismZone || '');
    const exactName = normalizedName && itemName === normalizedName;
    const exactGovernorate = normalizedGovernorate && itemGovernorate === normalizedGovernorate;
    const exactCity = normalizedCity && itemCity === normalizedCity;
    return exactName && (exactCity || exactGovernorate);
  });

  if (safeNameMatches.length === 1) {
    return { type: 'safe_name', doc: safeNameMatches[0] };
  }

  if (safeNameMatches.length > 1) {
    return { type: 'ambiguous', candidates: safeNameMatches };
  }

  const highSimilarityMatches = existingImportedDrafts
    .filter((item) => {
      const itemGovernorate = normalizeText(item.governorate || '');
      return normalizedGovernorate && itemGovernorate === normalizedGovernorate;
    })
    .map((item) => ({
      item,
      similarity: nameSimilarityScore(draft.hotelName || draft.title || '', item.title || item.hotelName || ''),
    }))
    .filter(({ item, similarity }) => similarity >= 0.92 && sameLocality(draft, item));

  if (highSimilarityMatches.length === 1) {
    return { type: 'safe_name', doc: highSimilarityMatches[0].item };
  }

  if (highSimilarityMatches.length > 1) {
    return { type: 'ambiguous', candidates: highSimilarityMatches.map(({ item }) => item) };
  }

  return { type: 'missing_existing_doc' };
};

const buildReviewNote = (draft) =>
  draft.imageSourceName
    ? `Review images collected from ${draft.imageSourceName}; approve before publishing.`
    : '';

const buildUpdatePayload = (draft, existingData) => {
  const reviewNote = buildReviewNote(draft);
  const nextNotes = reviewNote ? appendUniqueNote(existingData.notes || '', reviewNote) : cleanText(existingData.notes || '');
  return {
    imageUrlsForReview: normalizeUrlList(draft.imageUrlsForReview),
    imageSourceName: cleanText(draft.imageSourceName || ''),
    imageSourceUrl: cleanText(draft.imageSourceUrl || ''),
    notes: nextNotes,
    updatedAt: new Date().toISOString(),
  };
};

const needsReviewImageUpdate = (existingData, draft) => {
  const reviewNote = buildReviewNote(draft);
  const nextNotes = reviewNote ? appendUniqueNote(existingData.notes || '', reviewNote) : cleanText(existingData.notes || '');
  return !arraysEqual(existingData.imageUrlsForReview, draft.imageUrlsForReview)
    || cleanText(existingData.imageSourceName || '') !== cleanText(draft.imageSourceName || '')
    || cleanText(existingData.imageSourceUrl || '') !== cleanText(draft.imageSourceUrl || '')
    || cleanText(existingData.notes || '') !== nextNotes;
};

async function main() {
  const dryRun = !process.argv.includes('--write');
  const updateReviewImages = process.argv.includes(REVIEW_IMAGE_MODE_FLAG);

  ensureFileExists(PREVIEW_PATH, 'node scripts/import-tunisia-hotels-drafts.mjs');

  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  const previewDrafts = Array.isArray(preview.drafts) ? preview.drafts : [];
  const eligibleDrafts = previewDrafts.filter(isPreviewReviewCandidate);

  const db = initAdminSdk();
  const existingImportedDrafts = updateReviewImages ? await readImportedDraftDocs(db) : [];
  const summary = {
    generatedAt: new Date().toISOString(),
    dryRun,
    updateReviewImages,
    totalInput: previewDrafts.length,
    eligible: eligibleDrafts.length,
    eligibleUpdateReviewImages: eligibleDrafts.length,
    deterministicMatches: 0,
    safeNameMatches: 0,
    ambiguousMatches: 0,
    missingExistingDoc: 0,
    written: 0,
    skipped: 0,
    alreadyExists: 0,
    errors: 0,
    writtenDocIds: [],
    wouldUpdateDocIds: [],
    skippedItems: [],
  };

  for (const draft of eligibleDrafts) {
    const deterministicId = deterministicDraftId(draft);
    try {
      const match = updateReviewImages
        ? findReviewImageMatch(draft, existingImportedDrafts, deterministicId)
        : { type: 'missing_existing_doc' };

      if (match.type === 'missing_existing_doc') {
        summary.missingExistingDoc += 1;
        summary.skipped += 1;
        summary.skippedItems.push({
          docId: deterministicId,
          hotelName: draft.hotelName || draft.title || '',
          reason: 'missing_existing_doc',
        });
        continue;
      }

      if (match.type === 'ambiguous') {
        summary.ambiguousMatches += 1;
        summary.skipped += 1;
        summary.skippedItems.push({
          docId: deterministicId,
          hotelName: draft.hotelName || draft.title || '',
          reason: 'ambiguous_match',
          candidateDocIds: (match.candidates || []).map((item) => item.id),
        });
        continue;
      }

      const docId = match.doc.id;
      if (match.type === 'deterministic') {
        summary.deterministicMatches += 1;
      } else if (match.type === 'safe_name') {
        summary.safeNameMatches += 1;
      }

      summary.alreadyExists += 1;
      const existingData = match.doc;

      if (!isTargetImportedDraft(existingData)) {
        summary.skipped += 1;
        summary.skippedItems.push({
          docId,
          hotelName: draft.hotelName || draft.title || '',
          reason: 'not_target_imported_draft',
        });
        continue;
      }

      if (!needsReviewImageUpdate(existingData, draft)) {
        summary.skipped += 1;
        summary.skippedItems.push({
          docId,
          hotelName: draft.hotelName || draft.title || '',
          reason: 'no_change',
        });
        continue;
      }

      if (dryRun) {
        summary.skipped += 1;
        summary.wouldUpdateDocIds.push(docId);
        summary.skippedItems.push({
          docId,
          hotelName: draft.hotelName || draft.title || '',
          reason: 'dry_run',
          matchType: match.type,
        });
        continue;
      }

      const docRef = db.collection(TARGET_COLLECTION).doc(docId);
      await docRef.set(buildUpdatePayload(draft, existingData), { merge: true });
      summary.written += 1;
      summary.writtenDocIds.push(docId);
      summary.wouldUpdateDocIds.push(docId);
    } catch (error) {
      summary.errors += 1;
      summary.skippedItems.push({
        docId: deterministicId,
        hotelName: draft.hotelName || draft.title || '',
        reason: 'error',
        message: error?.message || String(error),
      });
    }
  }

  fs.mkdirSync(path.dirname(WRITE_REPORT_PATH), { recursive: true });
  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({
    dryRun,
    updateReviewImages,
    totalInputDrafts: summary.totalInput,
    eligibleUpdateReviewImages: summary.eligible,
    deterministicMatches: summary.deterministicMatches,
    safeNameMatches: summary.safeNameMatches,
    ambiguousMatches: summary.ambiguousMatches,
    missingExistingDoc: summary.missingExistingDoc,
    skipped: summary.skipped,
    alreadyExists: summary.alreadyExists,
    written: summary.written,
    errors: summary.errors,
    reportPath: WRITE_REPORT_PATH,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
