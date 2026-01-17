const Restaurant = require('../models/Restaurant');

/**
 * Seed sample restaurants for testing
 * Run this once to populate the database with sample data
 */
const sampleRestaurants = [
  {
    name: 'The Spice Garden',
    cuisine: 'Indian',
    description: 'Authentic Indian cuisine with a modern twist. Known for their flavorful curries and fresh naan.',
    price_range: '$$',
    rating: 4.5,
    dietary_options: ['vegetarian', 'vegan', 'gluten-free'],
    spice_level: 'high',
    tags: ['spicy', 'vegetarian-friendly', 'family-friendly'],
    location: {
      address: '123 Main St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Sushi Zen',
    cuisine: 'Japanese',
    description: 'Fresh sushi and sashimi in a minimalist setting. Omakase available.',
    price_range: '$$$',
    rating: 4.8,
    dietary_options: ['pescatarian', 'gluten-free'],
    spice_level: 'low',
    tags: ['fresh', 'upscale', 'date-night'],
    location: {
      address: '456 Queen St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Green Leaf Cafe',
    cuisine: 'Mediterranean',
    description: 'Healthy Mediterranean fare with plenty of vegetarian and vegan options.',
    price_range: '$$',
    rating: 4.3,
    dietary_options: ['vegetarian', 'vegan', 'gluten-free', 'halal'],
    spice_level: 'medium',
    tags: ['healthy', 'vegetarian-friendly', 'casual'],
    location: {
      address: '789 King St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Burger Palace',
    cuisine: 'American',
    description: 'Classic burgers, fries, and milkshakes. Comfort food at its finest.',
    price_range: '$',
    rating: 4.2,
    dietary_options: [],
    spice_level: 'none',
    tags: ['casual', 'family-friendly', 'comfort-food'],
    location: {
      address: '321 College St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    description: 'Authentic Mexican street food with bold flavors and fresh ingredients.',
    price_range: '$$',
    rating: 4.6,
    dietary_options: ['vegetarian', 'gluten-free'],
    spice_level: 'high',
    tags: ['spicy', 'casual', 'authentic'],
    location: {
      address: '654 Spadina Ave',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Pasta Paradise',
    cuisine: 'Italian',
    description: 'Homemade pasta and wood-fired pizzas in a cozy trattoria setting.',
    price_range: '$$',
    rating: 4.4,
    dietary_options: ['vegetarian'],
    spice_level: 'low',
    tags: ['romantic', 'family-friendly', 'comfort-food'],
    location: {
      address: '987 Bloor St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Dragon Wok',
    cuisine: 'Chinese',
    description: 'Szechuan and Cantonese dishes with authentic flavors and generous portions.',
    price_range: '$$',
    rating: 4.5,
    dietary_options: ['vegetarian'],
    spice_level: 'high',
    tags: ['spicy', 'family-style', 'authentic'],
    location: {
      address: '147 Yonge St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'The Vegan Table',
    cuisine: 'Vegan',
    description: '100% plant-based menu with creative takes on classic dishes.',
    price_range: '$$',
    rating: 4.7,
    dietary_options: ['vegan', 'vegetarian', 'gluten-free'],
    spice_level: 'medium',
    tags: ['vegan', 'healthy', 'trendy'],
    location: {
      address: '258 Dundas St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Steakhouse Prime',
    cuisine: 'Steakhouse',
    description: 'Premium cuts of meat, aged to perfection. Fine dining experience.',
    price_range: '$$$$',
    rating: 4.9,
    dietary_options: [],
    spice_level: 'none',
    tags: ['upscale', 'date-night', 'special-occasion'],
    location: {
      address: '369 Bay St',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
  {
    name: 'Falafel Express',
    cuisine: 'Middle Eastern',
    description: 'Fresh falafel, shawarma, and hummus. Quick and delicious.',
    price_range: '$',
    rating: 4.3,
    dietary_options: ['vegetarian', 'vegan', 'halal', 'kosher'],
    spice_level: 'medium',
    tags: ['quick', 'vegetarian-friendly', 'authentic'],
    location: {
      address: '741 Danforth Ave',
      city: 'Toronto',
      state: 'ON',
    },
    source: 'manual',
  },
];

async function seedRestaurants() {
  try {
    console.log('Seeding restaurants...');
    
    // Clear existing restaurants (optional - comment out if you want to keep existing data)
    // await Restaurant.deleteMany({ source: 'manual' });
    
    // Insert sample restaurants
    const inserted = await Restaurant.insertMany(sampleRestaurants);
    console.log(`✅ Seeded ${inserted.length} restaurants`);
    
    return inserted;
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some restaurants already exist, skipping duplicates');
    } else {
      console.error('❌ Error seeding restaurants:', error);
      throw error;
    }
  }
}

// If run directly, seed the database
if (require.main === module) {
  // Load environment variables from .env file
  require('dotenv').config();
  
  const mongoose = require('mongoose');
  const connectDB = require('../config/database');
  
  connectDB().then(async () => {
    await seedRestaurants();
    process.exit(0);
  }).catch(error => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
}

module.exports = seedRestaurants;
