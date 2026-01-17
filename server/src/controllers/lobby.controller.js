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
    const userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
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

    // Find user
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

    // Check if we already have matching restaurants stored for this session
    let restaurants;
    const mongoose = require('mongoose');
    
    if (lobby.matchingRestaurants && lobby.matchingRestaurants.length >= 5) {
      // Fetch the stored restaurants
      const storedIds = lobby.matchingRestaurants
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      restaurants = await Restaurant.find({ _id: { $in: storedIds } });
    } else {
      // First fetch or too few restaurants - get restaurants and store them
      // Try with preference filter first
      restaurants = await Restaurant.find(query).limit(20);

      // If too few restaurants match, get all restaurants (relaxed filtering)
      if (restaurants.length < 5) {
        console.log('Preference filter too strict, fetching all restaurants');
        restaurants = await Restaurant.find({}).limit(20);
      }

      // Store the restaurant IDs for this matching session
      lobby.matchingRestaurants = restaurants.map(r => r._id.toString());
      await lobby.save();
    }

    // Filter out already swiped restaurants for this user
    const userSwipedIds = new Set(swipedRestaurantIds);
    const unswipedRestaurants = restaurants.filter(r => 
      !userSwipedIds.has(r._id.toString())
    );

    res.json({
      restaurants: unswipedRestaurants.map(r => ({
        id: r._id?.toString() || r.id,
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
      totalRestaurants: lobby.matchingRestaurants.length,
      swipedCount: swipedRestaurantIds.length,
      remainingCount: unswipedRestaurants.length,
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

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }

    // Check if user is a participant
    const isParticipant = lobby.participants.some(p => p.user_id.toString() === userId);

    if (!isParticipant) {
      return res.status(403).json({
        error: { message: 'You must be a participant to swipe' },
      });
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

    // Check swiping progress
    const participantCount = lobby.participants.length;
    const totalRestaurants = lobby.matchingRestaurants?.length || 0;
    const swipes = lobby.swipes || [];

    // Count swipes per user
    const swipesPerUser = {};
    swipes.forEach(swipe => {
      const oderId = swipe.user_id.toString();
      swipesPerUser[oderId] = (swipesPerUser[oderId] || 0) + 1;
    });

    // Check if all participants have swiped all restaurants
    const allDoneSwiping = lobby.participants.every(p => {
      const userSwipeCount = swipesPerUser[p.user_id.toString()] || 0;
      return userSwipeCount >= totalRestaurants;
    });

    // Calculate consensus restaurants (all participants swiped right)
    const rightSwipes = swipes.filter(s => s.direction === 'right');
    const restaurantSwipeCounts = {};
    rightSwipes.forEach(swipe => {
      restaurantSwipeCounts[swipe.restaurant_id] = 
        (restaurantSwipeCounts[swipe.restaurant_id] || 0) + 1;
    });

    const consensusRestaurants = Object.entries(restaurantSwipeCounts)
      .filter(([_, count]) => count === participantCount)
      .map(([restaurantId]) => restaurantId);

    // If all users are done swiping, transition to voting
    let transitionedToVoting = false;
    if (allDoneSwiping && consensusRestaurants.length > 0) {
      lobby.status = 'voting';
      lobby.consensusRestaurants = consensusRestaurants;
      await lobby.save();
      transitionedToVoting = true;
    }

    // Calculate user's progress
    const userSwipeCount = swipesPerUser[userId] || 0;
    const userDone = userSwipeCount >= totalRestaurants;

    res.json({
      success: true,
      message: 'Swipe recorded',
      consensusReached: consensusRestaurants.length > 0,
      consensusRestaurants,
      progress: {
        userSwipeCount,
        totalRestaurants,
        userDone,
        allDone: allDoneSwiping,
      },
      transitionedToVoting,
      lobbyStatus: lobby.status,
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
 * Get voting data (consensus restaurants for voting)
 */
exports.getVotingData = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user?.userId;

    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Check if lobby is in voting or completed status
    if (!['voting', 'completed'].includes(lobby.status)) {
      return res.status(400).json({
        error: { message: 'Lobby is not in voting phase' },
      });
    }

    // Get consensus restaurant details
    const mongoose = require('mongoose');
    const consensusIds = (lobby.consensusRestaurants || [])
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    
    const restaurants = await Restaurant.find({ _id: { $in: consensusIds } });

    // Get current votes
    const votes = lobby.votes || [];
    const voteCounts = {};
    votes.forEach(vote => {
      voteCounts[vote.restaurant_id] = (voteCounts[vote.restaurant_id] || 0) + 1;
    });

    // Check if user has voted
    const userVote = votes.find(v => v.user_id.toString() === userId);

    // Check if all participants have voted
    const participantCount = lobby.participants.length;
    const votedUserIds = new Set(votes.map(v => v.user_id.toString()));
    const allVoted = lobby.participants.every(p => 
      votedUserIds.has(p.user_id.toString())
    );

    res.json({
      status: lobby.status,
      restaurants: restaurants.map(r => ({
        id: r._id.toString(),
        name: r.name,
        cuisine: r.cuisine,
        description: r.description,
        image: r.image || '/placeholder-restaurant.jpg',
        price_range: r.price_range,
        location: r.location,
        rating: r.rating,
        voteCount: voteCounts[r._id.toString()] || 0,
      })),
      userVote: userVote?.restaurant_id || null,
      allVoted,
      participantCount,
      voteCount: votes.length,
      winningRestaurant: lobby.winningRestaurant || null,
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
 * Submit a vote for a restaurant
 */
exports.submitVote = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;
    const userId = req.user?.userId;
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        error: { message: 'Restaurant ID is required' },
      });
    }

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

    // Check if lobby is in voting status
    if (lobby.status !== 'voting') {
      return res.status(400).json({
        error: { message: 'Lobby is not in voting phase' },
      });
    }

    // Check if user is a participant
    const isParticipant = lobby.participants.some(p => p.user_id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({
        error: { message: 'You must be a participant to vote' },
      });
    }

    // Check if restaurant is in consensus list
    if (!lobby.consensusRestaurants?.includes(restaurantId)) {
      return res.status(400).json({
        error: { message: 'Restaurant is not in the voting options' },
      });
    }

    // Initialize votes array if needed
    if (!lobby.votes) {
      lobby.votes = [];
    }

    // Check if user already voted
    const existingVote = lobby.votes.find(v => v.user_id.toString() === userId);
    if (existingVote) {
      // Update existing vote
      existingVote.restaurant_id = restaurantId;
      existingVote.timestamp = new Date();
    } else {
      // Add new vote
      lobby.votes.push({
        user_id: userId,
        restaurant_id: restaurantId,
        timestamp: new Date(),
      });
    }

    await lobby.save();

    // Check if all participants have voted
    const participantCount = lobby.participants.length;
    const votedUserIds = new Set(lobby.votes.map(v => v.user_id.toString()));
    const allVoted = lobby.participants.every(p => 
      votedUserIds.has(p.user_id.toString())
    );

    // If all voted, calculate winner and complete
    let winner = null;
    if (allVoted) {
      // Count votes
      const voteCounts = {};
      lobby.votes.forEach(vote => {
        voteCounts[vote.restaurant_id] = (voteCounts[vote.restaurant_id] || 0) + 1;
      });

      // Find winner (highest vote count)
      const sortedRestaurants = Object.entries(voteCounts)
        .sort(([, a], [, b]) => b - a);
      
      if (sortedRestaurants.length > 0) {
        winner = sortedRestaurants[0][0];
        lobby.winningRestaurant = winner;
        lobby.status = 'completed';
        await lobby.save();
      }
    }

    res.json({
      success: true,
      message: 'Vote recorded',
      allVoted,
      winner,
      lobbyStatus: lobby.status,
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
 * Get final results
 */
exports.getResults = async (req, res, next) => {
  try {
    const { lobbyId } = req.params;

    const lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      return res.status(404).json({
        error: { message: 'Lobby not found' },
      });
    }

    // Check if lobby is completed
    if (lobby.status !== 'completed') {
      return res.status(400).json({
        error: { message: 'Voting is not yet complete' },
      });
    }

    // Get winning restaurant details
    const mongoose = require('mongoose');
    let winningRestaurant = null;
    if (lobby.winningRestaurant && mongoose.Types.ObjectId.isValid(lobby.winningRestaurant)) {
      winningRestaurant = await Restaurant.findById(lobby.winningRestaurant);
    }

    // Get vote counts
    const voteCounts = {};
    (lobby.votes || []).forEach(vote => {
      voteCounts[vote.restaurant_id] = (voteCounts[vote.restaurant_id] || 0) + 1;
    });

    res.json({
      status: lobby.status,
      winner: winningRestaurant ? {
        id: winningRestaurant._id.toString(),
        name: winningRestaurant.name,
        cuisine: winningRestaurant.cuisine,
        description: winningRestaurant.description,
        image: winningRestaurant.image || '/placeholder-restaurant.jpg',
        price_range: winningRestaurant.price_range,
        location: winningRestaurant.location,
        rating: winningRestaurant.rating,
        voteCount: voteCounts[winningRestaurant._id.toString()] || 0,
      } : null,
      totalVotes: lobby.votes?.length || 0,
      participantCount: lobby.participants.length,
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
 * Reset lobby for a new matching round (host only)
 */
exports.resetLobby = async (req, res, next) => {
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

    // Only host can reset the lobby
    if (lobby.host_id.toString() !== userId) {
      return res.status(403).json({
        error: { message: 'Only the host can reset the lobby' },
      });
    }

    // Only allow reset from 'completed' or 'waiting' status
    if (!['completed', 'waiting'].includes(lobby.status)) {
      return res.status(400).json({
        error: { message: 'Cannot reset lobby while matching or voting is in progress' },
      });
    }

    // Clear all matching/voting data
    lobby.swipes = [];
    lobby.matchingRestaurants = [];
    lobby.consensusRestaurants = [];
    lobby.votes = [];
    lobby.winningRestaurant = undefined;
    lobby.status = 'waiting';

    await lobby.save();

    res.json({
      success: true,
      message: 'Lobby reset successfully',
      lobby: {
        id: lobby._id,
        code: lobby.code,
        status: lobby.status,
        participants: lobby.participants,
      },
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
 * Leave a lobby
 */
exports.leaveLobby = async (req, res, next) => {
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

    // Check if user is a participant
    const participantIndex = lobby.participants.findIndex(
      p => p.user_id.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        error: { message: 'You are not a participant in this lobby' },
      });
    }

    const isHost = lobby.host_id.toString() === userId;
    
    // Remove the participant
    lobby.participants.splice(participantIndex, 1);

    // If no participants left, delete the lobby
    if (lobby.participants.length === 0) {
      await Lobby.findByIdAndDelete(lobbyId);
      return res.json({
        success: true,
        message: 'You left the lobby. Lobby was deleted as no participants remain.',
        lobbyDeleted: true,
      });
    }

    // If host left, transfer host to next participant
    if (isHost && lobby.participants.length > 0) {
      const newHost = lobby.participants[0];
      lobby.host_id = newHost.user_id;
      newHost.isHost = true;
    }

    // Remove user's swipes and votes from the session
    lobby.swipes = lobby.swipes.filter(s => s.user_id.toString() !== userId);
    lobby.votes = lobby.votes.filter(v => v.user_id.toString() !== userId);

    await lobby.save();

    res.json({
      success: true,
      message: isHost ? 'You left the lobby. Host transferred to another participant.' : 'You left the lobby.',
      lobbyDeleted: false,
      newHostId: isHost ? lobby.host_id.toString() : null,
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
