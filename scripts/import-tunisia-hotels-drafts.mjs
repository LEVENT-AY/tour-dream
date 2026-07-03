import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-import-preview.json');
const QUALITY_REPORT_PATH = path.join(process.cwd(), 'tmp', 'tunisia-hotel-import-quality-report.json');
const REQUEST_DELAY_MS = 10_000;
const MAX_TOTAL_HOTELS = 35;
const MAX_PER_ZONE = 5;
const SOURCE_NAME = 'Discover Tunisia';
const BASE_SOURCE_URL = 'https://www.discovertunisia.com/en/tourist_information';
const HOTEL_CATEGORY_ID = '33';
const USER_AGENT = 'DreamsTourTunisiaHotelImporterPOC/1.0 (+local admin preview only)';

const TARGET_ZONES = [
  {
    key: 'tunis',
    governorate: 'Tunis',
    tourismZoneLabel: 'Tunis',
    regionIds: ['28'],
    aliases: ['tunis', 'bardo', 'le bardo', 'la soukra', 'ariana', 'carthage', 'la marsa', 'gammarth', 'lac 1', 'lac1', 'lac 2', 'lac2'],
  },
  {
    key: 'nabeul_hammamet',
    governorate: 'Nabeul',
    tourismZoneLabel: 'Nabeul / Hammamet',
    regionIds: ['21', '29'],
    aliases: ['nabeul', 'hammamet', 'yasmine hammamet', 'korba', 'kelibia'],
  },
  {
    key: 'sousse',
    governorate: 'Sousse',
    tourismZoneLabel: 'Sousse',
    regionIds: ['24'],
    aliases: ['sousse', 'port el kantaoui', 'kantaoui'],
  },
  {
    key: 'monastir',
    governorate: 'Monastir',
    tourismZoneLabel: 'Monastir',
    regionIds: ['20'],
    aliases: ['monastir', 'skanes'],
  },
  {
    key: 'mahdia',
    governorate: 'Mahdia',
    tourismZoneLabel: 'Mahdia',
    regionIds: ['19'],
    aliases: ['mahdia'],
  },
  {
    key: 'medenine_djerba',
    governorate: 'Medenine',
    tourismZoneLabel: 'Medenine / Djerba',
    regionIds: ['14'],
    aliases: ['djerba', 'houmt souk', 'midoun', 'zarzis'],
  },
  {
    key: 'tozeur',
    governorate: 'Tozeur',
    tourismZoneLabel: 'Tozeur',
    regionIds: ['16'],
    aliases: ['tozeur', 'nefta'],
  },
];

const REGION_LABELS = {
  '14': 'Djerba-Zarzis',
  '16': 'Gafsa-Tozeur',
  '19': 'Mahdia',
  '20': 'Monastir-Skanes',
  '21': 'Nabeul-Hammamet',
  '24': 'Sousse',
  '28': 'Tunis-Côte de Carthage',
  '29': 'Yasmine-Hammamet',
};

const MOJIBAKE_PATTERN = /Ã|Â|â€|ï¿½|�/;
const INVALID_TITLE_PATTERN = /^\?[\?\s]+$/;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtmlEntities = (value) =>
  String(value || '')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const hasMojibake = (value) => MOJIBAKE_PATTERN.test(String(value || ''));

const repairMojibake = (value) => {
  const input = String(value || '');
  if (!hasMojibake(input)) return input;

  try {
    const repaired = Buffer.from(input, 'latin1').toString('utf8');
    return hasMojibake(repaired) ? input : repaired;
  } catch {
    return input;
  }
};

const cleanText = (value) =>
  repairMojibake(
    decodeHtmlEntities(String(value || ''))
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

const cleanAddress = (value) =>
  cleanText(value)
    .replace(/\b(\d+)(Rue)\b/g, '$1 $2')
    .replace(/\b(\d+)(Avenue)\b/g, '$1 $2')
    .trim();

const stripTags = (value) => cleanText(String(value || '').replace(/<[^>]+>/g, ' '));

const normalizeText = (value) =>
  cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '');

const hasSuspiciousPhone = (value) => {
  const digits = normalizePhone(value);
  return Boolean(digits) && (digits.length > 12 || digits.length < 8);
};

const normalizeEmail = (value) =>
  cleanText(String(value || '').replace(/^mailto:/i, ''))
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();

