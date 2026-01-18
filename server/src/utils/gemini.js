const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initialize Gemini API
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate search keywords based on group preferences
 * @param {Array} userProfiles Array of user preference objects and histories
 * @param {Object} vibeCheck Combined vibe check for the current session
 * @returns {Promise<Array<string>>} List of keywords for Yelp search
 */
async function generateKeywords(userProfiles, vibeCheck) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return ['restaurant', 'food']; // Fallback
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    console.log('--- GEMINI INPUT DATA ---');
    console.log('User Profiles:', JSON.stringify(userProfiles, null, 2));
    console.log('Vibe Check:', JSON.stringify(vibeCheck, null, 2));
    console.log('-------------------------');

    const prompt = `
      I have a group of people looking for a place to eat. Based on their combined preferences and histories, generate 5-8 specific search keywords or short phrases that would help find the perfect restaurant on Yelp.

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
      1. Consider dietary restrictions as strict filters.
      2. Find the "culinary centroid" or interesting intersections (e.g., if one loves spicy and another is vegan, "spicy vegan" or "authentic thai").
      3. Exclude any disliked cuisines.
      4. Return ONLY a JSON array of strings. No extra text.
      5. Keywords should be things you'd type into a Yelp search bar.

      Example output: ["authentic mexican", "spicy noodles", "tapas bar", "outdoor seating"]
    `;

    console.log('--- FULL GEMINI PROMPT ---');
    console.log(prompt);
    console.log('---------------------------');

    console.log('Prompting Gemini for keywords...');
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
