// Store all request data
let allRequestsData = {};

// DOM elements
const requestsTableBody = document.getElementById('requestsTableBody');
const requestDetails = document.getElementById('requestDetails');
const noDataMessage = document.getElementById('noDataMessage');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const statsContainer = document.getElementById('statsContainer');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeLabel.textContent = savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1);
  themeToggle.querySelector('.theme-toggle-icon').textContent = savedTheme === 'light' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  themeLabel.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
  themeToggle.querySelector('.theme-toggle-icon').textContent = newTheme === 'light' ? '☀️' : '🌙';
}

// Initialize theme
loadTheme();

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Get current tab and load request data
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab) {
      // Request data from background script
      chrome.runtime.sendMessage(
        { action: "getRequestData", tabId: currentTab.id },
        (response) => {
          if (response && response.requestData) {
            allRequestsData = response.requestData;
            renderRequestsTable();
            updateStatistics();
          }
        }
      );
    }
  } catch (error) {
    console.error("Error loading request data:", error);
  }
});

// Listen for new request data from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "requestCompleted" || message.action === "requestFailed") {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && message.tabId === currentTab.id) {
        // Update our data
        if (!allRequestsData[message.requestId]) {
          allRequestsData[message.requestId] = message.requestData;
          renderRequestsTable();
          updateStatistics();
        }
      }
    });
  }
});

// Calculate percentile value
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 'N/A';
  
  // Sort values in ascending order
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate the index for the percentile
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  
  // Return the value at the calculated index
  return sortedValues[index];
}

