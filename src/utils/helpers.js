/**
 * Format number with thousands separator
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get file extension
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Check if file is supported
 */
function isSupportedFile(mimetype) {
  const supported = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  return supported.includes(mimetype);
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN');
}

module.exports = {
  formatNumber,
  getFileExtension,
  isSupportedFile,
  formatDate
};
