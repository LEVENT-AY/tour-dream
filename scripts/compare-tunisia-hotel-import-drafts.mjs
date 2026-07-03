import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'tour-tunisi';
const PREVIEW_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-import-preview.json');
const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-duplicate-report.json');
const ALLOWED_MATCH_STATUSES = new Set(['new_candidate', 'possible_duplicate', 'strong_duplicate']);
const ALLOWED_RECOMMENDED_ACTIONS = new Set(['create_draft', 'review_duplicate', 'skip_existing']);

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
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizePhone = (value) => String(value || '').replace(/[^\d]/g, '');

const normalizeEmail = (value) => cleanText(value).toLowerCase().replace(/\s+/g, '');

const normalizeWebsite = (value) =>
  cleanText(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .trim();

const getWordSet = (value) => new Set(normalizeText(value).split(' ').filter(Boolean));

const wordJaccard = (left, right) => {
  const leftSet = getWordSet(left);
  const rightSet = getWordSet(right);
  if (!leftSet.size || !rightSet.size) return 0;

  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }
  return intersection / new Set([...leftSet, ...rightSet]).size;
};

const getBigrams = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, '');
  if (normalized.length < 2) return new Set(normalized ? [normalized] : []);
  const result = new Set();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
};

const bigramDice = (left, right) => {
  const leftSet = getBigrams(left);
  const rightSet = getBigrams(right);
  if (!leftSet.size || !rightSet.size) return 0;

  let overlap = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) overlap += 1;
  }
  return (2 * overlap) / (leftSet.size + rightSet.size);
};

const similarity = (left, right) => {
  const leftNormalized = normalizeText(left);
  const rightNormalized = normalizeText(right);
  if (!leftNormalized || !rightNormalized) return 0;
  if (leftNormalized === rightNormalized) return 1;
  if (leftNormalized.includes(rightNormalized) || rightNormalized.includes(leftNormalized)) return 0.93;
  return Math.max(wordJaccard(left, right), bigramDice(left, right));
};

const tokensContainPhrase = (haystack, needle) => {
  const haystackTokens = normalizeText(haystack).split(' ').filter(Boolean);
  const needleTokens = normalizeText(needle).split(' ').filter(Boolean);
  if (!haystackTokens.length || !needleTokens.length || needleTokens.length > haystackTokens.length) return false;

  for (let start = 0; start <= haystackTokens.length - needleTokens.length; start += 1) {
    if (needleTokens.every((token, offset) => haystackTokens[start + offset] === token)) {
      return true;
    }
  }
  return false;
};

const sameLocality = (importDraft, existingHotel) => {
  const importValues = [
    importDraft.city,
    importDraft.tourismZone,
    importDraft.governorate,
  ].filter(Boolean);
  const existingValues = [
    existingHotel.city,
    existingHotel.tourismZone,
    existingHotel.governorate,
    existingHotel.location,
    existingHotel.address,
  ].filter(Boolean);

  return importValues.some((importValue) =>
    existingValues.some((existingValue) =>
      normalizeText(importValue) === normalizeText(existingValue) ||
      tokensContainPhrase(existingValue, importValue) ||
      tokensContainPhrase(importValue, existingValue),
    ),
  );
};

const sameGovernorate = (importDraft, existingHotel) =>
  Boolean(importDraft.governorate && existingHotel.governorate) &&
  normalizeText(importDraft.governorate) === normalizeText(existingHotel.governorate);

const sameCountry = (importDraft, existingHotel) =>
  Boolean(importDraft.country && existingHotel.country) &&
  normalizeText(importDraft.country) === normalizeText(existingHotel.country);

const phonePartiallyMatches = (left, right) => {
  const leftDigits = normalizePhone(left);
  const rightDigits = normalizePhone(right);
  if (!leftDigits || !rightDigits) return false;
  if (leftDigits === rightDigits) return true;
  if (leftDigits.length >= 6 && rightDigits.length >= 6) {
    return leftDigits.slice(-6) === rightDigits.slice(-6);
  }
  return false;
};

