const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initialize Gemini API
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate cuisine-type keywords based on group preferences.
 * Output is used to query the Geoapify Places API by category.
 *
 * @param {Array} userProfiles Array of user preference objects and histories
 * @param {Object} vibeCheck Combined vibe check for the current session
 * @returns {Promise<Array<string>>} List of cuisine keywords (e.g. ["indian", "vegan", "thai"])
 */
async function generateKeywords(userProfiles, vibeCheck) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return ['restaurant']; // Fallback
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      I have a group of people looking for a restaurant. Based on their combined preferences and visit history, generate 5-8 cuisine types or food categories that best match the group.

      Group Preferences:
      ${userProfiles.map((u, i) => `
        User ${i + 1}:
        - Spice Level: ${u.preferences?.spice_level || 'any'}
        - Budget: ${u.preferences?.budget || 'any'}
        - Allergies: ${u.preferences?.allergies?.join(', ') || 'none'}
        - Dietary: ${u.preferences?.dietary_preferences?.join(', ') || 'none'}
        - Disliked Cuisines: ${u.preferences?.disliked_cuisines?.join(', ') || 'none'}
        - Recent Favorites: ${u.visits?.filter(v => v.rating >= 4).map(v => v.restaurant_cuisine).join(', ') || 'none'}
      `).join('\n')}

      Session Vibe:
      - Meal Type: ${vibeCheck?.meal_type || 'any'}
      - Today's Budget: ${vibeCheck?.budget_today || 'any'}
      - Mood: ${vibeCheck?.mood || 'any'}

      Instructions:
      1. Return ONLY simple, single-word or two-word cuisine/food types (e.g. "indian", "thai", "vegan", "seafood", "pizza").
      2. If someone is vegan or vegetarian, include "vegan" or "vegetarian" as a keyword — these are treated as dietary filters.
      3. Exclude any disliked cuisines from the output entirely.
      4. Find a good culinary match for the whole group (e.g. if preferences overlap on spicy food, include "thai" or "indian").
      5. Return ONLY a JSON array of strings. No extra text, no explanations.

      Example output: ["indian", "thai", "vegan", "japanese", "mediterranean"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON array from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      const keywords = JSON.parse(jsonMatch[0]);
      console.log('Gemini generated keywords:', keywords);
      return keywords;
    } else {
      console.warn('Gemini did not return a valid JSON array. Response:', text);
      return ['restaurant', 'food'];
    }
  } catch (error) {
    console.error('Error generating keywords with Gemini:', error);
    return ['restaurant', 'food'];
  }
}

module.exports = { generateKeywords };
