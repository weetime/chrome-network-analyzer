/**
 * Stats Manager - Handles statistics calculation and display
 */

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
  if (window.TableManager && window.TableManager.applyFilters) {
    requests = window.TableManager.applyFilters();
  } else if (typeof applyFilters === 'function') {
    requests = applyFilters();
  } else {
    // Fallback: get all requests with valid time data
    const requestData = window.TableManager ? window.TableManager.getRequestData() : {};
    requests = Object.values(requestData).filter(req => req.totalTime);
  }
  
  // Clear container
  statsContainer.innerHTML = '';
  
  // If no data, show message
  if (requests.length === 0) {
    const noDataElement = document.createElement('div');
    noDataElement.className = 'stat-item';
    noDataElement.textContent = 'No requests data available';
    statsContainer.appendChild(noDataElement);
    return;
  }
  
  // Calculate statistics
  
  // Total requests
  const totalRequestsElement = document.createElement('div');
  totalRequestsElement.className = 'stat-item';
  totalRequestsElement.innerHTML = `
    <div class="stat-value">${requests.length}</div>
    <div class="stat-label">Total Requests</div>
  `;
  statsContainer.appendChild(totalRequestsElement);
  
  // Resources by type
  const resourceTypes = {};
  requests.forEach(req => {
    const type = req.type || 'other';
    resourceTypes[type] = (resourceTypes[type] || 0) + 1;
  });
  
  // Show top 3 resource types
  const topTypes = Object.entries(resourceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  topTypes.forEach(([type, count]) => {
    const typeElement = document.createElement('div');
    typeElement.className = 'stat-item';
    typeElement.innerHTML = `
      <div class="stat-value">${count}</div>
      <div class="stat-label">${type}</div>
    `;
    statsContainer.appendChild(typeElement);
  });
  
  // Total time
  const totalTime = requests.reduce((sum, req) => sum + (req.totalTime || 0), 0);
  const formattedTotalTime = formatTime(totalTime);
  
  const totalTimeElement = document.createElement('div');
  totalTimeElement.className = 'stat-item';
  totalTimeElement.innerHTML = `
    <div class="stat-value">${formattedTotalTime}</div>
    <div class="stat-label">Total Load Time</div>
  `;
  statsContainer.appendChild(totalTimeElement);
  
  // Percentiles
  const times = requests.map(req => req.totalTime).filter(time => time);
  
  // P50
  const p50 = calculatePercentile(times, 50);
  const p50Element = document.createElement('div');
  p50Element.className = 'stat-item';
  p50Element.innerHTML = `
    <div class="stat-value">${formatTime(p50)}</div>
    <div class="stat-label">P50 Response</div>
  `;
  statsContainer.appendChild(p50Element);
  
  // P95
  const p95 = calculatePercentile(times, 95);
  const p95Element = document.createElement('div');
  p95Element.className = 'stat-item';
  p95Element.innerHTML = `
    <div class="stat-value">${formatTime(p95)}</div>
    <div class="stat-label">P95 Response</div>
  `;
  statsContainer.appendChild(p95Element);
  
  // P99
  const p99 = calculatePercentile(times, 99);
  const p99Element = document.createElement('div');
  p99Element.className = 'stat-item';
  p99Element.innerHTML = `
    <div class="stat-value">${formatTime(p99)}</div>
    <div class="stat-label">P99 Response</div>
  `;
  statsContainer.appendChild(p99Element);
  
  // Status codes
  const statusGroups = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    'Error': 0
  };
  
  requests.forEach(req => {
    if (req.error) {
      statusGroups['Error']++;
    } else if (req.status) {
      const group = Math.floor(req.status / 100);
      if (group >= 2 && group <= 5) {
        statusGroups[`${group}xx`]++;
      }
    }
  });
  
  // Only show non-zero status groups
  Object.entries(statusGroups).forEach(([group, count]) => {
    if (count > 0) {
      const statusElement = document.createElement('div');
      statusElement.className = 'stat-item';
      statusElement.innerHTML = `
        <div class="stat-value">${count}</div>
        <div class="stat-label">${group} Responses</div>
      `;
      statsContainer.appendChild(statusElement);
    }
  });
}

/**
 * Format time in milliseconds to a readable format
 */
function formatTime(time) {
  // Use TableManager's formatting if available
  if (window.TableManager && window.TableManager.formatTime) {
    return window.TableManager.formatTime(time);
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

// Make functions available globally
(function(global) {
  global.StatsManager = {
    updateStatistics,
    calculatePercentile
  };
})(typeof window !== 'undefined' ? window : self);