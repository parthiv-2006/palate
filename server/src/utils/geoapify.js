const axios = require('axios');

/**
 * VERIFIED Geoapify category taxonomy (extracted from the live API error response).
 * Keys are lowercase keyword fragments that Gemini might produce.
 * Values are exact category strings the Geoapify /v2/places API accepts.
 *
 * If a keyword doesn't match anything here it is silently ignored;
 * the baseline 'catering.restaurant' always remains.
 */
const KEYWORD_TO_CATEGORY = {
  // ── Core cuisine types ──────────────────────────────────────────────────────
  indian:            'catering.restaurant.indian',
  curry:             'catering.restaurant.curry',
  chinese:           'catering.restaurant.asian',
  asian:             'catering.restaurant.asian',
  'dim sum':         'catering.restaurant.dumpling',
  dumpling:          'catering.restaurant.dumpling',
  // No catering.restaurant.italian exists in Geoapify taxonomy
  italian:           'catering.restaurant',
  pasta:             'catering.restaurant',
  pizza:             'catering.fast_food.pizza',
  japanese:          'catering.restaurant.japanese',
  sushi:             'catering.restaurant.sushi',
  ramen:             'catering.restaurant.ramen',
  noodle:            'catering.restaurant.noodle',
  noodles:           'catering.restaurant.noodle',
  mexican:           'catering.restaurant.mexican',
  tacos:             'catering.restaurant.tacos',
  'tex-mex':         'catering.restaurant.tex-mex',
  texmex:            'catering.restaurant.tex-mex',
  thai:              'catering.restaurant.thai',
  american:          'catering.restaurant.american',
  burger:            'catering.fast_food',
  burgers:           'catering.fast_food',
  korean:            'catering.restaurant.korean',
  vietnamese:        'catering.restaurant.vietnamese',
  pho:               'catering.restaurant.vietnamese',
  mediterranean:     'catering.restaurant.mediterranean',
  greek:             'catering.restaurant.greek',
  french:            'catering.restaurant.french',
  spanish:           'catering.restaurant.spanish',
  tapas:             'catering.restaurant.tapas',
  'middle eastern':  'catering.restaurant.arab',
  arab:              'catering.restaurant.arab',
  lebanese:          'catering.restaurant.lebanese',
  turkish:           'catering.restaurant.turkish',
  kebab:             'catering.restaurant.kebab',
  kebabs:            'catering.restaurant.kebab',
  seafood:           'catering.restaurant.seafood',
  fish:              'catering.restaurant.fish',
  steak:             'catering.restaurant.steak_house',
  steakhouse:        'catering.restaurant.steak_house',
  bbq:               'catering.restaurant.barbecue',
  barbecue:          'catering.restaurant.barbecue',
  wings:             'catering.restaurant.wings',
  cafe:              'catering.cafe',
  coffee:            'catering.cafe',
  'fast food':       'catering.fast_food',
  fastfood:          'catering.fast_food',
  // ── Regional / world cuisines ─────────────────────────────────────────────
  african:           'catering.restaurant.african',
  ethiopian:         'catering.restaurant.ethiopian',
  moroccan:          'catering.restaurant.moroccan',
  brazilian:         'catering.restaurant.brazilian',
  'latin american':  'catering.restaurant.latin_american',
  latin:             'catering.restaurant.latin_american',
  'south american':  'catering.restaurant.latin_american',
  peruvian:          'catering.restaurant.peruvian',
  caribbean:         'catering.restaurant.caribbean',
  jamaican:          'catering.restaurant.jamaican',
  cuban:             'catering.restaurant.cuban',
  malaysian:         'catering.restaurant.malaysian',
  malay:             'catering.restaurant.malay',
  indonesian:        'catering.restaurant.indonesian',
  persian:           'catering.restaurant.persian',
  argentinian:       'catering.restaurant.argentinian',
  argentinean:       'catering.restaurant.argentinian',
  taiwanese:         'catering.restaurant.taiwanese',
  filipino:          'catering.restaurant.filipino',
  russian:           'catering.restaurant.russian',
  ukrainian:         'catering.restaurant.ukrainian',
  portuguese:        'catering.restaurant.portuguese',
  german:            'catering.restaurant.german',
  bavarian:          'catering.restaurant.bavarian',
  hungarian:         'catering.restaurant.hungarian',
  czech:             'catering.restaurant.czech',
  polish:            'catering.restaurant',
  balkan:            'catering.restaurant.balkan',
  croatian:          'catering.restaurant.croatian',
  georgian:          'catering.restaurant.georgian',
  armenian:          'catering.restaurant',
  syrian:            'catering.restaurant.syrian',
  afghan:            'catering.restaurant.afghan',
  pakistani:         'catering.restaurant.pakistani',
  nepalese:          'catering.restaurant.nepalese',
  nepali:            'catering.restaurant.nepalese',
  uzbek:             'catering.restaurant.uzbek',
  hawaiian:          'catering.restaurant.hawaiian',
  // ── Vague/descriptor keywords → sensible fallbacks ───────────────────────
  fusion:            'catering.restaurant.international',
  international:     'catering.restaurant.international',
  grill:             'catering.restaurant',
  grilled:           'catering.restaurant',
  healthy:           'catering.restaurant',
  salad:             'catering.restaurant',
  soup:              'catering.restaurant.soup',
  seasonal:          'catering.restaurant',
  vegan:             'catering.restaurant',   // dietary → handled at DB level
  vegetarian:        'catering.restaurant',   // dietary → handled at DB level
  halal:             'catering.restaurant',
  kosher:            'catering.restaurant',
  comfort:           'catering.restaurant.american',
  'comfort food':    'catering.restaurant.american',
  brunch:            'catering.cafe',
  breakfast:         'catering.cafe',
};

