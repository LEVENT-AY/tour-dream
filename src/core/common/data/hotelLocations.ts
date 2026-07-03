export interface HotelLocation {
  label: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export const HOTEL_LOCATIONS: HotelLocation[] = [
  { label: 'Tunis', city: 'Tunis', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815, radiusKm: 10 },
  { label: 'Djerba', city: 'Djerba', country: 'Tunisia', latitude: 33.8076, longitude: 10.8451, radiusKm: 20 },
  { label: 'Sousse', city: 'Sousse', country: 'Tunisia', latitude: 35.8256, longitude: 10.63699, radiusKm: 10 },
  { label: 'Hammamet', city: 'Hammamet', country: 'Tunisia', latitude: 36.4, longitude: 10.6167, radiusKm: 10 },
  { label: 'London', city: 'London', country: 'UK', latitude: 51.5071, longitude: -0.1416, radiusKm: 5 },
  { label: 'Paris', city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, radiusKm: 5 },
  { label: 'Istanbul', city: 'Istanbul', country: 'Türkiye', latitude: 41.0082, longitude: 28.9784, radiusKm: 10 },
  { label: 'Tokyo', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, radiusKm: 10 },
];

export function findLocation(label: string): HotelLocation | undefined {
  return HOTEL_LOCATIONS.find((l) => l.label === label);
}
