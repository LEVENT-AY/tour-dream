export type TunisiaHotelLocation = {
  label: string;
  city: string;
  governorate: string;
  country: 'Tunisia';
};

export type ManualHotelLocationFields = {
  city?: string;
  location?: string;
  address?: string;
  region?: string;
  destination?: string;
  title?: string;
  name?: string;
  hotelName?: string;
  propertyName?: string;
};

export const TUNISIA_HOTEL_LOCATIONS: TunisiaHotelLocation[] = [
  { label: 'Tunis', city: 'Tunis', governorate: 'Tunis', country: 'Tunisia' },
  { label: 'Hammamet', city: 'Hammamet', governorate: 'Nabeul', country: 'Tunisia' },
  { label: 'Nabeul', city: 'Nabeul', governorate: 'Nabeul', country: 'Tunisia' },
  { label: 'Sousse', city: 'Sousse', governorate: 'Sousse', country: 'Tunisia' },
  { label: 'Monastir', city: 'Monastir', governorate: 'Monastir', country: 'Tunisia' },
  { label: 'Mahdia', city: 'Mahdia', governorate: 'Mahdia', country: 'Tunisia' },
  { label: 'Djerba', city: 'Djerba', governorate: 'Medenine', country: 'Tunisia' },
  { label: 'Tozeur', city: 'Tozeur', governorate: 'Tozeur', country: 'Tunisia' },
  { label: 'Tabarka', city: 'Tabarka', governorate: 'Jendouba', country: 'Tunisia' },
  { label: 'Bizerte', city: 'Bizerte', governorate: 'Bizerte', country: 'Tunisia' },
  { label: 'Sfax', city: 'Sfax', governorate: 'Sfax', country: 'Tunisia' },
  { label: 'Kairouan', city: 'Kairouan', governorate: 'Kairouan', country: 'Tunisia' },
  { label: 'Douz', city: 'Douz', governorate: 'Kebili', country: 'Tunisia' },
  { label: 'Tataouine', city: 'Tataouine', governorate: 'Tataouine', country: 'Tunisia' },
];

const normalize = (value: string): string => value.trim().toLowerCase();

const normalizePhrase = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenize = (value: string): string[] =>
  normalizePhrase(value)
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

const phraseContainsAlias = (value: string, alias: string): boolean => {
  const haystack = tokenize(value);
  const needle = tokenize(alias);
  if (!haystack.length || !needle.length || needle.length > haystack.length) return false;

  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    const matches = needle.every((token, index) => haystack[start + index] === token);
    if (matches) return true;
  }

  return false;
};

const DESTINATION_ALIAS_MAP: Record<string, string[]> = {
  tunis: ['tunis', 'bardo', 'le bardo', 'la soukra', 'ariana', 'carthage', 'la marsa', 'gammarth'],
  sousse: ['sousse', 'port el kantaoui', 'kantaoui', 'zone touristique sousse'],
  hammamet: ['hammamet', 'nabeul', 'yasmine hammamet', 'nabeul governorate'],
  djerba: ['djerba', 'midoun', 'houmt souk', 'medenine', 'mezzraya'],
  monastir: ['monastir', 'skanes', 'zone touristique monastir'],
  mahdia: ['mahdia'],
  tozeur: ['tozeur', 'nefta'],
};

export const findTunisiaHotelLocation = (label: string): TunisiaHotelLocation | undefined => {
  const query = normalize(label);
  if (!query) return undefined;
  return TUNISIA_HOTEL_LOCATIONS.find((location) => normalize(location.label) === query);
};

export const getTunisiaHotelDestinationAliases = (destination: string): string[] => {
  const normalizedDestination = normalizePhrase(destination);
  if (!normalizedDestination) return [];

  const explicitAliases = DESTINATION_ALIAS_MAP[normalizedDestination];
  if (explicitAliases?.length) {
    return explicitAliases;
  }

  return [normalizedDestination];
};

export const matchesTunisiaHotelDestination = (
  hotel: ManualHotelLocationFields,
  destination: string,
): boolean => {
  const aliases = getTunisiaHotelDestinationAliases(destination);
  if (!aliases.length) return true;

  const searchableValues = [hotel.destination, hotel.city, hotel.region, hotel.location, hotel.address, hotel.title, hotel.name, hotel.hotelName, hotel.propertyName]
    .filter(Boolean)
    .map((value) => String(value));

  if (!searchableValues.length) return false;

  return searchableValues.some((value) =>
    aliases.some((alias) => phraseContainsAlias(value, alias)),
  );
};
