import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TMP_DIR = path.join(ROOT, 'tmp');
const OUTPUT_JSON_PATH = path.join(TMP_DIR, 'tunisiebooking-35-hotels-dry-run.json');
const OUTPUT_MD_PATH = path.join(TMP_DIR, 'tunisiebooking-35-hotels-dry-run.md');
const QUALITY_JSON_PATH = path.join(TMP_DIR, 'tunisiebooking-35-hotels-quality-report.json');
const QUALITY_MD_PATH = path.join(TMP_DIR, 'tunisiebooking-35-hotels-quality-report.md');

const SOURCE_NAME = 'TunisieBooking';
const MAIN_LISTING_URL = 'https://www.tunisiebooking.com/hotel-tunisie/';
const EXCLUDED_URLS = new Set([
  'https://www.tunisiebooking.com/hotel-tunisie/djerba/hotels/hotel-vincci-helios-beach-djerba.html',
]);

const REGION_CONFIGS = [
  {
    key: 'djerba_medenine',
    label: 'Djerba / Médenine',
    governorate: 'Medenine',
    targetCount: 5,
    candidateLimit: 12,
    listingUrls: [MAIN_LISTING_URL, 'https://www.tunisiebooking.com/hotel-djerba.html'],
    matchers: [/\/hotel-tunisie\/(djerba|zarzis)\/hotels\//i],
  },
  {
    key: 'hammamet_nabeul',
    label: 'Hammamet / Nabeul',
    governorate: 'Nabeul',
    targetCount: 5,
    candidateLimit: 12,
    listingUrls: [MAIN_LISTING_URL],
    matchers: [/\/hotel-tunisie\/(hammamet|nabeul|yasmine-hammamet|korba|kelibia)\/hotels\//i],
  },
  {
    key: 'sousse_port_el_kantaoui',
    label: 'Sousse / Port El Kantaoui',
    governorate: 'Sousse',
    targetCount: 5,
    candidateLimit: 12,
    listingUrls: [MAIN_LISTING_URL, 'https://www.tunisiebooking.com/hotel-sousse.html'],
    matchers: [/\/hotel-tunisie\/sousse\/hotels\//i],
  },
  {
    key: 'monastir_skanes',
    label: 'Monastir / Skanes',
    governorate: 'Monastir',
    targetCount: 5,
    candidateLimit: 12,
    listingUrls: [MAIN_LISTING_URL, 'https://www.tunisiebooking.com/hotel-monastir.html'],
    matchers: [/\/hotel-tunisie\/monastir\/hotels\//i],
  },
  {
    key: 'mahdia',
    label: 'Mahdia',
    governorate: 'Mahdia',
    targetCount: 5,
    candidateLimit: 8,
    listingUrls: ['https://www.tunisiebooking.com/hotel-mahdia.html'],
    matchers: [/\/hotel-tunisie\/mahdia\/hotels\//i],
  },
  {
    key: 'tunis_gammarth_lamarsa',
    label: 'Tunis / Gammarth / La Marsa',
    governorate: 'Tunis',
    targetCount: 5,
    candidateLimit: 8,
    listingUrls: ['https://www.tunisiebooking.com/hotel-tunis.html'],
    matchers: [/\/hotel-tunisie\/(tunis|gammarth)\/hotels\//i],
  },
  {
    key: 'tozeur',
    label: 'Tozeur',
    governorate: 'Tozeur',
    targetCount: 5,
    candidateLimit: 8,
    listingUrls: ['https://www.tunisiebooking.com/hotel-tozeur.html'],
    matchers: [/\/hotel-tunisie\/tozeur\/hotels\//i],
  },
];

const DIRECT_BOOKING_PATTERNS = [
  /rÃ©servez dÃ¨s maintenant[^.]*\.\s*/gi,
  /book now[^.]*\.\s*/gi,
  /instant booking[^.]*\.\s*/gi,
  /confirmed booking[^.]*\.\s*/gi,
  /pay now[^.]*\.\s*/gi,
  /guaranteed booking[^.]*\.\s*/gi,
  /book now/gi,
  /book online/gi,
  /reserve now/gi,
  /make a reservation/gi,
  /request this hotel/gi,
  /rÃ©server maintenant/gi,
  /book your stay/gi,
];

const NEARBY_MARKERS = [
  /\bles\s+environs\b/i,
  /\brestaurants?\s+Ã \s+proximitÃ©\b/i,
  /\bcafÃ©s?\s+aux\s+alentours\b/i,
  /\bhÃ´tels?\s+Ã \s+proximitÃ©\b/i,
  /\blieux\s+Ã \s+proximitÃ©\b/i,
  /\battractions?\s+Ã \s+proximitÃ©\b/i,
  /\brestaurants?\s+nearby\b/i,
  /\bcafes?\s+nearby\b/i,
  /\bhotels?\s+nearby\b/i,
  /\bnearby\b/i,
];

const NEGATIVE_SERVICE_PATTERNS = [
  /\bnon disponible\b/i,
  /\bunavailable\b/i,
  /\bnot available\b/i,
  /\bnot provided\b/i,
  /\bsans\b/i,
];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items.filter(Boolean))];
const hasMojibake = (value) => /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¢Ã¢â€šÂ¬|ÃƒÂ¯Ã‚Â¿Ã‚Â½|Ã¯Â¿Â½/.test(String(value || ''));
const hasReplacementCharacter = (value) => /Ã¯Â¿Â½/.test(String(value || ''));

const repairMojibake = (value) => {
  const text = clean(value);
  if (!text || !hasMojibake(text)) return text;
  try {
    return Buffer.from(text, 'latin1').toString('utf8').replace(/\u0000/g, '').trim();
  } catch {
    return text;
  }
};

const decodeHtmlEntities = (value) =>
  String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&eacute;/gi, 'Ã©')
    .replace(/&egrave;/gi, 'Ã¨')
    .replace(/&ecirc;/gi, 'Ãª')
    .replace(/&agrave;/gi, 'Ã ')
    .replace(/&ocirc;/gi, 'Ã´')
    .replace(/&acirc;/gi, 'Ã¢')
    .replace(/&ccedil;/gi, 'Ã§')
    .replace(/&icirc;/gi, 'Ã®')
    .replace(/&ugrave;/gi, 'Ã¹')
    .replace(/&laquo;/gi, 'Â«')
    .replace(/&raquo;/gi, 'Â»')
    .replace(/&deg;/gi, 'Â°')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const decodeHtml = (value) => repairMojibake(clean(decodeHtmlEntities(value).replace(/\u00a0/g, ' ')));
const stripTags = (value) => decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '));
const stripTagsPreserveUtf8 = (value) => clean(decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\u00a0/g, ' '));

const normalizeText = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normalizeSlug = (value) => normalizeText(value).replace(/\s+/g, '-');

const parseNumber = (value) => {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const normalizeAbsoluteUrl = (value, baseUrl = MAIN_LISTING_URL) => {
  const raw = decodeHtmlEntities(clean(value));
  if (!raw) return '';
  try {
    const parsed = new URL(raw, baseUrl);
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return '';
  }
};

const isRealHotelImage = (url) => {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/(logo|icon|favicon|preloader|loader|spinner|tracking|pixel|sprite|placeholder|facebook\.com\/tr)/i.test(url)) return false;
  return /\.(?:jpg|jpeg|png|webp)(?:$|\?)/i.test(url);
};

const normalizeImageUrlList = (items, { baseUrl = MAIN_LISTING_URL, excludeUrl = '' } = {}) => {
  const excludeNormalized = excludeUrl ? normalizeAbsoluteUrl(excludeUrl, baseUrl) : '';
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const normalized = normalizeAbsoluteUrl(item, baseUrl);
    if (!normalized || !isRealHotelImage(normalized)) continue;
    if (excludeNormalized && normalized === excludeNormalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; CodexBot/1.0)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const charsetHeader = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  const sniffedCharset = bytes.toString('latin1', 0, Math.min(bytes.length, 4096)).match(/charset=([a-z0-9._-]+)/i)?.[1]?.trim().toLowerCase() || '';
  const decodeAttempts = unique([charsetHeader, sniffedCharset, 'utf-8', 'windows-1252', 'latin1']).filter(Boolean);

  let bestDecoded = '';
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const encoding of decodeAttempts) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: false }).decode(bytes);
      const repaired = repairMojibake(decoded);
      const score = [decoded, repaired].reduce((total, text) => total + (String(text).match(/[Ã©Ã¨ÃªÃ Ã´Ã¢Ã§Ã®Ã¹Å“]/gi) || []).length, 0);
      const candidate = score >= bestScore ? repaired : decoded;
      if (score > bestScore) {
        bestScore = score;
        bestDecoded = candidate;
      }
    } catch {
      // Continue through fallback charsets.
    }
  }

  return bestDecoded || repairMojibake(new TextDecoder('utf-8', { fatal: false }).decode(bytes));
};

