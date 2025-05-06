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
let updateInterval = null; // For storing update timer ID

// Initialize internationalization
async function initI18n() {
  try {
    // Initialize I18n and load language packs
    await I18n.init();
    console.log('I18n initialized with language:', I18n.getCurrentLanguage());

    // Ensure language settings are applied to the page
    I18n.updatePageText();

    // Set html element's lang attribute for CSS selector matching
    document.documentElement.lang = I18n.getCurrentLanguage();
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

// Handle new network request messages
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle request completion messages
    if (message.action === 'requestCompleted' && message.tabId === currentTabId) {
      // Get current data
      const currentData = TableManager.getRequestData();
      // Update specific request data
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // Update table
        TableManager.updateTableData(currentData);
        // Update statistics
        StatsManager.updateStatistics();
        // Update AI analysis button state
        updateAiAnalysisButtonState();

        // Ensure internationalization updates
        I18n.updatePageText();
      }
    }

    // Handle request failure messages
    if (message.action === 'requestFailed' && message.tabId === currentTabId) {
      // Get current data
      const currentData = TableManager.getRequestData();
      // Update specific request data
      if (currentData) {
        currentData[message.requestId] = message.requestData;
        // Update table
        TableManager.updateTableData(currentData);
        // Update statistics
        StatsManager.updateStatistics();
        // Update AI analysis button state
        updateAiAnalysisButtonState();

        // Ensure internationalization updates
        I18n.updatePageText();
      }
    }

    // Return true to keep message channel open
    return true;
  });
}

// Function to request network data from background script
function requestNetworkData() {
  chrome.runtime.sendMessage({ action: 'getRequestData', tabId: currentTabId }, response => {
    if (chrome.runtime.lastError) {
      console.error('Error getting request data:', chrome.runtime.lastError);
      return;
    }

    if (response && response.requestData) {
      // Update table data using TableManager
      TableManager.updateTableData(response.requestData);

      // Update statistics
      StatsManager.updateStatistics();

      // Update AI analysis button state
      updateAiAnalysisButtonState();

      // Ensure internationalization updates
      I18n.updatePageText();
    }
  });
}

// Set requestNetworkData function as global variable so other modules can access it
window.requestNetworkData = requestNetworkData;

// Start real-time updates
function startRealTimeUpdates() {
  // Clear previous timer (if exists)
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Set new timer, update data every 3 seconds
  updateInterval = setInterval(requestNetworkData, 3000);
}