const mapExistingHotel = (docSnapshot) => {
  const data = docSnapshot.data() || {};
  return {
    id: docSnapshot.id,
    title: cleanText(data.title || data.name || ''),
    name: cleanText(data.name || data.title || ''),
    city: cleanText(data.city || ''),
    governorate: cleanText(data.governorate || ''),
    tourismZone: cleanText(data.tourismZone || ''),
    country: cleanText(data.country || ''),
    location: cleanText(data.location || ''),
    address: cleanText(data.address || ''),
    phone: cleanText(data.phone || data.whatsapp || ''),
    email: cleanText(data.email || ''),
    website: cleanText(data.website || ''),
    published: data.published === true,
  };
};

const evaluateMatch = (importDraft, existingHotel) => {
  const nameScore = similarity(importDraft.hotelName || importDraft.title, existingHotel.title || existingHotel.name);
  const addressScore = similarity(importDraft.address, existingHotel.address);
  const importPhone = normalizePhone(importDraft.phone);
  const existingPhone = normalizePhone(existingHotel.phone);
  const importEmail = normalizeEmail(importDraft.email);
  const existingEmail = normalizeEmail(existingHotel.email);
  const importWebsite = normalizeWebsite(importDraft.website);
  const existingWebsite = normalizeWebsite(existingHotel.website);

  const reasons = [];
  let score = 0;

  if (importWebsite && existingWebsite && importWebsite === existingWebsite) {
    score = 100;
    reasons.push('Normalized website matched exactly.');
  } else if (importEmail && existingEmail && importEmail === existingEmail) {
    score = 95;
    reasons.push('Normalized email matched exactly.');
  } else if (importPhone && existingPhone && importPhone === existingPhone && nameScore >= 0.72) {
    score = 90;
    reasons.push('Phone matched exactly and hotel names are similar.');
  } else if (nameScore >= 0.88 && sameLocality(importDraft, existingHotel)) {
    score = 86;
    reasons.push('Hotel names are very similar and locality matched.');
  } else if (nameScore >= 0.72 && sameGovernorate(importDraft, existingHotel)) {
    score = 72;
    reasons.push('Hotel names are similar and governorate matched.');
  } else if (addressScore >= 0.78) {
    score = 60;
    reasons.push('Addresses are similar.');
  } else if (phonePartiallyMatches(importPhone, existingPhone) && nameScore >= 0.55) {
    score = 55;
    reasons.push('Phone partially matched and hotel names are moderately similar.');
  } else if (nameScore >= 0.68 && sameCountry(importDraft, existingHotel)) {
    score = 52;
    reasons.push('Hotel names are somewhat similar and country matched.');
  }

  if (sameLocality(importDraft, existingHotel) && !reasons.some((reason) => reason.toLowerCase().includes('locality'))) {
    reasons.push('Locality fields overlap.');
  }
  if (sameGovernorate(importDraft, existingHotel) && !reasons.some((reason) => reason.toLowerCase().includes('governorate'))) {
    reasons.push('Governorate matched.');
  }
  if (addressScore >= 0.6 && !reasons.some((reason) => reason.toLowerCase().includes('address'))) {
    reasons.push('Addresses have moderate similarity.');
  }

  let matchStatus = 'new_candidate';
  let recommendedAction = 'create_draft';

  if (score >= 85) {
    matchStatus = 'strong_duplicate';
    recommendedAction = 'skip_existing';
  } else if (score >= 55) {
    matchStatus = 'possible_duplicate';
    recommendedAction = 'review_duplicate';
  }

  return {
    matchStatus,
    matchedHotelId: existingHotel.id,
    matchedHotelTitle: existingHotel.title || existingHotel.name || '',
    matchedHotelLocation: [existingHotel.city, existingHotel.governorate, existingHotel.location].filter(Boolean).join(' | '),
    matchedReasons: reasons,
    score,
    recommendedAction,
  };
};

