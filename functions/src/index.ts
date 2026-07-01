import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const duffelToken = defineSecret('DUFFEL_ACCESS_TOKEN');

interface DuffelSlice {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
}

interface NormalizedOffer {
  offerId: string;
  totalAmount: string;
  totalCurrency: string;
  airline: string;
  airlineIata: string;
  slices: DuffelSlice[];
  expiresAt: string;
  cabinClass: string;
}

function normalizeOffers(raw: Record<string, unknown>): NormalizedOffer[] {
  const data = raw.data as Record<string, unknown> | undefined;
  if (!data?.offers || !Array.isArray(data.offers)) return [];
  return data.offers.map((offer: Record<string, unknown>) => {
    const slices = ((offer.slices as Record<string, unknown>[]) || []).map(
      (slice: Record<string, unknown>) => {
        const segments = (slice.segments as Record<string, unknown>[]) || [];
        const origin = (slice.origin as Record<string, string>)?.iata_code || '';
        const destination = (slice.destination as Record<string, string>)?.iata_code || '';
        return {
          origin,
          destination,
          departureTime: (segments[0]?.departing_at as string) || '',
          arrivalTime: (segments[segments.length - 1]?.arriving_at as string) || '',
          duration: (slice.duration as string) || '',
          stops: Math.max(0, segments.length - 1),
        };
      },
    );
    const owner = offer.owner as Record<string, string> | undefined;
    return {
      offerId: (offer.id as string) || '',
      totalAmount: (offer.total_amount as string) || '',
      totalCurrency: (offer.total_currency as string) || '',
      airline: owner?.name || '',
      airlineIata: owner?.iata_code || '',
      slices,
      expiresAt: (offer.expires_at as string) || '',
      cabinClass: (offer.cabin_class as string) || '',
    };
  });
}

export const flightOffersSearch = onRequest(
  {
    secrets: [duffelToken],
    cors: [
      'https://tour-tunisi.web.app',
      /^https:\/\/tour-tunisi--pr[a-z0-9-]+\.web\.app$/,
      /^http:\/\/localhost(:\d+)?$/,
    ],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    const { origin, destination, departureDate, returnDate, adults, cabinClass } = req.body || {};

    if (!origin || !destination || !departureDate) {
      res
        .status(400)
        .json({ error: 'origin, destination, and departureDate are required' });
      return;
    }

    const duffelPayload: Record<string, unknown> = {
      data: {
        slices: [
          {
            origin: (origin as string).toUpperCase(),
            destination: (destination as string).toUpperCase(),
            departure_date: departureDate,
          },
        ],
        passengers: [{ type: adults && Number(adults) > 1 ? 'adult' : 'adult' }],
      },
    };

    if (returnDate) {
      (
        duffelPayload.data as Record<string, unknown>
      ).slices = [
        ...((duffelPayload.data as Record<string, unknown>).slices as unknown[]),
        {
          origin: (destination as string).toUpperCase(),
          destination: (origin as string).toUpperCase(),
          departure_date: returnDate,
        },
      ];
    }

    if (cabinClass) {
      (duffelPayload.data as Record<string, unknown>).cabin_class = (
        cabinClass as string
      ).toLowerCase();
    }

    try {
      const response = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${duffelToken.value()}`,
          'Content-Type': 'application/json',
          'Duffel-Version': 'v1',
        },
        body: JSON.stringify(duffelPayload),
      });

      const raw = (await response.json()) as Record<string, unknown>;
      const offers = normalizeOffers(raw);

      res.json({ offers });
    } catch (err) {
      console.error('Duffel API error:', err);
      res.status(502).json({ error: 'Failed to fetch flight offers' });
    }
  },
);
