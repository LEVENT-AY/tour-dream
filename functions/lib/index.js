"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flightOffersSearch = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const duffelToken = (0, params_1.defineSecret)('DUFFEL_ACCESS_TOKEN');
function normalizeOffers(raw) {
    const data = raw.data;
    if (!data?.offers || !Array.isArray(data.offers))
        return [];
    return data.offers.map((offer) => {
        const slices = (offer.slices || []).map((slice) => {
            const segments = slice.segments || [];
            const origin = slice.origin?.iata_code || '';
            const destination = slice.destination?.iata_code || '';
            return {
                origin,
                destination,
                departureTime: segments[0]?.departing_at || '',
                arrivalTime: segments[segments.length - 1]?.arriving_at || '',
                duration: slice.duration || '',
                stops: Math.max(0, segments.length - 1),
            };
        });
        const owner = offer.owner;
        return {
            offerId: offer.id || '',
            totalAmount: offer.total_amount || '',
            totalCurrency: offer.total_currency || '',
            airline: owner?.name || '',
            airlineIata: owner?.iata_code || '',
            slices,
            expiresAt: offer.expires_at || '',
            cabinClass: offer.cabin_class || '',
        };
    });
}
exports.flightOffersSearch = (0, https_1.onRequest)({
    secrets: [duffelToken],
    cors: [
        'https://tour-tunisi.web.app',
        /^https:\/\/tour-tunisi--pr[a-z0-9-]+\.web\.app$/,
        /^http:\/\/localhost(:\d+)?$/,
    ],
}, async (req, res) => {
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
    const duffelPayload = {
        data: {
            slices: [
                {
                    origin: origin.toUpperCase(),
                    destination: destination.toUpperCase(),
                    departure_date: departureDate,
                },
            ],
            passengers: [{ type: adults && Number(adults) > 1 ? 'adult' : 'adult' }],
        },
    };
    if (returnDate) {
        duffelPayload.data.slices = [
            ...duffelPayload.data.slices,
            {
                origin: destination.toUpperCase(),
                destination: origin.toUpperCase(),
                departure_date: returnDate,
            },
        ];
    }
    if (cabinClass) {
        duffelPayload.data.cabin_class = cabinClass.toLowerCase();
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
        const raw = (await response.json());
        const offers = normalizeOffers(raw);
        res.json({ offers });
    }
    catch (err) {
        console.error('Duffel API error:', err);
        res.status(502).json({ error: 'Failed to fetch flight offers' });
    }
});
//# sourceMappingURL=index.js.map