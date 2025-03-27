/**
 * Popup Main Script - Integrates all modules and initializes the popup functionality
 */

// Global variables
let currentTabId = null;
let updateInterval = null; // 用于存储更新定时器的ID

// 初始化国际化
async function initI18n() {
  if (window.I18n) {
    try {
      // 初始化I18n并加载语言包
      await window.I18n.init();
      console.log('I18n initialized with language:', window.I18n.getCurrentLanguage());
      
      // 确保语言设置应用到页面
      window.I18n.updatePageText();
      
      // 设置html元素的lang属性，用于CSS选择器匹配
      document.documentElement.lang = window.I18n.getCurrentLanguage();
    } catch (error) {
      console.error('Failed to initialize I18n:', error);
    }
  }
}

// 处理新的网络请求消息
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 处理请求完成的消息
    if (message.action === "requestCompleted" && message.tabId === currentTabId) {
      // 获取当前数据
      const currentData = window.TableManager ? window.TableManager.getRequestData() : {};
      // 更新特定请求的数据
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // 更新表格
        if (window.TableManager) {
          window.TableManager.updateTableData(currentData);
        }
        // 更新统计信息
        if (window.StatsManager) {
          window.StatsManager.updateStatistics();
          
          // 确保国际化更新
          if (window.I18n) {
            window.I18n.updatePageText();
          }
        }
      }
    }
    
    // 处理请求失败的消息
    if (message.action === "requestFailed" && message.tabId === currentTabId) {
      // 获取当前数据
      const currentData = window.TableManager ? window.TableManager.getRequestData() : {};
      // 更新特定请求的数据
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // 更新表格
        if (window.TableManager) {
          window.TableManager.updateTableData(currentData);
        }
        // 更新统计信息
        if (window.StatsManager) {
          window.StatsManager.updateStatistics();
          
          // 确保国际化更新
          if (window.I18n) {
            window.I18n.updatePageText();
          }
        }
      }
    }
    
    // 需要返回true以保持消息通道开放
    return true;
  });
}

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
        // Update table data using TableManager
        if (window.TableManager) {
          window.TableManager.updateTableData(response.requestData);
        }
        
        // Update statistics if StatsManager is available
        if (window.StatsManager) {
          window.StatsManager.updateStatistics();
          
          // 确保国际化更新
          if (window.I18n) {
            window.I18n.updatePageText();
          }
        }
      }
    }
  );
}

// 开始实时更新
function startRealTimeUpdates() {
  // 清除之前的定时器（如果存在）
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // 设置新的定时器，每3秒更新一次数据
  updateInterval = setInterval(requestNetworkData, 3000);
}

