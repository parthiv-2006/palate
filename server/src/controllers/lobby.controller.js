const Lobby = require('../models/Lobby');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const generateLobbyCode = require('../utils/generateCode');
const AppError = require('../utils/errors');

/**
 * Create a new lobby
 */
exports.createLobby = async (req, res, next) => {
  try {
    let userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) {
      // Create guest user if no userId provided
      const guestUser = await User.create({
        username: `guest_${Date.now()}`,
      });
      userId = guestUser._id.toString();
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    // Generate unique 6-digit code
    const checkCodeUnique = async (code) => {
      const existing = await Lobby.findOne({ code });
      return !existing;
    };

    const code = await generateLobbyCode(checkCodeUnique);

    // Create lobby with host as first participant
    const lobby = await Lobby.create({
      code,
      name: name || `Lobby ${code}`,
      host_id: user._id,
      participants: [{
        user_id: user._id,
        name: user.username,
        isHost: true,
        isReady: true,
      }],
      status: 'waiting',
    });

    res.status(201).json({
      lobbyId: lobby._id.toString(),
      code: lobby.code,
      id: lobby._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a lobby by code
 */
exports.joinLobby = async (req, res, next) => {
  try {
    let { code } = req.body;
    const userId = req.user?.userId;

    // Normalize code: convert to string, trim whitespace
    if (typeof code === 'number') {
      code = code.toString();
    }
    code = String(code).trim();

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: { message: 'Valid 6-digit lobby code is required' },
      });
    }

    // Find lobby by code
    const lobby = await Lobby.findOne({ code });
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found. Please check the code.' },
      });
    }

    // Check if lobby is open for joining
    if (lobby.status !== 'waiting') {
      return res.status(400).json({
        error: { message: 'Lobby is no longer accepting new participants' },
      });
    }

    // Handle user (create guest if needed)
    let user;
    if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      // Create guest user
      user = await User.create({
        username: `guest_${Date.now()}`,
      });
    }

    // Check if user is already a participant
    const existingParticipant = lobby.participants.find(
      p => p.user_id.toString() === user._id.toString()
    );

    if (existingParticipant) {
      return res.json({
        lobbyId: lobby._id.toString(),
        code: lobby.code,
      });
    }

    // Add user as participant
    lobby.participants.push({
      user_id: user._id,
      name: user.username,
      isHost: false,
      isReady: true,
    });

    await lobby.save();

    res.json({
      lobbyId: lobby._id.toString(),
      code: lobby.code,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lobby details
 */
exports.getLobby = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.findById(lobbyId).populate('participants.user_id', 'username preferences');
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Format participants for frontend
    const participants = lobby.participants.map(p => {
      // Handle populated user_id (object) or unpopulated (ObjectId)
      const userId = p.user_id?._id?.toString() || p.user_id?.toString() || p.user_id;
      const username = p.user_id?.username || p.name || 'Anonymous';
      
      return {
        id: userId,
        name: p.name || username,
        isHost: p.isHost || false,
        isReady: p.isReady !== undefined ? p.isReady : true,
      };
    });

    res.json({
      id: lobby._id.toString(),
      code: lobby.code,
      name: lobby.name,
      participants,
      restaurants: lobby.restaurants || [],
      status: lobby.status,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }
    next(error);
  }
};

/**
 * Start matching process for lobby
 */
exports.startMatching = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Verify user is the host
    if (lobby.host_id.toString() !== userId) {
      return res.status(403).json({
        error: { message: 'Only the lobby host can start matching' },
      });
    }

    // Check minimum participants (at least 2)
    if (lobby.participants.length < 2) {
      return res.status(400).json({
        error: { message: 'At least 2 participants are required to start matching' },
      });
    }

    // Update lobby status
    lobby.status = 'matching';
    await lobby.save();

    res.json({
      success: true,
      message: 'Matching started',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }
    next(error);
  }
};

/**
 * Get restaurants for matching (filtered by user preferences)
 */
