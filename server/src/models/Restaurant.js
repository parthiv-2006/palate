const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cuisine: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  price_range: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
  },
  location: {
    address: String,
    city: String,
    state: String,
    zip: String,
    latitude: Number,
    longitude: Number,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  dietary_options: [{
    type: String, // e.g., 'vegetarian', 'vegan', 'gluten-free'
  }],
  spice_level: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
  },
  tags: [{
    type: String,
  }],
  external_id: {
    type: String, // For Google Places or Yelp API integration
  },
  source: {
    type: String,
    enum: ['google', 'yelp', 'manual'],
    default: 'manual',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
