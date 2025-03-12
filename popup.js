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
const statsContainer = document.getElementById('statsContainer');

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
  // Get all valid request times
  const requestTimes = Object.values(allRequestsData)
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
    
    // Create row content
    row.innerHTML = `
      <td class="url-cell" title="${request.url}">${request.url}</td>
      <td>${request.type || 'unknown'}</td>
      <td>${request.method || 'GET'}</td>
      <td>${statusText}</td>
      <td>${request.totalTime ? Math.round(request.totalTime) : 'N/A'}</td>
      <td>${request.ttfb ? Math.round(request.ttfb) : 'N/A'}</td>
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
  `;
}

// Export data as CSV
exportBtn.addEventListener('click', () => {
  // Convert data to CSV
  const headers = ['URL', 'Type', 'Method', 'Status', 'Start Time', 'End Time', 'TTFB (ms)', 'Total Time (ms)'];
  
  let csvContent = headers.join(',') + '\n';
  
  Object.values(allRequestsData).forEach(request => {
    const row = [
      `"${request.url.replace(/"/g, '""')}"`,
      request.type || 'unknown',
      request.method || 'GET',
      request.error ? `Error (${request.error})` : (request.status || 'Pending'),
      new Date(request.startTime).toISOString(),
      request.endTime ? new Date(request.endTime).toISOString() : 'N/A',
      request.ttfb ? Math.round(request.ttfb) : 'N/A',
      request.totalTime ? Math.round(request.totalTime) : 'N/A'
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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