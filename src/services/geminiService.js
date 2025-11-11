const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

class GeminiService {
  constructor() {
    if (!config.geminiApiKey) {
      console.warn('⚠️  GEMINI_API_KEY chưa được cấu hình. Phân tích AI sẽ không khả dụng.');
      this.genAI = null;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = null;
      this.initializeModel();
    }
  }

  async initializeModel() {
    // Use gemini-2.5-flash (latest available model)
    try {
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      console.log(`✅ Đã khởi tạo Gemini AI model: gemini-2.5-flash`);
    } catch (error) {
      console.error('❌ Lỗi khởi tạo Gemini model:', error.message);
      this.model = null;
      this.genAI = null;
    }
  }

  // BƯỚC 1: Phân tích dữ liệu ban đầu và đề xuất biểu đồ
  async analyzeDataAndSuggestCharts(data) {
    if (!this.genAI || !this.model) {
      console.log('⚠️  Gemini API không khả dụng');
      return this.getFallbackChartSuggestions(data);
    }

    try {
      const dataSummary = this.prepareDataSummary(data);
      
      const prompt = `
Bạn là chuyên gia Data Visualization. Phân tích dữ liệu và đề xuất biểu đồ phù hợp:

DỮ LIỆU:
${dataSummary}

Hãy:
1. Phân tích cấu trúc và đặc điểm dữ liệu
2. Đề xuất 5-8 loại biểu đồ phù hợp nhất để thể hiện dữ liệu này
3. Giải thích vì sao mỗi biểu đồ phù hợp

Format trả về JSON:
{
  "dataInsights": "Phân tích sơ bộ về dữ liệu",
  "suggestedCharts": [
    {
      "type": "bar|line|pie|area|doughnut|horizontalBar|stacked|multiColumn",
      "columns": ["tên_cột_1", "tên_cột_2"],
      "reason": "Lý do chọn biểu đồ này",
      "priority": 1-10
    }
  ]
}

Chỉ trả về JSON, không thêm text khác.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }
      
      return this.getFallbackChartSuggestions(data);
    } catch (error) {
      console.error('Gemini chart suggestion error:', error);
      return this.getFallbackChartSuggestions(data);
    }
  }

  // BƯỚC 2: Phân tích các biểu đồ đã tạo
  async analyzeCharts(data, charts, dataAnalysis) {
    if (!this.genAI || !this.model) {
      console.log('⚠️  Gemini API không khả dụng, sử dụng phân tích fallback');
      return this.getFallbackAnalysis(data, charts);
    }

    try {
      // Prepare data summary for Gemini
      const dataSummary = this.prepareDataSummary(data);
      const chartsSummary = this.prepareChartsSummary(charts);

      const dataInsights = dataAnalysis?.dataInsights || 'Phân tích ban đầu không có sẵn';
      
      const prompt = `
Bạn là một chuyên gia phân tích dữ liệu kinh doanh với 10 năm kinh nghiệm. 

PHÂN TÍCH BAN ĐẦU VỀ DỮ LIỆU:
${dataInsights}

📊 DỮ LIỆU CHI TIẾT:
${dataSummary}

📈 CÁC BIỂU ĐỒ ĐÃ TẠO (${charts.length} biểu đồ):
${chartsSummary}

QUAN TRỌNG: 
- Chỉ phân tích dựa trên DỮ LIỆU THỰC TẾ có trong biểu đồ
- KHÔNG đưa ra phân tích chi tiết nếu biểu đồ không có dữ liệu
- Nếu biểu đồ trống hoặc không có giá trị, hãy nói rõ và yêu cầu dữ liệu đầy đủ hơn
- Chỉ đưa ra insights và recommendations dựa trên những gì thực sự có trong data

Bây giờ hãy phân tích CHÍNH XÁC các biểu đồ đã tạo:

Hãy cung cấp phân tích chuyên nghiệp và chi tiết theo cấu trúc sau:

## 1. TỔNG QUAN DỮ LIỆU
- Mô tả tổng quan về dataset
- Phạm vi và quy mô dữ liệu
- Các chỉ số chính (trung bình, tổng, min, max)

## 2. PHÂN TÍCH XU HƯỚNG
- Xu hướng tăng/giảm theo thời gian hoặc theo danh mục
- Tốc độ tăng trưởng (nếu có)
- Chu kỳ và mùa vụ (nếu phát hiện)
- Dự đoán xu hướng tương lai

## 3. CÁC ĐIỂM NỔI BẬT
- Top 3 giá trị cao nhất và ý nghĩa
- Top 3 giá trị thấp nhất và nguyên nhân
- Các điểm bất thường (outliers)
- Sự chênh lệch và phân bố

## 4. PHÂN TÍCH SO SÁNH
- So sánh giữa các danh mục/nhóm
- Tỷ lệ phần trăm và tương quan
- Khoảng cách và độ lệch chuẩn

## 5. INSIGHTS & PHÁT HIỆN QUAN TRỌNG
- Ít nhất 5 phát hiện quan trọng từ dữ liệu
- Mối tương quan ẩn
- Cơ hội và rủi ro
- Điểm mạnh và điểm yếu

## 6. KHUYẾN NGHỊ HÀNH ĐỘNG
- Ít nhất 5 khuyến nghị cụ thể
- Ưu tiên hành động (quan trọng nhất trước)
- Lộ trình thực hiện ngắn hạn và dài hạn
- KPI cần theo dõi

## 7. KẾT LUẬN
- Tóm tắt các điểm chính
- Đánh giá tổng thể
- Hướng phát triển tiếp theo

Hãy viết chi tiết, cụ thể với con số rõ ràng. Sử dụng tiếng Việt chuyên nghiệp, dễ hiểu.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      return {
        summary: this.extractSummary(analysisText),
        trends: this.extractTrends(analysisText),
        insights: this.extractInsights(analysisText),
        recommendations: this.extractRecommendations(analysisText),
        fullAnalysis: analysisText
      };

    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackAnalysis(data, charts);
    }
  }

