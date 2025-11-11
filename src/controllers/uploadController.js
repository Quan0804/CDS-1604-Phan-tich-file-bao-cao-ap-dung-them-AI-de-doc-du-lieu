const fileParser = require('../services/fileParser');
const chartGenerator = require('../services/chartGenerator');
const geminiService = require('../services/geminiService');
const db = require('../database/db');
const fs = require('fs');

exports.handleUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Upload Báo Cáo',
        error: 'Vui lòng chọn file để upload'
      });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    console.log(`📄 Đang xử lý file: ${fileName}`);

    // 1. Parse file to extract data
    const data = await fileParser.parseFile(filePath, fileType);
    
    if (!data || (Array.isArray(data) && data.length === 0) || (data.type === 'text' && !data.content)) {
      return res.status(400).render('upload', {
        title: 'Upload Báo Cáo',
        error: 'Không thể trích xuất dữ liệu từ file'
      });
    }

    // Check if this is a text document
    if (data.type === 'text') {
      console.log(`📝 Đây là văn bản: ${data.metadata.words} từ, ${data.metadata.paragraphs} đoạn`);
      
      // Analyze text content with Gemini
      console.log(`🤖 Phân tích văn bản với Gemini AI...`);
      const textAnalysis = await geminiService.analyzeTextDocument(data.content, data.metadata);
      console.log(`✅ Hoàn tất phân tích văn bản`);
      
      // Save to database
      const analysisId = db.saveAnalysis({
        fileName: fileName,
        filePath: filePath,
        fileSize: req.file.size,
        analysisType: 'text',
        textAnalysis: textAnalysis,
        charts: []
      });
      console.log(`💾 Đã lưu phân tích văn bản vào database với ID: ${analysisId}`);
      
      // Render text analysis view
      return res.render('text-analysis', {
        title: 'Phân Tích Văn Bản',
        fileName: fileName,
        metadata: data.metadata,
        sections: data.metadata.sections,
        analysis: textAnalysis,
        content: data.content,
        fileId: req.file.filename,
        analysisId: analysisId
      });
    }

    console.log(`✅ Đã trích xuất ${data.length} dòng dữ liệu`);

    // 2. BƯỚC 1: Gemini phân tích dữ liệu và đề xuất biểu đồ
    console.log(`🤖 Bước 1: Gemini phân tích dữ liệu và đề xuất biểu đồ...`);
    const dataAnalysis = await geminiService.analyzeDataAndSuggestCharts(data);
    console.log(`✅ Gemini đã phân tích và đề xuất ${dataAnalysis.suggestedCharts?.length || 0} loại biểu đồ`);

    // 3. BƯỚC 2: Tạo biểu đồ theo đề xuất của Gemini
    console.log(`📊 Bước 2: Tạo biểu đồ theo đề xuất của Gemini...`);
    const charts = await chartGenerator.generateChartsFromSuggestions(data, dataAnalysis.suggestedCharts);
    console.log(`✅ Đã tạo ${charts.length} biểu đồ`);

    // 4. BƯỚC 3: Gemini phân tích các biểu đồ đã tạo
    console.log(`🤖 Bước 3: Gemini phân tích các biểu đồ đã tạo...`);
    const chartAnalysis = await geminiService.analyzeCharts(data, charts, dataAnalysis);
    console.log(`✅ Hoàn tất phân tích toàn diện`);

    // 5. Save to database
    const analysisId = db.saveAnalysis({
      fileName: fileName,
      filePath: filePath,
      fileSize: req.file.size,
      analysisType: 'data',
      analysis: chartAnalysis,
      charts: charts
    });
    console.log(`💾 Đã lưu phân tích vào database với ID: ${analysisId}`);

    // 6. Render results
    res.render('analysis', {
      title: 'Kết Quả Phân Tích',
      fileName: fileName,
      data: data,
      charts: charts,
      dataAnalysis: dataAnalysis,
      analysis: chartAnalysis,
      fileId: req.file.filename,
      analysisId: analysisId
    });

  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};
