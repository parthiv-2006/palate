const mongoose = require('mongoose');

// WebAuthn credentials for passkey authentication
const webauthnCredentialSchema = new mongoose.Schema({
  credentialID: {
    type: Buffer,
    required: true,
  },
  publicKey: {
    type: Buffer,
    required: true,
  },
  counter: {
    type: Number,
    required: true,
  },
  transports: {
    type: [String],
    default: [],
  },
});

// Visit history with reviews (Post-Meal Feedback)
const visitSchema = new mongoose.Schema({
  restaurant_id: {
    type: String,
    required: true,
  },
  restaurant_name: {
    type: String,
    required: true,
  },
  restaurant_cuisine: {
    type: String,
  },
  restaurant_image: {
    type: String,
  },
  // Overall rating
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  // Detailed review text
  review: {
    type: String,
    maxlength: 1000,
  },
  // Specific aspect ratings
  aspects: {
    food_quality: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    ambiance: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
  },
  // What dishes they tried
  dishes_tried: [{
    type: String,
  }],
  // Would they go back?
  would_return: {
    type: Boolean,
  },
  // Tags for quick categorization
  tags: [{
    type: String,
    enum: ['great-for-groups', 'romantic', 'quick-service', 'good-portions', 
           'instagram-worthy', 'hidden-gem', 'loud', 'quiet', 'kid-friendly',
           'date-night', 'casual', 'upscale', 'outdoor-seating', 'late-night'],
  }],
  // Whether feedback has been completed
  feedback_completed: {
    type: Boolean,
    default: false,
  },
  visited_at: {
    type: Date,
    default: Date.now,
  },
  feedback_at: {
    type: Date,
  },
  lobby_id: {
    type: String,
  },
}, { _id: true });

// Schema for storing aggregated cuisine statistics from visit history
const cuisineStatSchema = new mongoose.Schema({
  cuisine: {
    type: String,
    required: true,
  },
  visit_count: {
    type: Number,
    default: 0,
  },
  average_rating: {
    type: Number,
    default: 0,
  },
  total_rating_sum: {
    type: Number,
    default: 0,
  },
  average_aspects: {
    food_quality: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    ambiance: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
  },
  would_return_count: {
    type: Number,
    default: 0,
  },
  last_visited: {
    type: Date,
  },
}, { _id: false });

// Schema for storing aggregated tag statistics from visit history
const tagStatSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
  },
  visit_count: {
    type: Number,
    default: 0,
  },
  average_rating: {
    type: Number,
    default: 0,
  },
  total_rating_sum: {
    type: Number,
    default: 0,
  },
  last_visited: {
    type: Date,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  // Passkey authentication
  webauthnCredentials: {
    type: [webauthnCredentialSchema],
    default: [],
  },
  challenge: { type: String, default: null },
  // User preferences
  preferences: {
    spice_level: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'medium',
    },
    budget: {
      type: String,
      enum: ['low', 'medium', 'high', 'any'],
      default: 'any',
    },
    allergies: [{
      type: String,
    }],
    dietary_preferences: [{
      type: String,
    }],
    disliked_cuisines: [{
      type: String,
    }],
    // Aggregated statistics from visit history
    cuisine_data: {
      type: [cuisineStatSchema],
      default: [],
    },
    tag_data: {
      type: [tagStatSchema],
      default: [],
    },
  },
  amplitude_behavioral_score: {
    adventurousness: {
      type: Number,
      default: 0,
    },
    budget_sensitivity: {
      type: String,
      default: 'medium',
    },
  },
  // Visit history with reviews
  visits: [visitSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
