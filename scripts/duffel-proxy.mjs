import http from 'http';
import https from 'https';

const PORT = 3001;
const DUFFEL_API = 'api.duffel.com';
const TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

const help = () => {
  console.log('');
  console.log('Duffel Flight Search Proxy');
  console.log('');
  console.log('Usage:');
  console.log('  set DUFFEL_ACCESS_TOKEN=<your_token_here> && node scripts/duffel-proxy.mjs');
  console.log('');
  console.log('Or create a .env file with:');
  console.log('  DUFFEL_ACCESS_TOKEN=<your_token_here>');
  console.log('Then run with:');
  console.log('  node -r dotenv/config scripts/duffel-proxy.mjs');
  console.log('');
};

if (!TOKEN) {
  console.error('ERROR: DUFFEL_ACCESS_TOKEN environment variable is not set.');
  help();
  process.exit(1);
}

const normalizeOffers = (raw) => {
  if (!raw?.data?.offers) return [];
  return raw.data.offers.map((offer) => {
    const slices = (offer.slices || []).map((slice) => ({
      origin: slice.origin?.iata_code || '',
      destination: slice.destination?.iata_code || '',
      departureTime: slice.segments?.[0]?.departing_at || '',
      arrivalTime: slice.segments?.[slice.segments.length - 1]?.arriving_at || '',
      duration: slice.duration || '',
      stops: (slice.segments?.length || 1) - 1,
    }));
    return {
      offerId: offer.id,
      totalAmount: offer.total_amount,
      totalCurrency: offer.total_currency,
      airline: offer.owner?.name || '',
      airlineIata: offer.owner?.iata_code || '',
      slices,
      expiresAt: offer.expires_at || '',
      cabinClass: offer.cabin_class || '',
    };
  });
};

const proxyRequest = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url.startsWith('/api/flight-offers/search')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    let searchParams;
    try {
      searchParams = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const { origin, destination, departureDate, returnDate, adults, cabinClass } = searchParams;
    if (!origin || !destination || !departureDate) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'origin, destination, and departureDate are required' }));
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
        passengers: [{ type: adults > 1 ? 'adult' : 'adult' }],
      },
    };

    if (returnDate) {
      duffelPayload.data.slices.push({
        origin: destination.toUpperCase(),
        destination: origin.toUpperCase(),
        departure_date: returnDate,
      });
    }

    if (cabinClass) {
      duffelPayload.data.cabin_class = cabinClass.toLowerCase();
    }

    const postData = JSON.stringify(duffelPayload);
    const options = {
      hostname: DUFFEL_API,
      path: '/air/offer_requests',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Duffel-Version': 'v1',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const dreq = https.request(options, (dres) => {
      let data = '';
      dres.on('data', (chunk) => { data += chunk; });
      dres.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const offers = normalizeOffers(parsed);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(JSON.stringify({ offers, raw: parsed }));
        } catch {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to parse Duffel response', raw: data }));
        }
      });
    });

    dreq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });

    dreq.write(postData);
    dreq.end();
  });
};

const server = http.createServer(proxyRequest);
server.listen(PORT, () => {
  console.log(`Duffel proxy running at http://localhost:${PORT}`);
  console.log(`POST /api/flight-offers/search`);
});
