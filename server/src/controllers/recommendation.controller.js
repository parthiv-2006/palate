const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const gemini = require('../utils/gemini');
const yelp = require('../utils/yelp');

async function createRecommendation(req, res, next) {
  try {
    const { userId, prefs, location } = req.body;

    let user = null;
    let preferences = prefs || {};
    if (userId) {
      user = await User.findById(userId).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      preferences = { ...(user.preferences || {}), ...preferences };
    }

    let candidates = [];
    try {
      if (process.env.YELP_API_KEY) {
        const searchOpts = {};
        if (location) searchOpts.location = location;
        if (preferences.budget && preferences.budget !== 'any') {
          const map = { low: '1', medium: '2', high: '3' };
          searchOpts.price = map[preferences.budget] || undefined;
        }
        searchOpts.limit = 20;
        candidates = await yelp.searchBusinesses(searchOpts);
      }
    } catch (err) {
      console.warn('Yelp search failed, continuing with empty candidates:', err.message || err);
      candidates = [];
    }

    const recs = await gemini.generateRecommendations(preferences, candidates);

    const doc = await Recommendation.create({
      user: user ? user._id : undefined,
      prefsSnapshot: preferences,
      candidates,
      recommendations: recs,
      source: process.env.YELP_API_KEY ? 'yelp+gemini' : 'gemini',
      raw: { generated: recs },
    });

    return res.json({ id: doc._id, recommendations: recs });
  } catch (err) {
    next(err);
  }
}

async function rateRecommendation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, rating } = req.body;
    const doc = await Recommendation.findById(id);
    if (!doc) return res.status(404).json({ error: 'Recommendation not found' });
    doc.ratings.push({ userId, rating });
    await doc.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function matchRecommendation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const doc = await Recommendation.findById(id);
    if (!doc) return res.status(404).json({ error: 'Recommendation not found' });
    doc.matches.push({ userId, matchedAt: new Date() });
    await doc.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { createRecommendation, rateRecommendation, matchRecommendation };
