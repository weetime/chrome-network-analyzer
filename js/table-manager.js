/**
 * Table Manager - Handles request table rendering and interactions
 */

import { RequestDetailsManager } from './request-details-manager.js';

// Store all request data
let allRequestsData = {};

// Table elements
let requestsTable = null;
let requestsTableBody = null;
let noDataMessage = null;

// Current sorting state
let currentSortColumn = 'totalTime';
let currentSortDirection = 'desc';

// Add sorting variables
let filteredRequests = [];

/**
 * Sort the requests data based on current sort column and direction
 */
function sortRequests(requests) {
  return requests.sort((a, b) => {
    let aValue = a[currentSortColumn];
    let bValue = b[currentSortColumn];
    
    // Handle undefined or null values
    if (aValue === undefined || aValue === null) aValue = 0;
    if (bValue === undefined || bValue === null) bValue = 0;
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      if (currentSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
    
    // Handle number comparison
    if (currentSortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
}

/**
 * Apply filters to the data based on search input, type and status filters
 */
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (!searchInput || !typeFilter || !statusFilter) return [];
  
  const searchValue = searchInput.value.toLowerCase();
  const typeValue = typeFilter.value;
  const statusValue = statusFilter.value;
  
  // Get all requests as array
  let requests = Object.values(allRequestsData);
  
  // Apply type filter
  if (typeValue !== 'all') {
    requests = requests.filter(req => req.type === typeValue);
  }
  
  // Apply status filter
  if (statusValue === 'success') {
    requests = requests.filter(req => req.status >= 200 && req.status < 400);
  } else if (statusValue === 'error') {
    requests = requests.filter(req => req.status >= 400 || req.error);
  } else if (statusValue === 'redirect') {
    requests = requests.filter(req => req.status >= 300 && req.status < 400);
  }
  
  // Apply search filter
  if (searchValue) {
    requests = requests.filter(req => 
      req.url.toLowerCase().includes(searchValue) || 
      (req.domain && req.domain.toLowerCase().includes(searchValue))
    );
  }
  
  return requests;
}

/**
 * Get the class for coloring based on load time
 */
function getLoadTimeClass(time) {
  if (!time) return '';
  if (time < 100) return 'fast';
  if (time < 500) return 'medium';
  return 'slow';
}

/**
 * Format time in milliseconds to a readable format
 */
function formatTime(time) {
  if (time === undefined || time === null) return 'N/A';
  
  if (time < 1) {
    return '< 1ms';
  } else if (time < 1000) {
    return `${Math.round(time)}ms`;
  } else {
    return `${(time / 1000).toFixed(2)}s`;
  }
}

/**
 * Format size in bytes to a readable format
 */
function formatSize(bytes) {
  if (bytes === undefined || bytes === null) return 'N/A';
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Render the requests table with current data
 */
function renderRequestsTable() {
  // If elements are not initialized, try to find them
  if (!requestsTableBody) {
    requestsTableBody = document.getElementById('requestsTableBody');
  }
  
  if (!noDataMessage) {
    noDataMessage = document.getElementById('noDataMessage');
  }
  
  if (!requestsTableBody || !noDataMessage) {
    console.error('Table elements not found for rendering');
    return;
  }
  
  // Apply filters
  filteredRequests = applyFilters();
  
  // Count visits per URL and collect response times
  const urlVisitCounts = {};
  const urlResponseTimes = {};
  
  filteredRequests.forEach(request => {
    if (request.url) {
      urlVisitCounts[request.url] = (urlVisitCounts[request.url] || 0) + 1;
      
      // Collect response times for P99 calculation
      if (request.totalTime) {
        if (!urlResponseTimes[request.url]) {
          urlResponseTimes[request.url] = [];
        }
        urlResponseTimes[request.url].push(request.totalTime);
      }
    }
  });
  
  // Calculate P99 for each URL
  const urlP99Times = {};
  Object.keys(urlResponseTimes).forEach(url => {
    const times = urlResponseTimes[url].sort((a, b) => a - b);
    const p99Index = Math.floor(times.length * 0.99);
    urlP99Times[url] = times[p99Index] || times[times.length - 1] || 0;
  });
  
  // Add visit counts and P99 to requests
  filteredRequests.forEach(request => {
    if (request.url) {
      request.visitCount = urlVisitCounts[request.url];
      request.p99 = urlP99Times[request.url];
    }
  });
  
  // Group by URL to avoid duplicates
  const uniqueRequests = {};
  filteredRequests.forEach(request => {
    // If we already have this URL, update with the newer one if it exists
    if (uniqueRequests[request.url]) {
      // Keep the one with the most recent timestamp
      if (request.endTime && (!uniqueRequests[request.url].endTime || request.endTime > uniqueRequests[request.url].endTime)) {
        // Preserve the visit count and P99
        const visitCount = uniqueRequests[request.url].visitCount;
        const p99 = uniqueRequests[request.url].p99;
        uniqueRequests[request.url] = request;
        uniqueRequests[request.url].visitCount = visitCount;
        uniqueRequests[request.url].p99 = p99;
      }
    } else {
      uniqueRequests[request.url] = request;
    }
  });
  
  // Convert back to array
  const uniqueRequestsArray = Object.values(uniqueRequests);
  
  // Sort the filtered requests
  const sortedRequests = sortRequests(uniqueRequestsArray);
  
  // Clear the table
  requestsTableBody.innerHTML = '';
  
  if (sortedRequests.length === 0) {
    requestsTableBody.innerHTML = '<tr><td colspan="8">No requests found matching filters</td></tr>';
    return;
  }
  
  // Hide no data message if we have data
  noDataMessage.style.display = 'none';
  
  // Create rows for each request
  sortedRequests.forEach(request => {
    const row = document.createElement('tr');
    row.addEventListener('click', () => {
      // Use RequestDetailsManager to show details
      if (RequestDetailsManager && RequestDetailsManager.showRequestDetails) {
        RequestDetailsManager.showRequestDetails(request);
      } else if (typeof showRequestDetails === 'function') {
        showRequestDetails(request);
      }
      
      // Highlight selected row
      document.querySelectorAll('#requestsTableBody tr').forEach(r => r.classList.remove('selected-row'));
      row.classList.add('selected-row');
    });
    
    // Status column
    const statusCell = document.createElement('td');
    statusCell.className = 'status-cell';
    if (request.error) {
      statusCell.innerHTML = `<span class="status-code error">Error</span>`;
      statusCell.title = request.error;
    } else if (request.status) {
      const statusClass = request.status >= 400 ? 'error' : 
                          request.status >= 300 ? 'redirect' : 'success';
      statusCell.innerHTML = `<span class="status-code ${statusClass}">${request.status}</span>`;
    } else {
      statusCell.innerHTML = `<span class="status-code">Pending</span>`;
    }
    
    // Method column
    const methodCell = document.createElement('td');
    methodCell.className = 'method-cell';
    methodCell.textContent = request.method || '-';
    
    // Type column
    const typeCell = document.createElement('td');
    typeCell.className = 'type-cell';
    typeCell.textContent = request.type || '-';
    
    // URL column
    const urlCell = document.createElement('td');
    urlCell.className = 'url-cell';
    
    const urlContainer = document.createElement('div');
    urlContainer.className = 'url-container';
    
    try {
      const url = new URL(request.url);
      
      // Create filename element
      const filename = document.createElement('span');
      filename.className = 'filename';
      const pathname = url.pathname.split('/').pop() || url.pathname;
      filename.textContent = pathname;
      urlContainer.appendChild(filename);
      
      // Create domain element (path without filename)
      const domain = document.createElement('span');
      domain.className = 'domain';
      const pathnameWithoutFilename = url.pathname === '/' ? '/' : 
        pathname === url.pathname ? '/' : 
        url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
      domain.textContent = url.origin + pathnameWithoutFilename;
      urlContainer.appendChild(domain);
      
      // Set title for tooltip
      urlContainer.title = request.url;
    } catch (e) {
      urlContainer.textContent = request.url || 'Unknown URL';
      urlContainer.title = request.url || 'Unknown URL';
    }
    
    urlCell.appendChild(urlContainer);
    
    // Total Time column
    const totalTimeCell = document.createElement('td');
    totalTimeCell.className = `time-cell ${getLoadTimeClass(request.totalTime)}`;
    totalTimeCell.textContent = formatTime(request.totalTime);
    
    // TTFB column
    const ttfbCell = document.createElement('td');
    ttfbCell.className = `time-cell ${getLoadTimeClass(request.ttfb)}`;
    ttfbCell.textContent = formatTime(request.ttfb);
    
    // Content Download Time column
    const contentTimeCell = document.createElement('td');
    contentTimeCell.className = `time-cell ${getLoadTimeClass(request.contentDownloadTime)}`;
    contentTimeCell.textContent = formatTime(request.contentDownloadTime);
    
    // Size column
    const sizeCell = document.createElement('td');
    sizeCell.className = 'size-cell';
    sizeCell.textContent = formatSize(request.responseSize);
    
    // Create visits cell (missing in the original code)
    const visitsCell = document.createElement('td');
    visitsCell.className = 'visits-cell';
    visitsCell.textContent = request.visitCount || '1';
    
    // Create P99 cell (missing in the original code)
    const p99Cell = document.createElement('td');
    p99Cell.className = 'time-cell';
    p99Cell.textContent = formatTime(request.p99);
    
    // Add all cells to the row
    row.appendChild(urlCell);          // 1. URL
    row.appendChild(typeCell);         // 2. Type
    row.appendChild(methodCell);       // 3. Method
    row.appendChild(statusCell);       // 4. Status
    row.appendChild(totalTimeCell);    // 5. Time
    row.appendChild(ttfbCell);         // 6. TTFB
    row.appendChild(visitsCell);       // 7. Visits
    row.appendChild(p99Cell);          // 8. P99
    
    // Add the row to the table
    requestsTableBody.appendChild(row);
  });
}

/**
 * Set up table sorting by adding event listeners to the headers
 */
function setupTableSorting() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      
      // If clicking the same column, toggle direction
      if (column === currentSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // New column, reset direction to default (desc)
        currentSortColumn = column;
        currentSortDirection = 'desc';
      }
      
      // Update UI to show sort direction
      document.querySelectorAll('th').forEach(header => header.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(`sort-${currentSortDirection}`);
      
      // Re-render the table
      renderRequestsTable();
    });
  });
}

