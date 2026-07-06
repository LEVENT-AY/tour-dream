import fs from 'node:fs';
import path from 'node:path';
import { normalizeHotelImageUrlList, normalizeAbsoluteImageUrl } from './tunisiebooking-image-utils.mjs';

const LISTING_URL = 'https://www.tunisiebooking.com/hotel-tunisie/';
const DETAIL_ENDPOINT_URL = 'https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php';
const OUTPUT_DRAFT_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-draft.json');
const OUTPUT_REQUEST_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-booking-request-shape.json');
const OUTPUT_ANALYSIS_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-analysis.md');
const OUTPUT_DEBUG_PATH = path.join(process.cwd(), 'tmp', 'tunisiebooking-one-hotel-analysis.json');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const unique = (items) => [...new Set(items.filter(Boolean))];

const hasBrokenReplacement = (value) => /�/.test(String(value || ''));
const hasCommonMojibake = (value) => /Ã.|Â.|â.|ï¿½/.test(String(value || ''));
const repairMojibake = (value) => {
  const text = clean(value);
  if (!text || !hasCommonMojibake(text)) return text;
  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8').replace(/\u0000/g, '').trim();
    return repaired || text;
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
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&agrave;/gi, 'à')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&icirc;/gi, 'î')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&deg;/gi, '°')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const decodeHtml = (value) => repairMojibake(clean(decodeHtmlEntities(value).replace(/\u00a0/g, ' ')));
const stripTags = (value) => decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '));
const stripTagsPreserveUtf8 = (value) => clean(decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\u00a0/g, ' '));

const scoreDecodedText = (text) => {
  const value = String(text || '');
  const replacementCount = (value.match(/�/g) || []).length;
  const mojibakeCount = (value.match(/Ã.|Â.|â.|ï¿½/g) || []).length;
  const frenchAccentCount = (value.match(/[àâçéèêëîïôùûüœ]/gi) || []).length;
  const hotelSignalCount = (value.match(/\b(hôtel|étoiles|région|établissement|séjour|plage|piscine)\b/gi) || []).length;
  return (frenchAccentCount * 3) + (hotelSignalCount * 5) - (replacementCount * 50) - (mojibakeCount * 20);
};

const sniffCharset = (buffer) => {
  const head = Buffer.from(buffer).toString('latin1', 0, Math.min(buffer.length, 4096));
  return head.match(/charset=([a-z0-9._-]+)/i)?.[1]?.trim().toLowerCase() || '';
};

