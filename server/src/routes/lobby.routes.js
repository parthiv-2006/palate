const express = require('express');
const router = express.Router();
const {
  createLobby,
  joinLobby,
  getLobby,
  startMatching,
  getRestaurants,
  recordSwipe,
  getVotingData,
  submitVote,
  getResults,
  resetLobby,
  leaveLobby,
} = require('../controllers/lobby.controller');
const authenticate = require('../middleware/auth.middleware');

// Lobby endpoints (authentication required)
router.post('/create', authenticate(true), createLobby);
router.post('/join', authenticate(true), joinLobby);
router.get('/:lobbyId', authenticate(true), getLobby);
router.post('/:lobbyId/start-matching', authenticate(true), startMatching);
router.get('/:lobbyId/restaurants', authenticate(true), getRestaurants);
router.post('/:lobbyId/swipe', authenticate(true), recordSwipe);

// Voting endpoints
router.get('/:lobbyId/voting', authenticate(true), getVotingData);
router.post('/:lobbyId/vote', authenticate(true), submitVote);
router.get('/:lobbyId/results', authenticate(true), getResults);

// Session management endpoints
router.post('/:lobbyId/reset', authenticate(true), resetLobby);
router.post('/:lobbyId/leave', authenticate(true), leaveLobby);

module.exports = router;