// Stop real-time updates
function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Setup event handlers for control buttons
function setupControlButtons() {
  // Theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', ThemeManager.toggleTheme);
  }

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

  // AI analysis toggle button
  const aiAnalysisToggleBtn = document.getElementById('aiAnalysisToggleBtn');
  if (aiAnalysisToggleBtn) {
    aiAnalysisToggleBtn.addEventListener('click', () => {
      // 检查是否有数据
      const requestData = TableManager.getRequestData();
      if (Object.keys(requestData).length === 0) {
        // 如果没有数据，不执行跳转并提示用户
        ToastManager.error(I18n.getText('noDataForAnalysis') || 'No data available for analysis');
        return;
      }

      // Open standalone AI analysis page, and pass current tabId parameter
      chrome.tabs.create({
        url: chrome.runtime.getURL(`src/ai-analysis.html?tabId=${currentTabId}&autoStart=true`),
      });
    });
  }

  // Open settings page
  const openOptionsPage = document.getElementById('openOptionsPage');
  if (openOptionsPage) {
    openOptionsPage.addEventListener('click', e => {
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
    // When no data, don't show toast, just return
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
  const confirmMsg = I18n.getText('confirmClear');

  // Create custom confirmation dialog
  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'custom-confirm';
  confirmDialog.innerHTML = `
    <div class="confirm-content">
      <div class="confirm-message">${confirmMsg}</div>
      <div class="confirm-buttons">
        <button class="cancel-btn">${I18n.getText('cancel')}</button>
        <button class="confirm-btn">${I18n.getText('confirm')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(confirmDialog);

  // Add event listeners
  return new Promise(resolve => {
    // Cancel button
    confirmDialog.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(false);
    });

    // Confirm button
    confirmDialog.querySelector('.confirm-btn').addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(true);

      // Execute clear operation
      chrome.runtime.sendMessage({ action: 'clearRequestData', tabId: currentTabId }, response => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing request data:', chrome.runtime.lastError);
          return;
        }

        if (response && response.success) {
          // Clear table data
          TableManager.updateTableData({});

          // Update statistics
          StatsManager.updateStatistics();

          // Update AI analysis button state
          updateAiAnalysisButtonState();

          // Close any open request details
          try {
            if (
              RequestDetailsManager &&
              typeof RequestDetailsManager.closeRequestDetails === 'function'
            ) {
              RequestDetailsManager.closeRequestDetails();
            } else if (
              RequestDetailsManager &&
              typeof RequestDetailsManager.closeDetails === 'function'
            ) {
              RequestDetailsManager.closeDetails();
            }
          } catch (error) {
            console.error('Error closing request details:', error);
          }

          // Don't show success message toast
          console.log('Data cleared successfully');
        } else if (response && response.error) {
          console.error('Error clearing data:', response.error);
        }
      });
    });
  });
}

// Main initialization function
async function initPopup() {
  console.log('Initializing popup...');

  // Initialize internationalization support
  await initI18n();

  // Initialize theme controller
  ThemeManager.init();

  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
    if (tabs.length > 0) {
      currentTabId = tabs[0].tabId || tabs[0].id;
      let domain = '';

      if (tabs[0].url && tabs[0].url.startsWith('http')) {
        domain = new URL(tabs[0].url).hostname;
      }

      console.log(`Current tab: ${currentTabId}, Domain: ${domain}`);

      // Start network data module
      await TableManager.init({
        tableId: 'requestsTable',
        bodyId: 'requestsTableBody',
        noDataMessageId: 'noDataMessage',
        requestDetailsManager: RequestDetailsManager,
      });

      // Initialize details manager
      await RequestDetailsManager.init({
        detailsContainerId: 'requestDetails',
      });

      // Initialize statistics module
      await StatsManager.init({
        containerId: 'statsContainer',
        getRequestData: TableManager.getRequestData,
      });

      // Initialize AI analysis manager
      await AiAnalysisManager.init({
        containerId: 'aiAnalysisContainer',
        statusId: 'aiAnalysisStatus',
        resultId: 'aiAnalysisResult',
        modelInfoId: 'aiModelInfo',
        copyButtonId: 'copyAiResultBtn',
        getRequestData: TableManager.getRequestData,
        tabId: currentTabId,
      });

      // Initialize domain authentication UI
      await DomainAuthUI.init({
        domainListId: 'headerDomainsList',
        switchId: 'headerAuthorizationSwitch',
        statusId: 'headerAuthStatus',
        settingsLinkId: 'openDomainSettings',
      });

      // Display current domain and check authorization
      checkDomainAndLoadData(domain);
    }
  });

  // Set up message listeners
  setupMessageListeners();

  // Set up control button event listeners
  setupControlButtons();

  // Start real-time updates
  startRealTimeUpdates();

  // Update AI analysis button state
  updateAiAnalysisButtonState();

  // Listen for popup close event
  window.addEventListener('beforeunload', function () {
    stopRealTimeUpdates();
  });
}

// Check domain authorization and load data
function checkDomainAndLoadData(domain) {
  // Use setCurrentDomain method to set current domain, this method will update UI display simultaneously
  DomainAuthUI.setCurrentDomain(domain).then(isAuthorized => {
    if (isAuthorized) {
      // Domain is authorized, load network data
      console.log(`Domain ${domain} is authorized, loading network data...`);
      requestNetworkData();

      // Show authorized content
      document.getElementById('authorizedContent').style.display = 'block';
    } else {
      // Domain is not authorized, show authorization form
      console.log(`Domain ${domain} is not authorized.`);

      // Hide authorized content
      document.getElementById('authorizedContent').style.display = 'none';

      // 确保AI分析按钮被禁用
      const aiAnalysisToggleBtn = document.getElementById('aiAnalysisToggleBtn');
      if (aiAnalysisToggleBtn) {
        aiAnalysisToggleBtn.classList.add('disabled');
        aiAnalysisToggleBtn.disabled = true;
        aiAnalysisToggleBtn.title = I18n.getText('domainNotAuthorized') || 'Domain not authorized';
      }
    }
  });
}

// Initialize popup when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initPopup);

// 更新AI分析按钮状态
function updateAiAnalysisButtonState() {
  const requestData = TableManager.getRequestData();
  const hasData = Object.keys(requestData).length > 0;
  const aiAnalysisToggleBtn = document.getElementById('aiAnalysisToggleBtn');

  if (aiAnalysisToggleBtn) {
    if (hasData) {
      // 有数据，启用按钮
      aiAnalysisToggleBtn.classList.remove('disabled');
      aiAnalysisToggleBtn.disabled = false;
      aiAnalysisToggleBtn.title = I18n.getText('aiAnalysis') || 'AI Analysis';
    } else {
      // 没有数据，禁用按钮
      aiAnalysisToggleBtn.classList.add('disabled');
      aiAnalysisToggleBtn.disabled = true;
      aiAnalysisToggleBtn.title =
        I18n.getText('noDataForAnalysis') || 'No data available for analysis';
    }
  }
}
