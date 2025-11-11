const geminiService = require('../services/geminiService');
const db = require('../database/db');

class ChatController {
  async chat(req, res) {
    try {
      const { message, data, analysisId } = req.body;

      if (!message || !data) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu message hoặc data'
        });
      }

      // Tạo prompt cho Gemini với context
      const prompt = `
Bạn là trợ lý phân tích dữ liệu thông minh. Người dùng đang xem một báo cáo với dữ liệu sau:

${JSON.stringify(data, null, 2)}

Câu hỏi của người dùng: "${message}"

Hãy trả lời câu hỏi một cách chi tiết, chính xác dựa trên dữ liệu đã cho. 
Nếu cần, hãy đề xuất tạo biểu đồ cụ thể (loại biểu đồ, cột dữ liệu).
Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.
`;

      const response = await geminiService.generateContent(prompt);

      // Lưu chat history nếu có analysisId
      if (analysisId) {
        db.saveChatMessage(analysisId, message, response);
      }

      res.json({
        success: true,
        response: response
      });

    } catch (error) {
      console.error('❌ Lỗi chat:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi xử lý chat',
        details: error.message
      });
    }
  }

  async getChatHistory(req, res) {
    try {
      const { analysisId } = req.params;

      const history = db.db.prepare(`
        SELECT * FROM chat_history 
        WHERE analysis_id = ? 
        ORDER BY created_at ASC
      `).all(analysisId);

      res.json({
        success: true,
        history: history
      });

    } catch (error) {
      console.error('❌ Lỗi lấy chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy lịch sử chat'
      });
    }
  }
}

module.exports = new ChatController();