const normalizeWebsite = (value) => {
  const cleaned = cleanText(value)
    .replace(/\s+/g, '')
    .replace(/^(https?:\/\/)?(www\.)?/i, '')
    .replace(/\/+$/, '');

  if (!cleaned || !cleaned.includes('.')) return '';
  if (!/^[a-z0-9.-]+$/i.test(cleaned) || cleaned.includes('..') || cleaned.startsWith('-') || cleaned.endsWith('-')) {
    return '';
  }

  const labels = cleaned.split('.');
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-') || label.includes('_'))) {
    return '';
  }

  const tld = labels.at(-1) || '';
  if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return '';
  }

  return `https://${cleaned.toLowerCase()}`;
};

const parseContactNumber = (value, label) => {
  const raw = cleanText(value);
  if (!raw) {
    return { primary: '', allValues: [], warning: '' };
  }

  const values = raw
    .split(/[\/|-]/)
    .map((part) => normalizePhone(part))
    .filter(Boolean);

  if (!values.length) {
    return { primary: '', allValues: [], warning: `${label} could not be parsed from "${raw}".` };
  }

  const primary = values.find((item) => !hasSuspiciousPhone(item)) || values[0];
  const warningParts = [];

  if (values.length > 1) {
    warningParts.push(`${label} had multiple numbers in source (${values.join(', ')}); kept ${primary}.`);
  }

  if (hasSuspiciousPhone(primary)) {
    warningParts.push(`${label} looks suspicious after normalization (${primary}).`);
  }

  return {
    primary,
    allValues: values,
    warning: warningParts.join(' '),
  };
};

const buildSourceUrl = (regionId, page = 0) => {
  const params = new URLSearchParams({
    field_designation_crt_tid: regionId,
    shs_term_node_tid_depth: HOTEL_CATEGORY_ID,
    title: '',
  });
  if (page > 0) {
    params.set('page', String(page));
  }
  return `${BASE_SOURCE_URL}?${params.toString()}`;
};

const detectCharset = (contentType) => {
  const match = String(contentType || '').match(/charset=([^;]+)/i);
  return match?.[1]?.trim().toLowerCase() || 'utf-8';
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) {
    throw new Error(`Source request failed: ${response.status} ${response.statusText} for ${url}`);
  }

  const charset = detectCharset(response.headers.get('content-type'));
  const buffer = Buffer.from(await response.arrayBuffer());

  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
};

const extractRowBlocks = (html) => {
  const markerRegex = /<li class="views-row[^"]*li-list-search">/g;
  const markers = [...html.matchAll(markerRegex)];
  if (!markers.length) return [];

  return markers.map((marker, index) => {
    const start = marker.index ?? 0;
    const end = index + 1 < markers.length ? markers[index + 1].index : html.indexOf('</ul>', start);
    return html.slice(start, end === -1 ? undefined : end);
  });
};

const extractFieldBlock = (block, fieldClass) => {
  const pattern = new RegExp(
    `<div class="views-field ${fieldClass}">([\\s\\S]*?)<\\/div>\\s*(?=<div class="views-field|$)`,
    'i',
  );
  const match = block.match(pattern);
  return match ? match[1] : '';
};

const extractTitle = (block) => {
  const fieldBlock = extractFieldBlock(block, 'views-field-title');
  if (!fieldBlock) return '';
  return cleanText(stripTags(fieldBlock).replace(/^Designation\s+/i, ''));
};

const extractFieldContent = (block, fieldClass) => {
  const pattern = new RegExp(
    `<div class="views-field ${fieldClass}">[\\s\\S]*?<div class="field-content">([\\s\\S]*?)<\\/div>`,
    'i',
  );
  const match = block.match(pattern);
  if (!match) return '';
  return stripTags(match[1]);
};

const extractCategories = (block) => {
  const themeMatch = block.match(/<div class="views-field views-field-field-theme">([\s\S]*?)<\/div>\s*<\/div>?/i);
  if (!themeMatch) return [];

  return [...themeMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => cleanText(stripTags(match[1])))
    .filter(Boolean);
};

