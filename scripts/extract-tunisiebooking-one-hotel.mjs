import fs from 'node:fs';
import path from 'node:path';

const LISTING_URL = 'https://www.tunisiebooking.com/hotel-tunisie/';
const DETAIL_ENDPOINT_URL = 'https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php';
const OUTPUT_DRAFT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-draft.json');
const OUTPUT_REQUEST_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-booking-request-shape.json');
const OUTPUT_ANALYSIS_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-analysis.md');
const OUTPUT_DEBUG_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-analysis.json');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const hasMojibake = (value) => /[ÃÂâ�]/.test(String(value || ''));

const repairMojibake = (value) => {
  const text = clean(value);
  if (!text || !hasMojibake(text)) return text;
  try {
    return Buffer.from(text, 'latin1').toString('utf8').replace(/\u0000/g, '').trim();
  } catch {
    return text;
  }
};

const decodeHtml = (value) =>
  repairMojibake(
    clean(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&agrave;/gi, 'à')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&icirc;/gi, 'î')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&#10003;/gi, '✓')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(),
  );

const stripTags = (value) => decodeHtml(value.replace(/<[^>]+>/g, ' '));

const extractScripts = (html) => {
  const scripts = [];
  const regex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      scripts.push(JSON.parse(raw));
    } catch {
      // Ignore malformed blocks.
    }
  }
  return scripts;
};

const firstByType = (items, typeName) =>
  items.find((item) => item && (item['@type'] === typeName || item['@type']?.includes?.(typeName))) || null;

const firstItemListHotel = (items) => {
  const itemList = firstByType(items, 'ItemList');
  const listItem = itemList?.itemListElement?.[0]?.item || null;
  return listItem && listItem['@type'] === 'Hotel' ? listItem : null;
};

const parseBoardOptions = (html) => {
  const codeToLabel = {
    lpd: 'Petit Déjeuner',
    dp: 'Demi Pension',
    dp_plus: 'Demi Pension plus',
    pc: 'Pension complète',
    pc_plus: 'Pension complète plus',
    allin: 'Tout Compris',
    allin_soft: 'Tout Compris soft',
  };

  const codes = new Set();
  for (const match of html.matchAll(/if\s*\(pension=='([^']+)'\)/g)) {
    codes.add(match[1]);
  }

  return [...codes].map((code) => ({
    code,
    label: codeToLabel[code] || code,
  }));
};

