const axios = require('axios');

/**
 * Maps common cuisine/food keywords (from Gemini) to Geoapify place category strings.
 * Geoapify uses OpenStreetMap's category taxonomy.
 */
const KEYWORD_TO_CATEGORY = {
  indian:           'catering.restaurant.indian_restaurant',
  curry:            'catering.restaurant.indian_restaurant',
  chinese:          'catering.restaurant.chinese_restaurant',
  'dim sum':        'catering.restaurant.chinese_restaurant',
  italian:          'catering.restaurant.italian_restaurant',
  pasta:            'catering.restaurant.italian_restaurant',
  pizza:            'catering.pizza',
  japanese:         'catering.restaurant.japanese_restaurant',
  sushi:            'catering.restaurant.japanese_restaurant',
  ramen:            'catering.restaurant.japanese_restaurant',
  mexican:          'catering.restaurant.mexican_food',
  tacos:            'catering.restaurant.mexican_food',
  thai:             'catering.restaurant.thai_restaurant',
  american:         'catering.restaurant.american_food',
  burger:           'catering.restaurant.american_food',
  korean:           'catering.restaurant.korean_restaurant',
  vietnamese:       'catering.restaurant.vietnamese_restaurant',
  pho:              'catering.restaurant.vietnamese_restaurant',
  mediterranean:    'catering.restaurant.mediterranean_food',
  greek:            'catering.restaurant.greek_restaurant',
  french:           'catering.restaurant.french_restaurant',
  spanish:          'catering.restaurant.spanish_restaurant',
  'middle eastern': 'catering.restaurant.middle_eastern_food',
  lebanese:         'catering.restaurant.middle_eastern_food',
  turkish:          'catering.restaurant.turkish_restaurant',
  seafood:          'catering.restaurant.seafood',
  steak:            'catering.restaurant.steak_house',
  steakhouse:       'catering.restaurant.steak_house',
  bbq:              'catering.restaurant.barbecue',
  barbecue:         'catering.restaurant.barbecue',
  cafe:             'catering.cafe',
  coffee:           'catering.cafe',
  'fast food':      'catering.fast_food',
};

/**
 * Dietary keywords that map to Geoapify condition filters.
 */
const CONDITION_KEYWORDS = {
  vegan:       'vegan',
  vegetarian:  'vegetarian',
};

/**
 * Maps a Geoapify category back to a human-readable cuisine label.
 */
const CATEGORY_TO_CUISINE = {
  'catering.restaurant.indian_restaurant':    'Indian',
  'catering.restaurant.chinese_restaurant':   'Chinese',
  'catering.restaurant.italian_restaurant':   'Italian',
  'catering.pizza':                           'Pizza',
  'catering.restaurant.japanese_restaurant':  'Japanese',
  'catering.restaurant.mexican_food':         'Mexican',
  'catering.restaurant.thai_restaurant':      'Thai',
  'catering.restaurant.american_food':        'American',
  'catering.restaurant.korean_restaurant':    'Korean',
  'catering.restaurant.vietnamese_restaurant':'Vietnamese',
  'catering.restaurant.mediterranean_food':   'Mediterranean',
  'catering.restaurant.greek_restaurant':     'Greek',
  'catering.restaurant.french_restaurant':    'French',
  'catering.restaurant.spanish_restaurant':   'Spanish',
  'catering.restaurant.middle_eastern_food':  'Middle Eastern',
  'catering.restaurant.turkish_restaurant':   'Turkish',
  'catering.restaurant.seafood':              'Seafood',
  'catering.restaurant.steak_house':          'Steakhouse',
  'catering.restaurant.barbecue':             'BBQ',
  'catering.cafe':                            'Cafe',
  'catering.fast_food':                       'Fast Food',
  'catering.restaurant':                      'Restaurant',
};

/**
 * Simple in-memory geocode cache to avoid redundant API calls for the same city.
 * Survives the lifetime of the Node process.
 */
const geocodeCache = new Map();

/**
 * Convert a city name to { lat, lon } using the Geoapify Geocoding API.
 * Results are cached in-process.
 * @param {string} city
 * @returns {Promise<{lat: number, lon: number}>}
 */
async function geocodeCity(city) {
  if (geocodeCache.has(city)) {
    return geocodeCache.get(city);
  }

  const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
    params: {
      text: city,
      type: 'city',
      format: 'json',
      apiKey: process.env.GEOAPIFY_API_KEY,
    },
  });

  const results = response.data?.results;
  if (!results || results.length === 0) {
    throw new Error(`Geoapify geocoding returned no results for city: "${city}"`);
  }

  const coords = { lat: results[0].lat, lon: results[0].lon };
  geocodeCache.set(city, coords);
  return coords;
}

