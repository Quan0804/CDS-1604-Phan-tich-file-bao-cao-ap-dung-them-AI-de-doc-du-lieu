const express = require('express');
const router = express.Router();
const uploadRoutes = require('./upload');
const analysisRoutes = require('./analysis');
const chatRoutes = require('./chat');
const historyRoutes = require('./history');

// Home page
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Report Analysis App',
    message: 'Chào mừng đến với ứng dụng phân tích báo cáo' 
  });
});

// Upload routes
router.use('/upload', uploadRoutes);

// Analysis routes
router.use('/analysis', analysisRoutes);

// Chat routes
router.use('/chat', chatRoutes);

// History routes
router.use('/history', historyRoutes);

module.exports = router;
