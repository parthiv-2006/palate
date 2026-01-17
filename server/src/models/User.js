const mongoose = require('mongoose');

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

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: false, // Optional during user creation, but required for login
    select: false, // Don't return password by default
  },
  webauthnCredentials: {
    type: [webauthnCredentialSchema],
    default: [],
  },
  challenge: { type: String, default: null },
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
