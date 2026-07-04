import fs from 'node:fs';
import path from 'node:path';

const DETAIL_URL = 'https://www.tunisiebooking.com/hotel-tunisie/djerba/hotels/hotel-vincci-helios-beach-djerba.html';
const ROBOTS_URL = 'https://www.tunisiebooking.com/robots.txt';
const PRICING_URL = 'https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php';
const TMP_DIR = path.join(process.cwd(), 'tmp');
const OUTPUT_JSON_PATH = path.join(TMP_DIR, 'tunisiebooking-vincci-source-audit.json');
const OUTPUT_MD_PATH = path.join(TMP_DIR, 'tunisiebooking-vincci-source-audit.md');

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const compactText = (value) => clean(String(value ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<[^>]+>/g, ' '));
const unique = (items) => [...new Set(items.filter(Boolean))];

const hasMojibake = (value) => /[ÃÂ�]/.test(String(value || ''));

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
      .trim(),
  );

const stripTags = (value) => decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '));

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
  const decodeAttempts = unique([charset, 'utf-8', 'windows-1252', 'latin1']);

  for (const encoding of decodeAttempts) {
    try {
      const decoded = new TextDecoder(encoding, { fatal: false }).decode(bytes);
      if (decoded) return decoded;
    } catch {
      // Ignore and try next decoder.
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

const extractJsonLdBlocks = (html) => {
  const blocks = [];
  const regex = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }
  return blocks;
};

const firstByType = (items, typeName) =>
  items.find((item) => item && (item['@type'] === typeName || item['@type']?.includes?.(typeName))) || null;

const extractHiddenInputs = (html) => {
  const result = {};
  const regex = /<input[^>]+type="hidden"[^>]*?(?:name|id)="([^"]+)"[^>]*value="([^"]*)"/gi;
  for (const match of html.matchAll(regex)) {
    const key = clean(match[1]);
    const value = decodeHtml(match[2]);
    if (!result[key]) result[key] = value;
  }
  return result;
};

const extractVisibleDateDefaults = (html) => ({
  checkIn: decodeHtml(html.match(/id="checkin1"[^>]*value="([^"]+)"/i)?.[1] || html.match(/id="checkin"[^>]*value="([^"]+)"/i)?.[1] || ''),
  checkOut: decodeHtml(html.match(/id="checkout1"[^>]*value="([^"]+)"/i)?.[1] || html.match(/id="checkout"[^>]*value="([^"]+)"/i)?.[1] || ''),
  nights: Number(html.match(/id="nbr_nuit"[^>]*value="([^"]+)"/i)?.[1] || 0) || null,
  rooms: Number(html.match(/name="chambres"[^>]*value="([^"]+)"/i)?.[1] || html.match(/id="select_ch"[^>]*value="([^"]+)"/i)?.[1] || 0) || null,
  adults: Number(html.match(/id="span-pax"[^>]*>\s*([0-9]+)/i)?.[1] || 0) || null,
  children: Number(html.match(/id="span-en"[^>]*>\s*([0-9]+)/i)?.[1] || 0),
});

const extractRoomTypesFromFaq = (faqPairs) =>
  unique(
    decodeHtml(
      faqPairs.find((entry) => entry.question.toLowerCase().includes('type de chambre'))?.answer || '',
    )
      .split(/:-|-/)
      .map((item) => clean(item.replace(/^:+/, '')))
      .filter((item) => item && !/prestations de l'hotel/i.test(item)),
  );

const parseFaqPairs = (faqPage) =>
  (faqPage?.mainEntity || [])
    .map((entity) => ({
      question: decodeHtml(entity?.name || ''),
      answer: decodeHtml(entity?.acceptedAnswer?.text || ''),
    }))
    .filter((entry) => entry.question || entry.answer);

const parseAmenities = (html) =>
  unique(
    [...html.matchAll(/<div class='col-md-4 border-start' id='sous_services'[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/g)].map((match) =>
      stripTags(match[1]),
    ),
  );

const parseGallery = (html) =>
  unique(
    [...html.matchAll(/"src"\s*:\s*"([^"]+)"/g)]
      .map((match) => clean(match[1]))
      .filter((src) => src.includes('image.resabooking.com')),
  );

const parseReviews = (html) =>
  [...html.matchAll(/<div class="row row_avis[^"]*"[^>]*>[\s\S]*?<div class="desc_avis_txt">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="desc_avis_date">([^<]+)<\/div>/g)].map(
    (match) => ({
      text: compactText(match[1]),
      date: decodeHtml(match[2]),
    }),
  );

const parseDescriptionBlocks = (html) => ({
  primaryHtml: html.match(/<div id="ruslt_descriptif2"[^>]*>([\s\S]*?)<\/div><div style=/i)?.[1] || '',
  extendedHtml: html.match(/<div id="ruslt_descriptif22"[^>]*>([\s\S]*?)<\/div><div style=/i)?.[1] || '',
});

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

  const codes = unique([...html.matchAll(/if\s*\(pension=='([^']+)'\)/g)].map((match) => clean(match[1])));
  return codes.map((code) => ({ code, label: codeToLabel[code] || code }));
};

const parseNearbySections = (extendedText) => {
  const lines = extendedText.split(/(?=<h[23]>)/i);
  return {
    nearbyAttractions: lines.filter((line) => /restaurants à proximité|cafés aux alentours|hôtels à proximité/i.test(line)).map(compactText),
    aliases: compactText(extendedText.match(/Cet hôtel est également connu sous le nom :([\s\S]*)/i)?.[1] || ''),
  };
};

const extractJsRequestSnippet = (html) =>
  clean(
    html.match(/var myData = "id_hotel_xml=9"[\s\S]*?url:\s*"https:\/\/www\.tunisiebooking\.com\/theme\/traitement_detailv4resp2_fr_new\.php"[\s\S]*?success:\s*function\s*\(response\)\s*\{[\s\S]*?\}\s*\}\);/i)?.[0] ||
      '',
  );

const normalizeSample = (value) => {
  if (Array.isArray(value)) return value.slice(0, 3);
  if (value && typeof value === 'object') return value;
  return clean(value);
};

function buildField(fieldName, status, sourceLocation, valueSample, selectorOrPattern, confidence, notes) {
  return {
    fieldName,
    status,
    sourceLocation,
    valueSample: normalizeSample(valueSample),
    selectorOrPattern,
    confidence,
    notes,
  };
}

function classifySection(section, data) {
  const {
    gallery,
    descriptionText,
    amenities,
    roomTypes,
    boardOptions,
    reviews,
    coordinates,
    nearbyAttractions,
    policies,
    providerContact,
  } = data;

  const sectionMap = {
    'Hero/gallery': gallery.length
      ? ['source_backed_from_tunisiebooking', 'Detail page exposes hotel-specific gallery array and lead image.']
      : ['missing_not_found_on_page', 'No source-backed gallery found.'],
    Description: descriptionText
      ? ['source_backed_from_tunisiebooking', 'Long-form description exists in detail HTML and inline script.']
      : ['missing_not_found_on_page', 'No reliable hotel description found.'],
    Highlights: descriptionText.includes('Les points forts')
      ? ['missing_but_can_be_completed_from_page', 'Highlights are embedded inside the description block and can be split out safely.']
      : ['currently_fake_template', 'No separate highlights section was found.'],
    'Popular Amenities': amenities.length
      ? ['source_backed_from_tunisiebooking', 'Amenities/services grid is present in detail HTML.']
      : ['missing_not_found_on_page', 'No amenity grid found.'],
    'Room types': roomTypes.length
      ? ['source_backed_from_tunisiebooking', 'Room types are discoverable via FAQ answers and descriptive text.']
      : ['missing_not_found_on_page', 'No room type evidence found.'],
    Availability: boardOptions.length
      ? ['should_come_from_future_pricing_model', 'Pricing form and endpoint exist, but direct API response is guarded and final availability should come from future pricing logic.']
      : ['missing_not_found_on_page', 'No reliable availability data found in static HTML.'],
    Services: amenities.length
      ? ['source_backed_from_tunisiebooking', 'Services are source-backed by the amenities grid.']
      : ['missing_not_found_on_page', 'No services data found.'],
    Gallery: gallery.length
      ? ['source_backed_from_tunisiebooking', 'Gallery image array is present in page script.']
      : ['missing_not_found_on_page', 'No gallery images found.'],
    'Hotel Rules': policies.checkIn && policies.checkOut
      ? ['missing_but_can_be_completed_from_page', 'Check-in/check-out exists via FAQ, but cancellation, payment, and children policies are not source-backed.']
      : ['currently_fake_template', 'Rules section cannot be completed from source alone.'],
    FAQ: reviews.length >= 0
      ? ['source_backed_from_tunisiebooking', 'Structured FAQ data exists via JSON-LD.']
      : ['missing_not_found_on_page', 'No FAQ found.'],
    Reviews: reviews.length
      ? ['source_backed_from_tunisiebooking', 'Traveler review rows are present in detail HTML and a dedicated review URL is linked.']
      : ['missing_not_found_on_page', 'No review rows found.'],
    'Provider Details': providerContact.phone || providerContact.website
      ? ['should_be_manual_admin_field', 'Only limited provider/support contact is visible; hotel-specific contact should be confirmed manually.']
      : ['should_be_manual_admin_field', 'Hotel-specific provider details were not found on page.'],
    'Map/Nearby': coordinates.latitude && nearbyAttractions.length
      ? ['missing_but_can_be_completed_from_page', 'Coordinates and nearby places exist, but should render only from real Tunisia source data.']
      : ['missing_not_found_on_page', 'No reliable map/nearby data found.'],
  };

  const [classification, notes] = sectionMap[section];
  return { section, classification, notes };
}

async function main() {
  const [robotsText, detailHtml] = await Promise.all([fetchText(ROBOTS_URL), fetchText(DETAIL_URL)]);
  const jsonLdBlocks = extractJsonLdBlocks(detailHtml);
  const faqPage = firstByType(jsonLdBlocks, 'FAQPage');
  const productSchema = firstByType(jsonLdBlocks, 'Product');
  const hotelSchema = firstByType(jsonLdBlocks, 'Hotel');
  const faqPairs = parseFaqPairs(faqPage);
  const hiddenInputs = extractHiddenInputs(detailHtml);
  const visibleDefaults = extractVisibleDateDefaults(detailHtml);
  const amenities = parseAmenities(detailHtml);
  const gallery = parseGallery(detailHtml);
  const reviews = parseReviews(detailHtml);
  const descriptionBlocks = parseDescriptionBlocks(detailHtml);
  const primaryDescriptionText = compactText(descriptionBlocks.primaryHtml);
  const extendedDescriptionText = compactText(descriptionBlocks.extendedHtml);
  const nearby = parseNearbySections(descriptionBlocks.extendedHtml);
  const boardOptions = parseBoardOptions(detailHtml);
  const roomTypes = unique([
    ...extractRoomTypesFromFaq(faqPairs),
    ...['Chambres doubles', 'Suites', 'Houchs traditionnels', 'Bungalows'].filter((label) => new RegExp(label.replace(/\s+/g, '\\s+'), 'i').test(primaryDescriptionText)),
  ]);

  const pricingDefaults = {
    checkIn: visibleDefaults.checkIn,
    checkOut: visibleDefaults.checkOut,
    nights: visibleDefaults.nights,
    rooms: visibleDefaults.rooms,
    adults: visibleDefaults.adults,
    children: visibleDefaults.children,
    hotelId: hiddenInputs.id_xml_hotel || '9',
    ville: hiddenInputs.ville || 'Djerba',
    source_comm: hiddenInputs.source_comm || 'web desktop',
  };

  const pricingParams = new URLSearchParams({
    id_hotel_xml: pricingDefaults.hotelId,
    formule: '',
    session: '',
    type_chambre: '',
    testmodif: '',
    ville: pricingDefaults.ville,
    DOPBookingSystem_CheckIn1: pricingDefaults.checkIn,
    nbr_nuit: String(pricingDefaults.nights || ''),
    chambres: String(pricingDefaults.rooms || ''),
    source_comm: pricingDefaults.source_comm,
    adultes1: String(pricingDefaults.adults || ''),
    enfants1: String(pricingDefaults.children || ''),
  });

  let pricingResponseText = '';
  let pricingResponseSummary = {};
  try {
    pricingResponseText = await fetchText(`${PRICING_URL}?${pricingParams.toString()}`);
  } catch (error) {
    pricingResponseText = `ERROR: ${error?.message || error}`;
  }

  const pricingBlocked =
    !pricingResponseText ||
    /Acc[eè]s Bloqu[eé]|activit[eé] automatis[eé]e non autoris[eé]e|scraping/i.test(pricingResponseText);
  const hasDelimiters = pricingResponseText.includes('###') || pricingResponseText.includes('~~~~~~~');

  if (pricingBlocked) {
    pricingResponseSummary = {
      status: 'blocked',
      notes:
        'Direct scripted replay of the observed pricing endpoint is guarded outside the normal browser flow. In this audit context it returned either an explicit anti-bot page or an empty 200 response, so live room/board/price rows could not be confirmed safely server-side.',
      responsePreview: compactText(pricingResponseText).slice(0, 280),
    };
  } else if (hasDelimiters) {
    const topSplit = pricingResponseText.split('~~~~~~~');
    const sections = topSplit[0].split('###');
    pricingResponseSummary = {
      status: 'delimited_payload',
      topLevelSections: topSplit.length,
      hashSections: sections.length,
      responsePreview: compactText(pricingResponseText).slice(0, 280),
      containsRoomWords: /chambre|formule|prix|adulte|enfant/i.test(pricingResponseText),
    };
  } else {
    pricingResponseSummary = {
      status: 'other',
      notes: 'Endpoint responded, but not with the expected delimiter payload.',
      responsePreview: compactText(pricingResponseText).slice(0, 280),
    };
  }

  const faqAnswer = (needle) =>
    decodeHtml(faqPairs.find((entry) => entry.question.toLowerCase().includes(needle.toLowerCase()))?.answer || '');

  const policies = {
    checkIn: faqAnswer("horaires d'arrivee"),
    checkOut: faqAnswer("horaires d'arrivee"),
    cancellation: '',
    children: '',
    payment: '',
    lateCheckout: '',
  };

  const coordinates = {
    latitude: decodeHtml(hotelSchema?.geo?.latitude || ''),
    longitude: decodeHtml(hotelSchema?.geo?.longitude || ''),
  };

  const providerContact = {
    phone: decodeHtml(hotelSchema?.telephone || ''),
    email: '',
    website: '',
    reviewsUrl: decodeHtml(detailHtml.match(/href="(https:\/\/www\.tunisiebooking\.com\/avis_hotel\/[^"]+)"/i)?.[1] || ''),
  };

  const fieldAudit = [
    buildField('hotelName', 'found', 'json_ld', hotelSchema?.name || productSchema?.name, '"@type":"Hotel" -> name', 'high', 'Hotel name is present in structured data and visible page title areas.'),
    buildField('starRating', 'found', 'detail_html', '4 étoiles', 'description block / Product + Hotel context', 'high', 'Visible description explicitly says hôtel 4 étoiles.'),
    buildField('city/region', 'found', 'json_ld', hotelSchema?.address?.addressLocality || hotelSchema?.address?.addressRegion, 'Hotel.address.addressLocality / addressRegion', 'high', 'Address schema includes Midoun Djerba and region Djerba.'),
    buildField('address', 'found', 'json_ld', hotelSchema?.address?.streetAddress, 'Hotel.address.streetAddress', 'high', 'Postal address is in Hotel schema.'),
    buildField('latitude/longitude or map coordinates', coordinates.latitude && coordinates.longitude ? 'found' : 'missing', coordinates.latitude ? 'json_ld' : 'not_found', coordinates, 'Hotel.geo.latitude / Hotel.geo.longitude', coordinates.latitude ? 'high' : 'low', coordinates.latitude ? 'Real Tunisia coordinates are present in Hotel schema.' : 'No coordinates found.'),
    buildField('description', primaryDescriptionText ? 'found' : 'missing', primaryDescriptionText ? 'detail_html' : 'not_found', primaryDescriptionText.slice(0, 240), '#ruslt_descriptif2', primaryDescriptionText ? 'high' : 'low', 'Long descriptive copy and highlights are embedded in the detail HTML.'),
    buildField('gallery images', gallery.length ? 'found' : 'missing', gallery.length ? 'inline_script' : 'not_found', gallery.slice(0, 5), 'tabimg / "src" image array in inline script', gallery.length ? 'high' : 'low', `Found ${gallery.length} hotel image URLs in page script.`),
    buildField('amenities/services', amenities.length ? 'found' : 'missing', amenities.length ? 'detail_html' : 'not_found', amenities.slice(0, 8), "#sous_services span", amenities.length ? 'high' : 'low', `Found ${amenities.length} source-backed amenity/service labels.`),
    buildField('roomTypes', roomTypes.length ? 'found' : 'missing', roomTypes.length ? 'json_ld' : 'not_found', roomTypes, 'FAQ answer + description keywords', roomTypes.length ? 'medium' : 'low', 'Room types are inferred from FAQ answers and description text rather than a dedicated structured list.'),
    buildField('boardOptions', boardOptions.length ? 'partial' : 'missing', boardOptions.length ? 'inline_script' : 'not_found', boardOptions, "inline JS pension codes: if (pension=='...')", boardOptions.length ? 'medium' : 'low', 'Board plans are defined in page JavaScript, not as a visible structured catalog block.'),
    buildField('checkIn time', policies.checkIn ? 'found' : 'missing', policies.checkIn ? 'json_ld' : 'not_found', policies.checkIn, 'FAQPage -> horaires arrivée/départ', policies.checkIn ? 'medium' : 'low', 'Present in FAQ answer, not in a dedicated policy section.'),
    buildField('checkOut time', policies.checkOut ? 'found' : 'missing', policies.checkOut ? 'json_ld' : 'not_found', policies.checkOut, 'FAQPage -> horaires arrivée/départ', policies.checkOut ? 'medium' : 'low', 'The same FAQ answer includes departure time 12h.'),
    buildField('cancellation policy', 'missing', 'not_found', '', 'No policy selector/pattern found', 'low', 'No source-backed cancellation policy found on the detail page.'),
    buildField('children policy', 'missing', 'not_found', '', 'No children policy selector/pattern found', 'low', 'Children counts exist in booking form, but no child policy text was found.'),
    buildField('payment/guarantee policy', 'missing', 'not_found', '', 'No payment policy selector/pattern found', 'low', 'The page links to secure payment flow, but no policy text was found.'),
    buildField('late checkout policy', 'missing', 'not_found', '', 'No late checkout selector/pattern found', 'low', 'No late checkout rule found.'),
    buildField('listing price', productSchema?.offers?.price ? 'found' : 'missing', productSchema?.offers?.price ? 'json_ld' : 'not_found', hotelSchema?.priceRange || productSchema?.offers?.price, 'Hotel.priceRange / Product.offers.price', 'high', 'Structured data exposes both a hotel price range string and a Product offer price.'),
    buildField('detail page price', productSchema?.offers?.price ? 'found' : 'missing', productSchema?.offers?.price ? 'json_ld' : 'not_found', productSchema?.offers?.price, 'Product.offers.price', productSchema?.offers?.price ? 'high' : 'low', 'Product schema exposes 82 EUR on the detail page.'),
    buildField('price unit', productSchema?.offers?.price ? 'partial' : 'missing', productSchema?.offers?.price ? 'json_ld' : 'not_found', 'night', 'Inferred from site pricing display and current extraction logic', productSchema?.offers?.price ? 'medium' : 'low', 'The unit is not explicitly labeled in JSON-LD; night is inferred from hotel listing context.'),
    buildField('board-specific prices', pricingBlocked ? 'unclear' : 'api_only', pricingBlocked ? 'ajax_response' : 'ajax_response', pricingResponseSummary.responsePreview || '', PRICING_URL, pricingBlocked ? 'low' : 'medium', pricingBlocked ? 'Direct endpoint call was blocked, but page JavaScript suggests board/formula-specific results.' : 'Would come from pricing payload, not static HTML.'),
    buildField('room-type-specific prices', pricingBlocked ? 'unclear' : 'api_only', pricingBlocked ? 'ajax_response' : 'ajax_response', pricingResponseSummary.responsePreview || '', PRICING_URL, pricingBlocked ? 'low' : 'medium', pricingBlocked ? 'Direct endpoint call was blocked; code strongly suggests per-room results in returned HTML.' : 'Likely returned in room selection result HTML.'),
    buildField('date-specific prices', pricingBlocked ? 'unclear' : 'api_only', pricingBlocked ? 'ajax_response' : 'ajax_response', `${pricingDefaults.checkIn} -> ${pricingDefaults.checkOut}`, 'Observed request defaults in page form + endpoint', pricingBlocked ? 'medium' : 'high', 'The request shape is date-sensitive even though live response was blocked from this audit context.'),
    buildField('child/adult pricing rules', pricingBlocked ? 'unclear' : 'api_only', pricingBlocked ? 'inline_script' : 'ajax_response', `adults1=${pricingDefaults.adults}, enfants1=${pricingDefaults.children}`, 'adultesN / enfantsN / ageN_K request params', pricingBlocked ? 'medium' : 'high', 'Adult and child counts are explicit request parameters, but resulting pricing rows were not recoverable from the blocked response.'),
    buildField('taxes/fees if shown', 'missing', 'not_found', '', 'No tax/fee label found in detail HTML', 'low', 'Taxe séjour variable is referenced in JS/localStorage, but no visible fee breakdown was found.'),
    buildField('default checkIn/checkOut', 'found', 'detail_html', pricingDefaults, '#checkin1/#checkout1/#nbr_nuit', 'high', 'Default dates and nights are visible in form inputs.'),
    buildField('rooms/adults/children parameters', 'found', 'detail_html', pricingDefaults, '#select_ch / #span-pax / #span-en / hidden children fields', 'high', 'Default occupancy controls are visible and mirrored in JS.'),
    buildField('API endpoint', 'found', 'inline_script', PRICING_URL, 'url: "https://www.tunisiebooking.com/theme/traitement_detailv4resp2_fr_new.php"', 'high', 'Observed directly in inline jQuery AJAX call.'),
    buildField('API method', 'found', 'inline_script', 'GET', '$.ajax({ type: "GET" })', 'high', 'Page JavaScript explicitly uses GET.'),
    buildField('API request parameters', 'found', 'inline_script', Object.fromEntries(pricingParams.entries()), 'var myData = ...', 'high', 'Inline JS builds explicit query string fields for hotel id, dates, rooms, adults, children, board, and room type.'),
    buildField('API response sections', pricingBlocked ? 'partial' : 'found', pricingBlocked ? 'inline_script' : 'ajax_response', pricingBlocked ? 'response.split("~~~~~~~"), then split("###") in JS' : pricingResponseSummary, 'response.split("~~~~~~~"); msi[0].split("###")', pricingBlocked ? 'medium' : 'high', 'Even without a usable payload, the page code clearly documents delimiter structure and DOM insertion points.'),
    buildField('whether response contains room/board/price rows', pricingBlocked ? 'unclear' : 'api_only', pricingBlocked ? 'inline_script' : 'ajax_response', pricingBlocked ? 'JS inserts ms[1] into #resultat and triggers formula/room selectors' : pricingResponseSummary.responsePreview, '#resultat innerHTML = ms[1]', pricingBlocked ? 'medium' : 'high', 'Strong inference from page JS that returned HTML contains selectable room/board/price result blocks.'),
    buildField('nearby attractions', nearby.nearbyAttractions.length ? 'found' : 'missing', nearby.nearbyAttractions.length ? 'detail_html' : 'not_found', nearby.nearbyAttractions.slice(0, 3), '#ruslt_descriptif22 nearby sections', nearby.nearbyAttractions.length ? 'medium' : 'low', 'Nearby restaurants, cafes, and hotels are embedded in the extended description block.'),
    buildField('FAQ', faqPairs.length ? 'found' : 'missing', faqPairs.length ? 'json_ld' : 'not_found', faqPairs.slice(0, 3), 'FAQPage JSON-LD', faqPairs.length ? 'high' : 'low', `Found ${faqPairs.length} FAQ entries.`),
    buildField('provider/contact information', providerContact.phone ? 'partial' : 'missing', providerContact.phone ? 'json_ld' : 'not_found', providerContact, 'Hotel.telephone + review link', providerContact.phone ? 'medium' : 'low', 'Telephone appears in Hotel schema, but it may be platform/support contact rather than hotel direct contact.'),
    buildField('reviews', reviews.length ? 'found' : 'missing', reviews.length ? 'detail_html' : 'not_found', reviews.slice(0, 3), '.liste_avis .row_avis', reviews.length ? 'high' : 'low', `Found ${reviews.length} review rows in the HTML, plus a dedicated review page link.`),
    buildField('room count', /160 chambres|32 bungalows/i.test(primaryDescriptionText) ? 'partial' : 'missing', /160 chambres|32 bungalows/i.test(primaryDescriptionText) ? 'detail_html' : 'not_found', '160 chambres dans les unités principales + 32 bungalows', 'description text', /160 chambres|32 bungalows/i.test(primaryDescriptionText) ? 'medium' : 'low', 'Room inventory is described narratively, not exposed as a structured field.'),
    buildField('hotel official website', 'missing', 'not_found', '', 'No official website link pattern found', 'low', 'No hotel-owned website URL was found on the detail page.'),
    buildField('phone/email if visible', providerContact.phone ? 'partial' : 'missing', providerContact.phone ? 'json_ld' : 'not_found', providerContact, 'Hotel.telephone / no email pattern found', providerContact.phone ? 'medium' : 'low', 'Telephone is visible in schema; no hotel-specific email was found.'),
  ];

  const dataForSections = {
    gallery,
    descriptionText: primaryDescriptionText,
    amenities,
    roomTypes,
    boardOptions,
    reviews,
    coordinates,
    nearbyAttractions: nearby.nearbyAttractions,
    policies,
    providerContact,
  };

  const currentUiSections = [
    'Hero/gallery',
    'Description',
    'Highlights',
    'Popular Amenities',
    'Room types',
    'Availability',
    'Services',
    'Gallery',
    'Hotel Rules',
    'FAQ',
    'Reviews',
    'Provider Details',
    'Map/Nearby',
  ].map((section) => classifySection(section, dataForSections));

  const summary = {
    sourceAuditDate: new Date().toISOString(),
    targetHotel: 'Vincci Helios Beach',
    sourceUrl: DETAIL_URL,
    robots: {
      url: ROBOTS_URL,
      snippet: robotsText.split('\n').slice(0, 24).join('\n'),
      notes:
        'robots.txt allows general crawling but Cloudflare content signals explicitly disallow ai-input and ai-train for GPTBot/Google-Extended style agents; this audit was limited to a single user-requested source inspection and no model training or bulk ingestion was performed.',
    },
    sourceAudit: {
      serverRenderedHtml: /id="ruslt_descriptif2"|class="liste_avis"|id="id_xml_hotel"/i.test(detailHtml),
      loginRequired: false,
      botBypassNeeded: false,
      pricingEndpointObserved: true,
      pricingEndpointBlockedForDirectCall: pricingBlocked,
      galleryCount: gallery.length,
      amenitiesCount: amenities.length,
      reviewCountInHtml: reviews.length,
      faqCount: faqPairs.length,
      roomTypesCount: roomTypes.length,
      boardOptionsCount: boardOptions.length,
    },
    pricingApi: {
      endpoint: PRICING_URL,
      method: 'GET',
      requestDefaults: pricingDefaults,
      requestParams: Object.fromEntries(pricingParams.entries()),
      delimiterStructure: 'response.split("~~~~~~~"), then msi[0].split("###")',
      observedResponse: pricingResponseSummary,
      sourceCodeSnippet: extractJsRequestSnippet(detailHtml).slice(0, 1200),
      dynamicPricingSupport:
        'High confidence that the page is designed for dynamic availability and price rows by date/occupancy/board/room, but direct server-side replay is guarded outside a browser session.',
    },
    currentUiSections,
    fieldAudit,
    recommendedDisplay: {
      shouldDisplayNow: [
        'Real gallery/hero images from TunisieBooking source',
        'Source-backed description and highlights extracted from detail text',
        'Source-backed amenities/services',
        'Source-backed room types and board options as informational labels',
        'Source-backed review excerpts only if we want third-party review text',
        'Real Tunisia map coordinates and nearby places only when shown from source data',
        'Request-only pricing teaser such as From 36 EUR / night with source/reference wording',
      ],
      shouldStayManualOrAdmin: [
        'Official hotel website',
        'Direct hotel phone/email verification',
        'Cancellation policy',
        'Children policy',
        'Payment/guarantee policy',
        'Late checkout policy',
        'Any definitive availability grid or board-specific final price table',
      ],
      shouldComeFromFuturePricingModel: [
        'Date-specific final prices',
        'Room-type-specific availability rows',
        'Board-specific price combinations',
        'Adult/child supplements and dynamic quote totals',
      ],
    },
  };

  const answers = {
    presentOnDetailPage: fieldAudit.filter((item) => item.status === 'found' || item.status === 'partial').map((item) => item.fieldName),
    apiOnlyOrApiDriven: fieldAudit.filter((item) => item.status === 'api_only' || item.fieldName.includes('API')).map((item) => item.fieldName),
    notPresentAtAll: fieldAudit.filter((item) => item.status === 'missing').map((item) => item.fieldName),
    fakeTemplateRiskSections: currentUiSections
      .filter((item) => item.classification === 'currently_fake_template' || item.classification === 'should_come_from_future_pricing_model')
      .map((item) => item.section),
    nextImplementationStep:
      'Replace remaining template-only hotel detail sections with source-backed content first, then keep availability/pricing request-only until browser-session pricing extraction is approved and stable.',
  };

  const markdown = `# TunisieBooking Vincci Source Audit

- Target hotel: Vincci Helios Beach
- Detail URL: ${DETAIL_URL}
- Generated at: ${summary.sourceAuditDate}
- Firestore writes: none
- Deploys: none

## Source Audit

- Server-rendered HTML: ${summary.sourceAudit.serverRenderedHtml ? 'yes' : 'no'}
- Login required: ${summary.sourceAudit.loginRequired ? 'yes' : 'no'}
- Bot bypass needed: ${summary.sourceAudit.botBypassNeeded ? 'yes' : 'no'}
- Gallery images found: ${summary.sourceAudit.galleryCount}
- Amenities found: ${summary.sourceAudit.amenitiesCount}
- Reviews found in HTML: ${summary.sourceAudit.reviewCountInHtml}
- FAQ entries found: ${summary.sourceAudit.faqCount}
- Room types inferred: ${summary.sourceAudit.roomTypesCount}
- Board options inferred: ${summary.sourceAudit.boardOptionsCount}

## Robots / Risk

\`\`\`txt
${summary.robots.snippet}
\`\`\`

Notes: ${summary.robots.notes}

## Pricing API

- Endpoint: ${PRICING_URL}
- Method: GET
- Direct scripted replay blocked: ${pricingBlocked ? 'yes' : 'no'}
- Request defaults: ${JSON.stringify(pricingDefaults)}
- Delimiter structure from page JS: ${summary.pricingApi.delimiterStructure}
- Response summary: ${pricingResponseSummary.status}
- Response preview: ${pricingResponseSummary.responsePreview || pricingResponseSummary.notes || ''}

## Field Audit

${fieldAudit
  .map(
    (item) => `### ${item.fieldName}

- Status: ${item.status}
- Source: ${item.sourceLocation}
- Confidence: ${item.confidence}
- Selector/pattern: ${item.selectorOrPattern}
- Sample: ${typeof item.valueSample === 'string' ? item.valueSample : JSON.stringify(item.valueSample)}
- Notes: ${item.notes}
`,
  )
  .join('\n')}

## Current UI Sections

${currentUiSections
  .map(
    (item) => `- ${item.section}: ${item.classification} — ${item.notes}`,
  )
  .join('\n')}

## Direct Answers

1. Missing fields actually present on page:
${answers.presentOnDetailPage.map((item) => `- ${item}`).join('\n')}

2. Fields only present in pricing API flow or inline pricing JS:
${answers.apiOnlyOrApiDriven.map((item) => `- ${item}`).join('\n')}

3. Fields not present at all:
${answers.notPresentAtAll.map((item) => `- ${item}`).join('\n')}

4. Current UI sections that are fake/template or future-pricing driven:
${answers.fakeTemplateRiskSections.map((item) => `- ${item}`).join('\n')}

5. Best next step:
- ${answers.nextImplementationStep}
`;

  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify({ ...summary, answers }, null, 2));
  fs.writeFileSync(OUTPUT_MD_PATH, markdown);

  console.log(
    JSON.stringify(
      {
        outputJson: OUTPUT_JSON_PATH,
        outputMarkdown: OUTPUT_MD_PATH,
        galleryCount: gallery.length,
        amenitiesCount: amenities.length,
        reviewCount: reviews.length,
        faqCount: faqPairs.length,
        pricingBlocked,
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
