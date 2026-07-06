const CLEAN_REPLACE_PATTERN = /\s+/g;
const IMAGE_REJECT_PATTERN = /(?:logo|icon|marker|location|map|pin|placeholder|blank|empty|loader|preloader|spinner|tracking|pixel|sprite|favicon|separator|default)/i;

const clean = (value) => String(value ?? '').replace(CLEAN_REPLACE_PATTERN, ' ').trim();

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
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const normalizeAbsoluteImageUrl = (value, baseUrl) => {
  const raw = clean(decodeHtmlEntities(value));
  if (!raw || /^data:/i.test(raw)) return '';
  try {
    const parsed = new URL(raw, baseUrl);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    parsed.hash = '';
    parsed.search = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return '';
  }
};

const extractEmbeddedDimensions = (value) => {
  const text = String(value ?? '');
  const sizeMatch = text.match(/(?:^|[?&#/_-])(\d{2,4})x(\d{2,4})(?:[?&#/_\-.]|$)/i);
  if (sizeMatch) {
    return { width: Number(sizeMatch[1]), height: Number(sizeMatch[2]) };
  }

  const widthMatch = text.match(/[?&](?:w|width)=(\d{2,4})/i);
  const heightMatch = text.match(/[?&](?:h|height)=(\d{2,4})/i);
  if (widthMatch && heightMatch) {
    return { width: Number(widthMatch[1]), height: Number(heightMatch[1]) };
  }

  return null;
};

const isLikelyHotelImage = (url) => {
  if (!/^https?:\/\//i.test(url)) return false;
  if (IMAGE_REJECT_PATTERN.test(url)) return false;
  if (!/\.(?:jpg|jpeg|png|webp)(?:$|\?)/i.test(url)) return false;

  const dimensions = extractEmbeddedDimensions(url);
  if (dimensions && Number.isFinite(dimensions.width) && Number.isFinite(dimensions.height)) {
    if (dimensions.width < 150 || dimensions.height < 150) return false;
  }

  return true;
};

const normalizeHotelImageUrlList = (items, { baseUrl = '', excludeUrl = '' } = {}) => {
  const excludeNormalized = excludeUrl ? normalizeAbsoluteImageUrl(excludeUrl, baseUrl) : '';
  const seen = new Set();
  const result = [];

  for (const item of Array.isArray(items) ? items : []) {
    const normalized = normalizeAbsoluteImageUrl(item, baseUrl);
    if (!normalized || !isLikelyHotelImage(normalized)) continue;
    if (excludeNormalized && normalized === excludeNormalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
};

export {
  decodeHtmlEntities,
  extractEmbeddedDimensions,
  isLikelyHotelImage,
  normalizeAbsoluteImageUrl,
  normalizeHotelImageUrlList,
};
