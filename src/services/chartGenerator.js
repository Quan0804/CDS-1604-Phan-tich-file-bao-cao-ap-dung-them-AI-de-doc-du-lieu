const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs').promises;
const path = require('path');

class ChartGenerator {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ 
      width: this.width, 
      height: this.height,
      backgroundColour: 'white'
    });
  }

  // Helper: Get smart labels from data
  getLabels(data, labelKey) {
    return data.map((row, idx) => {
      const label = row[labelKey];
      if (label !== undefined && label !== null && label !== '') {
        return label.toString().substring(0, 50);
      }
      // Try to find any string column
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && value.trim()) {
          return value.substring(0, 50);
        }
      }
      return `Item ${idx + 1}`;
    });
  }

  // Helper: Get values with validation
  getValues(data, valueKey) {
    return data.map(row => {
      const val = row[valueKey];
      return typeof val === 'number' && !isNaN(val) ? val : 0;
    });
  }

  // Helper: Check if data is valid
  validateData(values) {
    return values.some(v => v > 0);
  }

  // Generate charts based on Gemini suggestions
  async generateChartsFromSuggestions(data, suggestions) {
    if (!suggestions || suggestions.length === 0) {
      console.log('⚠️  Không có đề xuất biểu đồ, tạo biểu đồ mặc định');
      return this.generateCharts(data);
    }

    const charts = [];
    const keys = Object.keys(data[0]);
    const labelColumn = keys.find(key => typeof data[0][key] === 'string') || keys[0];

    // Sort suggestions by priority
    const sortedSuggestions = [...suggestions].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const suggestion of sortedSuggestions) {
      try {
        const { type, columns } = suggestion;
        const valueColumn = columns[1] || columns[0];

        switch(type) {
          case 'bar':
            charts.push(await this.generateBarChart(data, labelColumn, valueColumn));
            break;
          case 'horizontalBar':
            charts.push(await this.generateHorizontalBarChart(data, labelColumn, valueColumn));
            break;
          case 'line':
            charts.push(await this.generateLineChart(data, labelColumn, valueColumn));
            break;
          case 'area':
            charts.push(await this.generateAreaChart(data, labelColumn, valueColumn));
            break;
          case 'pie':
            if (data.length <= 10) {
              charts.push(await this.generatePieChart(data, labelColumn, valueColumn));
            }
            break;
          case 'doughnut':
            if (data.length <= 8) {
              charts.push(await this.generateDoughnutChart(data, labelColumn, valueColumn));
            }
            break;
          case 'multiColumn':
            const numericCols = keys.filter(k => typeof data[0][k] === 'number');
            if (numericCols.length > 1) {
              charts.push(await this.generateMultiColumnChart(data, labelColumn, numericCols));
            }
            break;
          case 'stacked':
            const numCols = keys.filter(k => typeof data[0][k] === 'number');
            if (numCols.length > 1) {
              charts.push(await this.generateStackedBarChart(data, labelColumn, numCols));
            }
            break;
        }
      } catch (error) {
        console.error(`Lỗi tạo biểu đồ ${suggestion.type}:`, error.message);
      }
    }

    // Filter out charts with no data
    const validCharts = charts.filter(chart => chart && chart.hasData !== false);
    
    if (validCharts.length < charts.length) {
      console.log(`⚠️  Loại bỏ ${charts.length - validCharts.length} biểu đồ không có dữ liệu`);
    }

    console.log(`✅ Đã tạo ${validCharts.length} biểu đồ hợp lệ theo đề xuất của Gemini`);
    return validCharts;
  }

  async generateCharts(data) {
    if (!data || data.length === 0) return [];

    const charts = [];
    const keys = Object.keys(data[0]);
    
    // Find numeric columns
    const numericColumns = keys.filter(key => 
      typeof data[0][key] === 'number'
    );

    const labelColumn = keys.find(key => 
      typeof data[0][key] === 'string'
    ) || keys[0];

    if (numericColumns.length === 0) {
      console.log('No numeric data found for charts');
      return charts;
    }

    console.log(`📊 Tạo biểu đồ cho ${numericColumns.length} cột số liệu...`);

    // Generate comprehensive charts for each numeric column
    for (const numCol of numericColumns) {
      // 1. Bar Chart (Vertical)
      const barChart = await this.generateBarChart(data, labelColumn, numCol);
      charts.push(barChart);

      // 2. Horizontal Bar Chart
      const horizontalBarChart = await this.generateHorizontalBarChart(data, labelColumn, numCol);
      charts.push(horizontalBarChart);

      // 3. Line Chart with trend
      if (data.length > 1) {
        const lineChart = await this.generateLineChart(data, labelColumn, numCol);
        charts.push(lineChart);
      }

      // 4. Area Chart
      if (data.length > 2) {
        const areaChart = await this.generateAreaChart(data, labelColumn, numCol);
        charts.push(areaChart);
      }

      // 5. Pie Chart (for reasonable data size)
      if (data.length <= 10 && data.length > 1) {
        const pieChart = await this.generatePieChart(data, labelColumn, numCol);
        charts.push(pieChart);
      }

      // 6. Doughnut Chart
      if (data.length <= 8 && data.length > 1) {
        const doughnutChart = await this.generateDoughnutChart(data, labelColumn, numCol);
        charts.push(doughnutChart);
      }
    }

    // 7. Multi-column comparison (if multiple numeric columns)
    if (numericColumns.length > 1) {
      const comparisonChart = await this.generateMultiColumnChart(data, labelColumn, numericColumns);
      charts.push(comparisonChart);
    }

    // 8. Stacked bar chart (if multiple numeric columns)
    if (numericColumns.length > 1 && data.length <= 15) {
      const stackedChart = await this.generateStackedBarChart(data, labelColumn, numericColumns);
      charts.push(stackedChart);
    }

    console.log(`✅ Đã tạo ${charts.length} biểu đồ chi tiết`);
    return charts;
  }

  async generateBarChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);
    
    if (!hasData) {
      console.log(`⚠️  Cột ${valueKey} không có dữ liệu hợp lệ`);
    }

    const configuration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: valueKey,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ cột: ${valueKey}`,
            font: { size: 18 }
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString('vi-VN');
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'bar',
      title: `Biểu đồ cột: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `Biểu đồ cột thể hiện ${valueKey} theo ${labelKey}`,
      hasData: hasData
    };
  }

  async generateLineChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);

    const configuration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: valueKey,
          data: values,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ đường: ${valueKey}`,
            font: { size: 18 }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'line',
      title: `Biểu đồ đường: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `Biểu đồ đường thể hiện xu hướng ${valueKey}`,
      hasData: hasData
    };
  }

  async generateHorizontalBarChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);

    const colors = this.generateColors(values.length);

    const configuration = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ tròn: ${valueKey}`,
            font: { size: 18 }
          },
          legend: {
            position: 'right'
          }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'pie',
      title: `Biểu đồ tròn: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `Biểu đồ tròn thể hiện tỷ lệ ${valueKey}`,
      hasData: hasData
    };
  }

  async generateDoughnutChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);

    const configuration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: valueKey,
          data: values,
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ thanh ngang: ${valueKey}`,
            font: { size: 18 }
          },
          legend: { display: true }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'horizontalBar',
      title: `Biểu đồ thanh ngang: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `So sánh ${valueKey} theo chiều ngang, dễ đọc với nhiều mục`,
      hasData: hasData
    };
  }

  async generateAreaChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);

    const configuration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: valueKey,
          data: values,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.3)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ vùng: ${valueKey}`,
            font: { size: 18 }
          },
          legend: { display: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'area',
      title: `Biểu đồ vùng: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `Hiển thị xu hướng và khối lượng ${valueKey} theo thời gian`,
      hasData: hasData
    };
  }

  async generatePieChart(data, labelKey, valueKey) {
    const labels = this.getLabels(data, labelKey);
    const values = this.getValues(data, valueKey);
    const hasData = this.validateData(values);
    const colors = this.generateColors(values.length);

    const configuration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Biểu đồ vành khuyên: ${valueKey}`,
            font: { size: 18 }
          },
          legend: { position: 'right' }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    return {
      type: 'doughnut',
      title: `Biểu đồ vành khuyên: ${valueKey}`,
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, values },
      description: `Tỷ lệ phần trăm ${valueKey} với thiết kế hiện đại`,
      hasData: hasData
    };
  }

  async generateMultiColumnChart(data, labelColumn, numericColumns) {
    const labels = this.getLabels(data, labelColumn);
    const datasets = numericColumns.map((col, idx) => {
      const colors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(153, 102, 255, 0.7)'
      ];
      
      return {
        label: col,
        data: data.map(row => row[col] || 0),
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.7', '1'),
        borderWidth: 1
      };
    });

    const configuration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'So sánh đa chỉ số',
            font: { size: 18 }
          },
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    const hasData = datasets.some(ds => ds.data.some(v => v > 0));
    
    return {
      type: 'multiColumn',
      title: 'Biểu đồ so sánh đa chỉ số',
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, datasets },
      description: `So sánh ${numericColumns.join(', ')} cùng một lúc`,
      hasData: hasData
    };
  }

  async generateStackedBarChart(data, labelColumn, numericColumns) {
    const labels = this.getLabels(data, labelColumn);
    const datasets = numericColumns.map((col, idx) => {
      const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ];
      
      return {
        label: col,
        data: data.map(row => row[col] || 0),
        backgroundColor: colors[idx % colors.length],
        borderWidth: 0
      };
    });

    const configuration = {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Biểu đồ cột xếp chồng',
            font: { size: 18 }
          },
          legend: { display: true, position: 'top' }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    };

    const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
    const base64Image = image.toString('base64');

    const hasData = datasets.some(ds => ds.data.some(v => v > 0));

    return {
      type: 'stacked',
      title: 'Biểu đồ cột xếp chồng',
      image: `data:image/png;base64,${base64Image}`,
      data: { labels, datasets },
      description: `Hiển thị tổng hợp và tỷ lệ của ${numericColumns.join(', ')}`,
      hasData: hasData
    };
  }

  generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 360 / count) % 360;
      colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    return colors;
  }
}

module.exports = new ChartGenerator();