const extractJsonLdBlocks = (html) => {
  const blocks = [];
  const regex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Ignore malformed blocks.
    }
  }
  return blocks;
};

const flattenJsonLd = (value, output = []) => {
  if (Array.isArray(value)) {
    for (const item of value) flattenJsonLd(item, output);
  } else if (value && typeof value === 'object') {
    output.push(value);
  }
  return output;
};

const firstByType = (items, typeName) =>
  items.find((item) => item && (item['@type'] === typeName || item['@type']?.includes?.(typeName))) || null;

const extractListingItems = (html, baseUrl, region) => {
  const candidates = [];
  const blocks = flattenJsonLd(extractJsonLdBlocks(html));
  for (const itemList of blocks.filter((item) => item && (item['@type'] === 'ItemList' || item['@type']?.includes?.('ItemList')))) {
    for (const entry of itemList.itemListElement || []) {
      const item = entry?.item || entry;
      const sourceUrl = normalizeAbsoluteUrl(item?.url || entry?.url || '', baseUrl);
      if (!sourceUrl) continue;
      if (!region.matchers.some((matcher) => matcher.test(sourceUrl))) continue;
      candidates.push({
        sourceListingUrl: baseUrl,
        sourceUrl,
        listingName: clean(item?.name || entry?.name || ''),
        listingImage: normalizeAbsoluteUrl(item?.image || entry?.image || '', sourceUrl),
        priceRange: clean(item?.priceRange || entry?.priceRange || ''),
        ratingValue: parseNumber(item?.aggregateRating?.ratingValue || entry?.aggregateRating?.ratingValue),
        reviewCount: parseNumber(item?.aggregateRating?.reviewCount || entry?.aggregateRating?.reviewCount),
      });
    }
  }

  const fallback = [...html.matchAll(/https:\/\/www\.tunisiebooking\.com\/hotel-tunisie\/[^"'\s<>]+/gi)]
    .map((match) => match[0])
    .map((sourceUrl) => normalizeAbsoluteUrl(sourceUrl, baseUrl))
    .filter((sourceUrl) => sourceUrl && region.matchers.some((matcher) => matcher.test(sourceUrl)));

  const combined = uniqueByUrl([
    ...candidates,
    ...fallback.map((sourceUrl) => ({ sourceListingUrl: baseUrl, sourceUrl })),
  ]);
  return combined;
};

const uniqueByUrl = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
};

const extractDescriptionHtml = (html, id) => html.match(new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)<\\/div><div style=`, 'i'))?.[1] || '';

const parseFaq = (items) => {
  const faq = firstByType(items, 'FAQPage');
  return (faq?.mainEntity || [])
    .map((entity) => ({
      question: decodeHtml(entity?.name || ''),
      answer: decodeHtml(entity?.acceptedAnswer?.text || ''),
    }))
    .filter((entry) => entry.question || entry.answer);
};

const extractFaqAnswer = (faqPairs, questionPrefix) =>
  faqPairs.find((entry) => entry.question.toLowerCase().includes(questionPrefix.toLowerCase()))?.answer || '';

const parseBoardOptions = (html) => {
  const codeToLabel = {
    lpd: 'Petit DÃ©jeuner',
    dp: 'Demi Pension',
    dp_plus: 'Demi Pension plus',
    pc: 'Pension complÃ¨te',
    pc_plus: 'Pension complÃ¨te plus',
    allin: 'Tout Compris',
    allin_soft: 'Tout Compris soft',
  };

  const codes = unique([...html.matchAll(/if\s*\(pension=='([^']+)'\)/g)].map((match) => clean(match[1])));
  return codes.map((code) => ({ code, label: codeToLabel[code] || code }));
};

const parseServiceTexts = (html) =>
  unique(
    [...html.matchAll(/<div class='col-md-4 border-start' id='sous_services'[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g)]
      .map((match) => stripTags(match[1])),
  );

const parseGalleryImages = (html, sourceUrl) =>
  normalizeImageUrlList(
    [
      ...html.matchAll(/"src"\s*:\s*"([^"]+)"/g),
      ...html.matchAll(/<meta[^>]+property="og:image(?:secure_url)?"[^>]+content="([^"]+)"/gi),
      ...html.matchAll(/<img[^>]+(?:src|data-src|data-lazy-src)="([^"]+)"/gi),
    ]
      .map((match) => match[1])
      .filter((src) => /image\.resabooking\.com|tunisiebooking\.com/i.test(src)),
    { baseUrl: sourceUrl },
  );

const parseReviews = (html) =>
  [...html.matchAll(/<div class="row row_avis[^"]*"[^>]*>[\s\S]*?<div class="desc_avis_txt">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="desc_avis_date">([^<]+)<\/div>/g)]
    .map((match) => ({
      text: stripTags(match[1]),
      date: decodeHtml(match[2]),
    }))
    .filter((entry) => entry.text || entry.date);

const parseNearbySections = (extendedHtml) => {
  const sections = [];
  const cleaned = stripTagsPreserveUtf8(extendedHtml);
  for (const marker of ['Restaurants Ã  proximitÃ©', 'CafÃ©s aux alentours', 'HÃ´tels Ã  proximitÃ©', 'Lieux Ã  proximitÃ©', 'Attractions Ã  proximitÃ©']) {
    const pattern = new RegExp(`${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:?\\s*`, 'i');
    const idx = cleaned.search(pattern);
    if (idx < 0) continue;
    const tail = cleaned.slice(idx);
    const nextMarker = tail.match(/(?:Restaurants Ã  proximitÃ©|CafÃ©s aux alentours|HÃ´tels Ã  proximitÃ©|Lieux Ã  proximitÃ©|Attractions Ã  proximitÃ©)\s*:?/i);
    const title = marker;
    const body = tail
      .replace(pattern, '')
      .split(/(?:Restaurants Ã  proximitÃ©|CafÃ©s aux alentours|HÃ´tels Ã  proximitÃ©|Lieux Ã  proximitÃ©|Attractions Ã  proximitÃ©)\s*:?/i)[0]
      .trim();
    const items = body
      .split(/\s*(?=\d+\.)/)
      .map((item) => clean(item.replace(/^\d+\.\s*/, '')))
      .filter(Boolean);
    if (items.length) sections.push({ title, items: items.slice(0, 6) });
  }

  if (!sections.length && cleaned) {
    const items = cleaned
      .split(/\s*(?=\d+\.)/)
      .map((item) => clean(item.replace(/^\d+\.\s*/, '')))
      .filter(Boolean);
    if (items.length) sections.push({ title: 'Nearby', items: items.slice(0, 6) });
  }

  return sections;
};

const extractHighlights = (html) => {
  const descriptionHtml = extractDescriptionHtml(html, 'ruslt_descriptif2');
  const match = descriptionHtml.match(/Les points forts[\s\S]*?<p>([\s\S]*?)<\/p>/i);
  if (!match) return [];
  return unique(
    stripTagsPreserveUtf8(match[1])
      .split(/\s*(?=\d+\.)/)
      .map((item) => clean(item.replace(/^\d+\.\s*/, '')))
      .filter(Boolean),
  );
};

const extractRoomInventory = (text) => {
  const mainRooms = parseNumber(text.match(/total de\s+(\d+)\s+chambres/i)?.[1] || '');
  const bungalows = parseNumber(text.match(/(\d+)\s+bungalows/i)?.[1] || '');
  return {
    roomInventoryText: mainRooms || bungalows ? `${mainRooms || 0} rooms${bungalows ? ` + ${bungalows} bungalows` : ''}` : '',
    roomCount: mainRooms,
  };
};

const sanitizeRequestOnlyCopy = (value) => {
  let text = clean(value);
  for (const pattern of DIRECT_BOOKING_PATTERNS) {
    text = text.replace(pattern, '');
  }
  return text.replace(/\s{2,}/g, ' ').replace(/^[,;:-]+\s*/, '').trim();
};

const trimAtNearbyMarkers = (value) => {
  const text = clean(value);
  if (!text) return '';
  let cutoff = text.length;
  for (const marker of NEARBY_MARKERS) {
    const match = text.match(marker);
    if (!match || match.index == null) continue;
    cutoff = Math.min(cutoff, match.index);
  }
  return clean(text.slice(0, cutoff).replace(/[\s,;:-]+$/, ''));
};

const buildDescriptionLead = (data, title) => {
  const starRating = Number(data?.starRating || data?.ratingValue || data?.rating);
  const region = clean(data?.region || data?.sourceRegion || '');
  const city = clean(data?.city || '');
  const normalizedCity = city.replace(/\bDjerba\b/i, '').replace(/\s+/g, ' ').trim();
  const leadTitle = title || clean(data?.hotelName || data?.name || '');
  if (!leadTitle || !Number.isFinite(starRating) || starRating <= 0) return '';
  const regionLabel = region ? `sur l'Ã®le de ${region}` : "sur l'Ã®le de Djerba";
  const cityLabel = normalizedCity ? `dans la rÃ©gion de ${normalizedCity}` : 'dans la rÃ©gion de Midoun';
  return `Le ${leadTitle} est un hÃ´tel ${Math.round(starRating)} Ã©toiles situÃ© ${regionLabel}, ${cityLabel}.`;
};

const buildDescriptionText = (data, title) => {
  const descriptionCandidates = [
    data?.description,
    data?.longDescription,
    data?.details,
    data?.rawSource?.detail?.descriptionExtended,
    data?.rawSource?.detail?.description,
  ];

  for (const candidate of descriptionCandidates) {
    const raw = clean(candidate || '');
    if (!raw) continue;

    const sanitized = trimAtNearbyMarkers(
      sanitizeRequestOnlyCopy(raw)
        .replace(/^(rÃ©servez dÃ¨s maintenant|book now|instant booking|confirmed booking|pay now|guaranteed booking)[^.]*\.\s*/i, '')
        .replace(/^(votre sÃ©jour\b[^.]*\.\s*)/i, '')
        .trim(),
    );

    if (!sanitized || hasReplacementCharacter(sanitized) || hasMojibake(sanitized)) continue;
    if (/^(votre sÃ©jour|votre sejour)/i.test(sanitized) || sanitized.length < 60) {
      const fallback = buildDescriptionLead(data, title);
      if (fallback) return fallback;
    }
    if (!/^(Le|La|Les|L['â€™]|Ce|Cette|Cet|The|Hotel|HÃ´tel)\b/.test(sanitized)) {
      const fallback = buildDescriptionLead(data, title);
      if (fallback) return fallback;
    }
    return sanitized;
  }

  return buildDescriptionLead(data, title);
};

const buildDisplayImages = (images, limit = 8) => {
  const source = unique(images.map((item) => normalizeAbsoluteUrl(item)).filter(Boolean));
  if (!source.length) return [];
  const picked = [source[0]];
  const tokensFor = (url) =>
    normalizeText(url.split('/').pop() || '')
      .split(' ')
      .filter((token) => token && !/^(jpg|jpeg|png|webp|img|image|\d+)$/i.test(token));
  while (picked.length < Math.min(limit, source.length)) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 0; index < source.length; index += 1) {
      const candidate = source[index];
      if (picked.includes(candidate)) continue;
      const candidateTokens = new Set(tokensFor(candidate));
      let overlap = 0;
      for (const selected of picked) {
        for (const token of tokensFor(selected)) {
          if (candidateTokens.has(token)) overlap += 1;
        }
      }
      if (overlap < bestScore) {
        bestScore = overlap;
        bestIndex = index;
      }
    }
    const next = source[bestIndex];
    if (!next || picked.includes(next)) break;
    picked.push(next);
  }
  return unique(picked.concat(source)).slice(0, limit);
};

const extractDetailHotel = async ({ candidate, region }) => {
  const detailHtml = await fetchText(candidate.sourceUrl);
  const detailJson = flattenJsonLd(extractJsonLdBlocks(detailHtml));
  const detailProduct = firstByType(detailJson, 'Product') || {};
  const detailHotel = firstByType(detailJson, 'Hotel') || {};
  const faq = parseFaq(detailJson);
  const reviews = parseReviews(detailHtml);
  const amenities = parseServiceTexts(detailHtml);
  const positiveAmenities = unique(
    amenities
      .map((item) => clean(item))
      .filter(Boolean)
      .filter((item) => !NEGATIVE_SERVICE_PATTERNS.some((pattern) => pattern.test(item)))
      .filter((item) => !/\b(non disponible|unavailable|not available)\b/i.test(item)),
  );
  const unavailableServices = unique(amenities.filter((item) => NEGATIVE_SERVICE_PATTERNS.some((pattern) => pattern.test(item))));
  const boardOptions = parseBoardOptions(detailHtml);
  const gallery = parseGalleryImages(detailHtml, candidate.sourceUrl);
  const highlights = extractHighlights(detailHtml);
  const nearbySections = parseNearbySections(extractDescriptionHtml(detailHtml, 'ruslt_descriptif22'));
  const nearbyAttractions = nearbySections.flatMap((section) => section.items);
  const descriptionHtmlBlock = extractDescriptionHtml(detailHtml, 'ruslt_descriptif2');
  const descriptionExtendedHtmlBlock = extractDescriptionHtml(detailHtml, 'ruslt_descriptif22');
  const descriptionFromHtml = stripTagsPreserveUtf8(descriptionHtmlBlock);
  const description = buildDescriptionText(
    {
      description: descriptionFromHtml || detailHotel.description || detailProduct.description || '',
      longDescription: detailHotel.description || detailProduct.description || '',
      details: descriptionFromHtml,
      rawSource: {
        detail: {
          descriptionExtended: stripTagsPreserveUtf8(descriptionExtendedHtmlBlock),
          description: decodeHtml(detailHotel.description || detailProduct.description || ''),
        },
      },
      region: region.label,
      city: clean(detailHotel.address?.addressLocality || ''),
      starRating: Number(detailHotel.starRating || detailHotel.aggregateRating?.ratingValue || detailProduct.aggregateRating?.ratingValue || 0) || null,
      ratingValue: Number(detailHotel.aggregateRating?.ratingValue || detailProduct.aggregateRating?.ratingValue || 0) || null,
    },
    clean(detailHotel.name || detailProduct.name || candidate.listingName || ''),
  );

  const hotelName = clean(detailHotel.name || detailProduct.name || candidate.listingName || '');
  const title = hotelName;
  const city = clean(detailHotel.address?.addressLocality || '').split(',')[0].trim() || region.governorate || '';
  const address = clean(detailHotel.address?.streetAddress || '');
  const regionLabel = region.label;
  const country = 'Tunisia';
  const image = normalizeImageUrlList([detailHotel.image, detailProduct.image, candidate.listingImage, gallery[0]], { baseUrl: candidate.sourceUrl })[0] || '';
  const normalizedGallery = normalizeImageUrlList(gallery, { baseUrl: candidate.sourceUrl, excludeUrl: image });
  const displayImages = buildDisplayImages([image, ...normalizedGallery], 8);
  const normalizedUniqueImageCount = new Set(displayImages.map((item) => normalizeAbsoluteUrl(item, candidate.sourceUrl))).size;
  const ratingValue = Number(detailHotel.aggregateRating?.ratingValue || detailProduct.aggregateRating?.ratingValue || candidate.listingRatingValue || 0) || null;
  const ratingLabel = ratingValue && ratingValue >= 4.5 ? 'Excellent' : ratingValue && ratingValue >= 4 ? 'TrÃ¨s Bien' : '';
  const reviewsCount = Number(detailHotel.aggregateRating?.reviewCount || detailProduct.aggregateRating?.reviewCount || candidate.listingReviewCount || reviews.length || 0) || reviews.length || 0;
  const starRating = Number(String(detailHotel.starRating || description).match(/(\d)\s*Ã©toiles/i)?.[1] || 4) || 4;
  const latitude = parseNumber(detailHotel?.geo?.latitude);
  const longitude = parseNumber(detailHotel?.geo?.longitude);
  const coordinatesFound = Number.isFinite(latitude) && Number.isFinite(longitude) && latitude > 30 && latitude < 38 && longitude > 7 && longitude < 12.5;
  const checkInFaq = extractFaqAnswer(faq, "horaires d'arrivee");
  const checkInTime = clean(checkInFaq.match(/Ã  partir de ([0-9h:\s]+)(?:jusqu|et)/i)?.[1] || '');
  const checkOutTime = clean(checkInFaq.match(/dÃ©parts? Ã  ([0-9h:\s]+)/i)?.[1] || '');
  const listingPrice = parseNumber(candidate.priceRange) || parseNumber(detailProduct?.offers?.price) || null;
  const priceCurrency = clean(detailProduct?.offers?.priceCurrency || 'EUR');
  const priceDate = clean(detailProduct?.offers?.priceValidUntil || new Date().toISOString().slice(0, 10));

  const roomTypes = unique([
    ...extractFaqAnswer(faq, 'type de chambre')
      .split(/:-|-/)
      .pop()
      .split('-')
      .map((item) => decodeHtml(item).replace(/^:+/, '').trim())
      .filter((item) => item && !/prestations de l'hotel/i.test(item)),
    ...['Chambres doubles', 'Suites', 'Houchs traditionnels', 'Bungalows'].filter((label) => new RegExp(label.replace(/\s+/g, '\\s+'), 'i').test(description)),
  ]);

  const missingFields = [
    'cancellationPolicy',
    'childrenPolicy',
    'paymentPolicy',
    'lateCheckoutPolicy',
    'officialWebsite',
    'directHotelEmail',
    'directHotelPhone',
    'finalRateTable',
  ];
  if (!checkInTime) missingFields.push('checkInTime');
  if (!checkOutTime) missingFields.push('checkOutTime');

  const pricingDiscovery = {
    sourcePriceType: candidate.priceRange ? 'listing_item_priceRange' : 'detail_offers_or_null',
    priceFrom: listingPrice,
    currency: priceCurrency,
    unit: 'night',
    priceDate,
    variableFactors: ['checkIn', 'checkOut', 'rooms', 'adults', 'children', 'childAges', 'boardType', 'roomType'],
    apiObserved: true,
    apiEndpoint: 'https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php',
    apiNotes: 'Observed TunisieBooking detail endpoint. Dynamic pricing is request-only and not integrated into the dry run.',
    recommendedInternalPricingModel: 'Keep this hotel request-only with teaser price data on the public draft and confirm final rates manually after request.',
  };

  const hasBrokenText = [hotelName, title, city, address, description, ...highlights, ...nearbyAttractions].some((value) => hasReplacementCharacter(value) || hasMojibake(value));
  const descriptionClean =
    Boolean(description) &&
    !hasBrokenText &&
    !DIRECT_BOOKING_PATTERNS.some((pattern) => pattern.test(description)) &&
    !NEARBY_MARKERS.some((pattern) => pattern.test(description));
  const hasNearby = nearbySections.length > 0;
  const hasUnavailableServices = unavailableServices.length > 0;
  const hasPriceReference = listingPrice != null;
  const galleryCount = normalizedGallery.length + (image ? 1 : 0);

  const completeness = {
    identity: hotelName && city && regionLabel ? 'complete' : 'partial',
    images: image && galleryCount >= 5 ? 'complete' : image ? 'partial' : 'missing',
    description: descriptionClean ? 'complete' : 'partial',
    amenities: positiveAmenities.length ? 'complete' : 'missing',
    roomTypes: roomTypes.length >= 3 ? 'complete' : roomTypes.length ? 'partial' : 'missing',
    boardOptions: boardOptions.length >= 3 ? 'complete' : boardOptions.length ? 'partial' : 'missing',
    pricing: hasPriceReference ? 'partial' : 'missing',
    location: coordinatesFound ? 'complete' : 'missing',
    policies: checkInTime || checkOutTime ? 'partial' : 'missing',
    faq: faq.length ? 'complete' : 'missing',
    reviews: reviews.length ? 'complete' : 'missing',
    providerContact: 'missing',
    dynamicPricing: 'partial',
  };

  const warnings = [];
  if (!image) warnings.push('Missing main image.');
  if (galleryCount < 5) warnings.push('Weak gallery (<5 unique display images).');
  if (!coordinatesFound) warnings.push('No coordinates found.');
  if (!descriptionClean) warnings.push('Description needs cleanup.');
  if (!hasPriceReference) warnings.push('No price reference extracted.');
  if (!roomTypes.length) warnings.push('No room types extracted.');
  if (!boardOptions.length) warnings.push('No board options extracted.');
  if (hasUnavailableServices) warnings.push('Unavailable services separated from positive amenities.');
  if (hasBrokenText) warnings.push('Broken text markers detected.');
  if (!hasNearby) warnings.push('No nearby sections extracted.');

  let qualityStatus = 'needs_manual_review';
  if (!image || !descriptionClean || !hotelName || !candidate.sourceUrl) {
    qualityStatus = 'reject_for_now';
  } else if (galleryCount >= 5 && coordinatesFound && roomTypes.length > 0 && boardOptions.length > 0 && hasPriceReference && !hasBrokenText) {
    qualityStatus = warnings.length ? 'needs_manual_review' : 'ready_for_draft';
  }

  return {
    sourceName: SOURCE_NAME,
    sourceRegion: regionLabel,
    sourceListingUrl: candidate.sourceListingUrl,
    sourceUrl: candidate.sourceUrl,
    importedAt: new Date().toISOString(),
    title,
    hotelName,
    country,
    city,
    region: region.governorate,
    address,
    starRating,
    ratingValue,
    ratingLabel,
    reviewsCount,
    reviewSummary: ratingValue && reviewsCount ? `${ratingLabel || 'Rated'} based on ${reviewsCount} reviews` : '',
    image,
    gallery: normalizedGallery,
    displayImages,
    galleryCount,
    normalizedUniqueImageCount,
    latitude: coordinatesFound ? latitude : null,
    longitude: coordinatesFound ? longitude : null,
    coordinatesFound,
    mapSource: coordinatesFound ? 'TunisieBooking' : null,
    nearbySections,
    nearbyAttractions,
    description,
    descriptionClean,
    highlights,
    amenities: positiveAmenities,
    services: positiveAmenities,
    unavailableServices,
    roomTypes,
    boardOptions,
    faq,
    reviews,
    roomInventoryText: extractRoomInventory(description).roomInventoryText || null,
    roomCount: extractRoomInventory(description).roomCount || null,
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
    policySource: 'TunisieBooking',
    cancellationPolicy: null,
    childrenPolicy: null,
    paymentPolicy: null,
    lateCheckoutPolicy: null,
    priceFrom: listingPrice,
    priceCurrency,
    priceUnit: 'night',
    priceDate,
    priceNote: 'Final price and availability are confirmed after request',
    priceStatus: 'source_reference',
    pricingDiscovery,
    dynamicPricingStatus: 'api_observed_but_not_integrated',
    apiObserved: true,
    apiEndpoint: pricingDiscovery.apiEndpoint,
    apiNotes: pricingDiscovery.apiNotes,
    missingFields,
    completeness,
    bookingMode: 'request_only',
    bookingEnabled: false,
    published: false,
    status: 'draft',
    rawSource: {
      listing: candidate,
      detail: {
        hotelName: clean(detailHotel.name || detailProduct.name || ''),
        image: detailHotel.image || '',
        description: decodeHtml(detailHotel.description || detailProduct.description || ''),
        descriptionExtended: stripTagsPreserveUtf8(descriptionExtendedHtmlBlock),
        offers: detailProduct.offers || {},
        address: detailHotel.address || {},
        geo: detailHotel.geo || {},
        faq,
        reviews,
        nearbySections,
        services: amenities,
        boardOptions,
        roomTypes,
      },
      pricingEndpoint: pricingDiscovery.apiEndpoint,
      imageNormalization: {
        mainImage: image,
        galleryCount: normalizedGallery.length,
        displayImages,
      },
    },
    quality: {
      qualityStatus,
      warnings,
      hasNearby,
      hasUnavailableServices,
      hasPriceReference,
      descriptionClean,
    },
  };
};

const regionForSourceUrl = (sourceUrl) =>
  REGION_CONFIGS.find((region) => region.matchers.some((matcher) => matcher.test(sourceUrl))) || null;

const collectRegionCandidates = async (region) => {
  const seen = new Set();
  const candidates = [];

  for (const listingUrl of region.listingUrls) {
    const html = await fetchText(listingUrl);
    const extracted = extractListingItems(html, listingUrl, region);
    for (const candidate of extracted) {
      if (EXCLUDED_URLS.has(candidate.sourceUrl)) continue;
      if (seen.has(candidate.sourceUrl)) continue;
      seen.add(candidate.sourceUrl);
      candidates.push(candidate);
      if (candidates.length >= region.candidateLimit) break;
    }
    if (candidates.length >= region.candidateLimit) break;
  }

  return candidates;
};

const buildDryRunMarkdown = (report) => {
  const regionLines = REGION_CONFIGS.map((region) => `- ${region.label}: ${report.summary.countsByRegion[region.label] || 0} selected${report.summary.shortfallsByRegion[region.label] ? `, shortfall ${report.summary.shortfallsByRegion[region.label]}` : ''}`);
  const readyNames = report.hotels.filter((hotel) => hotel.quality.qualityStatus === 'ready_for_draft').map((hotel) => `${hotel.title} (${hotel.sourceRegion})`);
  const manualNames = report.hotels.filter((hotel) => hotel.quality.qualityStatus === 'needs_manual_review').map((hotel) => `${hotel.title} (${hotel.sourceRegion})`);
  const skippedNames = report.failed.map((item) => `${item.title || '(missing title)'} (${item.sourceRegion})`);
  return `# TunisieBooking 35 Hotels Dry-Run Pilot

## Summary
- Total selected: ${report.summary.totalSelected}
- Final extracted hotels: ${report.summary.finalExtractedHotels}
- Candidate attempt failures: ${report.summary.candidateAttemptFailures}
- Final selected hotel failures: ${report.summary.finalSelectedHotelFailures}
- Ready for draft write: ${report.summary.readyForDraftWrite}
- Needs manual review: ${report.summary.needsManualReview}
- Reject for now: ${report.summary.rejectForNow}

## Regions
${regionLines.join('\n')}

## Ready Hotels
${readyNames.map((line) => `- ${line}`).join('\n') || '- None'}

## Manual Review Hotels
${manualNames.map((line) => `- ${line}`).join('\n') || '- None'}

## Failed/Skipped
${skippedNames.map((line) => `- ${line}`).join('\n') || '- None'}
`;
};

const buildQualityMarkdown = (report) => {
  const perHotel = report.hotels
    .map(
      (hotel) => `- ${hotel.region} | ${hotel.title} | ${hotel.sourceUrl}
  - status: ${hotel.qualityStatus}
  - warnings: ${hotel.warnings.length ? hotel.warnings.join('; ') : 'none'}
  - imageCount: ${hotel.galleryCount}
  - descriptionClean: ${hotel.descriptionClean}
  - hasNearby: ${hotel.hasNearby}
  - coordinatesFound: ${hotel.coordinatesFound}
  - amenitiesCount: ${hotel.amenitiesCount}
  - roomTypesCount: ${hotel.roomTypesCount}
  - boardOptionsCount: ${hotel.boardOptionsCount}
  - faqCount: ${hotel.faqCount}
  - reviewsCount: ${hotel.reviewsCount}
  - missingFields: ${hotel.missingFields.join(', ')}`
    )
    .join('\n');

  return `# TunisieBooking 35 Hotels Quality Report

## Overall
- Total selected: ${report.summary.totalSelected}
- Final extracted hotels: ${report.summary.finalExtractedHotels}
- Candidate attempt failures: ${report.summary.candidateAttemptFailures}
- Final selected hotel failures: ${report.summary.finalSelectedHotelFailures}
- Duplicates skipped: ${report.summary.duplicateTitleOrUrlWarnings}
- Missing images: ${report.summary.hotelsWithMissingImages}
- Weak gallery: ${report.summary.hotelsWithWeakGallery}
- Broken text: ${report.summary.hotelsWithBrokenText}
- No coordinates: ${report.summary.hotelsWithNoCoordinates}
- Description/nearby leak: ${report.summary.hotelsWithDescriptionNearbyLeak}
- Unavailable services: ${report.summary.hotelsWithUnavailableServices}
- No room types: ${report.summary.hotelsWithNoRoomTypes}
- No price reference: ${report.summary.hotelsWithNoPriceReference}
- Ready for draft write: ${report.summary.readyForDraftWrite}
- Needs manual review: ${report.summary.needsManualReview}
- Reject for now: ${report.summary.rejectForNow}

## By Region
${REGION_CONFIGS.map((region) => `- ${region.label}: ${report.summary.countsByRegion[region.label] || 0}`).join('\n')}

## Hotels
${perHotel}
`;
};

const main = async () => {
  const regionCandidateMap = {};
  const allDrafts = [];
  const failed = [];

  for (const region of REGION_CONFIGS) {
    const candidates = await collectRegionCandidates(region);
    regionCandidateMap[region.label] = candidates;
    const extracted = [];

    for (const candidate of candidates) {
      try {
        const draft = await extractDetailHotel({ candidate, region });
        if (draft.quality.qualityStatus === 'reject_for_now') {
          failed.push({
            title: draft.title,
            sourceUrl: draft.sourceUrl,
            sourceRegion: draft.sourceRegion,
            reason: draft.quality.warnings.join(' '),
          });
          continue;
        }
        extracted.push(draft);
      } catch (error) {
        failed.push({
          title: candidate.listingName || '',
          sourceUrl: candidate.sourceUrl,
          sourceRegion: region.label,
          reason: error?.message || String(error),
        });
      }
    }

    extracted.sort((a, b) => {
      const score = (hotel) =>
        (hotel.quality.qualityStatus === 'ready_for_draft' ? 100 : hotel.quality.qualityStatus === 'needs_manual_review' ? 50 : 0) +
        (hotel.galleryCount >= 5 ? 15 : hotel.galleryCount) +
        (hotel.coordinatesFound ? 10 : 0) +
        (hotel.descriptionClean ? 10 : 0) +
        (hotel.roomTypes.length ? 5 : 0) +
        (hotel.boardOptions.length ? 5 : 0) +
        (hotel.priceFrom != null ? 5 : 0);
      return score(b) - score(a) || a.title.localeCompare(b.title);
    });

    const chosen = extracted.slice(0, region.targetCount);
    const shortfall = Math.max(0, region.targetCount - chosen.length);
    if (shortfall > 0) {
      failed.push({
        title: `${region.label} shortfall`,
        sourceRegion: region.label,
        sourceUrl: '',
        reason: `Could only select ${chosen.length} hotels for ${region.label}.`,
      });
    }
    allDrafts.push(...chosen);
  }

  const countsByRegion = Object.fromEntries(REGION_CONFIGS.map((region) => [region.label, allDrafts.filter((hotel) => hotel.sourceRegion === region.label).length]));
  const shortfallsByRegion = Object.fromEntries(REGION_CONFIGS.map((region) => [region.label, Math.max(0, region.targetCount - (countsByRegion[region.label] || 0))]));
  const hotelsWithMissingImages = allDrafts.filter((hotel) => !hotel.image).length;
  const hotelsWithWeakGallery = allDrafts.filter((hotel) => hotel.galleryCount < 5).length;
  const hotelsWithBrokenText = allDrafts.filter((hotel) => !hotel.descriptionClean || hotel.quality.warnings.some((warning) => /Broken text|Description needs cleanup/.test(warning))).length;
  const hotelsWithNoCoordinates = allDrafts.filter((hotel) => !hotel.coordinatesFound).length;
  const hotelsWithDescriptionNearbyLeak = allDrafts.filter((hotel) => hotel.description && NEARBY_MARKERS.some((pattern) => pattern.test(hotel.description))).length;
  const hotelsWithUnavailableServices = allDrafts.filter((hotel) => hotel.unavailableServices.length > 0).length;
  const hotelsWithNoRoomTypes = allDrafts.filter((hotel) => hotel.roomTypes.length === 0).length;
  const hotelsWithNoPriceReference = allDrafts.filter((hotel) => hotel.priceFrom == null).length;
  const readyForDraftWrite = allDrafts.filter((hotel) => hotel.quality.qualityStatus === 'ready_for_draft').length;
  const needsManualReview = allDrafts.filter((hotel) => hotel.quality.qualityStatus === 'needs_manual_review').length;
  const rejectForNow = allDrafts.filter((hotel) => hotel.quality.qualityStatus === 'reject_for_now').length;
  const candidateAttemptFailures = failed.length;
  const finalSelectedHotelFailures = 0;
  const finalExtractedHotels = allDrafts.length;

  const duplicateTitleOrUrlWarnings = allDrafts.length - unique(allDrafts.map((hotel) => hotel.sourceUrl)).length;
  const summary = {
    totalSelected: allDrafts.length,
    finalExtractedHotels,
    candidateAttemptFailures,
    finalSelectedHotelFailures,
    countsByRegion,
    shortfallsByRegion,
    duplicateTitleOrUrlWarnings,
    hotelsWithMissingImages,
    hotelsWithWeakGallery,
    hotelsWithBrokenText,
    hotelsWithNoCoordinates,
    hotelsWithDescriptionNearbyLeak,
    hotelsWithUnavailableServices,
    hotelsWithNoRoomTypes,
    hotelsWithNoPriceReference,
    readyForDraftWrite,
    needsManualReview,
    rejectForNow,
  };

  const dryRun = {
    metadata: {
      sourceName: SOURCE_NAME,
      generatedAt: new Date().toISOString(),
      dryRun: true,
      firestoreWriteAttempted: false,
      targetRegions: REGION_CONFIGS.map((region) => region.label),
      sourcePages: Object.fromEntries(REGION_CONFIGS.map((region) => [region.label, region.listingUrls])),
    },
    summary,
    hotels: allDrafts,
    failed,
  };

  const qualityReport = {
    generatedAt: new Date().toISOString(),
    summary,
    hotels: allDrafts.map((hotel) => ({
      region: hotel.sourceRegion,
      title: hotel.title,
      sourceUrl: hotel.sourceUrl,
      city: hotel.city,
      starRating: hotel.starRating,
      ratingValue: hotel.ratingValue,
      ratingLabel: hotel.ratingLabel,
      reviewsCount: hotel.reviewsCount,
      priceFrom: hotel.priceFrom,
      priceCurrency: hotel.priceCurrency,
      priceUnit: hotel.priceUnit,
      priceDate: hotel.priceDate,
      galleryCount: hotel.galleryCount,
      normalizedUniqueImageCount: hotel.normalizedUniqueImageCount,
      descriptionClean: hotel.descriptionClean,
      hasNearby: hotel.quality.hasNearby,
      coordinatesFound: hotel.coordinatesFound,
      amenitiesCount: hotel.amenities.length,
      roomTypesCount: hotel.roomTypes.length,
      boardOptionsCount: hotel.boardOptions.length,
      faqCount: hotel.faq.length,
      reviewsCount: hotel.reviews.length,
      missingFields: hotel.missingFields,
      completeness: hotel.completeness,
      qualityStatus: hotel.quality.qualityStatus,
      warnings: hotel.quality.warnings,
    })),
    failed,
  };

  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(dryRun, null, 2));
  fs.writeFileSync(QUALITY_JSON_PATH, JSON.stringify(qualityReport, null, 2));
  fs.writeFileSync(OUTPUT_MD_PATH, buildDryRunMarkdown(dryRun));
  fs.writeFileSync(QUALITY_MD_PATH, buildQualityMarkdown(qualityReport));

  console.log(JSON.stringify({
    selectedRegions: REGION_CONFIGS.map((region) => region.label),
    countsByRegion,
    shortfallsByRegion,
    totalSelected: allDrafts.length,
    finalExtractedHotels,
    candidateAttemptFailures,
    finalSelectedHotelFailures,
    readyForDraftWrite,
    needsManualReview,
    rejectForNow,
    outputFiles: [OUTPUT_JSON_PATH, OUTPUT_MD_PATH, QUALITY_JSON_PATH, QUALITY_MD_PATH],
  }, null, 2));
};

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
