<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>
<h2 align="center">
   PHÂN TÍCH FILE BÁO CÁO ÁP DỤNG THÊM AI ĐỂ ĐỌC DỮ LIỆU
</h2>
<div align="center">
    <p align="center">
        <img src="docs/aiotlab_logo.png" alt="AIoTLab Logo" width="170"/>
        <img src="docs/fitdnu_logo.png" alt="FIT DNU Logo" width="180"/>
        <img src="docs/dnu_logo.png" alt="DaiNam University Logo" width="200"/>
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)

</div>

---

## 1. Giới thiệu
**Report Analysis App** là một ứng dụng phân tích báo cáo, hỗ trợ người dùng xử lý và phân tích dữ liệu từ các tệp báo cáo như PDF, Word, và Excel. Ứng dụng sử dụng **Node.js** và tích hợp **Google Gemini AI** để cung cấp các tính năng phân tích nâng cao.

Hệ thống bao gồm:

- **Frontend**:  
  - Giao diện người dùng được xây dựng bằng **JS** và **CSS**.  
  - Cho phép tải lên tệp và hiển thị kết quả phân tích.  

- **Backend**:  
  - Xử lý tệp tải lên, phân tích dữ liệu bằng **Google Gemini AI**.  
  - Quản lý lịch sử phân tích và xuất báo cáo.  

Ứng dụng không chỉ giúp tự động hóa quy trình phân tích mà còn cung cấp các biểu đồ trực quan và báo cáo chi tiết.

### 1.1. Các tính năng chính
- Tải lên và phân tích tệp PDF, Word, Excel.  
- Tích hợp AI để phân tích nội dung văn bản.  
- Tạo biểu đồ từ dữ liệu.  
- Xuất báo cáo dưới dạng PDF.  
- Lưu trữ lịch sử phân tích.  

---

## 2. Các công nghệ được sử dụng
<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/) [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/) [![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/) [![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google/) [![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/) [![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)](https://pptr.dev/)

</div>

---

## 3. Một số hình ảnh hệ thống

<div align="center">
  <img src="docs/upload_example.png" width="400" height="400"/>
  <p><b>Form tải lên tệp</b></p>
</div>

<br>

<div align="center">
  <img src="docs/analysis_result.png" width="600" height="600"/>
  <p><b>Kết quả phân tích</b></p>
</div>

<br>

<div align="center">
  <img src="docs/chart_example.png" width="400" height="400"/>
  <p><b>Biểu đồ phân tích</b></p>
</div>

<br>

---

## 4. Các bước cài đặt

### 4.1. Yêu cầu
- Node.js 18+  
- SQLite  
- Git  
- Hệ điều hành: Windows, Linux, macOS  

### 4.2. Clone project
```bash
git clone https://github.com/YourUsername/Report-Analysis-App.git
```

### 4.3. Cài đặt dependencies
```bash
cd Report-Analysis-App
npm install
```

### 4.4. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc và thêm các biến môi trường sau:
```
PORT=3000
DATABASE_URL=./data/database.db
GEMINI_API_KEY=your_gemini_api_key
```

### 4.5. Chạy ứng dụng
```bash
npm start
```

Truy cập ứng dụng tại [http://localhost:3000](http://localhost:3000).

---

## 5. Liên hệ với tôi
📧 Email: vuquan0804@gmail.com
📞 Phone: 0364973088
🌐 Facebook: [Your Profile](https://www.facebook.com/vuquan.844/)

