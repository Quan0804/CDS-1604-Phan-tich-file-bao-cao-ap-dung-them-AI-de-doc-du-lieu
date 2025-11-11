const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// View analysis results
router.get('/:fileId', analysisController.viewAnalysis);

// Get chart data
router.get('/chart/:fileId', analysisController.getChartData);

module.exports = router;
