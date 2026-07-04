type HotelPriceInput = {
  priceFrom?: unknown;
  price?: unknown;
  priceCurrency?: unknown;
  priceUnit?: unknown;
  priceNote?: unknown;
};

type HotelPriceLabelOptions = {
  prefix?: string;
  fallbackLabel?: string;
  includeFinalNote?: boolean;
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
};

export const normalizePositiveNumber = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

export const normalizePriceCurrency = (value: unknown): string => normalizeText(value).toUpperCase();

export const normalizePriceUnit = (value: unknown): string => normalizeText(value).toLowerCase();

export const formatHotelPrice = (
  input: HotelPriceInput,
  options: HotelPriceLabelOptions = {},
): { headline: string; note?: string; hasPrice: boolean } => {
  const price = normalizePositiveNumber(input.priceFrom ?? input.price);
  const currency = normalizePriceCurrency(input.priceCurrency);
  const unit = normalizePriceUnit(input.priceUnit);
  const prefix = options.prefix || 'From';
  const fallbackLabel = options.fallbackLabel || 'Price on request';
  const includeFinalNote = options.includeFinalNote !== false;
  if (price !== null) {
    const currencyPart = currency ? ` ${currency}` : '';
    const unitPart = unit ? ` / ${unit}` : '';
    return {
      headline: `${prefix} ${price}${currencyPart}${unitPart}`,
      note: includeFinalNote ? 'Final price confirmed after request' : undefined,
      hasPrice: true,
    };
  }

  return {
    headline: fallbackLabel,
    hasPrice: false,
  };
};
