export interface DuffelStay {
  stayId: string;
  accommodationName: string;
  rating: string;
  address: string;
  city: string;
  country: string;
  imageUrl: string;
  cheapestRateTotalAmount: string;
  cheapestRateCurrency: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomSummary: string;
  cancellationSummary: string;
  provider: string;
}

export interface StaysSearchParams {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  rooms?: number;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface StaysSearchResult {
  stays: DuffelStay[];
}

const API_ENDPOINT = '/api/stays/search';

export const searchStays = async (params: StaysSearchParams): Promise<StaysSearchResult> => {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Stays search failed (${res.status})`);
  }
  return res.json();
};
