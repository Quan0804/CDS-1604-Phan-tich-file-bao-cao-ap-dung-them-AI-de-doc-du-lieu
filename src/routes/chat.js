const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat endpoint
router.post('/', chatController.chat);

// Get chat history
router.get('/history/:analysisId', chatController.getChatHistory);

module.exports = router;
