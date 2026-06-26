import { normalizeCruiseDetails } from '../src/core/services/listingDetailModels.ts';

const mockCruise = {
    id: 'cruise-1',
    title: 'Test Cruise',
    price: 100
};

const normalized = normalizeCruiseDetails(mockCruise);
console.log('Normalized:', normalized);

if (normalized.currency === 'TND') {
    console.log('Smoke passed: TND default used.');
    process.exit(0);
} else {
    console.error('Smoke failed: Expected TND.');
    process.exit(1);
}