const summarizeByZone = (items) => {
  const summary = {};
  for (const item of items) {
    const zoneKey = item.importGovernorate || item.importCity || 'Unknown';
    summary[zoneKey] ??= {
      total: 0,
      newCandidates: 0,
      possibleDuplicates: 0,
      strongDuplicates: 0,
    };
    summary[zoneKey].total += 1;
    if (item.matchStatus === 'new_candidate') summary[zoneKey].newCandidates += 1;
    if (item.matchStatus === 'possible_duplicate') summary[zoneKey].possibleDuplicates += 1;
    if (item.matchStatus === 'strong_duplicate') summary[zoneKey].strongDuplicates += 1;
  }
  return summary;
};

function initAdminSdk() {
  if (admin.getApps().length === 0) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  return getFirestore();
}

async function readExistingHotelsReadOnly() {
  try {
    const db = initAdminSdk();
    const snapshot = await db.collection('hotels').get();
    return snapshot.docs.map(mapExistingHotel);
  } catch (error) {
    const reason = error?.message || String(error);
    throw new Error(
      `Firestore read failed. Ensure Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS are available for project ${PROJECT_ID}. Original error: ${reason}`,
    );
  }
}

async function main() {
  if (!fs.existsSync(PREVIEW_PATH)) {
    throw new Error(`Missing preview JSON at ${PREVIEW_PATH}. Run: node scripts/import-tunisia-hotels-drafts.mjs`);
  }

  const preview = JSON.parse(fs.readFileSync(PREVIEW_PATH, 'utf8'));
  const importedDrafts = Array.isArray(preview.drafts) ? preview.drafts : [];
  const existingHotels = await readExistingHotelsReadOnly();

  const items = importedDrafts.map((draft) => {
    const bestMatch = existingHotels
      .map((hotel) => evaluateMatch(draft, hotel))
      .sort((left, right) => right.score - left.score)[0];

    if (!bestMatch || bestMatch.score === 0) {
      return {
        importHotelName: draft.hotelName || draft.title || '',
        importCity: draft.city || draft.tourismZone || '',
        importGovernorate: draft.governorate || '',
        sourceUrl: draft.sourceUrl || '',
        matchStatus: 'new_candidate',
        matchedHotelId: null,
        matchedHotelTitle: '',
        matchedHotelLocation: '',
        matchedReasons: [],
        score: 0,
        recommendedAction: 'create_draft',
      };
    }

    return {
      importHotelName: draft.hotelName || draft.title || '',
      importCity: draft.city || draft.tourismZone || '',
      importGovernorate: draft.governorate || '',
      sourceUrl: draft.sourceUrl || '',
      ...bestMatch,
    };
  });

  for (const item of items) {
    if (!ALLOWED_MATCH_STATUSES.has(item.matchStatus)) {
      throw new Error(`Unexpected matchStatus in report generation: ${item.matchStatus}`);
    }
    if (!ALLOWED_RECOMMENDED_ACTIONS.has(item.recommendedAction)) {
      throw new Error(`Unexpected recommendedAction in report generation: ${item.recommendedAction}`);
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalImported: importedDrafts.length,
    totalExistingHotelsRead: existingHotels.length,
    newCandidates: items.filter((item) => item.matchStatus === 'new_candidate').length,
    possibleDuplicates: items.filter((item) => item.matchStatus === 'possible_duplicate').length,
    strongDuplicates: items.filter((item) => item.matchStatus === 'strong_duplicate').length,
    byZone: summarizeByZone(items),
  };

  const report = {
    ...summary,
    items,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

  console.log(`Duplicate report saved to ${OUTPUT_PATH}`);
  console.log(JSON.stringify(summary, null, 2));

  const topDuplicates = items
    .filter((item) => item.matchStatus !== 'new_candidate')
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);

  if (topDuplicates.length) {
    console.log('Top duplicate examples:');
    topDuplicates.forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.importHotelName} -> ${item.matchedHotelTitle} [${item.matchStatus}] score=${item.score} reasons=${item.matchedReasons.join('; ')}`,
      );
    });
  } else {
    console.log('Top duplicate examples: none found.');
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
