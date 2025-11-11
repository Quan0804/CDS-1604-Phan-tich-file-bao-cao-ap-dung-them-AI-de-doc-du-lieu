const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('upload', {
      title: 'Upload Báo Cáo',
      error: 'File quá lớn. Kích thước tối đa là 10MB.'
    });
  }

  if (err.message.includes('Loại file không được hỗ trợ')) {
    return res.status(400).render('upload', {
      title: 'Upload Báo Cáo',
      error: err.message
    });
  }

  // Default error
  res.status(err.status || 500).render('error', {
    title: 'Lỗi',
    message: err.message || 'Đã xảy ra lỗi không mong muốn',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = errorHandler;
