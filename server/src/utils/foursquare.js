const axios = require('axios');
const { geocodeCity } = require('./geoapify');

const FSQ_BASE = 'https://places-api.foursquare.com';

/** Foursquare price tier (1–4) → our price_range string */
const PRICE_MAP = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

/**
 * Keywords that are dietary flags, not cuisine types.
 * These don't improve a text-based restaurant search so we filter them out
 * when building the Foursquare query string.
 */
const DIETARY_WORDS = new Set([
  'vegan', 'vegetarian', 'healthy', 'salad', 'organic',
  'gluten-free', 'halal', 'kosher', 'plant-based', 'low-carb',
]);

/**
 * Build a focused search query from Gemini keywords.
 * Takes the top 3 cuisine-type words; falls back to 'restaurant'.
 * @param {string[]} keywords
 * @returns {string}
 */
function buildSearchQuery(keywords) {
  const cuisineWords = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => !DIETARY_WORDS.has(k) && k.length > 1);

  return cuisineWords.slice(0, 3).join(' ') || 'restaurant';
}

/**
 * Build a Foursquare photo URL.
 * Foursquare photo objects have { prefix, suffix } — size goes in between.
 * @param {Object[]} photos
 * @returns {string}
 */
function extractPhoto(photos) {
  if (!photos || photos.length === 0) return '/placeholder-restaurant.jpg';
  const p = photos[0];
  if (!p?.prefix || !p?.suffix) return '/placeholder-restaurant.jpg';
  return `${p.prefix}400x300${p.suffix}`;
}

/**
 * Extract a clean cuisine label from Foursquare categories.
 * e.g. "Thai Restaurant" → "Thai", "Indian Food" → "Indian"
 * @param {Object[]} categories
 * @returns {string}
 */
function extractCuisine(categories) {
  if (!categories || categories.length === 0) return 'Restaurant';
  const raw = categories[0]?.name || 'Restaurant';
  return raw
    .replace(/\s+restaurant$/i, '')
    .replace(/\s+food$/i, '')
    .replace(/\s+cuisine$/i, '')
    .trim() || 'Restaurant';
}

/**
 * Fetch restaurants directly from Foursquare Places API v3.
 *
 * This replaces the old two-step approach (Geoapify discover → Foursquare enrich).
 * Foursquare returns photos, ratings, and price tiers natively in a single search
 * call, so there is no cross-referencing step that can silently fail.
 *
 * Flow:
 *   1. Geocode the city via Geoapify (cached)
 *   2. Build a search query from Gemini's cuisine keywords
 *   3. One Foursquare /v3/places/search call requesting all enrichment fields
 *   4. Map results directly to our Restaurant model shape
 *
 * @param {string[]} keywords  - cuisine keywords from Gemini
 * @param {Object}   options
 * @param {string}   [options.location]    - city name
 * @param {number}   [options.limit=15]    - max restaurants to return
 * @param {number}   [options.radius=5000] - search radius in metres
 * @returns {Promise<Object[]>}
 */
async function fetchRestaurantsFromFoursquare(keywords, options = {}) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    console.error('[Foursquare] FOURSQUARE_API_KEY is not set');
    return [];
  }

  const city = options.location || process.env.DEFAULT_LOCATION || 'Toronto';
  const limit = options.limit || 15;
  const radiusMeters = options.radius || 5000;

  try {
    // Step 1: geocode (Geoapify, cached after first call)
    console.log(`[Foursquare] Geocoding "${city}"…`);
    const { lat, lon } = await geocodeCity(city);

    // Step 2: build query
    const query = buildSearchQuery(keywords);
    console.log(`[Foursquare] Searching query="${query}" near ${city}`);

    // Step 3: single discovery + enrichment call
    const response = await axios.get(`${FSQ_BASE}/places/search`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Places-Api-Version': '2025-06-17',
      },
      params: {
        query,
        ll: `${lat},${lon}`,
        radius: radiusMeters,
        limit,
        // Request all enrichment fields in one shot
        fields: 'name,geocodes,location,categories,photos,rating,price',
      },
    });

    const results = response.data?.results || [];

    if (results.length === 0) {
      console.warn('[Foursquare] No results returned for this query');
      return [];
    }

    // Step 4: normalise to our Restaurant model shape
    const restaurants = results
      .filter((p) => p.name && p.geocodes?.main)
      .map((place) => {
        const cuisine = extractCuisine(place.categories);
        const placeLat = place.geocodes.main.latitude;
        const placeLon = place.geocodes.main.longitude;

        // Foursquare rating is 0–10; we store 0–5
        const rating =
          typeof place.rating === 'number'
            ? Math.round((place.rating / 2) * 10) / 10
            : 4.0;

        return {
          name: place.name,
          cuisine,
          description: `${cuisine} restaurant at ${place.location?.address || city}.`,
          image: extractPhoto(place.photos),
          price_range: PRICE_MAP[place.price] || '$$',
          location: {
            address: place.location?.address || '',
            city: place.location?.locality || city,
            state: place.location?.region || '',
            zip: place.location?.postcode || '',
            latitude: placeLat,
            longitude: placeLon,
          },
          rating,
          external_id: `fsq_${place.fsq_place_id}`,
          source: 'foursquare',
          tags: (place.categories || []).map((c) => c.name),
        };
      });

    // Diagnostic summary
    const withPhotos = restaurants.filter(
      (r) => r.image !== '/placeholder-restaurant.jpg'
    ).length;
    const withRating = restaurants.filter((r) => r.rating !== 4.0).length;
    const withPrice = restaurants.filter((r) => r.price_range !== '$$').length;

    console.log(
      `[Foursquare] Fetched ${restaurants.length} restaurants` +
        ` | photos: ${withPhotos} | ratings: ${withRating} | prices: ${withPrice}`
    );

    return restaurants;
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data || error.message;
    if (status === 401 || status === 403) {
      console.error(
        `[Foursquare] Auth failed (${status}) — check FOURSQUARE_API_KEY.\n` +
        `  Keys for v3 Places API must be generated at https://location.foursquare.com/developer\n` +
        `  and start with "fsq3". Response:`, body
      );
    } else {
      console.error(`[Foursquare] Error (${status ?? 'network'}):`, body);
    }
    return [];
  }
}

module.exports = { fetchRestaurantsFromFoursquare };
