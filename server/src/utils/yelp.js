const axios = require('axios');

/**
 * Fetch restaurants from Yelp API based on keywords
 * @param {Array<string>} keywords List of keywords to search for
 * @param {Object} options Search options like location
 * @returns {Promise<Array>} List of restaurants
 */
async function fetchRestaurantsFromYelp(keywords, options = {}) {
  try {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      console.error('YELP_API_KEY is not set');
      return [];
    }

    const location = options.location || 'Toronto'; // Default location
    const limit = options.limit || 10;
    
    // We'll combine keywords into a search term or do multiple searches
    // For now, let's join them or pick the top ones
    const searchTerm = keywords.slice(0, 3).join(' ');
    
    console.log(`Searching Yelp for: "${searchTerm}" in ${location}`);

    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        term: searchTerm,
        location: location,
        limit: limit,
        categories: 'restaurants,food',
      },
    });

    if (!response.data || !response.data.businesses) {
      console.warn('No businesses found in Yelp response');
      return [];
    }

    // Map Yelp data to our Restaurant model format
    const restaurants = response.data.businesses.map(b => ({
      name: b.name,
      cuisine: b.categories.map(c => c.title).join(', '),
      description: `${b.categories.map(c => c.title).join(', ')} restaurant with ${b.rating} stars on Yelp.`,
      image: b.image_url || '/placeholder-restaurant.jpg',
      price_range: b.price || '$$',
      location: {
        address: b.location.address1,
        city: b.location.city,
        state: b.location.state,
        zip: b.location.zip_code,
        latitude: b.coordinates.latitude,
        longitude: b.coordinates.longitude,
      },
      rating: b.rating,
      external_id: b.id,
      source: 'yelp',
      tags: b.categories.map(c => c.alias),
    }));

    console.log(`Successfully fetched ${restaurants.length} restaurants from Yelp`);
    return restaurants;
  } catch (error) {
    console.error('Error fetching from Yelp:', error.response?.data || error.message);
    return [];
  }
}

module.exports = { fetchRestaurantsFromYelp };
