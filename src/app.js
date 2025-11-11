const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', routes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  const url = `http://localhost:${config.port}`;
  console.log(`🚀 Server đang chạy tại ${url}`);
  console.log(`📊 Ứng dụng phân tích báo cáo đã sẵn sàng!`);
  console.log(`🌐 Đang mở trình duyệt...`);
  
  // Automatically open browser
  const command = process.platform === 'win32' 
    ? `start ${url}` 
    : process.platform === 'darwin' 
    ? `open ${url}` 
    : `xdg-open ${url}`;
  
  exec(command, (error) => {
    if (error) {
      console.log(`⚠️  Không thể tự động mở trình duyệt. Vui lòng truy cập: ${url}`);
    }
  });
});

module.exports = app;