// 停止实时更新
function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Setup event handlers for control buttons
function setupControlButtons() {
  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  // Clear button
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearData);
  }
  
  // Analyze button
  const analyzeButton = document.getElementById('runAiAnalysisBtn');
  if (analyzeButton) {
    if (window.AiAnalysisManager && window.AiAnalysisManager.runAnalysis) {
      // Use the module if available
      analyzeButton.addEventListener('click', window.AiAnalysisManager.runAnalysis);
    } else {
      // Fallback to legacy function
      analyzeButton.addEventListener('click', runAiAnalysis);
    }
  }
  
  // AI分析切换按钮
  const aiAnalysisToggleBtn = document.getElementById('aiAnalysisToggleBtn');
  if (aiAnalysisToggleBtn) {
    aiAnalysisToggleBtn.addEventListener('click', () => {
      // 打开独立的AI分析页面，并传递当前的tabId参数
      chrome.tabs.create({
        url: chrome.runtime.getURL(`ai-analysis.html?tabId=${currentTabId}`)
      });
    });
  }
  
  // 打开设置页面
  const openOptionsPage = document.getElementById('openOptionsPage');
  if (openOptionsPage) {
    openOptionsPage.addEventListener('click', (e) => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
}

// Export data as JSON
function exportData() {
  const requestData = window.TableManager ? window.TableManager.getRequestData() : {};
  
  if (Object.keys(requestData).length === 0) {
    const noDataMsg = window.I18n ? window.I18n.getText('noDataMessage') : 'No data to export.';
    alert(noDataMsg);
    return;
  }
  
  // Create a blob with the data
  const dataStr = JSON.stringify(requestData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Get current date/time for filename
  const date = new Date();
  const dateStr = date.toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
  
  // Set download attributes
  a.download = `network_data_${dateStr}.json`;
  a.href = url;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Clear network data
function clearData() {
  const confirmMsg = window.I18n ? window.I18n.getText('confirm') : 'Are you sure you want to clear all network data for this tab?';
  
  if (confirm(confirmMsg)) {
    chrome.runtime.sendMessage(
      { action: "clearRequestData", tabId: currentTabId },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error clearing data:", chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          // Clear table data using TableManager
          if (window.TableManager) {
            window.TableManager.clearRequestData();
          }
          
          // Update statistics if StatsManager is available
          if (window.StatsManager) {
            window.StatsManager.updateStatistics();
          }
          
          // Clear request details
          const requestDetails = document.getElementById('requestDetails');
          if (requestDetails) {
            requestDetails.innerHTML = '';
            requestDetails.style.display = 'none';
          }
          
          // Show no data message
          const noDataMessage = document.getElementById('noDataMessage');
          if (noDataMessage) {
            noDataMessage.style.display = 'block';
          }
        }
      }
    );
  }
}

// Initialize the popup
async function initPopup() {
  console.log('Initializing popup...');
  
  try {
    // 初始化多语言支持
    await initI18n();
    
    // 设置消息监听，用于接收实时网络请求更新
    setupMessageListeners();
    
    // Initialize theme manager if available
    if (window.ThemeManager) {
      window.ThemeManager.init();
      console.log('Theme manager initialized');
    }
    
    // Initialize table manager if available
    if (window.TableManager) {
      window.TableManager.init();
      console.log('Table manager initialized');
    }
    
    // Initialize domain auth UI if available
    if (window.DomainAuthUi) {
      window.DomainAuthUi.init();
      console.log('Domain auth UI initialized');
    }
    
    // Initialize AI analysis manager if available
    if (window.AiAnalysisManager) {
      window.AiAnalysisManager.init();
      console.log('AI analysis manager initialized');
    }
    
    // Setup control buttons
    setupControlButtons();
    console.log('Control buttons initialized');
    
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab) {
      currentTabId = currentTab.id;
      
      // Extract domain from current tab URL
      try {
        const url = new URL(currentTab.url);
        const domain = url.hostname;
        
        // Set current domain
        if (window.DomainAuthUi) {
          const isAuthorized = await window.DomainAuthUi.setCurrentDomain(domain);
          if (isAuthorized) {
            // If domain is authorized, request network data
            requestNetworkData();
            // 启动实时更新
            startRealTimeUpdates();
          }
        } else {
          // Legacy flow
          checkDomainAndLoadData(domain);
        }
      } catch (error) {
        console.error("Error extracting domain:", error);
        // If we can't extract domain, just try to get data
        document.getElementById('authorizedContent').style.display = 'block';
        requestNetworkData();
        // 启动实时更新
        startRealTimeUpdates();
      }
    }
    
    // 在页面关闭时停止实时更新
    window.addEventListener('unload', stopRealTimeUpdates);
    
  } catch (error) {
    console.error("Error initializing popup:", error);
  }
}

// Legacy function for domain checking
function checkDomainAndLoadData(domain) {
  // 无论域名是否授权，都显示域名信息区域
  const domainInfo = document.querySelector('.domain-info');
  if (domainInfo) {
    domainInfo.style.display = 'flex';
  }
  
  chrome.runtime.sendMessage(
    { action: "checkDomainAuthorization", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error checking domain authorization:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.isAuthorized) {
        // Domain is authorized, request data
        // Show authorized content area
        document.getElementById('authorizedContent').style.display = 'block';
        
        // Update header authorization switch
        const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
        const headerAuthStatus = document.getElementById('headerAuthStatus');
        
        if (headerAuthorizationSwitch) {
          headerAuthorizationSwitch.checked = true;
        }
        if (headerAuthStatus) {
          headerAuthStatus.textContent = window.I18n ? window.I18n.getText('enable') : '启用';
          headerAuthStatus.className = 'auth-status enabled';
        }
        
        requestNetworkData();
        // 启动实时更新
        startRealTimeUpdates();
      } else {
        // Domain is not authorized, show authorization UI
        if (window.DomainAuthUi) {
          window.DomainAuthUi.hideAuthorizedContent();
        } else {
          document.getElementById('authorizedContent').style.display = 'none';
        }
        
        // Update header authorization switch
        const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
        const headerAuthStatus = document.getElementById('headerAuthStatus');
        
        if (headerAuthorizationSwitch) {
          headerAuthorizationSwitch.checked = false;
        }
        if (headerAuthStatus) {
          headerAuthStatus.textContent = window.I18n ? window.I18n.getText('disable') : '禁用';
          headerAuthStatus.className = 'auth-status disabled';
        }
      }
    }
  );
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // 使用IIFE包装async函数调用
  (async () => {
    try {
      await initPopup();
    } catch (error) {
      console.error('Error in popup initialization:', error);
    }
  })();
});