const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  prefsSnapshot: { type: Object, default: {} },
  candidates: { type: Array, default: [] },
  recommendations: { type: Array, default: [] },
  source: { type: String, default: 'generated' },
  raw: { type: Object, default: {} },
  ratings: [{ userId: { type: String }, rating: { type: Number } }],
  matches: [{ userId: { type: String }, matchedAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
