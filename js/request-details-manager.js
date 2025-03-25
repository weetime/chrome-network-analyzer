/**
 * Request Details Manager - Handles displaying and copying request details
 */

/**
 * Show details for a selected request
 */
function showRequestDetails(request) {
  const requestDetails = document.getElementById('requestDetails');
  
  if (!requestDetails) return;
  
  // Check if we have TableManager for formatting
  const formatTime = window.TableManager && window.TableManager.formatTime ? 
    window.TableManager.formatTime : 
    (time => `${time}ms`);
  
  const formatSize = window.TableManager && window.TableManager.formatSize ? 
    window.TableManager.formatSize : 
    (size => `${size} bytes`);
  
  const getLoadTimeClass = window.TableManager && window.TableManager.getLoadTimeClass ? 
    window.TableManager.getLoadTimeClass : 
    (() => '');
  
  // Clear previous details
  requestDetails.innerHTML = '';
  
  // Create header with URL
  const detailHeader = document.createElement('div');
  detailHeader.className = 'detail-header';
  
  const detailUrl = document.createElement('div');
  detailUrl.className = 'detail-url-container';
  
  try {
    const url = new URL(request.url);
    
    // Create hostname element
    const hostname = document.createElement('span');
    hostname.className = 'detail-hostname';
    hostname.textContent = url.hostname;
    detailUrl.appendChild(hostname);
    
    // Create path element
    const path = document.createElement('span');
    path.className = 'detail-path';
    path.textContent = url.pathname + url.search;
    detailUrl.appendChild(path);
  } catch (e) {
    detailUrl.textContent = request.url || 'Unknown URL';
  }
  
  detailHeader.appendChild(detailUrl);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    requestDetails.innerHTML = '';
    document.querySelectorAll('#requestsTableBody tr').forEach(r => r.classList.remove('selected-row'));
  });
  detailHeader.appendChild(closeButton);
  
  requestDetails.appendChild(detailHeader);
  
  // Create details content
  const detailContent = document.createElement('div');
  detailContent.className = 'detail-content';
  
  // Basic info section
  const basicInfoSection = document.createElement('div');
  basicInfoSection.className = 'detail-section';
  
  const basicInfoTitle = document.createElement('h3');
  basicInfoTitle.textContent = 'Basic Information';
  basicInfoSection.appendChild(basicInfoTitle);
  
  const basicInfoTable = document.createElement('table');
  basicInfoTable.className = 'detail-table';
  
  // Method & Status
  const methodRow = document.createElement('tr');
  methodRow.innerHTML = `<td>Method</td><td>${request.method || '-'}</td>`;
  basicInfoTable.appendChild(methodRow);
  
  const statusRow = document.createElement('tr');
  if (request.error) {
    statusRow.innerHTML = `<td>Status</td><td class="error">Error: ${request.error}</td>`;
  } else {
    const statusClass = request.status >= 400 ? 'error' : 
                       request.status >= 300 ? 'redirect' : 'success';
    statusRow.innerHTML = `<td>Status</td><td class="${statusClass}">${request.status || 'Pending'}</td>`;
  }
  basicInfoTable.appendChild(statusRow);
  
  // Type
  const typeRow = document.createElement('tr');
  typeRow.innerHTML = `<td>Resource Type</td><td>${request.type || '-'}</td>`;
  basicInfoTable.appendChild(typeRow);
  
  // Domain
  const domainRow = document.createElement('tr');
  domainRow.innerHTML = `<td>Domain</td><td>${request.domain || '-'}</td>`;
  basicInfoTable.appendChild(domainRow);
  
  basicInfoSection.appendChild(basicInfoTable);
  detailContent.appendChild(basicInfoSection);
  
  // Timing section
  const timingSection = document.createElement('div');
  timingSection.className = 'detail-section';
  
  const timingTitle = document.createElement('h3');
  timingTitle.textContent = 'Timing Information';
  timingSection.appendChild(timingTitle);
  
  const timingTable = document.createElement('table');
  timingTable.className = 'detail-table';
  
  // Total Time
  const totalTimeRow = document.createElement('tr');
  const totalTimeClass = getLoadTimeClass(request.totalTime);
  totalTimeRow.innerHTML = `<td>Total Time</td><td class="${totalTimeClass}">${formatTime(request.totalTime)}</td>`;
  timingTable.appendChild(totalTimeRow);
  
  // TTFB
  const ttfbRow = document.createElement('tr');
  const ttfbClass = getLoadTimeClass(request.ttfb);
  ttfbRow.innerHTML = `<td>Time to First Byte</td><td class="${ttfbClass}">${formatTime(request.ttfb)}</td>`;
  timingTable.appendChild(ttfbRow);
  
  // Content Download Time
  const contentTimeRow = document.createElement('tr');
  const contentTimeClass = getLoadTimeClass(request.contentDownloadTime);
  contentTimeRow.innerHTML = `<td>Content Download Time</td><td class="${contentTimeClass}">${formatTime(request.contentDownloadTime)}</td>`;
  timingTable.appendChild(contentTimeRow);
  
  // Start Time
  if (request.startTime) {
    const startTimeRow = document.createElement('tr');
    const startTime = new Date(request.startTime);
    startTimeRow.innerHTML = `<td>Start Time</td><td>${startTime.toLocaleTimeString()}.${startTime.getMilliseconds()}</td>`;
    timingTable.appendChild(startTimeRow);
  }
  
  // End Time
  if (request.endTime) {
    const endTimeRow = document.createElement('tr');
    const endTime = new Date(request.endTime);
    endTimeRow.innerHTML = `<td>End Time</td><td>${endTime.toLocaleTimeString()}.${endTime.getMilliseconds()}</td>`;
    timingTable.appendChild(endTimeRow);
  }
  
  timingSection.appendChild(timingTable);
  detailContent.appendChild(timingSection);
  
  // Size section
  const sizeSection = document.createElement('div');
  sizeSection.className = 'detail-section';
  
  const sizeTitle = document.createElement('h3');
  sizeTitle.textContent = 'Size Information';
  sizeSection.appendChild(sizeTitle);
  
  const sizeTable = document.createElement('table');
  sizeTable.className = 'detail-table';
  
  // Response Size
  const responseSizeRow = document.createElement('tr');
  responseSizeRow.innerHTML = `<td>Response Size</td><td>${formatSize(request.responseSize)}</td>`;
  sizeTable.appendChild(responseSizeRow);
  
  // Headers Size
  if (request.responseHeadersSize) {
    const headersSizeRow = document.createElement('tr');
    headersSizeRow.innerHTML = `<td>Headers Size</td><td>${formatSize(request.responseHeadersSize)}</td>`;
    sizeTable.appendChild(headersSizeRow);
  }
  
  sizeSection.appendChild(sizeTable);
  detailContent.appendChild(sizeSection);
  
  // Add copy details button
  const copyDetailsBtnContainer = document.createElement('div');
  copyDetailsBtnContainer.className = 'detail-actions';
  
  const copyDetailsBtn = document.createElement('button');
  copyDetailsBtn.textContent = 'Copy Details';
  copyDetailsBtn.className = 'copy-details-btn';
  copyDetailsBtn.addEventListener('click', () => {
    copyRequestDetails(request);
  });
  
  copyDetailsBtnContainer.appendChild(copyDetailsBtn);
  detailContent.appendChild(copyDetailsBtnContainer);
  
  requestDetails.appendChild(detailContent);
  
  // Show the details container
  requestDetails.style.display = 'block';
}

