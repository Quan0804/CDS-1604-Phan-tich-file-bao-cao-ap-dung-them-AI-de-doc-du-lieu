const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept both configured MIME types and common variations
  const allowedTypes = [
    ...config.allowedFileTypes,
    'application/octet-stream', // Sometimes PPT/PPTX may be detected as this
  ];
  
  // Also check file extension as fallback
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.xlsx', '.xls', '.docx', '.doc', '.pptx', '.ppt', '.pdf'];
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    console.log(`❌ Rejected file: ${file.originalname} (MIME: ${file.mimetype})`);
    cb(new Error('Loại file không được hỗ trợ. Chỉ chấp nhận Excel, Word, PowerPoint, PDF.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize
  },
  fileFilter: fileFilter
});

const uploadMiddleware = upload.single('reportFile');

module.exports = { uploadMiddleware };
