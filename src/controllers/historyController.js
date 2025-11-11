const db = require('../database/db');
const path = require('path');

class HistoryController {
  // Hiển thị trang lịch sử
  async showHistory(req, res) {
    try {
      const history = db.getAllHistory();
      const stats = db.getStats();

      res.render('history', {
        title: 'Lịch Sử Phân Tích',
        history: history,
        stats: stats
      });
    } catch (error) {
      console.error('❌ Lỗi hiển thị lịch sử:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        error: error.message
      });
    }
  }

  // Xem chi tiết phân tích từ lịch sử
  async viewAnalysis(req, res) {
    try {
      const { id } = req.params;
      const analysis = db.getAnalysisById(id);

      if (!analysis) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          error: 'Không tìm thấy phân tích này'
        });
      }

      // Check if this is text analysis
      if (analysis.analysis_type === 'text' && analysis.text_analysis) {
        const textAnalysis = JSON.parse(analysis.text_analysis);
        
        return res.render('text-analysis', {
          title: 'Chi Tiết Phân Tích Văn Bản',
          fileName: analysis.file_name,
          metadata: {
            words: 0,
            paragraphs: 0,
            characters: 0,
            sections: textAnalysis.themes || []
          },
          sections: textAnalysis.themes || [],
          analysis: textAnalysis,
          content: '',
          fileId: '',
          analysisId: id,
          fromHistory: true
        });
      }

      // Render lại trang analysis với dữ liệu từ database (data analysis)
      res.render('analysis', {
        title: 'Chi Tiết Phân Tích',
        fileName: analysis.file_name,
        fileSize: analysis.file_size,
        analysis: {
          summary: analysis.analysis_summary,
          trends: analysis.analysis_trends,
          insights: analysis.analysis_insights,
          recommendations: analysis.analysis_recommendations,
          fullAnalysis: analysis.full_analysis
        },
        charts: analysis.charts || [],
        data: [],
        analysisId: id,
        fromHistory: true
      });
    } catch (error) {
      console.error('❌ Lỗi xem phân tích:', error);
      res.status(500).render('error', {
        title: 'Lỗi',
        error: error.message
      });
    }
  }

  // Xóa phân tích
  async deleteAnalysis(req, res) {
    try {
      const { id } = req.params;
      db.deleteAnalysis(id);

      res.json({
        success: true,
        message: 'Đã xóa phân tích'
      });
    } catch (error) {
      console.error('❌ Lỗi xóa phân tích:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Export PDF
  async exportPDF(req, res) {
    try {
      const { id } = req.params;
      const analysis = db.getAnalysisById(id);

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy phân tích'
        });
      }

      const pdfExporter = require('../services/pdfExporter');
      
      const pdfBuffer = await pdfExporter.exportToPDF({
        fileName: analysis.file_name,
        fileSize: analysis.file_size,
        analysis: {
          summary: analysis.analysis_summary,
          trends: analysis.analysis_trends,
          insights: analysis.analysis_insights,
          recommendations: analysis.analysis_recommendations,
          fullAnalysis: analysis.full_analysis
        },
        charts: analysis.charts || []
      });

      // Gửi file PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${id}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('❌ Lỗi export PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi export PDF: ' + error.message
      });
    }
  }

  // API lấy thống kê
  async getStats(req, res) {
    try {
      const stats = db.getStats();
      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new HistoryController();
