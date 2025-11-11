const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Hiển thị trang lịch sử
router.get('/', historyController.showHistory);

// Xem chi tiết phân tích
router.get('/view/:id', historyController.viewAnalysis);

// Xóa phân tích
router.delete('/delete/:id', historyController.deleteAnalysis);

// Export PDF
router.get('/export/:id', historyController.exportPDF);

// API thống kê
router.get('/stats', historyController.getStats);

module.exports = router;
