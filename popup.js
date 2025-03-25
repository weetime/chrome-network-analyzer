// Store all request data
let allRequestsData = {};
let currentTabId = null;
let currentDomain = null;

// Add sorting variables
let currentSortColumn = 'p99'; // Default sort by P99
let currentSortDirection = 'desc'; // Default descending order

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
const themeTooltip = document.getElementById('themeTooltip');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
const sunRays = document.querySelectorAll('[id^="sunRay"]');
// Header domain elements
const headerDomainsList = document.getElementById('headerDomainsList');
const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
const headerAuthStatus = document.getElementById('headerAuthStatus');

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update theme icon visibility
  updateThemeIcon(savedTheme);
  
  // Update tooltip text
  themeTooltip.textContent = savedTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update theme icon visibility
  updateThemeIcon(newTheme);
  
  // Update tooltip text
  themeTooltip.textContent = newTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';
}

function updateThemeIcon(theme) {
  if (theme === 'light') {
    // Show sun icon for light theme
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
    sunRays.forEach(ray => ray.style.display = 'block');
    themeToggle.classList.remove('dark-mode');
  } else {
    // Show moon icon for dark theme
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
    sunRays.forEach(ray => ray.style.display = 'none');
    themeToggle.classList.add('dark-mode');
  }
}

// Initialize theme
loadTheme();

// Theme toggle event listener
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Get current tab and load request data
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('DOMContentLoaded - 开始初始化');
    
    // Default hide authorized content area
    document.getElementById('authorizedContent').style.display = 'none';
    
    // 检查并添加所有事件监听器
    console.log('检查DOM元素...');
    
    // 添加域名管理链接的点击事件处理
    const openDomainSettings = document.getElementById('openDomainSettings');
    console.log('openDomainSettings元素存在?', !!openDomainSettings);
    if (openDomainSettings) {
      console.log('绑定openDomainSettings点击事件');
      openDomainSettings.addEventListener('click', (e) => {
        console.log('openDomainSettings点击事件触发');
        e.preventDefault();
        console.log('打开配置页面');
        chrome.runtime.openOptionsPage();
      });
    } else {
      console.error('未找到openDomainSettings元素');
    }
    
    // 添加未授权页面的设置链接点击事件
    const unauthorizedOpenSettings = document.getElementById('unauthorizedOpenSettings');
    if (unauthorizedOpenSettings) {
      unauthorizedOpenSettings.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
    
    // 添加快速授权按钮点击事件
    const quickAuthButton = document.getElementById('quickAuthButton');
    if (quickAuthButton) {
      quickAuthButton.addEventListener('click', () => {
        chrome.runtime.sendMessage(
          { action: "authorizeDomain", domain: currentDomain },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error authorizing domain:", chrome.runtime.lastError);
              return;
            }
            
            if (response && response.success) {
              // 显示已授权内容
              document.getElementById('unauthorizedContent').style.display = 'none';
              document.getElementById('authorizedContent').style.display = 'block';
              
              // 显示header中的域信息
              const domainInfoElement = document.querySelector('.domain-info');
              if (domainInfoElement) {
                domainInfoElement.style.display = 'flex';
              }
              
              // 设置header中的开关状态
              if (headerAuthorizationSwitch) {
                headerAuthorizationSwitch.checked = true;
              }
              if (headerAuthStatus) {
                headerAuthStatus.textContent = '启用';
                headerAuthStatus.className = 'auth-status enabled';
              }
              
              // 请求网络数据
              requestNetworkData();
              
              // 更新已授权域名列表
              loadAuthorizedDomains();
            }
          }
        );
      });
    }
    
    // 添加AI配置页面链接的点击事件
    const openOptionsPage = document.getElementById('openOptionsPage');
    if (openOptionsPage) {
      openOptionsPage.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
    
    // Load authorized domains list
    loadAuthorizedDomains();
    
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab) {
      currentTabId = currentTab.id;
      
      // Extract domain from current tab URL
      try {
        const url = new URL(currentTab.url);
        currentDomain = url.hostname;
        
        // Check if domain is authorized
        chrome.runtime.sendMessage(
          { action: "checkDomainAuthorization", domain: currentDomain },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error checking domain authorization:", chrome.runtime.lastError);
              return;
            }
            
            if (response && response.isAuthorized) {
              // Domain is authorized, request data
              // Show authorized content area
              document.getElementById('authorizedContent').style.display = 'block';
              
              // Show domain info in header
              document.querySelector('.domain-info').style.display = 'flex';
              
              // Update header authorization switch
              headerAuthorizationSwitch.checked = true;
              headerAuthStatus.textContent = '启用';
              headerAuthStatus.className = 'auth-status enabled';
              
              requestNetworkData();
            } else {
              // Domain is not authorized, show authorization UI
              showUnauthorizedContent();
              
              // Hide domain info in header
              document.querySelector('.domain-info').style.display = 'none';
            }
          }
        );
      } catch (error) {
        console.error("Error extracting domain:", error);
        // If we can't extract domain, just try to get data
        document.getElementById('authorizedContent').style.display = 'block';
        requestNetworkData();
      }
    }
  } catch (error) {
    console.error("Error loading request data:", error);
  }
});

