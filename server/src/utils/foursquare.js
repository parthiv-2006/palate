const axios = require('axios');

const FSQ_BASE = 'https://api.foursquare.com/v3';

/**
 * Maps Foursquare price tier (1–4) to our price_range enum.
 */
const PRICE_MAP = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

/**
 * Build a Foursquare photo URL at a given size.
 * @param {Object} photo  - Foursquare photo object { prefix, suffix }
 * @param {string} size   - e.g. '400x300'
 * @returns {string}
 */
function buildPhotoUrl(photo, size = '400x300') {
  return `${photo.prefix}${size}${photo.suffix}`;
}

/**
 * Look up a single restaurant on Foursquare by name + coordinates and return
 * enrichment data (photo URL, rating 0–5, price_range string).
 *
 * Uses a tight 200 m radius so we match the same physical place rather than
 * a similarly-named venue across town.
 *
 * Returns null if no match is found or the API call fails.
 *
 * @param {string} name
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<{image: string, rating: number, price_range: string} | null>}
 */
async function lookupFoursquare(name, lat, lon, apiKey) {
  try {
    const response = await axios.get(`${FSQ_BASE}/places/search`, {
      headers: { Authorization: apiKey },
      params: {
        query: name,
        ll: `${lat},${lon}`,
        radius: 200,
        limit: 1,
        fields: 'rating,price,photos',
      },
    });

    const results = response.data?.results;
    if (!results || results.length === 0) return null;

    const place = results[0];

    // Photo: use the first available photo, fall back to placeholder
    const photo = place.photos?.[0];
    const image = photo ? buildPhotoUrl(photo, '400x300') : null;

    // Rating: Foursquare uses 0–10, we use 0–5
    const rating = typeof place.rating === 'number'
      ? Math.round((place.rating / 2) * 10) / 10  // e.g. 8.4 → 4.2
      : null;

    // Price: 1–4 integer → $, $$, $$$, $$$$
    const price_range = PRICE_MAP[place.price] || null;

    return { image, rating, price_range };
  } catch {
    // Silently swallow per-restaurant errors — caller keeps defaults
    return null;
  }
}

/**
 * Enrich an array of restaurant objects (from Geoapify) with real photos,
 * ratings, and price tiers from Foursquare.
 *
 * Each restaurant is looked up concurrently. If Foursquare returns no match
 * for a given restaurant, its existing defaults are kept unchanged.
 *
 * @param {Object[]} restaurants - Restaurants in our internal model shape
 * @returns {Promise<Object[]>}  - Same array with image/rating/price_range filled in
 */
async function enrichWithFoursquare(restaurants) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.warn('[Foursquare] FOURSQUARE_API_KEY not set — skipping enrichment');
    return restaurants;
  }

  console.log(`[Foursquare] Enriching ${restaurants.length} restaurants…`);

  const enriched = await Promise.all(
    restaurants.map(async (r) => {
      const lat = r.location?.latitude;
      const lon = r.location?.longitude;

      // Skip if we have no coordinates to search by
      if (!lat || !lon) return r;

      const data = await lookupFoursquare(r.name, lat, lon, apiKey);
      if (!data) return r;

      return {
        ...r,
        // Only overwrite defaults when Foursquare actually returned a value
        image:       data.image       ?? r.image,
        rating:      data.rating      ?? r.rating,
        price_range: data.price_range ?? r.price_range,
      };
    })
  );

  const matched = enriched.filter((r, i) =>
    r.image !== restaurants[i].image ||
    r.rating !== restaurants[i].rating ||
    r.price_range !== restaurants[i].price_range
  ).length;

  console.log(`[Foursquare] Enriched ${matched}/${restaurants.length} restaurants with real data`);
  return enriched;
}

module.exports = { enrichWithFoursquare };