const inferZoneAlias = (zone, ...values) => {
  const searchable = values.map((value) => normalizeText(value)).filter(Boolean);
  for (const alias of zone.aliases) {
    const normalizedAlias = normalizeText(alias);
    const aliasTokens = normalizedAlias.split(' ').filter(Boolean);
    const matches = searchable.some((value) => {
      const haystack = value.split(' ').filter(Boolean);
      for (let start = 0; start <= haystack.length - aliasTokens.length; start += 1) {
        if (aliasTokens.every((token, index) => haystack[start + index] === token)) return true;
      }
      return false;
    });
    if (matches) return alias;
  }
  return '';
};

const inferCity = (zone, address, title, regionLabel) => {
  const alias = inferZoneAlias(zone, address, title, regionLabel);
  if (!alias) return '';
  return alias
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const createDescriptionShort = (categories, address) => {
  const parts = [];
  if (categories.length > 1) {
    parts.push(categories.slice(1).join(', '));
  }
  if (address) {
    parts.push(address);
  }
  return cleanText(parts.join(' - ').slice(0, 240));
};

const getStarRating = (categories) => {
  const starCategory = categories.find((category) => /^\d\*$/.test(category.trim()));
  return starCategory ? Number(starCategory.replace('*', '')) : null;
};

const findExistingHotelMatch = (existingHotels, candidate) => {
  const candidateName = normalizeText(candidate.hotelName);
  const candidateLocality = normalizeText(candidate.city || candidate.tourismZone || candidate.address || '');
  const candidateWebsite = normalizeWebsite(candidate.website);

  return existingHotels.find((hotel) => {
    const sameWebsite = candidateWebsite && candidateWebsite === normalizeWebsite(hotel.website);
    const sameNameAndLocality =
      candidateName &&
      candidateName === normalizeText(hotel.title) &&
      candidateLocality &&
      candidateLocality === normalizeText(hotel.city || hotel.location || '');
    return sameWebsite || sameNameAndLocality;
  });
};

const validateDraftQuality = (draft) => {
  const warnings = [];

  if (hasMojibake(draft.hotelName) || hasMojibake(draft.title) || hasMojibake(draft.address) || hasMojibake(draft.category)) {
    return {
      keep: false,
      warnings: ['Skipped because cleaned fields still contain mojibake markers.'],
    };
  }

  if (INVALID_TITLE_PATTERN.test(draft.hotelName)) {
    return {
      keep: false,
      warnings: ['Skipped because hotel name is not readable enough for review.'],
    };
  }

  if (!draft.city && !draft.tourismZone) {
    return {
      keep: false,
      warnings: ['Skipped because city/tourismZone is missing.'],
    };
  }

  if (!draft.sourceUrl) {
    return {
      keep: false,
      warnings: ['Skipped because sourceUrl is missing.'],
    };
  }

  if (!draft.phone && !draft.email && !draft.website) {
    warnings.push('Missing primary contact fields (phone, email, website).');
  }

  if (hasSuspiciousPhone(draft.phone)) {
    warnings.push(`Phone still looks suspicious after cleanup (${draft.phone}).`);
  }

  if (hasSuspiciousPhone(draft.fax)) {
    warnings.push(`Fax still looks suspicious after cleanup (${draft.fax}).`);
  }

  return { keep: true, warnings };
};

const shouldKeepEntry = (entry) => {
  const hasLocation = Boolean(entry.city || entry.tourismZone);
  const hasContactOrAddress = Boolean(entry.phone || entry.email || entry.website || entry.address);
  return Boolean(entry.hotelName && entry.governorate && entry.sourceUrl && hasLocation && hasContactOrAddress);
};

const parseHotelsFromHtml = (html, zone, regionId, page, importBatchId, existingHotels, auditLog) => {
  const blocks = extractRowBlocks(html);
  const regionLabel = REGION_LABELS[regionId] || zone.tourismZoneLabel;

  return blocks
    .map((block) => {
      const hotelName = extractTitle(block);
      const address = cleanAddress(extractFieldContent(block, 'views-field-field-adresse'));
      const phoneRaw = extractFieldContent(block, 'views-field-field-telephone');
      const faxRaw = extractFieldContent(block, 'views-field-field-fax');
      const email = normalizeEmail(extractFieldContent(block, 'views-field-field-email'));
      const websiteRaw = cleanText(extractFieldContent(block, 'views-field-field-site-web'));
      const website = normalizeWebsite(websiteRaw);
      const categories = extractCategories(block);
      const city = cleanText(inferCity(zone, address, hotelName, regionLabel));
      const tourismZone = city || zone.tourismZoneLabel;
      const starRating = getStarRating(categories);
      const category = cleanText(categories.filter((value) => value !== 'Hotels').join(', ') || 'Hotels');
      const sourceUrl = buildSourceUrl(regionId, page);
      const phoneResult = parseContactNumber(phoneRaw, 'Phone');
      const faxResult = parseContactNumber(faxRaw, 'Fax');
      const noteParts = [`Imported from ${SOURCE_NAME} region ${regionLabel} page ${page + 1}.`];

      if (phoneResult.warning) noteParts.push(phoneResult.warning);
      if (faxResult.warning) noteParts.push(faxResult.warning);
      if (websiteRaw && !website) noteParts.push('Website looked invalid in source; kept only in rawSource.');

      const draft = {
        sourceName: SOURCE_NAME,
        sourceUrl,
        importedAt: new Date().toISOString(),
        importBatchId,
        status: 'draft',
        published: false,
        hotelName,
        title: hotelName,
        country: 'Tunisia',
        governorate: zone.governorate,
        city,
        tourismZone,
        address,
        phone: phoneResult.primary,
        fax: faxResult.primary,
        email,
        website,
        starRating,
        category,
        descriptionShort: createDescriptionShort(categories, address),
        imageUrlsForReview: [],
        notes: noteParts.join(' '),
        matchedHotelId: null,
        rawSource: {
          regionId,
          regionLabel,
          categories,
          sourcePage: page + 1,
          phoneRaw: cleanText(phoneRaw),
          faxRaw: cleanText(faxRaw),
          websiteRaw,
        },
      };

      const existingMatch = findExistingHotelMatch(existingHotels, draft);
      if (existingMatch) {
        draft.matchedHotelId = existingMatch.id;
        draft.status = 'duplicate_review';
        draft.notes += ` Existing hotel match found: ${existingMatch.id}.`;
      }

      const quality = validateDraftQuality(draft);
      if (!quality.keep) {
        auditLog.skipped.push({
          hotelName: draft.hotelName || '(missing title)',
          governorate: draft.governorate,
          sourceUrl: draft.sourceUrl,
          warnings: quality.warnings,
        });
        return null;
      }

      if (quality.warnings.length) {
        draft.notes += ` Quality warnings: ${quality.warnings.join(' ')}`;
        auditLog.warnings.push({
          hotelName: draft.hotelName,
          governorate: draft.governorate,
          sourceUrl: draft.sourceUrl,
          warnings: quality.warnings,
        });
      }

      return draft;
    })
    .filter(Boolean)
    .filter(shouldKeepEntry);
};

const dedupeDrafts = (drafts) => {
  const seen = new Set();
  return drafts.filter((draft) => {
    const key = [
      normalizeText(draft.hotelName),
      normalizeText(draft.city || draft.tourismZone || draft.governorate),
      normalizePhone(draft.phone),
      normalizeWebsite(draft.website),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const importZoneDrafts = async (zone, existingHotels, importBatchId, auditLog) => {
  const zoneDrafts = [];
  const testedUrls = [];

  for (const [regionIndex, regionId] of zone.regionIds.entries()) {
    const sourceUrl = buildSourceUrl(regionId, 0);
    testedUrls.push(sourceUrl);
    const html = await fetchHtml(sourceUrl);
    const parsedDrafts = parseHotelsFromHtml(html, zone, regionId, 0, importBatchId, existingHotels, auditLog);
    const uniqueDrafts = dedupeDrafts(parsedDrafts);

    for (const draft of uniqueDrafts) {
      if (zoneDrafts.length >= MAX_PER_ZONE) break;
      const duplicateWithinZone = zoneDrafts.some(
        (existingDraft) =>
          normalizeText(existingDraft.hotelName) === normalizeText(draft.hotelName) &&
          normalizeWebsite(existingDraft.website) === normalizeWebsite(draft.website) &&
          normalizePhone(existingDraft.phone) === normalizePhone(draft.phone),
      );
      if (!duplicateWithinZone) {
        zoneDrafts.push(draft);
      }
    }

    if (zoneDrafts.length >= MAX_PER_ZONE) break;
    if (regionIndex < zone.regionIds.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return { drafts: zoneDrafts.slice(0, MAX_PER_ZONE), testedUrls };
};

const buildDraftKey = (draft) => [draft.sourceUrl, draft.hotelName, draft.governorate].join('|');

const buildQualityReport = (drafts, countsByZone, auditLog) => {
  const countWithMojibake = drafts.filter((draft) =>
    [draft.hotelName, draft.title, draft.address, draft.category].some(hasMojibake),
  ).length;
  const countWithSuspiciousPhone = drafts.filter((draft) => hasSuspiciousPhone(draft.phone) || hasSuspiciousPhone(draft.fax)).length;
  const countMissingContact = drafts.filter((draft) => !draft.phone && !draft.email && !draft.website).length;
  const countMissingWebsite = drafts.filter((draft) => !draft.website).length;
  const selectedDraftKeys = new Set(drafts.map(buildDraftKey));

  return {
    generatedAt: new Date().toISOString(),
    totalDrafts: drafts.length,
    countWithMojibake,
    countWithSuspiciousPhone,
    countMissingContact,
    countMissingWebsite,
    countPerZone: countsByZone,
    sampleWarnings: auditLog.warnings
      .filter((warning) => selectedDraftKeys.has([warning.sourceUrl, warning.hotelName, warning.governorate].join('|')))
      .slice(0, 10),
    skippedEntries: auditLog.skipped,
  };
};

const main = async () => {
  const compareExistingHotels = process.argv.includes('--compare-existing');
  const importBatchId = `tunisia-hotel-preview-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const existingHotels = compareExistingHotels ? [] : [];
  const testedUrls = [];
  const allDrafts = [];
  const countsByZone = {};
  const auditLog = {
    warnings: [],
    skipped: [],
  };

  for (const [zoneIndex, zone] of TARGET_ZONES.entries()) {
    const { drafts, testedUrls: zoneUrls } = await importZoneDrafts(zone, existingHotels, importBatchId, auditLog);
    testedUrls.push(...zoneUrls);
    countsByZone[zone.tourismZoneLabel] = drafts.length;
    allDrafts.push(...drafts);

    if (allDrafts.length >= MAX_TOTAL_HOTELS) break;
    if (zoneIndex < TARGET_ZONES.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  const limitedDrafts = allDrafts.slice(0, MAX_TOTAL_HOTELS);
  const skippedDueToLimit = Math.max(0, allDrafts.length - limitedDrafts.length);
  const duplicateCount = limitedDrafts.filter((draft) => draft.status === 'duplicate_review').length;
  const qualityReport = buildQualityReport(limitedDrafts, countsByZone, auditLog);

  const output = {
    metadata: {
      sourceName: SOURCE_NAME,
      sourceAudit: {
        robotsTxt: 'https://www.discovertunisia.com/robots.txt',
        crawlDelaySeconds: REQUEST_DELAY_MS / 1000,
        serverRenderedHtml: true,
        loginRequired: false,
        botBypassUsed: false,
        paginationParam: 'page',
        categoryParam: 'shs_term_node_tid_depth=33',
        regionParam: 'field_designation_crt_tid=<regionId>',
      },
      importBatchId,
      generatedAt: new Date().toISOString(),
      maxTotalHotels: MAX_TOTAL_HOTELS,
      maxPerZone: MAX_PER_ZONE,
      testedUrls: [...new Set(testedUrls)],
      targetZones: TARGET_ZONES.map((zone) => zone.tourismZoneLabel),
      existingHotelComparison: compareExistingHotels
        ? 'Requested, but not enabled in preview-only mode.'
        : 'Skipped in preview-only mode to avoid Firestore access before approval.',
      qualityReportPath: QUALITY_REPORT_PATH,
    },
    summary: {
      totalDrafts: limitedDrafts.length,
      duplicateReviewCount: duplicateCount,
      skippedDueToLimit,
      countsByZone,
    },
    drafts: limitedDrafts,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  fs.writeFileSync(QUALITY_REPORT_PATH, JSON.stringify(qualityReport, null, 2));

  console.log(`Preview saved to ${OUTPUT_PATH}`);
  console.log(`Quality report saved to ${QUALITY_REPORT_PATH}`);
  console.log(JSON.stringify(output.summary, null, 2));
  console.log(JSON.stringify(qualityReport, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
