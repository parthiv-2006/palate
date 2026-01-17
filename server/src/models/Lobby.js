const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  isReady: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const lobbySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6,
  },
  name: {
    type: String,
  },
  host_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['waiting', 'matching', 'voting', 'completed'],
    default: 'waiting',
  },
  restaurants: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  swipes: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant_id: {
      type: String, // Can be ObjectId or external ID
      required: true,
    },
    direction: {
      type: String,
      enum: ['left', 'right'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  swipes: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant_id: {
      type: String, // Can be ObjectId or external ID
      required: true,
    },
    direction: {
      type: String,
      enum: ['left', 'right'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lobby', lobbySchema);