  prepareDataSummary(data) {
    if (!data || data.length === 0) return 'Không có dữ liệu';

    const summary = [];
    summary.push(`📊 Tổng số bản ghi: ${data.length}`);
    
    const keys = Object.keys(data[0]);
    summary.push(`📋 Số cột dữ liệu: ${keys.length}`);
    summary.push(`🏷️  Các cột: ${keys.join(', ')}`);

    // Calculate detailed statistics for numeric columns
    keys.forEach(key => {
      const values = data.map(row => row[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min;
        
        // Calculate median
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        // Calculate standard deviation
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        summary.push(`\n📈 Phân tích cột "${key}":`);
        summary.push(`  ✓ Tổng: ${sum.toFixed(2)}`);
        summary.push(`  ✓ Trung bình: ${avg.toFixed(2)}`);
        summary.push(`  ✓ Trung vị: ${median.toFixed(2)}`);
        summary.push(`  ✓ Cao nhất: ${max}`);
        summary.push(`  ✓ Thấp nhất: ${min}`);
        summary.push(`  ✓ Khoảng giá trị: ${range.toFixed(2)}`);
        summary.push(`  ✓ Độ lệch chuẩn: ${stdDev.toFixed(2)}`);
        summary.push(`  ✓ Hệ số biến thiên: ${((stdDev / avg) * 100).toFixed(2)}%`);
      }
    });

    // Add sample data for context
    summary.push(`\n📝 Mẫu dữ liệu (5 dòng đầu):`);
    data.slice(0, 5).forEach((row, idx) => {
      summary.push(`  ${idx + 1}. ${JSON.stringify(row)}`);
    });

    return summary.join('\n');
  }

  getFallbackChartSuggestions(data) {
    const keys = Object.keys(data[0] || {});
    const numericColumns = keys.filter(key => typeof data[0]?.[key] === 'number');
    const labelColumn = keys.find(key => typeof data[0]?.[key] === 'string') || keys[0];

    const suggestions = [];
    
    numericColumns.forEach((col, idx) => {
      suggestions.push(
        { type: 'bar', columns: [labelColumn, col], reason: 'So sánh giá trị', priority: 10 - idx },
        { type: 'line', columns: [labelColumn, col], reason: 'Xem xu hướng', priority: 9 - idx }
      );
    });

    if (data.length <= 10) {
      suggestions.push({ type: 'pie', columns: [labelColumn, numericColumns[0]], reason: 'Tỷ lệ phần trăm', priority: 8 });
    }

    return {
      dataInsights: `Dữ liệu có ${data.length} dòng với ${numericColumns.length} cột số`,
      suggestedCharts: suggestions.slice(0, 8)
    };
  }

  prepareChartsSummary(charts) {
    if (!charts || charts.length === 0) return 'Không có biểu đồ';

    return charts.map((chart, idx) => {
      return `${idx + 1}. ${chart.title}: ${chart.description}`;
    }).join('\n');
  }

  extractSummary(text) {
    const match = text.match(/1\.\s*Tổng quan[^:]*:?\s*([^\n]*(?:\n(?![\d]\.)[^\n]*)*)/i);
    return match ? match[1].trim() : 'Dữ liệu đã được phân tích thành công.';
  }

  extractTrends(text) {
    const match = text.match(/2\.\s*[^:]*xu hướng[^:]*:?\s*([^\n]*(?:\n(?![\d]\.)[^\n]*)*)/i);
    return match ? match[1].trim() : 'Đang phân tích xu hướng...';
  }

  extractInsights(text) {
    const match = text.match(/3\.\s*[^:]*điểm[^:]*:?\s*([^\n]*(?:\n(?![\d]\.)[^\n]*)*)/i);
    return match ? match[1].trim() : 'Có nhiều điểm đáng chú ý trong dữ liệu.';
  }

  extractRecommendations(text) {
    const match = text.match(/4\.\s*[^:]*(?:Insights|recommendations)[^:]*:?\s*([^\n]*(?:\n(?![\d]\.)[^\n]*)*)/i);
    return match ? match[1].trim() : 'Dựa trên phân tích, có một số khuyến nghị quan trọng.';
  }

  getFallbackAnalysis(data, charts) {
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    const numericColumns = keys.filter(key => typeof data[0]?.[key] === 'number');

    let summary = `Đã phân tích ${data.length} dòng dữ liệu với ${keys.length} cột.`;
    let trends = 'Dữ liệu cho thấy sự biến động qua các điểm đo.';
    let insights = 'Có một số giá trị nổi bật cần được chú ý.';
    let recommendations = 'Nên theo dõi thêm để đưa ra quyết định chính xác hơn.';

    if (numericColumns.length > 0) {
      const firstNumCol = numericColumns[0];
      const values = data.map(row => row[firstNumCol]).filter(v => typeof v === 'number');
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      summary = `Phân tích ${data.length} dòng dữ liệu. Cột "${firstNumCol}" có giá trị trung bình ${avg.toFixed(2)}.`;
      insights = `Giá trị cao nhất: ${max}, thấp nhất: ${min}, chênh lệch: ${(max - min).toFixed(2)}.`;
    }

    return {
      summary,
      trends,
      insights,
      recommendations,
      fullAnalysis: `${summary}\n\n${trends}\n\n${insights}\n\n${recommendations}`
    };
  }

  // Phân tích văn bản Word/PDF
  async analyzeTextDocument(content, metadata) {
    if (!this.genAI || !this.model) {
      console.log('⚠️  Gemini API không khả dụng');
      return this.getFallbackTextAnalysis(content, metadata);
    }

    try {
      // Limit content to avoid token limits
      const limitedContent = content.slice(0, 10000);
      const sectionsSummary = metadata.sections
        .map((s, i) => `${i + 1}. ${s.title} (${s.content.split(/\s+/).length} từ)`)
        .join('\n');

      const prompt = `
Bạn là chuyên gia phân tích văn bản. Hãy phân tích chi tiết văn bản sau:

THÔNG TIN VĂN BẢN:
- Tổng số từ: ${metadata.words}
- Tổng số đoạn: ${metadata.paragraphs}
- Số ký tự: ${metadata.characters}

CÁC PHẦN CHÍNH:
${sectionsSummary}

NỘI DUNG (${limitedContent.length} ký tự đầu):
"""
${limitedContent}
"""

Hãy phân tích theo cấu trúc JSON sau:
{
  "mainTopic": "Chủ đề chính của văn bản",
  "summary": "Tóm tắt nội dung chính (3-5 câu)",
  "keyPoints": [
    "Ý chính 1",
    "Ý chính 2",
    "Ý chính 3"
  ],
  "themes": [
    { "theme": "Chủ đề 1", "description": "Mô tả" },
    { "theme": "Chủ đề 2", "description": "Mô tả" }
  ],
  "structure": "Đánh giá về cấu trúc văn bản",
  "language": "Đánh giá về ngôn ngữ và phong cách viết",
  "audience": "Đối tượng hướng đến",
  "purpose": "Mục đích của văn bản",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Gợi ý cải thiện 1", "Gợi ý cải thiện 2"],
  "conclusions": "Kết luận tổng quan"
}

Chỉ trả về JSON, không thêm text khác.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }
      
      return this.getFallbackTextAnalysis(content, metadata);
    } catch (error) {
      console.error('Gemini text analysis error:', error);
      return this.getFallbackTextAnalysis(content, metadata);
    }
  }

  getFallbackTextAnalysis(content, metadata) {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    // Simple keyword extraction
    const wordFreq = {};
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^\w]/g, '');
      if (clean.length > 4) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });
    
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return {
      mainTopic: `Văn bản bao gồm ${metadata.sections.length} phần chính`,
      summary: `Tài liệu có ${metadata.words} từ, được chia thành ${metadata.paragraphs} đoạn văn. ${sentences.length} câu tổng cộng. Các từ khóa chính: ${topWords.join(', ')}.`,
      keyPoints: metadata.sections.slice(0, 5).map(s => s.title),
      themes: metadata.sections.slice(0, 3).map(s => ({
        theme: s.title,
        description: `Phần này bao gồm ${s.content.split(/\s+/).length} từ`
      })),
      structure: `Văn bản được cấu trúc thành ${metadata.sections.length} phần rõ ràng`,
      language: 'Ngôn ngữ trang trọng, phù hợp với văn bản công việc',
      audience: 'Người đọc chuyên nghiệp',
      purpose: 'Cung cấp thông tin và phân tích',
      strengths: ['Cấu trúc rõ ràng', 'Nội dung chi tiết'],
      improvements: ['Có thể tóm tắt ngắn gọn hơn', 'Thêm hình ảnh minh họa'],
      conclusions: `Đây là một văn bản ${metadata.words > 1000 ? 'dài' : 'ngắn gọn'} với nội dung được trình bày có hệ thống.`
    };
  }
}

module.exports = new GeminiService();
