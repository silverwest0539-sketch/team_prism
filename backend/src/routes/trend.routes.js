const express = require('express');
const router = express.Router();
const trendController = require('../controllers/trend.controller');

router.get('/trends/rising', trendController.getRisingTrends);
router.get('/trends/platform', trendController.getPlatformTrends);
router.get('/trends', trendController.getAllTrends);
router.get('/analysis', trendController.getAnalysis);

module.exports = router;