/**
 * Copy request details to clipboard
 */
function copyRequestDetails(request) {
  // Check if we have TableManager for formatting
  const formatTime = window.TableManager && window.TableManager.formatTime ? 
    window.TableManager.formatTime : 
    (time => `${time}ms`);
  
  const formatSize = window.TableManager && window.TableManager.formatSize ? 
    window.TableManager.formatSize : 
    (size => `${size} bytes`);
  
  // Create formatted details text
  let detailsText = `Chrome Network Analyzer - Request Details\n`;
  detailsText += `URL: ${request.url}\n\n`;
  
  // Basic Info
  detailsText += `Basic Information:\n`;
  detailsText += `- Method: ${request.method || '-'}\n`;
  detailsText += `- Status: ${request.error ? 'Error: ' + request.error : request.status || 'Pending'}\n`;
  detailsText += `- Resource Type: ${request.type || '-'}\n`;
  detailsText += `- Domain: ${request.domain || '-'}\n\n`;
  
  // Timing Info
  detailsText += `Timing Information:\n`;
  detailsText += `- Total Time: ${formatTime(request.totalTime)}\n`;
  detailsText += `- Time to First Byte: ${formatTime(request.ttfb)}\n`;
  detailsText += `- Content Download Time: ${formatTime(request.contentDownloadTime)}\n`;
  
  if (request.startTime) {
    const startTime = new Date(request.startTime);
    detailsText += `- Start Time: ${startTime.toLocaleTimeString()}.${startTime.getMilliseconds()}\n`;
  }
  
  if (request.endTime) {
    const endTime = new Date(request.endTime);
    detailsText += `- End Time: ${endTime.toLocaleTimeString()}.${endTime.getMilliseconds()}\n`;
  }
  
  detailsText += `\n`;
  
  // Size Info
  detailsText += `Size Information:\n`;
  detailsText += `- Response Size: ${formatSize(request.responseSize)}\n`;
  
  if (request.responseHeadersSize) {
    detailsText += `- Headers Size: ${formatSize(request.responseHeadersSize)}\n`;
  }
  
  // Copy to clipboard
  navigator.clipboard.writeText(detailsText).then(() => {
    // Show notification
    showNotification('Details copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy details: ', err);
    showNotification('Failed to copy details', true);
  });
}

/**
 * Show a notification message
 */
function showNotification(message, isError = false) {
  // Check if notification container exists
  let notificationContainer = document.getElementById('notificationContainer');
  
  // Create if it doesn't exist
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notificationContainer.contains(notification)) {
        notificationContainer.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Make functions available globally
(function(global) {
  global.RequestDetailsManager = {
    showRequestDetails,
    copyRequestDetails,
    showNotification
  };
})(typeof window !== 'undefined' ? window : self);