/**
 * Set up filter event listeners
 */
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const typeFilter = document.getElementById('typeFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  if (searchInput) {
    searchInput.addEventListener('input', renderRequestsTable);
  }
  
  if (typeFilter) {
    typeFilter.addEventListener('change', renderRequestsTable);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', renderRequestsTable);
  }
}

/**
 * Update the table with new data
 */
function updateTableData(data) {
  allRequestsData = data || {};
  renderRequestsTable();
}

/**
 * Get the current request data
 */
function getRequestData() {
  return allRequestsData;
}

/**
 * Clear the current request data
 */
function clearRequestData() {
  allRequestsData = {};
  renderRequestsTable();
}

/**
 * Initialize the table manager
 */
function initTableManager(options = {}) {
  // Process options
  const {
    tableId = 'requestsTable',
    bodyId = 'requestsTableBody',
    noDataMessageId = 'noDataMessage'
  } = options;
  
  // Get table elements
  requestsTable = document.getElementById(tableId);
  requestsTableBody = document.getElementById(bodyId);
  noDataMessage = document.getElementById(noDataMessageId);
  
  if (!requestsTable || !requestsTableBody) {
    console.error('Table elements not found');
    return Promise.reject('Table elements not found');
  }
  
  setupTableSorting();
  setupFilters();
  renderRequestsTable();
  
  return Promise.resolve();
}

// Export TableManager using ES6 export syntax
export const TableManager = {
  init: initTableManager,
  updateTableData,
  getRequestData,
  clearRequestData,
  renderRequestsTable,
  formatTime,
  formatSize,
  getLoadTimeClass,
  applyFilters
};