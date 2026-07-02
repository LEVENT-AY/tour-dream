"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flightOffersSearch = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const DUFFEL_URL = 'https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=30000';
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
        const token = duffelToken.value();
        console.log("DUFFEL_DEBUG_REQUEST", JSON.stringify({
            tokenLivePrefix: token.startsWith("duffel_live_"),
            origin,
            destination,
            departureDate,
            adults,
            cabinClass
        }));
        const response = await fetch(DUFFEL_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Duffel-Version': 'v2',
            },
            body: JSON.stringify(duffelPayload),
        });
        const raw = (await response.json());
        if (!response.ok) {
            console.log("DUFFEL_DEBUG_RESPONSE", JSON.stringify({
                duffelStatus: response.status,
                errors: raw.errors || null,
                responseTopLevelKeys: raw && typeof raw === "object" ? Object.keys(raw) : []
            }));
            console.log("DUFFEL_DEBUG_ERROR", JSON.stringify({
                duffelStatus: response.status,
                errorType: Array.isArray(raw.errors) ? raw.errors[0]?.type || null : null,
                errorCode: Array.isArray(raw.errors) ? raw.errors[0]?.code || null : null,
                errorTitle: Array.isArray(raw.errors) ? raw.errors[0]?.title || null : null,
                errorMessage: Array.isArray(raw.errors) ? raw.errors[0]?.message || null : null
            }));
            res.status(502).json({ error: 'Duffel API request failed', details: raw.errors || [] });
            return;
        }
        const normalizedOffers = normalizeOffers(raw);
        console.log("DUFFEL_DEBUG_RESPONSE", JSON.stringify({
            duffelStatus: response.status,
            offerRequestId: raw.data?.id || null,
            liveMode: raw.data?.live_mode ?? null,
            rawOfferCount: Array.isArray(raw.data?.offers) ? (raw.data?.offers).length : null,
            normalizedOfferCount: normalizedOffers.length
        }));
        res.json({ offers: normalizedOffers });
    }
    catch (err) {
        console.log("DUFFEL_DEBUG_ERROR", JSON.stringify({
            duffelStatus: err instanceof Response ? err.status : null,
            errorType: null,
            errorCode: null,
            errorTitle: null,
            errorMessage: err instanceof Error ? err.message : String(err)
        }));
        res.status(502).json({ error: 'Failed to fetch flight offers' });
    }
});
//# sourceMappingURL=index.js.map