/**
 * Map an array of cuisine/food keywords to Geoapify category and condition strings.
 * Always includes the generic 'catering.restaurant' as a baseline.
 *
 * @param {string[]} keywords
 * @returns {{ categories: string, conditions: string }}
 */
function mapKeywordsToGeoapify(keywords) {
  const categories = new Set(['catering.restaurant']);
  const conditions = new Set();

  keywords.forEach((keyword) => {
    const lk = keyword.toLowerCase();

    for (const [kw, condition] of Object.entries(CONDITION_KEYWORDS)) {
      if (lk.includes(kw)) conditions.add(condition);
    }

    for (const [kw, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
      if (lk.includes(kw)) categories.add(category);
    }
  });

  return {
    categories: Array.from(categories).join(','),
    conditions: Array.from(conditions).join(','),
  };
}

/**
 * Derive a human-readable cuisine label from a Geoapify place's properties.
 * Prefers the OSM raw 'cuisine' tag, then falls back to the category taxonomy.
 *
 * @param {Object} properties - Geoapify feature properties
 * @returns {string}
 */
function extractCuisine(properties) {
  // OSM raw tag e.g. "indian", "pizza;italian"
  const rawCuisine = properties.datasource?.raw?.cuisine;
  if (rawCuisine) {
    return rawCuisine
      .split(';')[0]
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Fall back to Geoapify category → label map
  const cats = properties.categories || [];
  for (const cat of cats) {
    if (CATEGORY_TO_CUISINE[cat]) return CATEGORY_TO_CUISINE[cat];
  }

  return 'Restaurant';
}

/**
 * Fetch restaurants from the Geoapify Places API.
 *
 * Replaces fetchRestaurantsFromYelp. The flow is:
 *   1. Geocode the city name → lat/lon
 *   2. Map Gemini keywords → Geoapify categories + conditions
 *   3. Call /v2/places within a radius circle
 *   4. Normalise features → our Restaurant model shape
 *
 * Note: Geoapify (OpenStreetMap-based) does NOT provide photos, star ratings,
 * or price tiers. image defaults to '/placeholder-restaurant.jpg',
 * rating to 4.0, price_range to '$$'.
 *
 * @param {string[]} keywords  - cuisine/food keywords from Gemini
 * @param {Object}  options
 * @param {string}  [options.location]      - city name (default: DEFAULT_LOCATION env or 'Toronto')
 * @param {number}  [options.limit=15]      - max results
 * @param {number}  [options.radius=5000]   - search radius in metres
 * @returns {Promise<Object[]>}
 */
async function fetchRestaurantsFromGeoapify(keywords, options = {}) {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      console.error('GEOAPIFY_API_KEY is not set');
      return [];
    }

    const city = options.location || process.env.DEFAULT_LOCATION || 'Toronto';
    const limit = options.limit || 15;
    const radiusMeters = options.radius || 5000;

    console.log(`[Geoapify] Geocoding "${city}"…`);
    const { lat, lon } = await geocodeCity(city);

    const { categories, conditions } = mapKeywordsToGeoapify(keywords);
    console.log(`[Geoapify] Searching categories="${categories}" conditions="${conditions}" near ${city}`);

    const params = {
      categories,
      filter: `circle:${lon},${lat},${radiusMeters}`,
      limit,
      apiKey,
    };
    if (conditions) params.conditions = conditions;

    const response = await axios.get('https://api.geoapify.com/v2/places', { params });

    const features = response.data?.features;
    if (!features || features.length === 0) {
      console.warn('[Geoapify] No places returned for this query');
      return [];
    }

    const restaurants = features
      .filter((f) => f.properties?.name) // skip unnamed POIs
      .map((f) => {
        const props = f.properties;
        const [fLon, fLat] = f.geometry.coordinates;
        const cuisine = extractCuisine(props);

        return {
          name: props.name,
          cuisine,
          description: `${cuisine} restaurant at ${props.address_line1 || props.address_line2 || city}.`,
          image: '/placeholder-restaurant.jpg',
          price_range: '$$',
          location: {
            address: props.address_line1 || '',
            city: props.city || city,
            state: props.state || '',
            zip: props.postcode || '',
            latitude: fLat,
            longitude: fLon,
          },
          rating: 4.0,
          external_id: props.place_id,
          source: 'geoapify',
          tags: (props.categories || []).map((c) => c.split('.').pop()),
        };
      });

    console.log(`[Geoapify] Fetched ${restaurants.length} restaurants`);
    return restaurants;
  } catch (error) {
    console.error('[Geoapify] Error fetching restaurants:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { fetchRestaurantsFromGeoapify };
