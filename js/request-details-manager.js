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
  
  const detailTitle = document.createElement('h3');
  detailTitle.className = 'request-detail-title';
  detailTitle.textContent = 'Request Details';
  detailHeader.appendChild(detailTitle);
  
  const detailUrl = document.createElement('div');
  detailUrl.className = 'detail-url-container';
  
  try {
    const url = new URL(request.url);
    const urlStr = url.toString();
    
    // Create URL item
    const urlItem = document.createElement('div');
    urlItem.className = 'detail-item';
    
    const urlLabel = document.createElement('div');
    urlLabel.className = 'detail-label';
    urlLabel.textContent = 'URL';
    
    const urlValue = document.createElement('div');
    urlValue.className = 'detail-value';
    urlValue.textContent = urlStr;
    urlValue.title = urlStr;
    
    urlItem.appendChild(urlLabel);
    urlItem.appendChild(urlValue);
    detailUrl.appendChild(urlItem);
    
  } catch (e) {
    const urlItem = document.createElement('div');
    urlItem.className = 'detail-item';
    
    const urlLabel = document.createElement('div');
    urlLabel.className = 'detail-label';
    urlLabel.textContent = 'URL';
    
    const urlValue = document.createElement('div');
    urlValue.className = 'detail-value';
    urlValue.textContent = request.url || 'Unknown URL';
    
    urlItem.appendChild(urlLabel);
    urlItem.appendChild(urlValue);
    detailUrl.appendChild(urlItem);
  }
  
  detailHeader.appendChild(detailUrl);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  
  // 使用I18n支持关闭按钮的title
  const closeTitle = window.I18n ? window.I18n.getText('close') : '关闭详情';
  closeButton.setAttribute('title', closeTitle);
  
  closeButton.addEventListener('click', closeRequestDetails);
  
  // 将关闭按钮直接添加到requestDetails
  requestDetails.appendChild(closeButton);
  requestDetails.appendChild(detailHeader);
  
  // Create details content
  const detailContent = document.createElement('div');
  detailContent.className = 'detail-content';
  
  // Basic info section
  const basicInfoSection = document.createElement('div');
  basicInfoSection.className = 'detail-section';
  
  const basicInfoTitle = document.createElement('h4');
  basicInfoTitle.className = 'detail-title';
  basicInfoTitle.textContent = 'Basic Information';
  basicInfoSection.appendChild(basicInfoTitle);
  
  // Method
  const methodItem = document.createElement('div');
  methodItem.className = 'detail-item';
  
  const methodLabel = document.createElement('div');
  methodLabel.className = 'detail-label';
  methodLabel.textContent = 'Method';
  
  const methodValue = document.createElement('div');
  methodValue.className = 'detail-value';
  methodValue.textContent = request.method || '-';
  
  methodItem.appendChild(methodLabel);
  methodItem.appendChild(methodValue);
  basicInfoSection.appendChild(methodItem);
  
  // Status
  const statusItem = document.createElement('div');
  statusItem.className = 'detail-item';
  
  const statusLabel = document.createElement('div');
  statusLabel.className = 'detail-label';
  statusLabel.textContent = 'Status';
  
  const statusValue = document.createElement('div');
  statusValue.className = 'detail-value';
  
  if (request.error) {
    statusValue.className += ' status-error';
    statusValue.textContent = `Error: ${request.error}`;
  } else {
    if (request.status >= 400) {
      statusValue.className += ' status-error';
    } else if (request.status >= 300) {
      statusValue.className += ' status-redirect';
    } else {
      statusValue.className += ' status-success';
    }
    statusValue.textContent = request.status || 'Pending';
  }
  
  statusItem.appendChild(statusLabel);
  statusItem.appendChild(statusValue);
  basicInfoSection.appendChild(statusItem);
  
  // Type
  const typeItem = document.createElement('div');
  typeItem.className = 'detail-item';
  
  const typeLabel = document.createElement('div');
  typeLabel.className = 'detail-label';
  typeLabel.textContent = 'Resource Type';
  
  const typeValue = document.createElement('div');
  typeValue.className = 'detail-value';
  typeValue.textContent = request.type || '-';
  
  typeItem.appendChild(typeLabel);
  typeItem.appendChild(typeValue);
  basicInfoSection.appendChild(typeItem);
  
  // Domain
  const domainItem = document.createElement('div');
  domainItem.className = 'detail-item';
  
  const domainLabel = document.createElement('div');
  domainLabel.className = 'detail-label';
  domainLabel.textContent = 'Domain';
  
  const domainValue = document.createElement('div');
  domainValue.className = 'detail-value';
  domainValue.textContent = request.domain || '-';
  
  domainItem.appendChild(domainLabel);
  domainItem.appendChild(domainValue);
  basicInfoSection.appendChild(domainItem);
  
  detailContent.appendChild(basicInfoSection);
  
  // Timing section
  const timingSection = document.createElement('div');
  timingSection.className = 'detail-section';
  
  const timingTitle = document.createElement('h4');
  timingTitle.className = 'detail-title';
  timingTitle.textContent = 'Timing Information';
  timingSection.appendChild(timingTitle);
  
  // Total Time
  const totalTimeItem = document.createElement('div');
  totalTimeItem.className = 'detail-item';
  
  const totalTimeLabel = document.createElement('div');
  totalTimeLabel.className = 'detail-label';
  totalTimeLabel.textContent = 'Total Time';
  
  const totalTimeValue = document.createElement('div');
  totalTimeValue.className = 'detail-value ' + getLoadTimeClass(request.totalTime);
  totalTimeValue.textContent = formatTime(request.totalTime);
  
  totalTimeItem.appendChild(totalTimeLabel);
  totalTimeItem.appendChild(totalTimeValue);
  timingSection.appendChild(totalTimeItem);
  
  // TTFB
  const ttfbItem = document.createElement('div');
  ttfbItem.className = 'detail-item';
  
  const ttfbLabel = document.createElement('div');
  ttfbLabel.className = 'detail-label';
  ttfbLabel.textContent = 'Time to First Byte';
  
  const ttfbValue = document.createElement('div');
  ttfbValue.className = 'detail-value ' + getLoadTimeClass(request.ttfb);
  ttfbValue.textContent = formatTime(request.ttfb);
  
  ttfbItem.appendChild(ttfbLabel);
  ttfbItem.appendChild(ttfbValue);
  timingSection.appendChild(ttfbItem);
  
  // Content Download Time
  const contentTimeItem = document.createElement('div');
  contentTimeItem.className = 'detail-item';
  
  const contentTimeLabel = document.createElement('div');
  contentTimeLabel.className = 'detail-label';
  contentTimeLabel.textContent = 'Content Download Time';
  
  const contentTimeValue = document.createElement('div');
  contentTimeValue.className = 'detail-value ' + getLoadTimeClass(request.contentDownloadTime);
  contentTimeValue.textContent = formatTime(request.contentDownloadTime);
  
  contentTimeItem.appendChild(contentTimeLabel);
  contentTimeItem.appendChild(contentTimeValue);
  timingSection.appendChild(contentTimeItem);
  
  // Start Time
  if (request.startTime) {
    const startTimeItem = document.createElement('div');
    startTimeItem.className = 'detail-item';
    
    const startTimeLabel = document.createElement('div');
    startTimeLabel.className = 'detail-label';
    startTimeLabel.textContent = 'Start Time';
    
    const startTime = new Date(request.startTime);
    const startTimeValue = document.createElement('div');
    startTimeValue.className = 'detail-value';
    startTimeValue.textContent = `${startTime.toLocaleTimeString()}.${startTime.getMilliseconds()}`;
    
    startTimeItem.appendChild(startTimeLabel);
    startTimeItem.appendChild(startTimeValue);
    timingSection.appendChild(startTimeItem);
  }
  
  // End Time
  if (request.endTime) {
    const endTimeItem = document.createElement('div');
    endTimeItem.className = 'detail-item';
    
    const endTimeLabel = document.createElement('div');
    endTimeLabel.className = 'detail-label';
    endTimeLabel.textContent = 'End Time';
    
    const endTime = new Date(request.endTime);
    const endTimeValue = document.createElement('div');
    endTimeValue.className = 'detail-value';
    endTimeValue.textContent = `${endTime.toLocaleTimeString()}.${endTime.getMilliseconds()}`;
    
    endTimeItem.appendChild(endTimeLabel);
    endTimeItem.appendChild(endTimeValue);
    timingSection.appendChild(endTimeItem);
  }
  
  detailContent.appendChild(timingSection);
  
  // Size section
  const sizeSection = document.createElement('div');
  sizeSection.className = 'detail-section';
  
  const sizeTitle = document.createElement('h4');
  sizeTitle.className = 'detail-title';
  sizeTitle.textContent = 'Size Information';
  sizeSection.appendChild(sizeTitle);
  
  // Response Size
  const responseSizeItem = document.createElement('div');
  responseSizeItem.className = 'detail-item';
  
  const responseSizeLabel = document.createElement('div');
  responseSizeLabel.className = 'detail-label';
  responseSizeLabel.textContent = 'Response Size';
  
  const responseSizeValue = document.createElement('div');
  responseSizeValue.className = 'detail-value';
  responseSizeValue.textContent = formatSize(request.responseSize);
  
  responseSizeItem.appendChild(responseSizeLabel);
  responseSizeItem.appendChild(responseSizeValue);
  sizeSection.appendChild(responseSizeItem);
  
  // Headers Size
  if (request.responseHeadersSize) {
    const headersSizeItem = document.createElement('div');
    headersSizeItem.className = 'detail-item';
    
    const headersSizeLabel = document.createElement('div');
    headersSizeLabel.className = 'detail-label';
    headersSizeLabel.textContent = 'Headers Size';
    
    const headersSizeValue = document.createElement('div');
    headersSizeValue.className = 'detail-value';
    headersSizeValue.textContent = formatSize(request.responseHeadersSize);
    
    headersSizeItem.appendChild(headersSizeLabel);
    headersSizeItem.appendChild(headersSizeValue);
    sizeSection.appendChild(headersSizeItem);
  }
  
  detailContent.appendChild(sizeSection);
  
  // Add copy details button
  const copyDetailsBtnContainer = document.createElement('div');
  copyDetailsBtnContainer.className = 'detail-actions';
  
  const copyDetailsBtn = document.createElement('button');
  copyDetailsBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg> Copy Details';
  copyDetailsBtn.className = 'btn-copy-details';
  copyDetailsBtn.addEventListener('click', () => {
    copyRequestDetails(request);
  });
  
  copyDetailsBtnContainer.appendChild(copyDetailsBtn);
  detailContent.appendChild(copyDetailsBtnContainer);
  
  requestDetails.appendChild(detailContent);
  
  // Create modal backdrop if it doesn't exist
  let modalBackdrop = document.getElementById('modalBackdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'modalBackdrop';
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.addEventListener('click', closeRequestDetails);
    document.body.appendChild(modalBackdrop);
  }
  
  // 在显示之前先构建好所有内容
  // 防止重复动画导致的抖动
  requestDetails.style.animation = 'none';
  modalBackdrop.style.animation = 'none';
  requestDetails.style.transform = 'translate(-50%, -50%)';
  
  // Reset animations by forcing reflow
  requestDetails.classList.remove('closing');
  modalBackdrop.classList.remove('closing');
  
  // 先显示背景
  modalBackdrop.style.display = 'block';
  
  // 强制回流
  void modalBackdrop.offsetWidth;
  
  // 再显示弹窗 (分离显示操作以避免抖动)
  requestDetails.style.display = 'block';
  
  // 强制回流
  void requestDetails.offsetWidth;
  
  // 重新启用动画（在下一个渲染周期）
  requestAnimationFrame(() => {
    requestDetails.style.animation = '';
    modalBackdrop.style.animation = '';
  });
  
  // Add keydown event listener for ESC key
  document.addEventListener('keydown', handleEscKeyPress);
}