const normalizeUrlList = (items) =>
  unique(items.map((item) => normalizeAbsoluteImageUrl(item)).filter((item) => /^https?:\/\//i.test(item)));

const normalizeSlug = (value) =>
  clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const parseNumber = (value) => {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

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
    lpd: 'Petit Déjeuner',
    dp: 'Demi Pension',
    dp_plus: 'Demi Pension plus',
    pc: 'Pension complète',
    pc_plus: 'Pension complète plus',
    allin: 'Tout Compris',
    allin_soft: 'Tout Compris soft',
  };

  const codes = unique([...html.matchAll(/if\s*\(pension=='([^']+)'\)/g)].map((match) => match[1]));
  return codes.map((code) => ({
    code,
    label: codeToLabel[code] || code,
  }));
};

const parseServiceTexts = (html) =>
  unique(
    [...html.matchAll(/<div class='col-md-4 border-start' id='sous_services'[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g)]
      .map((match) => stripTags(match[1])),
  );

const parseGalleryImages = (html, sourceUrl) =>
  normalizeHotelImageUrlList(
    [...html.matchAll(/"src"\s*:\s*"([^"]+)"/g)]
      .map((match) => match[1])
      .filter((src) => /image\.resabooking\.com|tunisiebooking\.com/i.test(src) && /Vincci_Helios_Beach/i.test(src)),
    { baseUrl: sourceUrl },
  );

const parseReviews = (html) =>
  [...html.matchAll(/<div class="row row_avis[^"]*"[^>]*>[\s\S]*?<div class="desc_avis_txt">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="desc_avis_date">([^<]+)<\/div>/g)]
    .map((match) => ({
      text: stripTags(match[1]),
      date: decodeHtml(match[2]),
    }))
    .filter((entry) => entry.text || entry.date);

const parseNearbyAttractions = (html) => {
  const extendedHtml = extractDescriptionHtml(html, 'ruslt_descriptif22');
  const blocks = [];
  for (const [, heading, body] of extendedHtml.matchAll(/<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p>/gi)) {
    const title = stripTagsPreserveUtf8(heading);
    const text = stripTagsPreserveUtf8(body);
    if (title && text) {
      blocks.push(`${title}: ${text}`);
    }
  }
  return blocks;
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

const inferRegionFromUrl = (url) => decodeHtml(String(url).match(/hotel-tunisie\/([^/]+)\//i)?.[1] || '');

const extractListingCardText = (html, hotelName) => {
  const idx = html.indexOf(hotelName);
  if (idx < 0) return '';
  return decodeHtml(html.slice(Math.max(0, idx - 900), idx + 1800).replace(/\s+/g, ' '));
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
  const charsetHeader = contentType.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase() || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  const sniffedCharset = sniffCharset(bytes);
  const decodeAttempts = unique([charsetHeader, sniffedCharset, 'utf-8', 'windows-1252', 'latin1']).filter(Boolean);

  let bestDecoded = '';
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const encoding of decodeAttempts) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: false }).decode(bytes);
      const repaired = repairMojibake(decoded);
      const decodedScore = scoreDecodedText(decoded);
      const repairedScore = scoreDecodedText(repaired);
      const candidate = repairedScore >= decodedScore ? repaired : decoded;
      const score = Math.max(decodedScore, repairedScore);
      if (score > bestScore) {
        bestScore = score;
        bestDecoded = candidate;
      }
    } catch {
      // Try the next encoding.
    }
  }

  return bestDecoded || repairMojibake(new TextDecoder('utf-8', { fatal: false }).decode(bytes));
}

const buildAnalysisMarkdown = ({ draft, requestShape }) => `# TunisieBooking One Hotel Analysis

Selected hotel: ${draft.hotelName}
Source listing: ${draft.sourceListingUrl}
Detail page: ${draft.sourceUrl}

## Extracted
- Title: ${draft.title}
- City: ${draft.city}
- Region: ${draft.region}
- Address: ${draft.address}
- Coordinates: ${draft.latitude}, ${draft.longitude}
- Main image: ${draft.image}
- Gallery images: ${draft.gallery.length}
- Rating: ${draft.ratingValue} / 5 (${draft.ratingLabel})
- Star rating: ${draft.starRating}
- Price from listing: ${draft.priceFrom} ${draft.priceCurrency}
- Price date reference: ${draft.priceDate}
- Board options: ${draft.boardOptions.length}
- Room types: ${draft.roomTypes.length}
- Amenities/services: ${draft.amenities.length}
- FAQ entries: ${draft.faq.length}
- Reviews extracted: ${draft.reviews.length}
- Nearby attractions: ${draft.nearbyAttractions.length}

## Missing Fields
${draft.missingFields.map((item) => `- ${item}`).join('\n')}

## Pricing Discovery
- Dynamic pricing status: ${draft.dynamicPricingStatus}
- API endpoint: ${draft.apiEndpoint}
- API notes: ${draft.apiNotes}

Observed request shape:
\`\`\`json
${JSON.stringify(requestShape, null, 2)}
\`\`\`

## Notes
- Source listing HTML is server-rendered.
- No Firestore writes were performed.
- No deploy was performed.
`;

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
  const faq = parseFaq(detailJson);
  const reviews = parseReviews(detailHtml);
  const amenities = parseServiceTexts(detailHtml);
  const boardOptions = parseBoardOptions(detailHtml);
  const gallery = parseGalleryImages(detailHtml, sourceUrl);
  const highlights = extractHighlights(detailHtml);
  const nearbyAttractions = parseNearbyAttractions(detailHtml);
  const descriptionHtmlBlock = extractDescriptionHtml(detailHtml, 'ruslt_descriptif2');
  const descriptionExtendedHtmlBlock = extractDescriptionHtml(detailHtml, 'ruslt_descriptif22');
  const descriptionFromHtml = stripTagsPreserveUtf8(descriptionHtmlBlock);
  const description = hasBrokenReplacement(descriptionFromHtml)
    ? decodeHtml(detailHotel.description || detailProduct.description || '')
    : descriptionFromHtml || decodeHtml(detailHotel.description || detailProduct.description || '');
  const descriptionExtended = hasBrokenReplacement(stripTagsPreserveUtf8(descriptionExtendedHtmlBlock))
    ? stripTags(descriptionExtendedHtmlBlock)
    : stripTagsPreserveUtf8(descriptionExtendedHtmlBlock);
  const roomTypes = unique([
    ...extractFaqAnswer(faq, 'Quel type de chambre propose cet etablissement ?')
      .split(/:-/)
      .pop()
      .split('-')
      .map((item) => decodeHtml(item).replace(/^:+/, '').trim())
      .filter((item) => item && !/prestations de l'hotel/i.test(item)),
    ...['Chambres doubles', 'Suites', 'Houchs traditionnels', 'Bungalows'].filter((label) => new RegExp(label.replace(/\s+/g, '\\s+'), 'i').test(description)),
  ]);

  const listingPriceFrom = parseNumber(listingItem.priceRange) || null;
  const offerPrice = parseNumber(detailProduct?.offers?.price) || null;
  const priceCurrency = clean(detailProduct?.offers?.priceCurrency || 'EUR');
  const priceDate = clean(detailProduct?.offers?.priceValidUntil || new Date().toISOString().slice(0, 10));
  const hotelName = clean(listingItem.name || detailHotel.name || detailProduct.name || '');
  const title = hotelName;
  const slug = normalizeSlug(hotelName);
  const region = inferRegionFromUrl(sourceUrl) || clean(detailHotel.address?.addressRegion || '');
  const city = clean(detailHotel.address?.addressLocality || '').split(',')[0].trim() || region || '';
  const address = clean(detailHotel.address?.streetAddress || listingItem.address?.streetAddress || '');
  const image = normalizeHotelImageUrlList([listingItem.image, detailHotel.image, gallery[0]], { baseUrl: sourceUrl })[0] || '';
  const normalizedGallery = normalizeHotelImageUrlList(gallery, { baseUrl: sourceUrl, excludeUrl: image });
  const ratingValue = Number(listingItem.aggregateRating?.ratingValue || detailHotel.aggregateRating?.ratingValue || 0) || null;
  const ratingLabel = ratingValue && ratingValue >= 4.5 ? 'Excellent' : ratingValue && ratingValue >= 4 ? 'Très Bien' : '';
  const reviewsCount = Number(listingItem.aggregateRating?.reviewCount || reviews.length || 0) || reviews.length || 0;
  const reviewSummary = ratingValue && reviewsCount ? `${ratingLabel || 'Rated'} based on ${reviewsCount} reviews` : '';
  const starRating = Number(String(description).match(/(\d)\s*étoiles/i)?.[1] || 4) || 4;
  const latitude = parseNumber(detailHotel?.geo?.latitude);
  const longitude = parseNumber(detailHotel?.geo?.longitude);
  const { roomInventoryText, roomCount } = extractRoomInventory(`${description} ${descriptionExtended}`);
  const checkInFaq = extractFaqAnswer(faq, "horaires d'arrivee");
  const checkInTime = clean(checkInFaq.match(/à partir de ([0-9h:\s]+)(?:jusqu|et)/i)?.[1] || '14h');
  const checkOutTime = clean(checkInFaq.match(/départs? à ([0-9h:\s]+)/i)?.[1] || '12h');

  const defaultSearch = {
    checkIn: '2026-07-04',
    checkOut: '2026-07-06',
    nights: 2,
    rooms: 1,
    adults: 2,
    children: 0,
    childAges: [],
  };

  const pricingDiscovery = {
    sourcePriceType: 'listing_jsonld_priceRange',
    priceFrom: listingPriceFrom,
    currency: priceCurrency,
    unit: 'night',
    priceDate,
    defaultSearch,
    variableFactors: ['checkIn', 'checkOut', 'rooms', 'adults', 'children', 'childAges', 'boardType', 'roomType'],
    apiObserved: true,
    apiEndpoint: DETAIL_ENDPOINT_URL,
    apiNotes: `Observed GET endpoint ${DETAIL_ENDPOINT_URL}. Page JavaScript assembles a request with hotel id, dates, rooms, adults, children, board formula, and room type. Direct scripted replay is guarded, so dynamic rates are not integrated into this draft.`,
    recommendedInternalPricingModel:
      'Keep this hotel request-only with teaser price data on the public draft and confirm final rates manually after request.',
  };

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
    starRating,
    ratingValue,
    ratingLabel,
    reviewsCount,
    reviewSummary,
    image,
    gallery: normalizedGallery,
    latitude,
    longitude,
    mapSource: 'TunisieBooking',
    nearbyAttractions,
    description,
    highlights,
    amenities,
    services: amenities,
    roomTypes,
    boardOptions,
    faq,
    reviews,
    roomInventoryText: roomInventoryText || null,
    roomCount,
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
    policySource: 'TunisieBooking',
    cancellationPolicy: null,
    childrenPolicy: null,
    paymentPolicy: null,
    lateCheckoutPolicy: null,
    priceFrom: listingPriceFrom,
    priceCurrency,
    priceUnit: 'night',
    priceDate,
    priceNote: 'Final price and availability are confirmed after request',
    priceStatus: 'source_reference',
    pricingDiscovery,
    dynamicPricingStatus: 'api_observed_but_not_integrated',
    apiObserved: true,
    apiEndpoint: DETAIL_ENDPOINT_URL,
    apiNotes: pricingDiscovery.apiNotes,
    missingFields,
    completeness: {
      identity: 'complete',
      images: 'complete',
      description: 'complete',
      amenities: 'complete',
      roomTypes: 'partial',
      boardOptions: 'partial',
      pricing: 'partial',
      location: 'complete',
      policies: 'partial',
      faq: 'complete',
      reviews: 'complete',
      providerContact: 'missing',
      dynamicPricing: 'partial',
    },
    bookingMode: 'request_only',
    bookingEnabled: false,
    published: false,
    status: 'draft',
    rawSource: {
      listing: {
        hotelName: decodeHtml(listingItem.name || ''),
        detailUrl: listingItem.url || '',
        image: listingItem.image || '',
        priceRange: listingItem.priceRange || '',
        ratingValue: listingItem.aggregateRating?.ratingValue ?? '',
        reviewCount: listingItem.aggregateRating?.reviewCount ?? '',
        rawListingText,
      },
      detail: {
        hotelName: decodeHtml(detailHotel.name || detailProduct.name || ''),
        image: detailHotel.image || '',
        description: decodeHtml(detailHotel.description || detailProduct.description || ''),
        descriptionExtended,
        offers: detailProduct.offers || {},
        address: detailHotel.address || {},
        geo: detailHotel.geo || {},
        faq,
        reviews,
        nearbyAttractions,
        services: amenities,
        boardOptions,
        roomTypes,
      },
      observedFormDefaults: defaultSearch,
      pricingEndpoint: DETAIL_ENDPOINT_URL,
      imageNormalization: {
        mainImage: image,
        galleryCount: normalizedGallery.length,
      },
    },
  };

  const requestShape = {
    hotelId: detailProduct.sku || String(listingItem.mpn || ''),
    hotelName,
    checkIn: defaultSearch.checkIn,
    checkOut: defaultSearch.checkOut,
    nights: defaultSearch.nights,
    rooms: [
      {
        adults: defaultSearch.adults,
        children: defaultSearch.children,
        childAges: defaultSearch.childAges,
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

  const analysisMarkdown = buildAnalysisMarkdown({ draft, requestShape });

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
        reviewsCount,
        priceFrom: listingPriceFrom,
        offerPrice,
        priceCurrency,
        priceDate,
        image,
        galleryCount: draft.gallery.length,
        galleryUrls: draft.gallery,
        imageHasReplacementChar: hasBrokenReplacement(image),
        descriptionHasReplacementChar: hasBrokenReplacement(description),
        highlightHasReplacementChar: highlights.some((item) => hasBrokenReplacement(item)),
        faqHasReplacementChar: faq.some((item) => hasBrokenReplacement(item.question) || hasBrokenReplacement(item.answer)),
        nearbyHasReplacementChar: nearbyAttractions.some((item) => hasBrokenReplacement(item)),
        boardOptions,
        servicesCount: amenities.length,
        roomTypes,
        faqCount: faq.length,
        nearbyCount: nearbyAttractions.length,
        extractedFaqQuestions: faq.map((item) => item.question),
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
        mainImage: image,
        galleryCount: draft.gallery.length,
        roomTypes: roomTypes.length,
        amenities: amenities.length,
        boardOptions: boardOptions.length,
        faqCount: faq.length,
        reviewsCount,
        nearbyCount: nearbyAttractions.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