// Function to request network data from background script
function requestNetworkData() {
  chrome.runtime.sendMessage(
    { action: "getRequestData", tabId: currentTabId },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting request data:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.requestData) {
        allRequestsData = response.requestData;
        renderRequestsTable();
        updateStatistics();
      }
    }
  );
}

// Function to show unauthorized content
function showUnauthorizedContent() {
  document.getElementById('unauthorizedContent').style.display = 'block';
  document.getElementById('authorizedContent').style.display = 'none';
  
  // Hide AI analysis panel
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  if (aiAnalysisContainer) {
    aiAnalysisContainer.style.display = 'none';
  }
}

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
          
          // Remove selected class from all rows
          const allRows = document.querySelectorAll('#requestsTableBody tr');
          allRows.forEach(row => row.classList.remove('selected'));
          
          // Show no data message
          noDataMessage.textContent = 'No network requests captured yet. Browse a website to see data.';
          noDataMessage.style.display = 'block';
        }
      );
    }
  });
});

// Listen for new request data from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "requestCompleted" || message.action === "requestFailed") {
      // Get current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("Error querying tabs:", chrome.runtime.lastError);
          return;
        }
        
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
    
    // Always send a response to prevent "The message port closed before a response was received" error
    if (sendResponse) {
      sendResponse({ received: true });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    if (sendResponse) {
      sendResponse({ error: error.message });
    }
  }
  
  return true; // Required for async response
});