/**
 * Close request details modal
 */
function closeRequestDetails() {
  const requestDetails = document.getElementById('requestDetails');
  const modalBackdrop = document.getElementById('modalBackdrop');
  
  if (!requestDetails) return;
  
  // 防止用户多次点击关闭按钮
  document.removeEventListener('keydown', handleEscKeyPress);
  
  // 防止鼠标悬停引起的抖动
  requestDetails.style.pointerEvents = 'none';
  
  // Add closing animation classes
  requestDetails.classList.add('closing');
  if (modalBackdrop) {
    modalBackdrop.classList.add('closing');
  }
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    requestDetails.style.display = 'none';
    requestDetails.classList.remove('closing');
    requestDetails.style.pointerEvents = '';
    
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
      modalBackdrop.classList.remove('closing');
    }
    
    // Deselect any selected row
    document.querySelectorAll('#requestsTableBody tr').forEach(r => r.classList.remove('selected-row'));
  }, 200); // Matches animation duration
}

/**
 * Handle ESC key press to close modal
 */
function handleEscKeyPress(e) {
  if (e.key === 'Escape') {
    closeRequestDetails();
  }
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
  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : ''}`;
  
  // Add icon
  const iconDiv = document.createElement('div');
  iconDiv.className = 'notification-icon';
  
  if (isError) {
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  }
  
  notification.appendChild(iconDiv);
  
  // Add text
  const textDiv = document.createElement('div');
  textDiv.className = 'notification-text';
  textDiv.textContent = message;
  notification.appendChild(textDiv);
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Make functions available globally
(function(global) {
  global.RequestDetailsManager = {
    showRequestDetails,
    closeRequestDetails,
    copyRequestDetails,
    showNotification
  };
})(typeof window !== 'undefined' ? window : self);