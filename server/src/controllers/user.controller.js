const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Get user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    // Get pending feedback count
    const pendingFeedback = (user.visits || []).filter(v => !v.feedback_completed).length;

    res.json({
      id: user._id.toString(),
      username: user.username,
      preferences: user.preferences || {},
      visits: (user.visits || []).slice(0, 10).map(v => formatVisit(v)),
      totalVisits: (user.visits || []).length,
      pendingFeedback,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Format a visit for API response
 */
function formatVisit(v) {
  return {
    id: v._id.toString(),
    restaurant_id: v.restaurant_id,
    restaurant_name: v.restaurant_name,
    restaurant_cuisine: v.restaurant_cuisine,
    restaurant_image: v.restaurant_image,
    rating: v.rating,
    review: v.review,
    aspects: v.aspects || {},
    dishes_tried: v.dishes_tried || [],
    would_return: v.would_return,
    tags: v.tags || [],
    feedback_completed: v.feedback_completed || false,
    visited_at: v.visited_at,
    feedback_at: v.feedback_at,
    lobby_id: v.lobby_id,
  };
}

/**
 * Update aggregated cuisine and tag statistics based on visit feedback
 */
function updateCuisineAndTagStats(user, visit) {
  // Initialize preferences if needed
  if (!user.preferences) {
    user.preferences = {};
  }
  if (!user.preferences.cuisine_data) {
    user.preferences.cuisine_data = [];
  }
  if (!user.preferences.tag_data) {
    user.preferences.tag_data = [];
  }

  const cuisine = visit.restaurant_cuisine;
  const rating = visit.rating;
  const visitDate = visit.visited_at || visit.feedback_at || new Date();
  
  let cuisineDataChanged = false;
  let tagDataChanged = false;

  // Update cuisine statistics
  if (cuisine) {
    const cuisineIndex = user.preferences.cuisine_data.findIndex(
      stat => stat.cuisine === cuisine
    );

    let cuisineStat;
    if (cuisineIndex === -1) {
      // Create new cuisine stat entry
      cuisineStat = {
        cuisine: cuisine,
        visit_count: 0,
        average_rating: 0,
        total_rating_sum: 0,
        average_aspects: {
          food_quality: 0,
          service: 0,
          ambiance: 0,
          value: 0,
        },
        would_return_count: 0,
        last_visited: null,
      };
    } else {
      // Get existing stat and create a new object with defaults (don't modify in place)
      const existing = user.preferences.cuisine_data[cuisineIndex];
      cuisineStat = {
        cuisine: existing.cuisine || cuisine,
        visit_count: existing.visit_count || 0,
        average_rating: existing.average_rating || 0,
        total_rating_sum: existing.total_rating_sum || 0,
        average_aspects: {
          food_quality: existing.average_aspects?.food_quality || 0,
          service: existing.average_aspects?.service || 0,
          ambiance: existing.average_aspects?.ambiance || 0,
          value: existing.average_aspects?.value || 0,
        },
        would_return_count: existing.would_return_count || 0,
        last_visited: existing.last_visited || null,
      };
    }

    // Update visit count and rating statistics
    cuisineStat.visit_count = (cuisineStat.visit_count || 0) + 1;
    cuisineStat.total_rating_sum = (cuisineStat.total_rating_sum || 0) + Number(rating);
    cuisineStat.average_rating = cuisineStat.visit_count > 0 
      ? cuisineStat.total_rating_sum / cuisineStat.visit_count 
      : 0;

    // Update aspect averages if provided
    if (visit.aspects) {
      const aspectFields = ['food_quality', 'service', 'ambiance', 'value'];
      aspectFields.forEach(field => {
        if (visit.aspects[field] !== null && visit.aspects[field] !== undefined) {
          const currentSum = cuisineStat.average_aspects[field] * (cuisineStat.visit_count - 1);
          cuisineStat.average_aspects[field] = (currentSum + visit.aspects[field]) / cuisineStat.visit_count;
        }
      });
    }

    // Update would_return count
    if (visit.would_return === true) {
      cuisineStat.would_return_count += 1;
    }

    // Update last visited date
    if (!cuisineStat.last_visited || visitDate > cuisineStat.last_visited) {
      cuisineStat.last_visited = visitDate;
    }

    // Replace the object in the array (this ensures Mongoose tracks the change)
    if (cuisineIndex === -1) {
      user.preferences.cuisine_data.push(cuisineStat);
    } else {
      user.preferences.cuisine_data[cuisineIndex] = cuisineStat;
    }
    cuisineDataChanged = true;
  }

  // Mark preferences.cuisine_data as modified so Mongoose saves the changes
  if (cuisineDataChanged) {
    user.markModified('preferences.cuisine_data');
  }

  // Update tag statistics
  if (visit.tags && Array.isArray(visit.tags) && visit.tags.length > 0) {
    visit.tags.forEach(tag => {
      // Skip empty or invalid tags
      if (!tag || typeof tag !== 'string' || !tag.trim()) {
        return;
      }

      const tagIndex = user.preferences.tag_data.findIndex(stat => stat.tag === tag);

      let tagStat;
      if (tagIndex === -1) {
        // Create new tag stat entry
        tagStat = {
          tag: tag,
          visit_count: 0,
          average_rating: 0,
          total_rating_sum: 0,
          last_visited: null,
        };
      } else {
        // Get existing stat and create a new object with defaults (don't modify in place)
        const existing = user.preferences.tag_data[tagIndex];
        tagStat = {
          tag: existing.tag || tag,
          visit_count: existing.visit_count || 0,
          average_rating: existing.average_rating || 0,
          total_rating_sum: existing.total_rating_sum || 0,
          last_visited: existing.last_visited || null,
        };
      }

      // Update visit count and rating statistics
      tagStat.visit_count = (tagStat.visit_count || 0) + 1;
      tagStat.total_rating_sum = (tagStat.total_rating_sum || 0) + Number(rating);
      tagStat.average_rating = tagStat.visit_count > 0 
        ? tagStat.total_rating_sum / tagStat.visit_count 
        : 0;

      // Update last visited date
      if (!tagStat.last_visited || visitDate > tagStat.last_visited) {
        tagStat.last_visited = visitDate;
      }

      // Replace the object in the array (this ensures Mongoose tracks the change)
      if (tagIndex === -1) {
        user.preferences.tag_data.push(tagStat);
      } else {
        user.preferences.tag_data[tagIndex] = tagStat;
      }
      tagDataChanged = true;
    });
  }

  // Mark preferences.tag_data as modified so Mongoose saves the changes
  if (tagDataChanged) {
    user.markModified('preferences.tag_data');
  }
  
  // Mark preferences as modified if any nested changes were made
  if (cuisineDataChanged || tagDataChanged) {
    user.markModified('preferences');
  }
}

/**
 * Save or update user preferences
 */
exports.savePreferences = async (req, res, next) => {
  try {
    const {
      spice_level,
      budget,
      allergies = [],
      dietary_preferences = [],
      disliked_cuisines = [],
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    // Update preferences
    user.preferences = {
      spice_level: spice_level || user.preferences?.spice_level || 'medium',
      budget: budget || user.preferences?.budget || 'any',
      allergies,
      dietary_preferences,
      disliked_cuisines,
    };
    
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a restaurant visit with optional review
 */
exports.addVisit = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { 
      restaurant_id, 
      restaurant_name, 
      restaurant_cuisine, 
      restaurant_image,
      lobby_id 
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    if (!restaurant_id || !restaurant_name) {
      return res.status(400).json({
        error: { message: 'Restaurant ID and name are required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    // Initialize visits array if needed
    if (!user.visits) {
      user.visits = [];
    }

    // Check if this restaurant was already visited in this lobby
    const existingVisit = user.visits.find(
      v => v.restaurant_id === restaurant_id && v.lobby_id === lobby_id
    );

    if (existingVisit) {
      return res.json({
        success: true,
        message: 'Visit already recorded',
        visit: formatVisit(existingVisit),
      });
    }

    // Add new visit at the beginning
    user.visits.unshift({
      restaurant_id,
      restaurant_name,
      restaurant_cuisine,
      restaurant_image,
      lobby_id: lobby_id || null,
      visited_at: new Date(),
      feedback_completed: false,
    });

    await user.save();

    res.json({
      success: true,
      message: 'Visit recorded',
      visit: formatVisit(user.visits[0]),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit detailed feedback for a visit
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { visitId } = req.params;
    const { 
      rating, 
      review, 
      aspects,
      dishes_tried,
      would_return,
      tags,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: { message: 'Rating (1-5) is required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    const visit = user.visits?.id(visitId);
    
    if (!visit) {
      return res.status(404).json({
        error: { message: 'Visit not found' },
      });
    }

    // Check if this is the first time feedback is being submitted
    const isFirstFeedback = !visit.feedback_completed;

    // Update the visit with feedback
    visit.rating = rating;
    visit.review = review || '';
    visit.would_return = would_return;
    visit.feedback_completed = true;
    visit.feedback_at = new Date();

    // Update aspect ratings if provided
    if (aspects) {
      visit.aspects = {
        food_quality: aspects.food_quality || null,
        service: aspects.service || null,
        ambiance: aspects.ambiance || null,
        value: aspects.value || null,
      };
    }

    // Update dishes tried
    if (dishes_tried && Array.isArray(dishes_tried)) {
      visit.dishes_tried = dishes_tried.filter(d => d && d.trim());
    }

    // Update tags
    if (tags && Array.isArray(tags)) {
      visit.tags = tags;
    }

    // Update aggregated statistics from visit history
    // Only update if this is the first time feedback is being submitted
    if (isFirstFeedback) {
      updateCuisineAndTagStats(user, visit);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      visit: formatVisit(visit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a visit review (simple update)
 */
exports.updateVisit = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { visitId } = req.params;
    const { rating, review } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    const visit = user.visits?.id(visitId);
    
    if (!visit) {
      return res.status(404).json({
        error: { message: 'Visit not found' },
      });
    }

    if (rating !== undefined) visit.rating = rating;
    if (review !== undefined) visit.review = review;

    await user.save();

    res.json({
      success: true,
      message: 'Visit updated',
      visit: formatVisit(visit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all visits (with pagination)
 */
exports.getVisits = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, pending_only } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    let visits = user.visits || [];
    
    // Filter to only pending feedback if requested
    if (pending_only === 'true') {
      visits = visits.filter(v => !v.feedback_completed);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedVisits = visits.slice(startIndex, endIndex);

    res.json({
      visits: paginatedVisits.map(v => formatVisit(v)),
      total: visits.length,
      page: parseInt(page),
      totalPages: Math.ceil(visits.length / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single visit by ID
 */
exports.getVisit = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { visitId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    const visit = user.visits?.id(visitId);
    
    if (!visit) {
      return res.status(404).json({
        error: { message: 'Visit not found' },
      });
    }

    res.json({
      visit: formatVisit(visit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending feedback visits
 */
exports.getPendingFeedback = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    const pendingVisits = (user.visits || []).filter(v => !v.feedback_completed);

    res.json({
      visits: pendingVisits.map(v => formatVisit(v)),
      count: pendingVisits.length,
    });
  } catch (error) {
    next(error);
  }
};
