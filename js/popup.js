/**
 * Popup Main Script - Integrates all modules and initializes the popup functionality
 */

// Import all required modules
import { I18n } from './i18n.js';
import './i18n/zh.js'; 
import './i18n/en.js';
import { AiConnector } from './ai-connector.js';
import { ThemeManager } from './theme-manager.js';
import { DomainManager } from './domain-manager.js';
import { NetworkTracker } from './network-tracker.js';
import { TableManager } from './table-manager.js';
import { StatsManager } from './stats-manager.js';
import { RequestDetailsManager } from './request-details-manager.js';
import { AiAnalysisManager } from './ai-analysis-manager.js';
import { DomainAuthUI } from './domain-auth-ui.js';
import { ToastManager } from './toast-manager.js';

// Global variables
let currentTabId = null;
let updateInterval = null; // 用于存储更新定时器的ID

// 初始化国际化
async function initI18n() {
  try {
    // 初始化I18n并加载语言包
    await I18n.init();
    console.log('I18n initialized with language:', I18n.getCurrentLanguage());
    
    // 确保语言设置应用到页面
    I18n.updatePageText();
    
    // 设置html元素的lang属性，用于CSS选择器匹配
    document.documentElement.lang = I18n.getCurrentLanguage();
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

// 处理新的网络请求消息
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 处理请求完成的消息
    if (message.action === "requestCompleted" && message.tabId === currentTabId) {
      // 获取当前数据
      const currentData = TableManager.getRequestData();
      // 更新特定请求的数据
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // 更新表格
        TableManager.updateTableData(currentData);
        // 更新统计信息
        StatsManager.updateStatistics();
        
        // 确保国际化更新
        I18n.updatePageText();
      }
    }
    
    // 处理请求失败的消息
    if (message.action === "requestFailed" && message.tabId === currentTabId) {
      // 获取当前数据
      const currentData = TableManager.getRequestData();
      // 更新特定请求的数据
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // 更新表格
        TableManager.updateTableData(currentData);
        // 更新统计信息
        StatsManager.updateStatistics();
        
        // 确保国际化更新
        I18n.updatePageText();
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
        TableManager.updateTableData(response.requestData);
        
        // Update statistics
        StatsManager.updateStatistics();
        
        // 确保国际化更新
        I18n.updatePageText();
      }
    }
  );
}

// 将 requestNetworkData 函数设置为全局变量，以便其他模块可以访问
window.requestNetworkData = requestNetworkData;

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
    analyzeButton.addEventListener('click', AiAnalysisManager.runAiAnalysis);
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
  const requestData = TableManager.getRequestData();
  
  if (Object.keys(requestData).length === 0) {
    // 没有数据时不显示 toast，直接返回
    console.log('No data to export');
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
  
  // Set attributes and click to trigger download
  a.href = url;
  a.download = `network_data_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Clear network request data
function clearData() {
  const confirmMsg = I18n.getText('confirmClear') || 'Are you sure you want to clear all network data?';
  
  // 创建自定义确认对话框
  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'custom-confirm';
  confirmDialog.innerHTML = `
    <div class="confirm-content">
      <div class="confirm-message">${confirmMsg}</div>
      <div class="confirm-buttons">
        <button class="cancel-btn">${I18n.getText('cancel') || 'Cancel'}</button>
        <button class="confirm-btn">${I18n.getText('confirm') || 'Confirm'}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmDialog);
  
  // 添加事件监听器
  return new Promise(resolve => {
    // 取消按钮
    confirmDialog.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(false);
    });
    
    // 确认按钮
    confirmDialog.querySelector('.confirm-btn').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(true);
      
      // 执行清除操作
      chrome.runtime.sendMessage(
        { action: "clearRequestData", tabId: currentTabId },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error clearing request data:", chrome.runtime.lastError);
            return;
          }
          
          if (response && response.success) {
            // Clear table data
            TableManager.updateTableData({});
            
            // Update statistics
            StatsManager.updateStatistics();
            
            // Close any open request details
            try {
              if (RequestDetailsManager && typeof RequestDetailsManager.closeRequestDetails === 'function') {
                RequestDetailsManager.closeRequestDetails();
              } else if (RequestDetailsManager && typeof RequestDetailsManager.closeDetails === 'function') {
                RequestDetailsManager.closeDetails();
              }
            } catch (error) {
              console.error('Error closing request details:', error);
            }
            
            // 不显示成功消息 toast
            console.log('Data cleared successfully');
          } else if (response && response.error) {
            console.error("Error clearing data:", response.error);
          }
        }
      );
    });
  });
}

// 初始化弹出界面
async function initPopup() {
  console.log("Initializing popup...");
  
  // 初始化国际化支持
  await initI18n();
  
  // 初始化主题控制器
  ThemeManager.init();
  
  // 获取当前活动标签页
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0) {
      currentTabId = tabs[0].tabId || tabs[0].id;
      const domain = new URL(tabs[0].url).hostname;
      
      console.log(`Current tab: ${currentTabId}, Domain: ${domain}`);
      
      // 启动网络数据模块
      await TableManager.init({
        tableId: 'requestsTable',
        bodyId: 'requestsTableBody',
        noDataMessageId: 'noDataMessage',
        requestDetailsManager: RequestDetailsManager
      });
      
      // 初始化详情管理器
      await RequestDetailsManager.init({
        detailsContainerId: 'requestDetails'
      });
      
      // 初始化统计模块
      await StatsManager.init({
        containerId: 'statsContainer',
        getRequestData: TableManager.getRequestData
      });
      
      // 初始化AI分析管理器
      await AiAnalysisManager.init({
        containerId: 'aiAnalysisContainer',
        statusId: 'aiAnalysisStatus',
        resultId: 'aiAnalysisResult',
        modelInfoId: 'aiModelInfo',
        copyButtonId: 'copyAiResultBtn',
        getRequestData: TableManager.getRequestData,
        tabId: currentTabId
      });
      
      // 初始化域名身份验证UI
      await DomainAuthUI.init({
        domainListId: 'headerDomainsList',
        switchId: 'headerAuthorizationSwitch',
        statusId: 'headerAuthStatus',
        settingsLinkId: 'openDomainSettings'
      });
      
      // 显示当前域名并检查授权
      checkDomainAndLoadData(domain);
    }
  });
  
  // 设置消息监听器
  setupMessageListeners();
  
  // 设置控制按钮事件监听器
  setupControlButtons();
  
  // 启动实时更新
  startRealTimeUpdates();
  
  // 监听弹窗关闭事件
  window.addEventListener('beforeunload', function() {
    stopRealTimeUpdates();
  });
}

// 检查域名授权并加载数据
function checkDomainAndLoadData(domain) {
  // 使用 setCurrentDomain 方法设置当前域名，该方法会同时更新 UI 显示
  DomainAuthUI.setCurrentDomain(domain).then(isAuthorized => {
    if (isAuthorized) {
      // 域名已授权，加载网络数据
      console.log(`Domain ${domain} is authorized, loading network data...`);
      requestNetworkData();
      
      // 显示授权内容
      document.getElementById('authorizedContent').style.display = 'block';
    } else {
      // 域名未授权，显示授权表单
      console.log(`Domain ${domain} is not authorized.`);
      
      // 隐藏授权内容
      document.getElementById('authorizedContent').style.display = 'none';
    }
  });
}

// 在DOM加载完成后初始化弹出窗口
document.addEventListener('DOMContentLoaded', initPopup);