exports.getRestaurants = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user?.userId;

    const lobby = await Lobby.findById(lobbyId).populate('participants.user_id', 'preferences');
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Check if lobby is in matching status
    if (lobby.status !== 'matching') {
      return res.status(400).json({
        error: { message: 'Lobby is not in matching phase' },
      });
    }

    // Get all participants' preferences
    const participants = lobby.participants.map(p => p.user_id).filter(Boolean);
    const preferences = participants.map(p => p.preferences || {});

    // Build filter based on group preferences
    const filters = {};
    
    // Get common dietary restrictions (allergies)
    const allAllergies = new Set();
    preferences.forEach(pref => {
      if (pref.allergies && Array.isArray(pref.allergies)) {
        pref.allergies.forEach(allergy => allAllergies.add(allergy));
      }
    });

    // Get common dietary preferences (intersection - all must be satisfied)
    const dietaryPrefs = new Set();
    if (preferences.length > 0) {
      // Start with first user's preferences
      const firstPrefs = preferences[0].dietary_preferences || [];
      firstPrefs.forEach(pref => dietaryPrefs.add(pref));
      
      // Intersect with others
      preferences.slice(1).forEach(pref => {
        const userPrefs = new Set(pref.dietary_preferences || []);
        dietaryPrefs.forEach(dietPref => {
          if (!userPrefs.has(dietPref)) {
            dietaryPrefs.delete(dietPref);
          }
        });
      });
    }

    // Get disliked cuisines (union - exclude any disliked by any user)
    const dislikedCuisines = new Set();
    preferences.forEach(pref => {
      if (pref.disliked_cuisines && Array.isArray(pref.disliked_cuisines)) {
        pref.disliked_cuisines.forEach(cuisine => dislikedCuisines.add(cuisine));
      }
    });

    // Get swiped restaurant IDs for this user (to exclude already swiped)
    // Handle case where swipes might not be initialized
    const swipes = lobby.swipes || [];
    const userSwipes = userId 
      ? swipes.filter(s => s.user_id?.toString() === userId)
      : [];
    const swipedRestaurantIds = userSwipes.map(s => s.restaurant_id).filter(Boolean);

    // Build MongoDB query
    const query = {};

    // Build dietary_options query
    // Must satisfy: has all common dietary preferences AND doesn't have any allergies
    const dietaryConditions = [];
    
    if (dietaryPrefs.size > 0) {
      dietaryConditions.push({ dietary_options: { $all: Array.from(dietaryPrefs) } });
    }
    
    if (allAllergies.size > 0) {
      dietaryConditions.push({ dietary_options: { $nin: Array.from(allAllergies) } });
    }

    // If we have dietary conditions, combine them with $and
    if (dietaryConditions.length > 0) {
      if (dietaryConditions.length === 1) {
        Object.assign(query, dietaryConditions[0]);
      } else {
        query.$and = dietaryConditions;
      }
    }

    // Exclude disliked cuisines
    if (dislikedCuisines.size > 0) {
      query.cuisine = { $nin: Array.from(dislikedCuisines) };
    }

    // Exclude already swiped restaurants (convert string IDs to ObjectIds)
    if (swipedRestaurantIds.length > 0) {
      const mongoose = require('mongoose');
      const swipedObjectIds = swipedRestaurantIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      if (swipedObjectIds.length > 0) {
        query._id = { $nin: swipedObjectIds };
      }
    }

    // Fetch restaurants (limit to 20 for now, can be paginated later)
    let restaurants = await Restaurant.find(query).limit(20);

    // If no restaurants match, return some default options
    if (restaurants.length === 0) {
      restaurants = await Restaurant.find({}).limit(10);
    }

    res.json({
      restaurants: restaurants.map(r => ({
        id: r._id.toString(),
        name: r.name,
        cuisine: r.cuisine,
        description: r.description,
        image: r.image || '/placeholder-restaurant.jpg',
        price_range: r.price_range,
        location: r.location,
        rating: r.rating,
        dietary_options: r.dietary_options,
        spice_level: r.spice_level,
        tags: r.tags,
      })),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }
    next(error);
  }
};

/**
 * Record a swipe action
 */
exports.recordSwipe = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user?.userId;
    const { restaurantId, direction } = req.body;

    if (!restaurantId || !direction || !['left', 'right'].includes(direction)) {
      return res.status(400).json({
        error: { message: 'Restaurant ID and direction (left/right) are required' },
      });
    }

    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Check if lobby is in matching status
    if (lobby.status !== 'matching') {
      return res.status(400).json({
        error: { message: 'Lobby is not in matching phase' },
      });
    }

    // Check if user is a participant (handle both authenticated and guest users)
    const isParticipant = userId 
      ? lobby.participants.some(p => p.user_id.toString() === userId)
      : false;

    if (!isParticipant && userId) {
      return res.status(403).json({
        error: { message: 'You must be a participant to swipe' },
      });
    }

    // For guest users, we'll allow swiping but track by a temporary ID
    if (!userId) {
      // Create a guest user for tracking
      const guestUser = await User.create({
        username: `guest_${Date.now()}`,
      });
      userId = guestUser._id.toString();
    }

    // Initialize swipes array if it doesn't exist
    if (!lobby.swipes) {
      lobby.swipes = [];
    }

    // Check if already swiped this restaurant
    const existingSwipe = lobby.swipes.find(
      s => s.user_id.toString() === userId && s.restaurant_id === restaurantId
    );

    if (existingSwipe) {
      // Update existing swipe
      existingSwipe.direction = direction;
      existingSwipe.timestamp = new Date();
    } else {
      // Add new swipe
      lobby.swipes.push({
        user_id: userId,
        restaurant_id: restaurantId,
        direction,
        timestamp: new Date(),
      });
    }

    await lobby.save();

    // Check if all participants have swiped on enough restaurants
    // For now, just return success - we can add logic to move to voting phase later
    const participantCount = lobby.participants.length;
    const rightSwipes = lobby.swipes?.filter(s => s.direction === 'right') || [];
    
    // Group right swipes by restaurant
    const restaurantSwipeCounts = {};
    rightSwipes.forEach(swipe => {
      restaurantSwipeCounts[swipe.restaurant_id] = 
        (restaurantSwipeCounts[swipe.restaurant_id] || 0) + 1;
    });

    // Find restaurants that all participants swiped right on
    const consensusRestaurants = Object.entries(restaurantSwipeCounts)
      .filter(([_, count]) => count === participantCount)
      .map(([restaurantId]) => restaurantId);

    res.json({
      success: true,
      message: 'Swipe recorded',
      consensusReached: consensusRestaurants.length > 0,
      consensusRestaurants,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }
    next(error);
  }
};
