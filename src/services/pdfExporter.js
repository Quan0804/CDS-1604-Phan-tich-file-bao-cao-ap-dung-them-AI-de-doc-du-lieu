const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');

class PDFExporter {
  async exportToPDF(data) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Render HTML từ template
      const html = await this.renderHTML(data);
      
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Tạo PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error('❌ Lỗi export PDF:', error);
      throw error;
    }
  }

  async renderHTML(data) {
    const template = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Phân Tích - <%= fileName %></title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
      background: #fff;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .container {
      padding: 0 30px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      color: #667eea;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    
    .section h3 {
      color: #764ba2;
      font-size: 16px;
      margin: 15px 0 10px 0;
    }
    
    .section p {
      text-align: justify;
      margin-bottom: 10px;
      line-height: 1.8;
    }
    
    .chart-container {
      margin: 20px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .chart-title {
      font-weight: bold;
      margin: 10px 0;
      color: #667eea;
    }
    
    .chart-description {
      font-size: 13px;
      color: #666;
      font-style: italic;
    }
    
    .footer {
      margin-top: 50px;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e0e0e0;
    }
    
    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    
    .info-box strong {
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 BÁO CÁO PHÂN TÍCH DỮ LIỆU</h1>
    <p>File: <%= fileName %> | Ngày tạo: <%= new Date().toLocaleDateString('vi-VN') %></p>
  </div>

  <div class="container">
    <!-- Thông tin file -->
    <div class="info-box">
      <strong>Tên file:</strong> <%= fileName %><br>
      <strong>Kích thước:</strong> <%= (fileSize / 1024).toFixed(2) %> KB<br>
      <strong>Số biểu đồ:</strong> <%= charts.length %><br>
      <strong>Thời gian phân tích:</strong> <%= new Date().toLocaleString('vi-VN') %>
    </div>

    <!-- Phân tích AI -->
    <div class="section">
      <h2>🤖 Phân Tích Từ Gemini AI</h2>
      
      <h3>📋 Tổng Quan</h3>
      <p><%= analysis.summary %></p>
      
      <h3>📈 Xu Hướng</h3>
      <p><%= analysis.trends %></p>
      
      <h3>💡 Insights</h3>
      <p><%= analysis.insights %></p>
      
      <h3>🎯 Khuyến Nghị</h3>
      <p><%= analysis.recommendations %></p>
    </div>

    <!-- Biểu đồ -->
    <% if (charts && charts.length > 0) { %>
      <div class="section">
        <h2>📊 Biểu Đồ Trực Quan</h2>
        
        <% charts.forEach((chart, index) => { %>
          <div class="chart-container">
            <div class="chart-title"><%= index + 1 %>. <%= chart.title %></div>
            <img src="<%= chart.image %>" alt="<%= chart.title %>">
            <div class="chart-description"><%= chart.description %></div>
          </div>
        <% }); %>
      </div>
    <% } %>

    <!-- Phân tích chi tiết -->
    <div class="section">
      <h2>📝 Phân Tích Chi Tiết</h2>
      <div style="white-space: pre-wrap; font-size: 13px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
<%= analysis.fullAnalysis %>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Báo cáo được tạo tự động bởi Report Analysis App với Gemini AI</p>
    <p>© 2025 - Phân tích thông minh, Quyết định chính xác</p>
  </div>
</body>
</html>
    `;

    return ejs.render(template, data);
  }
}

module.exports = new PDFExporter();
