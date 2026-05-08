import { getListings } from '../services/listing.service.js';

(async () => {
  try {
    const res = await getListings({ city: 'hcm', limit: 10, page: 1 });
    console.log('getListings result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error calling getListings:', err.message, err.stack);
  } finally {
    process.exit(0);
  }
})();
