/**
 * Stats Manager - Handles statistics calculation and display
 */

import { I18n } from './i18n.js';
import { TableManager } from './table-manager.js';

/**
 * Calculate a percentile value from an array of numbers
 */
function calculatePercentile(values, percentile) {
  if (!values || values.length === 0) return 0;
  
  // Sort values
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate index
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  
  // Return the value at that index
  return sortedValues[index] || 0;
}

/**
 * Update statistics display based on the current request data
 */
function updateStatistics() {
  const statsContainer = document.getElementById('statsContainer');
  
  if (!statsContainer) return;
  
  // Get the filtered requests
  let requests = [];
  
  // Use TableManager's filtered requests if available
  if (TableManager && TableManager.applyFilters) {
    requests = TableManager.applyFilters();
  } else if (typeof applyFilters === 'function') {
    requests = applyFilters();
  } else {
    // Fallback: get all requests with valid time data
    const requestData = TableManager ? TableManager.getRequestData() : {};
    requests = Object.values(requestData).filter(req => req.totalTime);
  }
  
  // Clear container
  statsContainer.innerHTML = '';
  
  // If no data, show message
  if (requests.length === 0) {
    const noDataElement = document.createElement('div');
    noDataElement.className = 'stat-item';
    noDataElement.innerHTML = `
      <div class="stat-value">-</div>
      <div class="stat-label" data-i18n="noData">No Data</div>
    `;
    statsContainer.appendChild(noDataElement);
    
    // 应用国际化
    if (I18n && I18n.updatePageText) {
      I18n.updatePageText();
    }
    return;
  }
  
  // 仅展示固定的5个指标
  const stats = [
    // 总请求数
    {
      value: requests.length,
      label: 'Total Requests',
      i18n: 'totalRequests'
    },
    // 最慢请求
    {
      value: formatTime(Math.max(...requests.map(req => req.totalTime || 0))),
      label: 'Slowest Request',
      i18n: 'slowestRequest',
      raw: false
    },
    // 平均响应时间
    {
      value: formatTime(requests.reduce((sum, req) => sum + (req.totalTime || 0), 0) / (requests.length || 1)),
      label: 'Avg Response',
      i18n: 'avgResponse',
      raw: false
    },
    // P50响应时间
    {
      value: formatTime(calculatePercentile(requests.map(req => req.totalTime).filter(time => time), 50)),
      label: 'P50 Response',
      i18n: 'p50Response',
      raw: false
    },
    // P95响应时间
    {
      value: formatTime(calculatePercentile(requests.map(req => req.totalTime).filter(time => time), 95)),
      label: 'P95 Response',
      i18n: 'p95Response',
      raw: false
    }
  ];
  
  // Create stat elements
  stats.forEach(stat => {
    const statElement = document.createElement('div');
    statElement.className = 'stat-item';
    
    // 使用I18n获取翻译，如果不存在则使用默认标签
    let label = stat.label;
    let hasI18n = false;
    
    if (I18n && I18n.getText && stat.i18n) {
      const translated = I18n.getText(stat.i18n);
      // 只有当翻译不等于键名时才使用翻译（避免未翻译的情况）
      if (translated && translated !== stat.i18n) {
        label = translated;
        hasI18n = true;
      }
    }
    
    statElement.innerHTML = `
      <div class="stat-value">${stat.raw === false ? stat.value : stat.value}</div>
      <div class="stat-label" ${hasI18n ? `data-i18n="${stat.i18n}"` : ''}>${label}</div>
    `;
    statsContainer.appendChild(statElement);
  });
  
  // 应用国际化
  if (I18n && I18n.updatePageText) {
    setTimeout(() => {
      I18n.updatePageText();
    }, 0);
  }
}

/**
 * Format time in milliseconds to a readable format
 */
function formatTime(time) {
  // Use TableManager's formatting if available
  if (TableManager && TableManager.formatTime) {
    return TableManager.formatTime(time);
  }
  
  if (time === undefined || time === null) return 'N/A';
  
  if (time < 1) {
    return '< 1ms';
  } else if (time < 1000) {
    return `${Math.round(time)}ms`;
  } else {
    return `${(time / 1000).toFixed(2)}s`;
  }
}

// Export StatsManager using ES6 export syntax
export const StatsManager = {
  init: function(options = {}) {
    // 初始化统计管理器，保存设置选项
    console.log('StatsManager initialized with options:', options);
    return Promise.resolve(); // 返回一个已解决的 Promise
  },
  updateStatistics,
  calculatePercentile
};