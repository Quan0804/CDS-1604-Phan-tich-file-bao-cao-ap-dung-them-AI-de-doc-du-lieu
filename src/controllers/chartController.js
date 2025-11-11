const chartGenerator = require('../services/chartGenerator');

exports.generateChart = async (req, res, next) => {
  try {
    const { data, chartType } = req.body;
    
    if (!data || !chartType) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu hoặc loại biểu đồ'
      });
    }

    const chart = await chartGenerator.generateChart(data, chartType);
    
    res.json({
      success: true,
      chart: chart
    });
  } catch (error) {
    next(error);
  }
};