/**
 * Maps Geoapify category strings back to human-readable cuisine labels.
 * Used when the OSM raw cuisine tag is absent.
 */
const CATEGORY_TO_CUISINE = {
  'catering.restaurant.indian':         'Indian',
  'catering.restaurant.curry':          'Curry',
  'catering.restaurant.asian':          'Asian',
  'catering.restaurant.dumpling':       'Dumplings',
  'catering.restaurant.japanese':       'Japanese',
  'catering.restaurant.sushi':          'Sushi',
  'catering.restaurant.ramen':          'Ramen',
  'catering.restaurant.noodle':         'Noodles',
  'catering.restaurant.mexican':        'Mexican',
  'catering.restaurant.tacos':          'Tacos',
  'catering.restaurant.tex-mex':        'Tex-Mex',
  'catering.restaurant.thai':           'Thai',
  'catering.restaurant.american':       'American',
  'catering.restaurant.korean':         'Korean',
  'catering.restaurant.vietnamese':     'Vietnamese',
  'catering.restaurant.mediterranean':  'Mediterranean',
  'catering.restaurant.greek':          'Greek',
  'catering.restaurant.french':         'French',
  'catering.restaurant.spanish':        'Spanish',
  'catering.restaurant.tapas':          'Tapas',
  'catering.restaurant.arab':           'Middle Eastern',
  'catering.restaurant.lebanese':       'Lebanese',
  'catering.restaurant.turkish':        'Turkish',
  'catering.restaurant.kebab':          'Kebab',
  'catering.restaurant.seafood':        'Seafood',
  'catering.restaurant.fish':           'Fish',
  'catering.restaurant.steak_house':    'Steakhouse',
  'catering.restaurant.barbecue':       'BBQ',
  'catering.restaurant.wings':          'Wings',
  'catering.restaurant.african':        'African',
  'catering.restaurant.ethiopian':      'Ethiopian',
  'catering.restaurant.moroccan':       'Moroccan',
  'catering.restaurant.brazilian':      'Brazilian',
  'catering.restaurant.latin_american': 'Latin American',
  'catering.restaurant.peruvian':       'Peruvian',
  'catering.restaurant.caribbean':      'Caribbean',
  'catering.restaurant.jamaican':       'Jamaican',
  'catering.restaurant.cuban':          'Cuban',
  'catering.restaurant.malaysian':      'Malaysian',
  'catering.restaurant.malay':          'Malay',
  'catering.restaurant.indonesian':     'Indonesian',
  'catering.restaurant.persian':        'Persian',
  'catering.restaurant.argentinian':    'Argentinian',
  'catering.restaurant.taiwanese':      'Taiwanese',
  'catering.restaurant.filipino':       'Filipino',
  'catering.restaurant.russian':        'Russian',
  'catering.restaurant.portuguese':     'Portuguese',
  'catering.restaurant.german':         'German',
  'catering.restaurant.international':  'International',
  'catering.restaurant.soup':           'Soup',
  'catering.fast_food.pizza':           'Pizza',
  'catering.fast_food':                 'Fast Food',
  'catering.cafe':                      'Cafe',
  'catering.restaurant':                'Restaurant',
};

/** In-memory geocode cache — survives for the life of the Node process */
const geocodeCache = new Map();

/**
 * Convert a city name to { lat, lon } using the Geoapify Geocoding API.
 * @param {string} city
 * @returns {Promise<{lat: number, lon: number}>}
 */
async function geocodeCity(city) {
  if (geocodeCache.has(city)) return geocodeCache.get(city);

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
    throw new Error(`Geoapify geocoding: no results for "${city}"`);
  }

  const coords = { lat: results[0].lat, lon: results[0].lon };
  geocodeCache.set(city, coords);
  return coords;
}