// Add header authorization switch event listener
headerAuthorizationSwitch.addEventListener('change', () => {
  if (headerAuthorizationSwitch.checked) {
    // 开关打开，授权当前域名
    headerAuthStatus.textContent = '启用';
    headerAuthStatus.className = 'auth-status enabled';
    
    // 如果当前域名未授权，则授权
    if (document.getElementById('authorizedContent').style.display !== 'block') {
      chrome.runtime.sendMessage(
        { action: "authorizeDomain", domain: currentDomain },
        (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            console.error("Error authorizing domain:", chrome.runtime.lastError);
            // 授权失败，恢复开关状态
            headerAuthorizationSwitch.checked = false;
            headerAuthStatus.textContent = '未启用';
            headerAuthStatus.className = 'auth-status disabled';
            return;
          }
          
          // 域名已授权，显示授权内容
          document.getElementById('unauthorizedContent').style.display = 'none';
          document.getElementById('authorizedContent').style.display = 'block';
          requestNetworkData();
        }
      );
    }
  } else {
    // 开关关闭，取消授权
    headerAuthStatus.textContent = '未启用';
    headerAuthStatus.className = 'auth-status disabled';
    
    // 取消授权
    removeDomainAuthorization(currentDomain);
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
  
  // 确定P99的颜色类
  let p99ColorClass = '';
  if (typeof p99 === 'number') {
    if (p99 > 1000) {
      p99ColorClass = 'p99-very-slow';
    } else if (p99 > 500) {
      p99ColorClass = 'p99-slow';
    } else if (p99 > 200) {
      p99ColorClass = 'p99-medium';
    } else if (p99 > 0) {
      p99ColorClass = 'p99-fast';
    }
  }
  
  // Update the stats container
  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value ${p99ColorClass}">${p99 !== 'N/A' ? Math.round(p99) + ' ms' : 'N/A'}</div>
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
  
  // Calculate visit counts and p99 for each unique URL
  const urlStats = {};
  requestsArray.forEach(request => {
    if (!urlStats[request.url]) {
      urlStats[request.url] = {
        count: 0,
        times: [],
        latestRequest: request // Save latest request object
      };
    }
    urlStats[request.url].count++;
    if (request.totalTime) {
      urlStats[request.url].times.push(request.totalTime);
    }
    // Update to latest request (assuming requests are added in chronological order)
    if (request.startTime > (urlStats[request.url].latestRequest.startTime || 0)) {
      urlStats[request.url].latestRequest = request;
    }
  });
  
  // Create unique URL request array
  const uniqueRequests = Object.values(urlStats).map(stat => {
    const request = stat.latestRequest;
    request.visitCount = stat.count;
    request.p99 = calculatePercentile(stat.times, 99);
    request.p95 = calculatePercentile(stat.times, 95);
    request.p90 = calculatePercentile(stat.times, 90);
    request.p50 = calculatePercentile(stat.times, 50);
    request.avgTime = stat.times.length > 0 
      ? Math.round(stat.times.reduce((sum, time) => sum + time, 0) / stat.times.length) 
      : 'N/A';
    return request;
  });
  
  // Apply filters
  const filteredRequests = uniqueRequests.filter(request => {
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
  
  // Sort based on current sort column and direction
  filteredRequests.sort((a, b) => {
    let aValue, bValue;
    
    // Get corresponding value based on sort column
    switch (currentSortColumn) {
      case 'url':
        aValue = a.url;
        bValue = b.url;
        break;
      case 'type':
        aValue = a.type || '';
        bValue = b.type || '';
        break;
      case 'method':
        aValue = a.method || 'GET';
        bValue = b.method || 'GET';
        break;
      case 'status':
        aValue = a.error ? 0 : (a.status || 0);
        bValue = b.error ? 0 : (b.status || 0);
        break;
      case 'totalTime':
        aValue = a.totalTime || 0;
        bValue = b.totalTime || 0;
        break;
      case 'ttfb':
        aValue = a.ttfb || 0;
        bValue = b.ttfb || 0;
        break;
      case 'visitCount':
        aValue = a.visitCount || 0;
        bValue = b.visitCount || 0;
        break;
      case 'p99':
        aValue = typeof a.p99 === 'number' ? a.p99 : 0;
        bValue = typeof b.p99 === 'number' ? b.p99 : 0;
        break;
      default:
        aValue = a.startTime;
        bValue = b.startTime;
    }
    
    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const result = aValue.localeCompare(bValue);
      return currentSortDirection === 'asc' ? result : -result;
    }
    
    // Numerical comparison
    const result = aValue - bValue;
    return currentSortDirection === 'asc' ? result : -result;
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
    
    // Get visit count and p99 for this URL
    const visitCount = request.visitCount;
    const p99 = request.p99;
    
    // Create URL cell
    const urlCell = document.createElement('td');
    urlCell.className = 'url-cell';
    urlCell.title = request.url;
    urlCell.textContent = request.url;
    
    // Create other cells
    const typeCell = document.createElement('td');
    typeCell.textContent = request.type || 'unknown';
    
    const methodCell = document.createElement('td');
    methodCell.textContent = request.method || 'GET';
    
    const statusCell = document.createElement('td');
    statusCell.textContent = statusText;
    
    const totalTimeCell = document.createElement('td');
    totalTimeCell.textContent = request.totalTime ? Math.round(request.totalTime) : 'N/A';
    
    const ttfbCell = document.createElement('td');
    ttfbCell.textContent = request.ttfb ? Math.round(request.ttfb) : 'N/A';
    
    const visitCountCell = document.createElement('td');
    visitCountCell.textContent = visitCount;
    
    const p99Cell = document.createElement('td');
    p99Cell.textContent = typeof p99 === 'number' ? Math.round(p99) : p99;
    
    // 为P99单元格添加颜色梯度
    if (typeof p99 === 'number') {
      if (p99 > 1000) {
        p99Cell.classList.add('p99-very-slow');
      } else if (p99 > 500) {
        p99Cell.classList.add('p99-slow');
      } else if (p99 > 200) {
        p99Cell.classList.add('p99-medium');
      } else if (p99 > 0) {
        p99Cell.classList.add('p99-fast');
      }
    }
    
    // Add all cells to row
    row.appendChild(urlCell);
    row.appendChild(typeCell);
    row.appendChild(methodCell);
    row.appendChild(statusCell);
    row.appendChild(totalTimeCell);
    row.appendChild(ttfbCell);
    row.appendChild(visitCountCell);
    row.appendChild(p99Cell);
    
    // Add click event to show details
    row.addEventListener('click', () => {
      showRequestDetails(request);
    });
    
    requestsTableBody.appendChild(row);
  });
  
  // Update table header sort icon
  const tableHeaders = document.querySelectorAll('#requestsTable th[data-sort]');
  tableHeaders.forEach(header => {
    header.classList.remove('sort-asc', 'sort-desc');
    if (header.getAttribute('data-sort') === currentSortColumn) {
      header.classList.add(`sort-${currentSortDirection}`);
    }
  });
}

// Show detailed information for a request
function showRequestDetails(request) {
  requestDetails.style.display = 'block';
  
  // Remove selected class from all rows
  const allRows = document.querySelectorAll('#requestsTableBody tr');
  allRows.forEach(row => row.classList.remove('selected'));
  
  // Find and highlight the row for this request
  const rows = document.querySelectorAll('#requestsTableBody tr');
  rows.forEach(row => {
    const urlCell = row.querySelector('.url-cell');
    if (urlCell && urlCell.title === request.url) {
      row.classList.add('selected');
    }
  });
  
  // Format the timing information
  const ttfb = request.ttfb ? `${Math.round(request.ttfb)} ms` : 'N/A';
  const totalTime = request.totalTime ? `${Math.round(request.totalTime)} ms` : 'N/A';
  const startTime = new Date(request.startTime).toLocaleTimeString();
  const endTime = request.endTime ? new Date(request.endTime).toLocaleTimeString() : 'N/A';
  
  // Get all requests with the same URL
  const requestsArray = Object.values(allRequestsData);
  const urlRequests = requestsArray.filter(req => req.url === request.url);
  const visitCount = urlRequests.length;
  
  // Calculate statistics
  const times = urlRequests.filter(req => req.totalTime).map(req => req.totalTime);
  const p99 = calculatePercentile(times, 99);
  const p95 = calculatePercentile(times, 95);
  const p90 = calculatePercentile(times, 90);
  const p50 = calculatePercentile(times, 50);
  const avg = times.length > 0 
    ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length) 
    : 'N/A';
  
  const p99Display = typeof p99 === 'number' ? `${Math.round(p99)} ms` : p99;
  const p95Display = typeof p95 === 'number' ? `${Math.round(p95)} ms` : p95;
  const p90Display = typeof p90 === 'number' ? `${Math.round(p90)} ms` : p90;
  const p50Display = typeof p50 === 'number' ? `${Math.round(p50)} ms` : p50;
  
  // 确定P99的颜色类
  let p99ColorClass = '';
  if (typeof p99 === 'number') {
    if (p99 > 1000) {
      p99ColorClass = 'p99-very-slow';
    } else if (p99 > 500) {
      p99ColorClass = 'p99-slow';
    } else if (p99 > 200) {
      p99ColorClass = 'p99-medium';
    } else if (p99 > 0) {
      p99ColorClass = 'p99-fast';
    }
  }
  
  // Create detail HTML
  requestDetails.innerHTML = `
    <div class="request-detail-header">
      <h3 class="request-detail-title">Request Details</h3>
      <button id="closeDetails" class="close-button"></button>
    </div>
    <div class="detail-url-container">
      <strong>URL:</strong> 
      <div class="detail-url-wrapper">
        <span class="detail-url">${request.url}</span>
        <button class="detail-copy-btn" title="Copy URL">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V4C17 3.44772 16.5523 3 16 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17 9H20C20.5523 9 21 9.44772 21 10V20C21 20.5523 20.5523 21 20 21H10C9.44772 21 9 20.5523 9 20V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <p><strong>Type:</strong> ${request.type || 'unknown'}</p>
    <p><strong>Method:</strong> ${request.method || 'GET'}</p>
    <p><strong>Status:</strong> ${request.error ? `Error (${request.error})` : (request.status || 'Pending')}</p>
    <p><strong>Start Time:</strong> ${startTime}</p>
    <p><strong>End Time:</strong> ${endTime}</p>
    <p><strong>Time to First Byte:</strong> ${ttfb}</p>
    <p><strong>Total Time:</strong> ${totalTime}</p>
    
    <div class="request-details-section">
      <h4 class="request-stats-title">URL Statistics (${visitCount} visits)</h4>
      <div class="request-stats-grid">
        <p class="request-stat-item"><strong>P99:</strong> <span class="${p99ColorClass}">${p99Display}</span></p>
        <p class="request-stat-item"><strong>P95:</strong> ${p95Display}</p>
        <p class="request-stat-item"><strong>P90:</strong> ${p90Display}</p>
        <p class="request-stat-item"><strong>P50:</strong> ${p50Display}</p>
        <p class="request-stat-item"><strong>Average Response Time:</strong> ${avg !== 'N/A' ? `${avg} ms` : avg}</p>
        <p class="request-stat-item"><strong>Visits:</strong> ${visitCount}</p>
      </div>
    </div>
  `;
  
  // Add close button event
  const closeButton = document.getElementById('closeDetails');
  closeButton.addEventListener('click', () => {
    requestDetails.style.display = 'none';
    // Remove selected class from all rows when closing details
    const allRows = document.querySelectorAll('#requestsTableBody tr');
    allRows.forEach(row => row.classList.remove('selected'));
  });
  
  // Add URL copy functionality
  const copyUrlBtn = requestDetails.querySelector('.detail-copy-btn');
  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(request.url)
      .then(() => {
        // Show copy success notification
        copyUrlBtn.classList.add('copied');
        setTimeout(() => {
          copyUrlBtn.classList.remove('copied');
        }, 1500);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  });
  
  // Scroll to detail area
  requestDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Export data as CSV
exportBtn.addEventListener('click', () => {
  // Get filter values for statistics
  const searchTerm = searchInput.value.toLowerCase();
  const typeFilterValue = typeFilter.value;
  const statusFilterValue = statusFilter.value;
  
  // Convert object to array for filtering
  const requestsArray = Object.values(allRequestsData);
  
  // Calculate visit counts and p99 for each unique URL
  const urlStats = {};
  requestsArray.forEach(request => {
    if (!urlStats[request.url]) {
      urlStats[request.url] = {
        count: 0,
        times: [],
        latestRequest: request
      };
    }
    urlStats[request.url].count++;
    if (request.totalTime) {
      urlStats[request.url].times.push(request.totalTime);
    }
    // Update to latest request
    if (request.startTime > (urlStats[request.url].latestRequest.startTime || 0)) {
      urlStats[request.url].latestRequest = request;
    }
  });
  
  // Create unique URL request array
  const uniqueRequests = Object.values(urlStats).map(stat => {
    const request = stat.latestRequest;
    request.visitCount = stat.count;
    request.p99 = calculatePercentile(stat.times, 99);
    request.p95 = calculatePercentile(stat.times, 95);
    request.p90 = calculatePercentile(stat.times, 90);
    request.p50 = calculatePercentile(stat.times, 50);
    request.avgTime = stat.times.length > 0 
      ? Math.round(stat.times.reduce((sum, time) => sum + time, 0) / stat.times.length) 
      : 'N/A';
    return request;
  });
  
  // Apply filters
  const filteredRequests = uniqueRequests.filter(request => {
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
  
  // Get all valid request times from filtered requests for overall statistics
  const requestTimes = filteredRequests
    .filter(request => request.totalTime && !request.error)
    .map(request => request.totalTime);
  
  // Calculate overall statistics
  const p99 = calculatePercentile(requestTimes, 99);
  const p95 = calculatePercentile(requestTimes, 95);
  const p90 = calculatePercentile(requestTimes, 90);
  const p50 = calculatePercentile(requestTimes, 50);
  const avg = requestTimes.length > 0 
    ? Math.round(requestTimes.reduce((sum, time) => sum + time, 0) / requestTimes.length) 
    : 'N/A';
  
  // Convert data to CSV
  const headers = ['URL', 'Type', 'Method', 'Status', 'Start Time', 'End Time', 'TTFB (ms)', 'Total Time (ms)', 'Visits', 'P99 (ms)', 'P95 (ms)', 'P90 (ms)', 'P50 (ms)', 'Average Response Time (ms)'];
  
  let csv = headers.join(',') + '\n';
  
  filteredRequests.forEach(request => {
    const startTime = new Date(request.startTime).toLocaleTimeString();
    const endTime = request.endTime ? new Date(request.endTime).toLocaleTimeString() : 'N/A';
    const status = request.error ? `Error (${request.error})` : (request.status || 'Pending');
    const ttfb = request.ttfb ? Math.round(request.ttfb) : 'N/A';
    const totalTime = request.totalTime ? Math.round(request.totalTime) : 'N/A';
    const visitCount = request.visitCount;
    const p99Display = typeof request.p99 === 'number' ? Math.round(request.p99) : request.p99;
    const p95Display = typeof request.p95 === 'number' ? Math.round(request.p95) : request.p95;
    const p90Display = typeof request.p90 === 'number' ? Math.round(request.p90) : request.p90;
    const p50Display = typeof request.p50 === 'number' ? Math.round(request.p50) : request.p50;
    const avgDisplay = request.avgTime;
    
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
      p99Display,
      p95Display,
      p90Display,
      p50Display,
      avgDisplay
    ];
    
    csv += row.join(',') + '\n';
  });
  
  // Add statistics to CSV
  csv += '\n';
  csv += 'Overall Statistics,Value (ms)\n';
  csv += `P99,${p99 !== 'N/A' ? Math.round(p99) : 'N/A'}\n`;
  csv += `P95,${p95 !== 'N/A' ? Math.round(p95) : 'N/A'}\n`;
  csv += `P90,${p90 !== 'N/A' ? Math.round(p90) : 'N/A'}\n`;
  csv += `P50,${p50 !== 'N/A' ? Math.round(p50) : 'N/A'}\n`;
  csv += `Average,${avg !== 'N/A' ? avg : 'N/A'}\n`;
  csv += `Total Unique URLs,${filteredRequests.length}\n`;
  csv += `Total Requests,${requestsArray.length}\n`;
  
  // 添加P99颜色梯度说明
  csv += '\n';
  csv += 'P99 Performance Thresholds,\n';
  csv += 'Very Slow,> 1000 ms\n';
  csv += 'Slow,> 500 ms\n';
  csv += 'Medium,> 200 ms\n';
  csv += 'Fast,<= 200 ms\n';
  
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
          
          // Remove selected class from all rows
          const allRows = document.querySelectorAll('#requestsTableBody tr');
          allRows.forEach(row => row.classList.remove('selected'));
          
          // Show no data message
          noDataMessage.textContent = 'No network requests captured yet. Browse a website to see data.';
          noDataMessage.style.display = 'block';
        }
      );
    }
  });
});