// Update statistics display
function updateStatistics() {
  // Get filter values
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const statusFilterValue = statusFilter.value;
  
  // Convert object to array for filtering
  const requestsArray = Object.values(allRequestsData);
  
  // Apply filters
  const filteredRequests = requestsArray.filter(request => {
    // Search filter
    if (searchTerm && !request.url.toLowerCase().includes(searchTerm)) {
      return false;
    }
    
    // Type filter
    if (typeFilterValue !== 'all' && request.type !== typeFilterValue) {
      return false;
    }
    
    // Status filter
    if (statusFilterValue !== 'all') {
      if (statusFilterValue === 'error' && !request.error) {
        return false;
      } else if (statusFilterValue === 'success' && !(request.status >= 200 && request.status < 300)) {
        return false;
      } else if (statusFilterValue === 'redirect' && !(request.status >= 300 && request.status < 400)) {
        return false;
      } else if (statusFilterValue === 'client-error' && !(request.status >= 400 && request.status < 500)) {
        return false;
      } else if (statusFilterValue === 'server-error' && !(request.status >= 500 && request.status < 600)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Get all valid request times from filtered requests
  const requestTimes = filteredRequests
    .filter(request => request.totalTime && !request.error)
    .map(request => request.totalTime);
  
  // Calculate statistics
  const p99 = calculatePercentile(requestTimes, 99);
  const p95 = calculatePercentile(requestTimes, 95);
  const p90 = calculatePercentile(requestTimes, 90);
  const p50 = calculatePercentile(requestTimes, 50);
  const avg = requestTimes.length > 0 
    ? Math.round(requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length) 
    : 'N/A';
  
  // Update the stats container
  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${p99 !== 'N/A' ? Math.round(p99) + ' ms' : 'N/A'}</div>
      <div class="stat-label">P99</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${p95 !== 'N/A' ? Math.round(p95) + ' ms' : 'N/A'}</div>
      <div class="stat-label">P95</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${p90 !== 'N/A' ? Math.round(p90) + ' ms' : 'N/A'}</div>
      <div class="stat-label">P90</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${p50 !== 'N/A' ? Math.round(p50) + ' ms' : 'N/A'}</div>
      <div class="stat-label">P50</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${avg !== 'N/A' ? avg + ' ms' : 'N/A'}</div>
      <div class="stat-label">Average</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${requestTimes.length}</div>
      <div class="stat-label">Requests</div>
    </div>
  `;
}

// Render the requests table
function renderRequestsTable() {
  // Clear the table
  requestsTableBody.innerHTML = '';
  
  // Get filter values
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const statusFilterValue = statusFilter.value;
  
  // Convert object to array for sorting
  const requestsArray = Object.values(allRequestsData);
  
  // Sort by start time (newest first)
  requestsArray.sort((a, b) => b.startTime - a.startTime);
  
  // Apply filters and render
  const filteredRequests = requestsArray.filter(request => {
    // Search filter
    if (searchTerm && !request.url.toLowerCase().includes(searchTerm)) {
      return false;
    }
    
    // Type filter
    if (typeFilterValue !== 'all' && request.type !== typeFilterValue) {
      return false;
    }
    
    // Status filter
    if (statusFilterValue !== 'all') {
      if (statusFilterValue === 'error' && !request.error) {
        return false;
      } else if (statusFilterValue === 'success' && !(request.status >= 200 && request.status < 300)) {
        return false;
      } else if (statusFilterValue === 'redirect' && !(request.status >= 300 && request.status < 400)) {
        return false;
      } else if (statusFilterValue === 'client-error' && !(request.status >= 400 && request.status < 500)) {
        return false;
      } else if (statusFilterValue === 'server-error' && !(request.status >= 500 && request.status < 600)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Show/hide no data message
  if (filteredRequests.length === 0) {
    if (requestsArray.length === 0) {
      noDataMessage.style.display = 'block';
    } else {
      noDataMessage.textContent = 'No requests match your filters.';
      noDataMessage.style.display = 'block';
    }
  } else {
    noDataMessage.style.display = 'none';
  }
  
  // Calculate visit counts and p99 for each unique URL
  const urlStats = {};
  requestsArray.forEach(request => {
    if (!urlStats[request.url]) {
      urlStats[request.url] = {
        count: 0,
        times: []
      };
    }
    urlStats[request.url].count++;
    if (request.totalTime) {
      urlStats[request.url].times.push(request.totalTime);
    }
  });
  
  // Render each request
  filteredRequests.forEach(request => {
    const row = document.createElement('tr');
    
    // Determine row class based on response time
    if (request.error) {
      row.className = 'error';
    } else if (request.totalTime > 1000) {
      row.className = 'slow';
    } else if (request.totalTime > 500) {
      row.className = 'medium';
    } else {
      row.className = 'fast';
    }
    
    // Format status
    let statusText = request.error ? 'Error' : (request.status || 'Pending');
    
    // Get visit count and p99 for this URL
    const visitCount = urlStats[request.url].count;
    const p99 = calculatePercentile(urlStats[request.url].times, 99);
    
    // Create row content
    row.innerHTML = `
      <td class="url-cell" title="${request.url}">${request.url}</td>
      <td>${request.type || 'unknown'}</td>
      <td>${request.method || 'GET'}</td>
      <td>${statusText}</td>
      <td>${request.totalTime ? Math.round(request.totalTime) : 'N/A'}</td>
      <td>${request.ttfb ? Math.round(request.ttfb) : 'N/A'}</td>
      <td>${visitCount}</td>
      <td>${typeof p99 === 'number' ? Math.round(p99) : p99}</td>
    `;
    
    // Add click event to show details
    row.addEventListener('click', () => {
      showRequestDetails(request);
    });
    
    requestsTableBody.appendChild(row);
  });
}

// Show detailed information for a request
function showRequestDetails(request) {
  requestDetails.style.display = 'block';
  
  // Format the timing information
  const ttfb = request.ttfb ? `${Math.round(request.ttfb)} ms` : 'N/A';
  const totalTime = request.totalTime ? `${Math.round(request.totalTime)} ms` : 'N/A';
  const startTime = new Date(request.startTime).toLocaleTimeString();
  const endTime = request.endTime ? new Date(request.endTime).toLocaleTimeString() : 'N/A';
  
  // Calculate visit count and p99 for this URL
  const requestsArray = Object.values(allRequestsData);
  const urlRequests = requestsArray.filter(req => req.url === request.url);
  const visitCount = urlRequests.length;
  const times = urlRequests.filter(req => req.totalTime).map(req => req.totalTime);
  const p99 = calculatePercentile(times, 99);
  const p99Display = typeof p99 === 'number' ? `${Math.round(p99)} ms` : p99;
  
  // Create the details HTML
  requestDetails.innerHTML = `
    <h3>Request Details</h3>
    <p><strong>URL:</strong> ${request.url}</p>
    <p><strong>Type:</strong> ${request.type || 'unknown'}</p>
    <p><strong>Method:</strong> ${request.method || 'GET'}</p>
    <p><strong>Status:</strong> ${request.error ? `Error (${request.error})` : (request.status || 'Pending')}</p>
    <p><strong>Start Time:</strong> ${startTime}</p>
    <p><strong>End Time:</strong> ${endTime}</p>
    <p><strong>Time to First Byte:</strong> ${ttfb}</p>
    <p><strong>Total Time:</strong> ${totalTime}</p>
    <p><strong>访问次数:</strong> ${visitCount}</p>
    <p><strong>P99 (ms):</strong> ${p99Display}</p>
  `;
}

// Export data as CSV
exportBtn.addEventListener('click', () => {
  // Get filter values for statistics
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const statusFilterValue = statusFilter.value;
  
  // Convert object to array for filtering
  const requestsArray = Object.values(allRequestsData);
  
  // Apply filters
  const filteredRequests = requestsArray.filter(request => {
    // Search filter
    if (searchTerm && !request.url.toLowerCase().includes(searchTerm)) {
      return false;
    }
    
    // Type filter
    if (typeFilterValue !== 'all' && request.type !== typeFilterValue) {
      return false;
    }
    
    // Status filter
    if (statusFilterValue !== 'all') {
      if (statusFilterValue === 'error' && !request.error) {
        return false;
      } else if (statusFilterValue === 'success' && !(request.status >= 200 && request.status < 300)) {
        return false;
      } else if (statusFilterValue === 'redirect' && !(request.status >= 300 && request.status < 400)) {
        return false;
      } else if (statusFilterValue === 'client-error' && !(request.status >= 400 && request.status < 500)) {
        return false;
      } else if (statusFilterValue === 'server-error' && !(request.status >= 500 && request.status < 600)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Get all valid request times from filtered requests
  const requestTimes = filteredRequests
    .filter(request => request.totalTime && !request.error)
    .map(request => request.totalTime);
  
  // Calculate statistics
  const p99 = calculatePercentile(requestTimes, 99);
  const p95 = calculatePercentile(requestTimes, 95);
  const p90 = calculatePercentile(requestTimes, 90);
  const p50 = calculatePercentile(requestTimes, 50);
  const avg = requestTimes.length > 0 
    ? Math.round(requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length) 
    : 'N/A';
  
  // Calculate visit counts and p99 for each unique URL
  const urlStats = {};
  requestsArray.forEach(request => {
    if (!urlStats[request.url]) {
      urlStats[request.url] = {
        count: 0,
        times: []
      };
    }
    urlStats[request.url].count++;
    if (request.totalTime) {
      urlStats[request.url].times.push(request.totalTime);
    }
  });
  
  // Convert data to CSV
  const headers = ['URL', 'Type', 'Method', 'Status', 'Start Time', 'End Time', 'TTFB (ms)', 'Total Time (ms)', '访问次数', 'P99 (ms)'];
  
  let csv = headers.join(',') + '\n';
  
  filteredRequests.forEach(request => {
    const startTime = new Date(request.startTime).toLocaleTimeString();
    const endTime = request.endTime ? new Date(request.endTime).toLocaleTimeString() : 'N/A';
    const status = request.error ? `Error (${request.error})` : (request.status || 'Pending');
    const ttfb = request.ttfb ? Math.round(request.ttfb) : 'N/A';
    const totalTime = request.totalTime ? Math.round(request.totalTime) : 'N/A';
    const visitCount = urlStats[request.url].count;
    const urlP99 = calculatePercentile(urlStats[request.url].times, 99);
    const p99Display = typeof urlP99 === 'number' ? Math.round(urlP99) : urlP99;
    
    const row = [
      `"${request.url}"`,
      request.type || 'unknown',
      request.method || 'GET',
      `"${status}"`,
      startTime,
      endTime,
      ttfb,
      totalTime,
      visitCount,
      p99Display
    ];
    
    csv += row.join(',') + '\n';
  });
  
  // Add statistics to CSV
  csv += '\n';
  csv += 'Statistics,Value (ms)\n';
  csv += `P99,${p99 !== 'N/A' ? Math.round(p99) : 'N/A'}\n`;
  csv += `P95,${p95 !== 'N/A' ? Math.round(p95) : 'N/A'}\n`;
  csv += `P90,${p90 !== 'N/A' ? Math.round(p90) : 'N/A'}\n`;
  csv += `P50,${p50 !== 'N/A' ? Math.round(p50) : 'N/A'}\n`;
  csv += `Average,${avg !== 'N/A' ? avg : 'N/A'}\n`;
  csv += `Total Requests,${requestTimes.length}\n`;
  
  // Create a download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `network-requests-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Add event listeners for filters
searchInput.addEventListener('input', () => {
  renderRequestsTable();
  updateStatistics();
});
typeFilter.addEventListener('change', () => {
  renderRequestsTable();
  updateStatistics();
});
statusFilter.addEventListener('change', () => {
  renderRequestsTable();
  updateStatistics();
});

// Add event listener for clear button
clearBtn.addEventListener('click', () => {
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      // Clear data for current tab
      allRequestsData = {};
      
      // Clear data in background script
      chrome.runtime.sendMessage(
        { action: "clearRequestData", tabId: currentTab.id },
        () => {
          // Update UI
          renderRequestsTable();
          updateStatistics();
          
          // Hide request details if visible
          requestDetails.style.display = 'none';
          
          // Show no data message
          noDataMessage.textContent = 'No network requests captured yet. Browse a website to see data.';
          noDataMessage.style.display = 'block';
        }
      );
    }
  });
});