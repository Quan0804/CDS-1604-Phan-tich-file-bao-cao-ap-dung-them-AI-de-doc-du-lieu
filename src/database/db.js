const Database = require('better-sqlite3');
const path = require('path');

class AnalysisDatabase {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/analysis_history.db');
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    // Bảng lưu lịch sử phân tích
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        analysis_type TEXT DEFAULT 'data',
        analysis_summary TEXT,
        analysis_trends TEXT,
        analysis_insights TEXT,
        analysis_recommendations TEXT,
        full_analysis TEXT,
        charts_count INTEGER DEFAULT 0,
        text_analysis TEXT
      )
    `);

    // Bảng lưu biểu đồ
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS charts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER NOT NULL,
        chart_type TEXT NOT NULL,
        chart_title TEXT,
        chart_image TEXT,
        chart_description TEXT,
        FOREIGN KEY (analysis_id) REFERENCES analysis_history(id) ON DELETE CASCADE
      )
    `);

    // Bảng lưu chat history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analysis_history(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database initialized');
  }

  // Lưu phân tích mới
  saveAnalysis(data) {
    const stmt = this.db.prepare(`
      INSERT INTO analysis_history 
      (file_name, file_path, file_size, analysis_type, analysis_summary, analysis_trends, 
       analysis_insights, analysis_recommendations, full_analysis, charts_count, text_analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.fileName,
      data.filePath,
      data.fileSize,
      data.analysisType || 'data',
      data.analysis?.summary || '',
      data.analysis?.trends || '',
      data.analysis?.insights || '',
      data.analysis?.recommendations || '',
      data.analysis?.fullAnalysis || '',
      data.charts?.length || 0,
      data.textAnalysis ? JSON.stringify(data.textAnalysis) : null
    );

    // Lưu biểu đồ
    if (data.charts && data.charts.length > 0) {
      const chartStmt = this.db.prepare(`
        INSERT INTO charts (analysis_id, chart_type, chart_title, chart_image, chart_description)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertMany = this.db.transaction((charts) => {
        for (const chart of charts) {
          chartStmt.run(
            info.lastInsertRowid,
            chart.type,
            chart.title,
            chart.image,
            chart.description
          );
        }
      });

      insertMany(data.charts);
    }

    return info.lastInsertRowid;
  }

  // Lấy tất cả lịch sử
  getAllHistory() {
    return this.db.prepare(`
      SELECT id, file_name, file_size, upload_date, charts_count, analysis_type,
             substr(COALESCE(analysis_summary, text_analysis, ''), 1, 200) as summary_preview
      FROM analysis_history
      ORDER BY upload_date DESC
    `).all();
  }

  // Lấy chi tiết phân tích
  getAnalysisById(id) {
    const analysis = this.db.prepare(`
      SELECT * FROM analysis_history WHERE id = ?
    `).get(id);

    if (analysis) {
      analysis.charts = this.db.prepare(`
        SELECT * FROM charts WHERE analysis_id = ?
      `).all(id);

      analysis.chatHistory = this.db.prepare(`
        SELECT * FROM chat_history WHERE analysis_id = ? ORDER BY created_at DESC
      `).all(id);
    }

    return analysis;
  }

  // Lưu chat
  saveChatMessage(analysisId, message, response) {
    return this.db.prepare(`
      INSERT INTO chat_history (analysis_id, message, response)
      VALUES (?, ?, ?)
    `).run(analysisId, message, response);
  }

  // Xóa phân tích
  deleteAnalysis(id) {
    return this.db.prepare('DELETE FROM analysis_history WHERE id = ?').run(id);
  }

  // Thống kê
  getStats() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_analyses,
        SUM(charts_count) as total_charts,
        AVG(file_size) as avg_file_size,
        MAX(upload_date) as last_analysis_date
      FROM analysis_history
    `).get();

    return stats;
  }
}

module.exports = new AnalysisDatabase();
