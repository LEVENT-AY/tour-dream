export interface DuffelOffer {
  offerId: string;
  totalAmount: string;
  totalCurrency: string;
  airline: string;
  airlineIata: string;
  slices: DuffelSlice[];
  expiresAt: string;
  cabinClass: string;
}

export interface DuffelSlice {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  cabinClass?: string;
}

export interface SearchResult {
  offers: DuffelOffer[];
}

const API_ENDPOINT = '/api/flight-offers/search';

export const searchFlightOffers = async (params: SearchParams): Promise<SearchResult> => {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Search failed (${res.status})`);
  }
  return res.json();
};
