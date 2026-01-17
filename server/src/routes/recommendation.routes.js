const express = require('express');
const router = express.Router();
const controller = require('../controllers/recommendation.controller');

router.post('/', controller.createRecommendation);
router.post('/:id/rate', controller.rateRecommendation);
router.post('/:id/match', controller.matchRecommendation);

module.exports = router;
