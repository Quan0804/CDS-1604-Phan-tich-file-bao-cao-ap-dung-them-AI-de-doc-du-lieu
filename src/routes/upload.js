const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadMiddleware } = require('../middleware/fileUpload');

// Upload page
router.get('/', (req, res) => {
  res.render('upload', { 
    title: 'Upload Báo Cáo',
    error: null 
  });
});

// Handle file upload
router.post('/', uploadMiddleware, uploadController.handleUpload);

module.exports = router;
