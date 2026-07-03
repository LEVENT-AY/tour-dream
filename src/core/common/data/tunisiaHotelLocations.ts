export type TunisiaHotelLocation = {
  label: string;
  city: string;
  governorate: string;
  country: 'Tunisia';
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

export const findTunisiaHotelLocation = (label: string): TunisiaHotelLocation | undefined => {
  const query = normalize(label);
  if (!query) return undefined;
  return TUNISIA_HOTEL_LOCATIONS.find((location) => normalize(location.label) === query);
};