// Function to load and display authorized domains
function loadAuthorizedDomains() {
  chrome.runtime.sendMessage(
    { action: "getAuthorizedDomains" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting authorized domains:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.authorizedDomains) {
        // Check if current domain is authorized
        if (currentDomain && response.authorizedDomains.includes(currentDomain)) {
          // Current domain is authorized, show domain info in header
          const domainInfoElement = document.querySelector('.domain-info');
          if (domainInfoElement) {
            domainInfoElement.style.display = 'flex';
          }
          displayAuthorizedDomains(response.authorizedDomains);
        } else {
          // Current domain is not authorized, hide domain info in header
          const domainInfoElement = document.querySelector('.domain-info');
          if (domainInfoElement) {
            domainInfoElement.style.display = 'none';
          }
        }
      }
    }
  );
}

// Function to display authorized domains
function displayAuthorizedDomains(domains) {
  // Update header domain info
  if (!headerDomainsList) return;
  
  headerDomainsList.innerHTML = '';
  
  // Only show current domain if it's authorized
  if (!currentDomain || !domains.includes(currentDomain)) {
    const noDomainsElement = document.createElement('p');
    noDomainsElement.textContent = '未授权';
    noDomainsElement.style.fontStyle = 'italic';
    noDomainsElement.style.color = 'var(--stats-label)';
    noDomainsElement.style.margin = '0';
    headerDomainsList.appendChild(noDomainsElement);
    
    // Set switch state
    if (headerAuthorizationSwitch) {
      headerAuthorizationSwitch.checked = false;
    }
    if (headerAuthStatus) {
      headerAuthStatus.textContent = '未启用';
      headerAuthStatus.className = 'auth-status disabled';
    }
    
    // Hide domain info in header
    const domainInfoElement = document.querySelector('.domain-info');
    if (domainInfoElement) {
      domainInfoElement.style.display = 'none';
    }
    
    // Show unauthorized content
    showUnauthorizedContent();
    return;
  }
  
  // Create domain text
  const domainText = document.createElement('span');
  domainText.textContent = currentDomain;
  domainText.style.flex = '1';
  domainText.style.fontWeight = '500';
  domainText.style.overflow = 'hidden';
  domainText.style.textOverflow = 'ellipsis';
  domainText.style.whiteSpace = 'nowrap';
  headerDomainsList.appendChild(domainText);
  
  // Set switch state
  if (headerAuthorizationSwitch) {
    headerAuthorizationSwitch.checked = true;
  }
  if (headerAuthStatus) {
    headerAuthStatus.textContent = '启用';
    headerAuthStatus.className = 'auth-status enabled';
  }
  
  // Show domain info in header
  const domainInfoElement = document.querySelector('.domain-info');
  if (domainInfoElement) {
    domainInfoElement.style.display = 'flex';
  }
  
  // Show authorized content
  document.getElementById('unauthorizedContent').style.display = 'none';
  document.getElementById('authorizedContent').style.display = 'block';
}