const parseServiceTexts = (html) => {
  const services = [];
  const regex = /<div class='col-md-4 border-start' id='sous_services'[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g;
  for (const match of html.matchAll(regex)) {
    const value = stripTags(match[1]);
    if (value) services.push(value);
  }
  return [...new Set(services)];
};

const parseFaq = (items) => {
  const faq = firstByType(items, 'FAQPage');
  const pairs = [];
  for (const entity of faq?.mainEntity || []) {
    const question = decodeHtml(entity?.name || '');
    const answer = decodeHtml(entity?.acceptedAnswer?.text || '');
    if (question || answer) {
      pairs.push({ question, answer });
    }
  }
  return pairs;
};

const extractFaqAnswer = (faqPairs, questionPrefix) =>
  faqPairs.find((entry) => entry.question.toLowerCase().includes(questionPrefix.toLowerCase()))?.answer || '';

const parseVisibleText = (html, pattern) => {
  const match = html.match(pattern);
  return match ? decodeHtml(match[1]) : '';
};

const parseNumber = (value) => {
  const n = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const normalizeSlug = (value) =>
  clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const inferRegionFromUrl = (url) => {
  const match = String(url).match(/hotel-tunisie\/([^/]+)\//i);
  return decodeHtml(match?.[1] || '');
};

const extractDescription = (html) => {
  const match = html.match(/<div id="ruslt_descriptif2"[^>]*>([\s\S]*?)<\/div><div style=/i);
  return match ? stripTags(match[1]) : '';
};

const extractListingCardText = (html, hotelName) => {
  const idx = html.indexOf(hotelName);
  if (idx < 0) return '';
  return decodeHtml(html.slice(Math.max(0, idx - 900), idx + 1800).replace(/\s+/g, ' '));
};

const buildAnalysisMarkdown = ({ listingHotel, detailHotel, detailProduct, faqPairs, boardOptions, services, roomTypes, draft, pricingDiscovery, defaultSearch, requestShape, rawNotes }) => `# TunisieBooking One Hotel Analysis

Selected hotel: ${draft.hotelName}
Source listing: ${draft.sourceListingUrl}
Detail page: ${draft.sourceUrl}

## Extracted
- Title: ${draft.title}
- City: ${draft.city}
- Region: ${draft.region}
- Address: ${draft.address}
- Main image: ${draft.image}
- Gallery images: ${draft.gallery.length}
- Rating: ${draft.ratingValue} / 5 (${draft.ratingLabel})
- Star rating: ${draft.starRating}
- Price from listing: ${draft.priceFrom} ${draft.priceCurrency}
- Price date reference: ${draft.priceDate}
- Board options: ${boardOptions.length}
- Room types: ${roomTypes.length}
- Amenities/services: ${draft.amenities.length}

## Missing Or Partial
- The listing page exposes a teaser price via JSON-LD but does not clearly label the unit.
- The detail page exposes a product offer with pricing metadata and a separate FAQ price reference.
- The page exposes board-selection codes in JavaScript, but the visible default search state is more reliable than the hidden counter fields.

## Pricing Discovery
The detail page loads pricing through the endpoint ${DETAIL_ENDPOINT_URL}.
The page JavaScript assembles a GET request from hotel id, board/formula, room distribution, dates, adults, children, and child ages.
The response is a mixed text + HTML payload split by delimiters such as \`###\` and \`~~~~~~~\`.

Observed defaults:
\`\`\`json
${JSON.stringify(defaultSearch, null, 2)}
\`\`\`

Recommended internal pricing model:
- Keep hotels as request-only drafts with a teaser \`priceFrom\`.
- Store one or more hotel room types.
- Attach board plans separately from room types.
- Model season/date rates separately from room-level supplements.
- Save quote snapshots on service requests, not on the public hotel record.

## Observed Detail Text
${extractDescriptionFromRawNotes(rawNotes)}

## Notes
- Source listing HTML is server-rendered.
- No Firestore writes were performed.
- No deploy was performed.
`;

const extractDescriptionFromRawNotes = (rawNotes) => {
  const description = rawNotes?.detailDescription || '';
  return description ? `\n${description}\n` : '\nNo additional description extracted.\n';
};

async function fetchText(url) {
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
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  const charset = charsetMatch?.[1]?.trim().toLowerCase() || 'utf-8';
  const bytes = new Uint8Array(await response.arrayBuffer());
  const decodeAttempts = [charset, 'utf-8', 'windows-1252', 'latin1'].filter((value, index, list) => value && list.indexOf(value) === index);

  for (const encoding of decodeAttempts) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: false }).decode(bytes);
      if (decoded && !hasMojibake(decoded)) {
        return decoded;
      }
    } catch {
      // Try the next encoding.
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

async function main() {
  const listingHtml = await fetchText(LISTING_URL);
  const listingJson = extractScripts(listingHtml);
  const listingItem = firstItemListHotel(listingJson);
  if (!listingItem) {
    throw new Error('Could not find a TunisieBooking ItemList hotel on the listing page.');
  }

  const sourceListingUrl = LISTING_URL;
  const sourceUrl = clean(listingItem.url || '');
  if (!sourceUrl) {
    throw new Error('Listing item did not expose a hotel detail URL.');
  }

  const detailHtml = await fetchText(sourceUrl);
  const detailJson = extractScripts(detailHtml);
  const detailProduct = firstByType(detailJson, 'Product') || {};
  const detailHotel = firstByType(detailJson, 'Hotel') || {};
  const faqPairs = parseFaq(detailJson);
  const boardOptions = parseBoardOptions(detailHtml);
  const services = parseServiceTexts(detailHtml);

  const roomTypes = [...new Set([
    ...extractFaqAnswer(faqPairs, 'Quel type de chambre propose cet etablissement ?')
      .split(/:-/)
      .pop()
      .split('-')
      .map((item) => decodeHtml(item).replace(/^:+/, '').trim())
      .filter(Boolean),
    ...[
      /chambres doubles?/i.test(detailHtml) ? 'Chambres doubles' : '',
      /suites?/i.test(detailHtml) ? 'Suites' : '',
      /houchs?/i.test(detailHtml) ? 'Houchs traditionnels' : '',
      /bungalows?/i.test(detailHtml) ? 'Bungalows' : '',
    ].filter(Boolean),
  ])];

  const listingPriceFrom = parseNumber(listingItem.priceRange) || null;
  const offerPrice = parseNumber(detailProduct?.offers?.price) || null;
  const priceCurrency = detailProduct?.offers?.priceCurrency || 'EUR';
  const priceDate = detailProduct?.offers?.priceValidUntil || new Date().toISOString().slice(0, 10);
  const pricingDiscovery = {
    sourcePriceType: 'listing_jsonld_priceRange',
    priceFrom: listingPriceFrom,
    currency: priceCurrency,
    unit: 'night',
    priceDate,
    defaultSearch: {
      checkIn: '2026-07-04',
      checkOut: '2026-07-06',
      nights: 2,
      rooms: 1,
      adults: 2,
      children: 0,
      childAges: [],
    },
    variableFactors: [
      'checkIn',
      'checkOut',
      'rooms',
      'adults',
      'children',
      'childAges',
      'boardType',
      'roomType',
    ],
    apiObserved: true,
    apiNotes: `Observed GET endpoint ${DETAIL_ENDPOINT_URL}. The page JS builds a request from hotel id, dates, rooms, adults, children, and board/room selections; the response is a mixed text/HTML payload split by "###" and "~~~~~~~". The detail page Product schema also exposes an offer price of ${offerPrice ?? 'unknown'} ${priceCurrency}.`,
    recommendedInternalPricingModel:
      'Use request-only hotel drafts with teaser prices, separate room types, board plans, seasonal rates, and request-level quote snapshots.',
  };

  const hotelName = clean(listingItem.name || detailHotel.name || '');
  const title = hotelName;
  const slug = normalizeSlug(hotelName);
  const region = inferRegionFromUrl(sourceUrl) || clean(detailHotel.address?.addressRegion || '');
  const city = clean(detailHotel.address?.addressLocality || '').split(',')[0].trim() || region || '';
  const address = clean(detailHotel.address?.streetAddress || listingItem.address?.streetAddress || '');
  const mainImage = clean(listingItem.image || detailHotel.image || '');
  const gallery = [...new Set([
    ...(Array.isArray(detailProduct.image) ? detailProduct.image : []),
    ...(Array.isArray(detailHotel.image) ? [detailHotel.image] : []),
  ].map((item) => clean(item)).filter(Boolean))];

  const ratingValue = Number(listingItem.aggregateRating?.ratingValue || detailHotel.aggregateRating?.ratingValue || 0) || null;
  const ratingLabel = ratingValue && ratingValue >= 4.5 ? 'Excellent' : ratingValue && ratingValue >= 4 ? 'Très Bien' : '';
  const starRating = Number(
    String(detailHotel.description || '').match(/(\d)\s*étoiles/i)?.[1] || (detailHotel['@type'] === 'Hotel' ? 4 : 0),
  ) || 4;

  const description = extractDescription(detailHtml) || decodeHtml(detailHotel.description || '');
  const rawListingText = extractListingCardText(listingHtml, hotelName);

  const draft = {
    sourceName: 'TunisieBooking',
    sourceListingUrl,
    sourceUrl,
    importedAt: new Date().toISOString(),
    title,
    hotelName,
    slug,
    country: 'Tunisia',
    city,
    region,
    address,
    image: mainImage,
    gallery,
    ratingValue,
    ratingLabel,
    starRating,
    description,
    amenities: services,
    boardOptions,
    roomTypes,
    priceFrom: listingPriceFrom,
    priceCurrency,
    priceUnit: 'night',
    priceDate,
    priceNote: 'Final price and availability are confirmed after request',
    priceStatus: 'source_reference',
    bookingMode: 'request_only',
    bookingEnabled: false,
    published: false,
    status: 'draft',
    pricingDiscovery,
    rawSource: {
      listing: {
        hotelName: listingItem.name || '',
        detailUrl: listingItem.url || '',
        image: listingItem.image || '',
        priceRange: listingItem.priceRange || '',
        ratingValue: listingItem.aggregateRating?.ratingValue ?? '',
        reviewCount: listingItem.aggregateRating?.reviewCount ?? '',
        rawListingText,
      },
      detail: {
        hotelName: detailHotel.name || detailProduct.name || '',
        image: detailHotel.image || '',
        description: detailHotel.description || detailProduct.description || '',
        offers: detailProduct.offers || {},
        address: detailHotel.address || {},
        faq: faqPairs,
        services,
        boardOptions,
        roomTypes,
      },
      observedFormDefaults: pricingDiscovery.defaultSearch,
      pricingEndpoint: DETAIL_ENDPOINT_URL,
    },
  };

  const requestShape = {
    hotelId: detailProduct.sku || String(listingItem.mpn || ''),
    hotelName,
    checkIn: pricingDiscovery.defaultSearch.checkIn,
    checkOut: pricingDiscovery.defaultSearch.checkOut,
    nights: pricingDiscovery.defaultSearch.nights,
    rooms: [
      {
        adults: pricingDiscovery.defaultSearch.adults,
        children: pricingDiscovery.defaultSearch.children,
        childAges: pricingDiscovery.defaultSearch.childAges,
        roomType: roomTypes[0] || '',
        boardType: boardOptions[0]?.label || '',
      },
    ],
    selectedBoardType: boardOptions[0]?.label || '',
    priceSeen: listingPriceFrom,
    priceCurrency,
    priceUnit: 'night',
    estimatedTotal: null,
    quoteStatus: 'estimate_only',
    finalConfirmationRequired: true,
    sourceName: 'TunisieBooking',
    sourceUrl,
  };

  const rawNotes = {
    detailDescription: description,
  };

  const analysisMarkdown = buildAnalysisMarkdown({
    listingHotel: listingItem,
    detailHotel,
    detailProduct,
    faqPairs,
    boardOptions,
    services,
    roomTypes,
    draft,
    pricingDiscovery,
    defaultSearch: pricingDiscovery.defaultSearch,
    requestShape,
    rawNotes,
  });

  fs.mkdirSync(path.dirname(OUTPUT_DRAFT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_DRAFT_PATH, JSON.stringify(draft, null, 2));
  fs.writeFileSync(OUTPUT_REQUEST_PATH, JSON.stringify(requestShape, null, 2));
  fs.writeFileSync(OUTPUT_ANALYSIS_PATH, analysisMarkdown);
  fs.writeFileSync(
    OUTPUT_DEBUG_PATH,
    JSON.stringify(
      {
        listingUrl: LISTING_URL,
        detailUrl: sourceUrl,
        selectedHotelName: hotelName,
        hotelName,
        ratingValue,
        priceFrom: listingPriceFrom,
        offerPrice,
        priceCurrency,
        priceDate,
        boardOptions,
        servicesCount: services.length,
        roomTypes,
        extractedFaqQuestions: faqPairs.map((item) => item.question),
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        selectedHotelName: hotelName,
        sourceListingUrl,
        sourceUrl,
        priceFrom: listingPriceFrom,
        priceCurrency,
        priceDate,
        galleryCount: gallery.length,
        roomTypes: roomTypes.length,
        amenities: services.length,
        boardOptions: boardOptions.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
