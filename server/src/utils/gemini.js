const axios = require('axios');

const buildPrompt = (prefs = {}, candidates = []) => {
  const prefLines = [];
  if (prefs.spice_level) prefLines.push(`Spice level: ${prefs.spice_level}`);
  if (prefs.budget) prefLines.push(`Budget: ${prefs.budget}`);
  if (prefs.allergies && prefs.allergies.length) prefLines.push(`Allergies: ${prefs.allergies.join(', ')}`);
  if (prefs.dietary_preferences && prefs.dietary_preferences.length) prefLines.push(`Dietary preferences: ${prefs.dietary_preferences.join(', ')}`);

  const candidateSummary = candidates && candidates.length
    ? `Candidate restaurants (name | rating | price | categories):\n` + candidates.slice(0, 20).map(c => `${c.name} | ${c.rating || 'N/A'} | ${c.price || 'N/A'} | ${ (c.categories||[]).map(cc=>cc.title).join(',') }`).join('\n')
    : 'No candidate list provided.';

  return `You are a helpful restaurant recommender. Given the following user preferences:\n${prefLines.join('\n')}\n\n${candidateSummary}\n\nReturn a JSON array of up to 5 recommended objects with these fields: name, reason, score (0-100), and optional source. Respond ONLY with valid JSON.`;
};

const parseJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    const chunk = text.slice(start, end + 1);
    try { return JSON.parse(chunk); } catch (e) { /* fallthrough */ }
  }
  try { return JSON.parse(text); } catch (e) { return null; }
};

async function generateRecommendations(prefs = {}, candidates = []) {
  const prompt = buildPrompt(prefs, candidates);

  const url = process.env.GEMINI_API_URL;
  const key = process.env.GEMINI_API_KEY;

  if (url && key) {
    try {
      const res = await axios.post(url, { input: prompt }, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const data = res.data;
      if (!data) throw new Error('Empty response from Gemini endpoint');

      if (data.output && Array.isArray(data.output) && data.output[0] && data.output[0].content) {
        const text = data.output[0].content.map(c => c.text || c).join('\n');
        const parsed = parseJsonFromText(text);
        if (parsed) return parsed;
      }

      if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
        const msg = data.choices[0].message || data.choices[0];
        const text = typeof msg === 'string' ? msg : (msg.content || msg.text || '');
        const parsed = parseJsonFromText(text);
        if (parsed) return parsed;
      }

      if (typeof data === 'string') {
        const parsed = parseJsonFromText(data);
        if (parsed) return parsed;
      }

      const parsed = parseJsonFromText(JSON.stringify(data));
      if (parsed) return parsed;

      throw new Error('Unable to parse Gemini response');
    } catch (err) {
      console.error('Gemini API error:', err.message || err);
    }
  }

  if (Array.isArray(candidates) && candidates.length) {
    return candidates.slice(0, 5).map((c) => ({
      name: c.name,
      reason: `Matches preferences (rating ${c.rating || 'N/A'})`,
      score: Math.round(((c.rating || 3) / 5) * 80) + 10,
      source: c.source || 'yelp',
    }));
  }

  const cuisines = ['Italian','Sushi','Indian','Mexican','Thai','Mediterranean'];
  const out = [];
  for (let i = 0; i < 5; i++) {
    const name = `${prefs.budget || 'Cozy'} ${cuisines[i % cuisines.length]} Place ${i+1}`;
    out.push({ name, reason: `Good fit for ${prefs.spice_level || 'medium'} spice and ${prefs.budget || 'any'} budget`, score: 70 - i*5, source: 'generated' });
  }
  return out;
}

module.exports = { generateRecommendations };