/**
 * Map Gemini keywords to a deduplicated comma-separated Geoapify category string.
 * Always includes 'catering.restaurant' as the baseline.
 * NOTE: dietary keywords (vegan, vegetarian) intentionally map to the generic
 * restaurant category — OSM dietary condition tags are too sparse to be useful
 * as API-level filters. Dietary filtering is handled downstream by MongoDB.
 *
 * @param {string[]} keywords
 * @returns {string}  e.g. "catering.restaurant,catering.restaurant.thai,catering.restaurant.indian"
 */
function buildCategories(keywords) {
  const cats = new Set(['catering.restaurant']);

  keywords.forEach((keyword) => {
    const lk = keyword.toLowerCase().trim();
    // Direct match
    if (KEYWORD_TO_CATEGORY[lk]) {
      cats.add(KEYWORD_TO_CATEGORY[lk]);
      return;
    }
    // Partial / substring match
    for (const [kw, cat] of Object.entries(KEYWORD_TO_CATEGORY)) {
      if (lk.includes(kw) || kw.includes(lk)) {
        cats.add(cat);
        break;
      }
    }
  });

  return Array.from(cats).join(',');
}

/**
 * Derive a human-readable cuisine label from a Geoapify place's properties.
 * Priority: OSM raw cuisine tag → category map → 'Restaurant'.
 */
function extractCuisine(properties) {
  const raw = properties.datasource?.raw?.cuisine;
  if (raw) {
    return raw
      .split(';')[0]
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  for (const cat of properties.categories || []) {
    if (CATEGORY_TO_CUISINE[cat]) return CATEGORY_TO_CUISINE[cat];
  }

  return 'Restaurant';
}

/**
 * Execute a single Geoapify /v2/places request and normalise results.
 * @param {Object} params  - axios params object
 * @returns {Promise<Object[]>} normalised restaurant objects
 */
async function callPlacesApi(params) {
  const response = await axios.get('https://api.geoapify.com/v2/places', { params });
  const features = response.data?.features || [];

  return features
    .filter((f) => f.properties?.name)
    .map((f) => {
      const props = f.properties;
      const [fLon, fLat] = f.geometry.coordinates;
      const cuisine = extractCuisine(props);

      return {
        name: props.name,
        cuisine,
        description: `${cuisine} restaurant at ${props.address_line1 || props.address_line2 || ''}.`,
        image: '/placeholder-restaurant.jpg',
        price_range: '$$',
        location: {
          address: props.address_line1 || '',
          city: props.city || '',
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
}

/**
 * Fetch restaurants from the Geoapify Places API.
 *
 * Flow:
 *   1. Geocode the city (cached)
 *   2. Map Gemini keywords → validated Geoapify category strings
 *   3. Call /v2/places with specific categories
 *   4. On 400 (invalid category): auto-retry with generic catering.restaurant
 *   5. Normalise GeoJSON features → our Restaurant model shape
 *
 * @param {string[]} keywords  - cuisine keywords from Gemini
 * @param {Object}  options
 * @param {string}  [options.location]    - city name
 * @param {number}  [options.limit=15]    - max results
 * @param {number}  [options.radius=5000] - search radius in metres
 * @returns {Promise<Object[]>}
 */
async function fetchRestaurantsFromGeoapify(keywords, options = {}) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.error('[Geoapify] GEOAPIFY_API_KEY is not set');
    return [];
  }

  const city = options.location || process.env.DEFAULT_LOCATION || 'Toronto';
  const limit = options.limit || 15;
  const radiusMeters = options.radius || 5000;

  try {
    console.log(`[Geoapify] Geocoding "${city}"…`);
    const { lat, lon } = await geocodeCity(city);

    const categories = buildCategories(keywords);
    console.log(`[Geoapify] Searching categories="${categories}" near ${city}`);

    const baseParams = {
      filter: `circle:${lon},${lat},${radiusMeters}`,
      limit,
      apiKey,
    };

    let restaurants = [];

    try {
      // ── Attempt 1: specific categories derived from keywords ───────────────
      restaurants = await callPlacesApi({ ...baseParams, categories });
    } catch (err) {
      if (err.response?.status === 400) {
        // ── Attempt 2: fall back to generic restaurant search ─────────────────
        console.warn(
          '[Geoapify] Category search failed (400). Retrying with generic catering.restaurant…'
        );
        restaurants = await callPlacesApi({
          ...baseParams,
          categories: 'catering.restaurant',
        });
      } else {
        throw err; // propagate non-400 errors to outer handler
      }
    }

    if (restaurants.length === 0) {
      console.warn('[Geoapify] No named restaurants returned for this query');
    } else {
      console.log(`[Geoapify] Fetched ${restaurants.length} restaurants`);
    }

    return restaurants;
  } catch (error) {
    console.error('[Geoapify] Fatal error:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { fetchRestaurantsFromGeoapify };