// Function to remove domain authorization
function removeDomainAuthorization(domain) {
  chrome.runtime.sendMessage(
    { action: "removeDomainAuthorization", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error removing domain authorization:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        // Clear table data
        allRequestsData = {};
        
        // Clear data in background script
        chrome.runtime.sendMessage(
          { action: "clearRequestData", tabId: currentTabId },
          () => {
            // Update UI
            renderRequestsTable();
            updateStatistics();
            
            // Hide request details (if visible)
            if (requestDetails) {
              requestDetails.style.display = 'none';
            }
          }
        );
        
        // Reload authorized domains list
        loadAuthorizedDomains();
        
        // If the removed domain is the current domain, show unauthorized content
        if (domain === currentDomain) {
          // Hide domain info in header
          const domainInfoElement = document.querySelector('.domain-info');
          if (domainInfoElement) {
            domainInfoElement.style.display = 'none';
          }
          
          // Show unauthorized content
          showUnauthorizedContent();
        }
      }
    }
  );
}

// Add table header click event
document.addEventListener('DOMContentLoaded', () => {
  // Set default sort column style
  setTimeout(() => {
    const defaultSortHeader = document.querySelector(`#requestsTable th[data-sort="${currentSortColumn}"]`);
    if (defaultSortHeader) {
      defaultSortHeader.classList.add(`sort-${currentSortDirection}`);
    }
  }, 100);
  
  // Add table header sort event
  const tableHeaders = document.querySelectorAll('#requestsTable th[data-sort]');
  if (tableHeaders && tableHeaders.length > 0) {
    tableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortColumn = header.getAttribute('data-sort');
        
        // If clicked is current sort column, switch sort direction
        if (sortColumn === currentSortColumn) {
          currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortColumn = sortColumn;
          currentSortDirection = 'desc'; // New column default descending
        }
        
        // Update table header style
        tableHeaders.forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        
        header.classList.add(`sort-${currentSortDirection}`);
        
        // Re-render table
        renderRequestsTable();
      });
    });
  }
});

// AI Analysis elements
const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
const aiAnalysisToggleBtn = document.getElementById('aiAnalysisToggleBtn');
const runAiAnalysisBtn = document.getElementById('runAiAnalysisBtn');
const aiAnalysisContent = document.getElementById('aiAnalysisContent');
const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
const aiAnalysisResult = document.getElementById('aiAnalysisResult');
const aiModelInfo = document.getElementById('aiModelInfo');
const copyAiResultBtn = document.getElementById('copyAiResultBtn');
const openOptionsPage = document.getElementById('openOptionsPage');

// Load settings from storage
chrome.storage.local.get(['showAiAnalysis'], (result) => {
  // If show AI analysis panel is set and page is authorized
  if (result.showAiAnalysis && document.getElementById('authorizedContent').style.display === 'block') {
    aiAnalysisContainer.classList.add('visible');
    aiAnalysisContainer.style.display = 'block';
  }
});

// Toggle AI analysis panel visibility
aiAnalysisToggleBtn.addEventListener('click', () => {
  const isVisible = aiAnalysisContainer.style.display === 'block';
  aiAnalysisContainer.style.display = isVisible ? 'none' : 'block';
  
  // Save display state
  chrome.storage.local.set({ showAiAnalysis: !isVisible });
});

// Open options page
openOptionsPage.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Run AI analysis
runAiAnalysisBtn.addEventListener('click', async () => {
  // First get AI configuration from storage
  chrome.storage.local.get(['aiApiKey', 'aiProvider', 'aiModel'], async (result) => {
    if (!result.aiApiKey) {
      aiAnalysisResult.textContent = '请先在配置页面设置API密钥';
      aiAnalysisContent.style.display = 'block';
      aiAnalysisStatus.style.display = 'none';
      return;
    }

    try {
      aiAnalysisContent.style.display = 'block';
      aiAnalysisStatus.style.display = 'flex';
      aiAnalysisResult.textContent = '正在准备分析数据...';

      // Copy network request data
      const requestsDataCopy = Object.assign({}, allRequestsData);
      
      // Prepare statistics data
      const statistics = {
        totalRequests: Object.keys(requestsDataCopy).length,
        totalSize: 0,
        totalTime: 0,
        slowestRequest: null,
        slowestTime: 0,
        statusCodes: {},
        contentTypes: {},
        domains: {}
      };
      
      // Calculate statistics data
      for (const reqId in requestsDataCopy) {
        const req = requestsDataCopy[reqId];
        
        // Total volume
        if (req.size) {
          statistics.totalSize += req.size;
        }
        
        // Total time
        if (req.totalTime) {
          statistics.totalTime += req.totalTime;
          
          // Slowest request
          if (req.totalTime > statistics.slowestTime) {
            statistics.slowestTime = req.totalTime;
            statistics.slowestRequest = req.url;
          }
        }
        
        // Status code distribution
        if (req.status) {
          const statusCode = req.status.toString();
          statistics.statusCodes[statusCode] = (statistics.statusCodes[statusCode] || 0) + 1;
        }
        
        // Content type distribution
        if (req.type) {
          statistics.contentTypes[req.type] = (statistics.contentTypes[req.type] || 0) + 1;
        }
        
        // Domain distribution
        if (req.domain) {
          statistics.domains[req.domain] = (statistics.domains[req.domain] || 0) + 1;
        }
      }
      
      // Prepare data
      const formattedData = AiConnector.formatNetworkDataForAI(requestsDataCopy, statistics);
      
      aiAnalysisResult.textContent = '正在发送数据到AI进行分析...';
      
      // Call AI analysis
      const analysisResult = await AiConnector.sendToAI(
        formattedData,
        result.aiProvider || 'openai',
        result.aiApiKey,
        result.aiModel || 'gpt-4-turbo'
      );
      
      // Display result
      aiAnalysisStatus.style.display = 'none';
      aiAnalysisResult.textContent = analysisResult.analysis;
      
      // Update model information
      aiModelInfo.textContent = `使用 ${analysisResult.model} (${analysisResult.provider}) 分析`;
    } catch (error) {
      aiAnalysisStatus.style.display = 'none';
      aiAnalysisResult.textContent = `错误: ${error.message}`;
    }
  });
});

// Copy AI analysis result
copyAiResultBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(aiAnalysisResult.textContent);
    copyAiResultBtn.textContent = '已复制!';
    setTimeout(() => {
      copyAiResultBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy AI analysis result:', err);
  }
});