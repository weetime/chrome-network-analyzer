/**
 * AI Analysis Page Script - Handles standalone AI analysis page functionality
 */

// ================ Import Dependencies ================
import { I18n } from './i18n.js';
import './i18n/zh.js';
import './i18n/en.js';
import { AiConnector } from './ai-connector.js';
import { AiAnalysisManager } from './ai-analysis-manager.js';
import { ThemeManager } from './theme-manager.js';
import { StatsManager } from './stats-manager.js';
import { RequestDetailsManager } from './request-details-manager.js';
import { ToastManager } from './toast-manager.js';

// ================ Global Variables ================
let currentTabId = null;
let requestsData = {};
let isAnalysisRunning = false;
let abortController = null; // Add abort controller

/**
 * Core Functions: Data Retrieval and Analysis
 */

// ================ Page Data Initialization ================
// Get current tab ID and network request data
async function initPage() {
  try {
    // 首先检查API密钥配置，确保有可用配置
    const apiConfigured = await checkApiKeyConfiguration();

    // 由于我们现在会自动设置默认值，不再需要检查apiConfigured是否为false
    // 但保留此逻辑以便未来可能需要

    // 获取tabId从URL参数
    const urlParams = new URLSearchParams(window.location.search);
    currentTabId = parseInt(urlParams.get('tabId'));

    if (!currentTabId) {
      // If no tabId provided, get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) {
        currentTabId = tabs[0].id;
      } else {
        console.error('Unable to determine which tab to analyze');
        return;
      }
    }

    // Get current tab information to display domain
    if (currentTabId) {
      await updateTabInfo(currentTabId);
    }

    // Get network request data
    await fetchNetworkData();

    // Update data overview
    updateDataOverview(requestsData);

    // Update statistics
    if (StatsManager) {
      // Initialize statistics module
      await StatsManager.init({
        containerId: 'statsContainer',
        getRequestData: () => requestsData,
      });

      StatsManager.updateStatistics();
    }
  } catch (error) {
    console.error('Error initializing page:', error);
    ToastManager.error('Error initializing page: ' + error.message);
  }
}

// ================ Data Retrieval and Processing ================
// Get network request data from background script
async function fetchNetworkData() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getRequestData', tabId: currentTabId }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (response && response.requestData) {
        requestsData = response.requestData;
        resolve(requestsData);
      } else {
        reject(new Error('Failed to get network request data'));
      }
    });
  });
}

// Get and update current tab information
async function updateTabInfo(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url) {
      const urlElement = document.getElementById('domainUrl');

      if (urlElement) urlElement.textContent = tab.url;
    }
  } catch (error) {
    console.error('Error getting tab information:', error);
  }
}

// Get and load data for specified tab
async function loadTabData(tabId) {
  try {
    // Update current tab ID
    currentTabId = tabId;

    // Get tab information and display domain
    await updateTabInfo(tabId);

    // Get network request data
    await fetchNetworkData();

    // Update data overview
    updateDataOverview(requestsData);

    // Update statistics
    if (StatsManager) {
      StatsManager.updateStatistics();
    }

    // Show success message
    ToastManager.success(I18n.getText('tabDataLoaded'));

    return true;
  } catch (error) {
    console.error('Error loading tab data:', error);
    ToastManager.error(`${I18n.getText('tabDataLoadError')}: ${error.message}`);
    return false;
  }
}

// Update data overview area
function updateDataOverview(requestsData) {
  const requests = Object.values(requestsData);

  // Update request count
  updateElementText('requestsCount', '.highlight-text', requests.length);
  updateElementText('totalRequestsValue', null, requests.length);
  updateElementText('totalRequestsValue2', null, requests.length);

  // Calculate performance metrics
  const validRequests = requests.filter(req => req.totalTime);
  if (validRequests.length === 0) return;

  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  const avgResponseTime = totalLoadTime / validRequests.length;
  const slowestRequest = validRequests.reduce(
    (prev, current) => (prev.totalTime > current.totalTime ? prev : current),
    { totalTime: 0 }
  );

  // Update UI
  updateElementText(
    'totalLoadTimeValue',
    null,
    totalLoadTime > 0 ? `${Math.round(totalLoadTime)}ms` : '--'
  );
  updateElementText(
    'avgResponseTimeValue',
    null,
    avgResponseTime > 0 ? `${Math.round(avgResponseTime)}ms` : '--'
  );
  updateElementText(
    'slowestRequestValue',
    null,
    slowestRequest.totalTime > 0 ? `${Math.round(slowestRequest.totalTime)}ms` : '--'
  );
}

// Calculate statistics
function calculateStatistics(requestsData) {
  const requests = Object.values(requestsData);
  const validRequests = requests.filter(req => req.totalTime);

  // If no valid requests, return empty statistics
  if (validRequests.length === 0) {
    return {
      totalRequests: requests.length,
      averageLoadTime: 0,
      p95LoadTime: 0,
      errorRate: 0,
    };
  }

  // Calculate key metrics
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  const averageLoadTime = totalLoadTime / validRequests.length;
  const errorCount = requests.filter(req => req.error || (req.status && req.status >= 400)).length;
  const errorRate = (errorCount / requests.length) * 100;

  // Calculate p95 response time
  const times = validRequests.map(req => req.totalTime).sort((a, b) => a - b);
  const index = Math.floor(times.length * 0.95);
  const p95LoadTime = times[index] || 0;

  return {
    totalRequests: requests.length,
    averageLoadTime,
    p95LoadTime,
    errorRate,
  };
}

// Helper function: Update element text
function updateElementText(id, selector, value) {
  const element = document.getElementById(id);
  if (!element) return;

  if (selector) {
    const targetElement = element.querySelector(selector);
    if (targetElement) targetElement.textContent = value;
  } else {
    element.textContent = value;
  }
}

// Update progress bar
function updateProgress(percent, elements, statusText) {
  if (!elements.progressBar || !elements.progressText) return;

  elements.progressBar.style.width = `${percent}%`;
  elements.progressText.textContent = statusText;

  // If progress is nearing completion, change progress bar color
  if (percent >= 90) {
    elements.progressBar.classList.add('progress-complete');
  } else {
    elements.progressBar.classList.remove('progress-complete');
  }
}

/**
 * AI Analysis Functionality
 */

// ================ AI Analysis Functionality ================
// Run AI Analysis
async function runAiAnalysis() {
  // If analysis is already running, do not allow clicking again
  if (isAnalysisRunning) {
    ToastManager.error('Analysis is already running, please wait for completion');
    return;
  }

  // Set analysis status to running
  isAnalysisRunning = true;

  // Create new abort controller
  abortController = new AbortController();

  // Disable analysis button and change style
  const analyzeButton = document.getElementById('runAiAnalysisBtn');
  // Add stop analysis button
  const stopAnalysisButton = document.getElementById('stopAiAnalysisBtn');
  // Get dropdown selected element to disable it
  const dropdownSelected = document.querySelector('.dropdown-selected');

  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.classList.add('disabled');
  }

  if (stopAnalysisButton) {
    stopAnalysisButton.style.display = 'inline-block';
  }

  // Disable dropdown selector during analysis
  if (dropdownSelected) {
    dropdownSelected.classList.add('disabled');
    // Remove any active click listeners temporarily
    dropdownSelected.style.pointerEvents = 'none';
  }

  // Get analysis elements
  const elements = {
    loading: document.getElementById('analysisLoading'),
    content: document.getElementById('analysisContent'),
    text: document.getElementById('analysisText'),
    error: document.getElementById('analysisError'),
    progress: document.getElementById('analysisProgress'),
    progressBar: document.getElementById('analysisProgressBar'),
    progressText: document.getElementById('analysisProgressText'),
  };

  if (!elements.loading || !elements.content || !elements.text || !elements.error) {
    console.error('Required AI analysis elements not found');
    resetAnalysisState();
    return;
  }

  // Reset UI state
  resetAnalysisUI(elements);

  try {
    // Ensure there is request data
    if (!(await ensureRequestData(elements))) {
      resetAnalysisState();
      return;
    }

    updateProgress(20, elements, I18n.getText('calculatingStats'));

    // Calculate statistics
    const statistics = calculateStatistics(requestsData);

    // Get AI configuration and check
    updateProgress(30, elements, I18n.getText('loadingAiConfig'));
    const config = await getAIConfig();

    if (!(await validateAIConfig(config, elements))) {
      resetAnalysisState();
      return;
    }

    // Prepare analysis data
    updateProgress(40, elements, I18n.getText('preparingData'));
    updateAIProviderDisplay(config);

    // Check cache status
    updateProgress(45, elements, I18n.getText('checkingCache'));

    // Send AI request and process result
    await processAIAnalysis(requestsData, statistics, config, elements);
  } catch (error) {
    // Check if the request was canceled by the user
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      showAnalysisError(I18n.getText('analysisCancelled'), elements);
      ToastManager.showInfo(I18n.getText('analysisCancelled'));
    } else {
      handleAnalysisError(error, elements);
    }
  } finally {
    // Regardless of success or failure, reset analysis state
    resetAnalysisState();
  }
}

// Stop running AI Analysis
function stopAiAnalysis() {
  if (abortController && isAnalysisRunning) {
    abortController.abort();
    console.log('User canceled AI analysis');
  }
}

// Reset analysis UI state
function resetAnalysisUI(elements) {
  elements.progressBar.style.width = '0%';
  elements.progressText.textContent = I18n.getText('analysisStarting');
  elements.loading.style.display = 'block';
  elements.progress.style.display = 'block';
  elements.text.style.display = 'block'; // Make text element visible for streaming display
  elements.text.innerHTML = '<div class="stream-cursor"></div>'; // Add a blinking cursor
  elements.error.style.display = 'none';

  // Simulate data loading progress
  updateProgress(10, elements, I18n.getText('dataLoading'));
}

// Ensure there is request data
async function ensureRequestData(elements) {
  if (Object.keys(requestsData).length === 0) {
    try {
      await fetchNetworkData();
      if (currentTabId) await updateTabInfo(currentTabId);
      updateDataOverview(requestsData);
    } catch (error) {
      showNoDataError(elements);
      return false;
    }
  }

  // If still no data, show error
  if (Object.keys(requestsData).length === 0) {
    showNoDataError(elements);
    return false;
  }

  return true;
}

// Validate AI configuration
async function validateAIConfig(config, elements) {
  if (!config.apiKey) {
    // 如果没有API密钥，尝试获取默认配置
    console.log('No API key in config, trying to get default configuration');

    // 从AiConnector获取默认配置
    const { AI_PROVIDERS } = AiConnector;
    const defaultApiKey = AI_PROVIDERS.OPENROUTER.defaultApiKey;

    if (defaultApiKey) {
      // 使用默认API密钥更新配置
      config.apiKey = defaultApiKey;
      config.provider = 'openrouter';
      config.model = AI_PROVIDERS.OPENROUTER.defaultModel;

      // 保存配置到存储
      chrome.storage.sync.set({
        aiProvider: config.provider,
        aiModel: config.model,
        aiApiKey: config.apiKey,
      });

      console.log('Applied default OpenRouter configuration for analysis');
      return true;
    } else {
      // 无法获取默认API密钥，显示错误
      const errorMsg = I18n.getText('noApiKeyConfigured');
      showAnalysisError(errorMsg, elements);
      ToastManager.error(errorMsg);
      elements.loading.style.display = 'none';
      elements.progress.style.display = 'none';
      return false;
    }
  }
  return true;
}

// Process AI Analysis process
async function processAIAnalysis(requestsData, statistics, config, elements) {
  // Connect to AI service
  updateProgress(50, elements, I18n.getText('connectingAi'));

  // Format data and prepare to send to AI
  const analysisData = AiConnector.formatNetworkDataForAI(requestsData, statistics);
  const currentLanguage = I18n.getCurrentLanguage();

  // Create a variable to track generation progress
  let generationProgress = 0;
  const startGenerationPercent = 60;
  const endGenerationPercent = 95;

  // Use streaming API, define callback function for processing each data block
  const onChunkReceived = (chunk, fullText) => {
    // Update generation progress
    generationProgress = Math.min(generationProgress + 1, 100);
    const progressPercent =
      startGenerationPercent +
      (generationProgress / 100) * (endGenerationPercent - startGenerationPercent);

    updateProgress(progressPercent, elements, I18n.getText('generatingAnalysis'));

    // Update display (replace last cursor element)
    elements.text.innerHTML = formatAnalysisText(fullText) + '<div class="stream-cursor"></div>';

    // When content increases, scroll to bottom for user to see latest content
    elements.content.scrollTop = elements.content.scrollHeight;
  };

  // Use streaming API to send request, pass abort signal
  const result = await AiConnector.streamToAI(
    analysisData,
    config.provider,
    config.apiKey,
    config.model,
    { language: currentLanguage },
    2000, // Max tokens
    onChunkReceived, // Callback function
    abortController.signal // Add abort signal
  );

  // Streaming processing completed, ensure final result is fully displayed
  elements.text.innerHTML = formatAnalysisText(result.analysis);

  // Set result provider and model information
  updateProviderModelInfo(result, config);

  // Complete progress
  updateProgress(100, elements, I18n.getText('analysisComplete'));

  // Hide progress bar and loading area
  setTimeout(() => {
    elements.loading.style.display = 'none';
    elements.progress.style.display = 'none';
  }, 500);
}

// Reset analysis state
function resetAnalysisState() {
  isAnalysisRunning = false;
  abortController = null;

  // Re-enable buttons and hide stop button
  const analyzeButton = document.getElementById('runAiAnalysisBtn');
  const stopAnalysisButton = document.getElementById('stopAiAnalysisBtn');
  // Get dropdown selected element to re-enable it
  const dropdownSelected = document.querySelector('.dropdown-selected');

  if (analyzeButton) {
    analyzeButton.disabled = false;
    analyzeButton.classList.remove('disabled');
  }

  if (stopAnalysisButton) {
    stopAnalysisButton.style.display = 'none';
  }

  // Re-enable dropdown selector after analysis is done
  if (dropdownSelected) {
    dropdownSelected.classList.remove('disabled');
    // Restore click event handling
    dropdownSelected.style.pointerEvents = 'auto';
  }
}

// Handle analysis error
function handleAnalysisError(error, elements) {
  showAnalysisError(`AI analysis error: ${error.message}`, elements);
  ToastManager.error(`${I18n.getText('aiAnalysisError')}: ${error.message}`);
  elements.loading.style.display = 'none';
  elements.progress.style.display = 'none';
  resetAnalysisState();
}

// Get AI configuration
async function getAIConfig() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['aiProvider', 'aiModel', 'aiApiKey', 'aiApiUrl'], result => {
      // 从AiConnector获取默认配置信息
      const { AI_PROVIDERS } = AiConnector;

      const config = {
        provider: result.aiProvider || 'openrouter',
        apiKey: result.aiApiKey || AI_PROVIDERS.OPENROUTER.defaultApiKey || '',
        model:
          result.aiModel || AI_PROVIDERS.OPENROUTER.defaultModel || 'deepseek-chat-v3-0324:free',
        apiUrl: result.aiApiUrl || '',
      };

      // 如果没有设置提供商或apiKey，自动保存默认配置
      if (!result.aiProvider || !result.aiApiKey) {
        chrome.storage.sync.set({
          aiProvider: config.provider,
          aiModel: config.model,
          aiApiKey: config.apiKey,
        });
        console.log('Saved default OpenRouter configuration');
      }

      resolve(config);
    });
  });
}

// Show no data error
function showNoDataError(elements) {
  const noDataMsg = I18n.getText('noDataAvailable');
  showAnalysisError(noDataMsg, elements);
  ToastManager.error(noDataMsg);
  elements.loading.style.display = 'none';
}

// Update provider and model information
function updateProviderModelInfo(result, config) {
  // Handle provider information
  let provider = result.provider || 'Unknown provider';
  if (provider.includes('(')) {
    provider = provider.split('(')[0].trim();
  }

  // Prefer user configuration
  if (config && config.provider) {
    provider = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
  }

  const model = config && config.model ? config.model : result.model || 'Unknown model';

  // Set model and provider information
  updateElementText('analysisModel', null, model);
  updateElementText('analysisProvider', null, provider);
}

// Update AI provider and model display
function updateAIProviderDisplay(config) {
  const analysisProvider = document.getElementById('analysisProvider');
  const analysisModel = document.getElementById('analysisModel');

  if (analysisProvider && analysisModel) {
    const providerName = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
    analysisProvider.textContent = providerName;
    analysisModel.textContent = config.model;
  }
}

// Display analysis result (keep compatibility, but streaming API will directly update content)
function displayAnalysisResult(result, config, elements) {
  // Hide loading, show content
  elements.loading.style.display = 'none';
  elements.text.style.display = 'block';

  // Set analysis text
  elements.text.innerHTML = formatAnalysisText(result.analysis);

  // Update provider and model information
  updateProviderModelInfo(result, config);
}

// Show error information
function showAnalysisError(message, elements, isApiConfigError = false) {
  if (!elements) {
    elements = {
      loading: document.getElementById('analysisLoading'),
      text: document.getElementById('analysisText'),
      error: document.getElementById('analysisError'),
      errorText: document.getElementById('analysisErrorText'),
    };
  }

  if (!elements.loading || !elements.text || !elements.error || !elements.errorText) {
    console.error('Required AI analysis elements not found');
    return;
  }

  // Hide loading and content, show error
  elements.loading.style.display = 'none';
  elements.text.style.display = 'none';
  elements.error.style.display = 'block';

  // Set error information
  elements.errorText.textContent = message;
}

// Use similar Markdown format to format analysis text
function formatAnalysisText(text) {
  if (!text) return '';

  // Convert newline characters to HTML newlines
  let formatted = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

  // Convert titles
  formatted = formatted.replace(/#{3,6} (.+?)(?:<br>|$)/g, '<h4>$1</h4>');
  formatted = formatted.replace(/## (.+?)(?:<br>|$)/g, '<h3>$1</h3>');
  formatted = formatted.replace(/# (.+?)(?:<br>|$)/g, '<h2>$1</h2>');

  // Convert formatted text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert lists
  formatted = formatted.replace(/- (.+?)(?:<br>|$)/g, '• $1<br>');

  return formatted;
}

/**
 * Export Functionality
 */

// ================ Export Functionality ================
// Copy analysis results to clipboard
function copyAnalysisResults() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.innerHTML) {
    ToastManager.error(I18n.getText('noCopyContent'));
    return;
  }

  // Copy to clipboard in Markdown format
  const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);

  navigator.clipboard
    .writeText(markdownText)
    .then(() => {
      ToastManager.success(I18n.getText('copySuccess'));
    })
    .catch(err => {
      console.error('Failed to copy analysis results:', err);
      ToastManager.error(`${I18n.getText('copyFailed')}: ${err.message}`);
    });
}

// Download analysis report and data
function downloadReport() {
  const analysisText = document.getElementById('analysisText');
  const domainUrl = document.getElementById('domainUrl').textContent;

  // If no analysis results, show error
  if (!analysisText.innerHTML.trim()) {
    ToastManager.error(I18n.getText('noAnalysisResultsToDownload'));
    return;
  }

  // Extract domain
  const domain = extractDomain(domainUrl);
  const currentDate = formatDate(new Date());

  // Create and show dropdown menu
  const dropdown = createDownloadDropdown();
  document.body.appendChild(dropdown);

  // Position dropdown menu
  const anchor = document.getElementById('downloadReportBtn');
  positionDropdown(dropdown, anchor);

  // Set download option event listeners
  setupDownloadListeners(dropdown, analysisText, domain, currentDate);
}

// Click outside area to close dropdown menu
function closeDropdownOnOutsideClick(e) {
  if (!e.target.closest('#downloadReportBtn')) {
    closeDropdown();
  }
}

// Extract domain
function extractDomain(url) {
  if (!url) return 'unknown-domain';
  try {
    // Remove protocol and path, keep domain part
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
  } catch (error) {
    console.error('Failed to extract domain:', error);
    return 'unknown-domain';
  }
}

// Format date as YYYY-MM-DD format
function formatDate(date) {
  if (!date) return 'unknown-date';
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Failed to format date:', error);
    return 'unknown-date';
  }
}

// Create download option dropdown menu
function createDownloadDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'download-dropdown';
  dropdown.innerHTML = `
    <div class="download-dropdown-content">
      <div class="download-header">${I18n.getText('downloadOptions')}</div>
      <a href="#" id="downloadReportOnly">${I18n.getText('downloadReportOnly').replace('TXT', 'MD')}</a>
      <a href="#" id="downloadDataJSON">${I18n.getText('downloadDataJSON')}</a>
      <a href="#" id="downloadDataCSV">${I18n.getText('downloadDataCSV')}</a>
      <a href="#" id="downloadAll">${I18n.getText('downloadAll')}</a>
    </div>
  `;
  return dropdown;
}

// Position dropdown menu
function positionDropdown(dropdown, anchor) {
  const rect = anchor.getBoundingClientRect();

  // Calculate best display position
  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX;

  // Check if it exceeds bottom of page
  const dropdownHeight = 200; // Estimated height
  const windowHeight = window.innerHeight;
  const windowBottom = window.scrollY + windowHeight;

  // If dropdown menu would exceed bottom, show above button
  if (top + dropdownHeight > windowBottom) {
    top = rect.top + window.scrollY - dropdownHeight - 5;
  }

  // Ensure it doesn't exceed left side
  if (left < 10) {
    left = 10;
  }

  // Ensure it doesn't exceed right side
  const dropdownWidth = 200; // Estimated width
  if (left + dropdownWidth > document.documentElement.clientWidth - 10) {
    left = document.documentElement.clientWidth - dropdownWidth - 10;
  }

  dropdown.style.position = 'absolute';
  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
  dropdown.style.zIndex = '2000'; // Ensure higher z-index

  document.body.appendChild(dropdown);

  // Scroll to dropdown menu visible
  setTimeout(() => {
    dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// Set download button listeners
function setupDownloadListeners(dropdown, analysisText, domainName, currentDate) {
  // Click other areas to close dropdown menu
  document.addEventListener('click', closeDropdownOnOutsideClick);

  // Prevent clicking dropdown menu itself to close
  dropdown.addEventListener('click', e => {
    e.stopPropagation();
  });

  // Set event listeners for each download option
  setupDownloadOptionListeners(dropdown, analysisText, domainName, currentDate);
}

// Set event listeners for each download option
function setupDownloadOptionListeners(dropdown, analysisText, domainName, currentDate) {
  // Download report button
  document.getElementById('downloadReportOnly').addEventListener('click', e => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(
      markdownText,
      `${I18n.getText('reportFileName')}-${domainName}-${currentDate}.md`
    );
    closeDropdown();
  });

  // Download JSON data button
  document.getElementById('downloadDataJSON').addEventListener('click', e => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(
        requestsData,
        `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.json`
      );
    } else {
      ToastManager.error(I18n.getText('noDataAvailable'));
    }
    closeDropdown();
  });

  // Download CSV data button
  document.getElementById('downloadDataCSV').addEventListener('click', e => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.csv`);
    } else {
      ToastManager.error(I18n.getText('noDataAvailable'));
    }
    closeDropdown();
  });

  // Download all button
  document.getElementById('downloadAll').addEventListener('click', e => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(
      markdownText,
      `${I18n.getText('reportFileName')}-${domainName}-${currentDate}.md`
    );

    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(
        requestsData,
        `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.json`
      );
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.csv`);
    }
    closeDropdown();
  });
}

// Close dropdown menu function
function closeDropdown() {
  const dropdown = document.querySelector('.download-dropdown');
  if (dropdown) {
    document.body.removeChild(dropdown);
    document.removeEventListener('click', closeDropdownOnOutsideClick);
  }
}

// Download file related functions
function downloadTextFile(text, filename) {
  downloadFile(new Blob([text], { type: 'text/plain' }), filename);
}

function downloadJsonFile(data, filename) {
  downloadFile(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

function downloadMarkdownFile(text, filename) {
  downloadFile(new Blob([text], { type: 'text/markdown' }), filename);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  ToastManager.success(`${I18n.getText('downloadSuccess')}: ${filename}`);
}

// Convert HTML to Markdown
function convertHtmlToMarkdown(html) {
  if (!html) return '';

  let markdown = html;

  // Replace HTML tags with Markdown format
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '# $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '## $1\n\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '### $1\n\n');
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');

  // Replace list items
  markdown = markdown.replace(/• (.*?)<br>/g, '- $1\n');

  // Replace newlines
  markdown = markdown.replace(/<br>/g, '\n');

  // Clean up possible HTML entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');

  return markdown;
}

// Convert requests data to CSV format
function convertRequestsToCSV(requestsData) {
  const requests = Object.values(requestsData);
  if (requests.length === 0) return '';

  // CSV headers
  const headers = [
    'URL',
    'Type',
    'Method',
    'Status',
    'Total Time (ms)',
    'TTFB (ms)',
    'Domain',
    'Transferred Size (bytes)',
    'Content Size (bytes)',
    'Protocol',
    'Priority',
    'Cache Control',
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  // Escape CSV fields
  const escapeCSV = field => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Add each request's row
  requests.forEach(req => {
    const row = [
      escapeCSV(req.url),
      escapeCSV(req.type),
      escapeCSV(req.method),
      escapeCSV(req.status),
      escapeCSV(req.totalTime),
      escapeCSV(req.ttfb),
      escapeCSV(req.domain),
      escapeCSV(req.transferSize),
      escapeCSV(req.contentSize),
      escapeCSV(req.protocol),
      escapeCSV(req.priority),
      escapeCSV(req.cacheControl),
    ];
    csvContent += row.join(',') + '\n';
  });

  return csvContent;
}

/**
 * Domain and Authorization Management
 */

// ================ Domain and Authorization Management ================
// Helper function: Truncate title, avoid repeated display of domain
function truncateTitle(title, domain) {
  if (!title) return '';

  // Remove domain part, avoid repeated
  let shortTitle = title.replace(domain, '').trim();
  shortTitle = shortTitle.replace(/^[-–—\s|]*/, '').trim(); // Remove leading separators

  // If title is too long, truncate
  if (shortTitle.length > 20) {
    shortTitle = shortTitle.substring(0, 18) + '...';
  }

  return shortTitle;
}

// Check if domain is authorized domain
function isAuthorizedDomain(domain, authorizedDomains) {
  if (!domain || !authorizedDomains || !authorizedDomains.length) return false;

  // Check exact match
  if (authorizedDomains.includes(domain)) return true;

  // Check subdomain match (if authorizedDomains contains example.com, then sub.example.com is also authorized)
  return authorizedDomains.some(authDomain => {
    return domain.endsWith('.' + authDomain);
  });
}

// Check if it's local development address
function isLocalhost(domain) {
  return (
    domain === 'localhost' || domain === '127.0.0.1' || domain.match(/^192\.168\.\d{1,3}\.\d{1,3}$/)
  );
}

// Get authorized domain list
async function getAuthorizedDomains() {
  try {
    // Try to get authorized domain list from storage
    const result = await chrome.storage.sync.get('authorizedDomains');
    const domains = result.authorizedDomains || [];

    // Always allow common development and test domains
    const defaultDomains = ['localhost', '127.0.0.1', 'example.com'];

    // Merge default domains and stored domains, ensure no duplicates
    return [...new Set([...defaultDomains, ...domains])];
  } catch (error) {
    console.error('Error getting authorized domain list:', error);
    return ['localhost', '127.0.0.1']; // Return basic local domain if error
  }
}

/**
 * Initialization and Setup
 */

// Initialize tab selector
async function initTabSelector() {
  const tabSelectorWrapper = document.querySelector('.tab-selector-wrapper');
  if (!tabSelectorWrapper) return;

  try {
    // Get current page's domain
    const currentDomainUrl = document.getElementById('domainUrl')?.textContent;
    let currentDomain = '';
    let displayDomain = I18n.getText('currentTab');

    try {
      if (currentDomainUrl && currentDomainUrl !== '--') {
        const url = new URL(currentDomainUrl);
        currentDomain = url.hostname;
        // Set display domain for use (short version)
        displayDomain = currentDomain;
      }
    } catch (e) {
      console.error('Error parsing current domain:', e);
    }

    // Create custom dropdown menu element
    tabSelectorWrapper.innerHTML = '';
    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown';

    // Get all tabs
    const tabs = await chrome.tabs.query({});

    // Get authorized domain list
    const authorizedDomains = await getAuthorizedDomains();

    // Create tab page option data structure
    const authorizedTabs = [];
    let hasMatchingTab = false;

    // Handle current tab
    const currentTab = {
      element: document.createElement('div'),
      domain: currentDomain.toLowerCase(),
      tabId: 'current',
      matchesCurrent: true,
      displayName: displayDomain,
    };

    currentTab.element.className = 'dropdown-option';
    currentTab.element.dataset.value = 'current';
    currentTab.element.dataset.domain = currentDomain;
    currentTab.element.title = currentDomainUrl;
    currentTab.element.innerHTML = `<span class="tab-domain">${displayDomain}</span>`;

    // Add other tabs that meet conditions
    tabs.forEach(tab => {
      // Ignore current page
      if (tab.id === chrome.devtools?.inspectedWindow?.tabId) return;

      try {
        // Check if tab has URL and whether it's authorized domain
        if (tab.url) {
          const url = new URL(tab.url);
          const domain = url.hostname;

          // Only add authorized domain or local development address
          if (isAuthorizedDomain(domain, authorizedDomains) || isLocalhost(domain)) {
            // Truncate title length, only display meaningful part
            const title = tab.title || '';
            const shortTitle = truncateTitle(title, domain);

            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.dataset.value = tab.id;
            option.dataset.domain = domain;
            option.title = `${domain} - ${tab.title || ''}`;

            // Use more concise display form
            option.innerHTML = `<span class="tab-domain">${domain}</span>`;
            if (shortTitle) {
              option.innerHTML += `<span class="tab-title">${shortTitle}</span>`;
            }

            const matchesCurrent =
              currentDomain && domain.toLowerCase() === currentDomain.toLowerCase();

            // If find matching tab for current domain, mark it
            if (matchesCurrent) {
              hasMatchingTab = true;
            }

            authorizedTabs.push({
              element: option,
              domain: domain.toLowerCase(),
              tabId: tab.id,
              matchesCurrent: matchesCurrent,
              displayName: domain,
            });
          }
        }
      } catch (e) {
        // If URL parsing fails, skip this tab
        console.error('Error parsing tab URL:', e);
      }
    });

    // Sort by domain
    authorizedTabs.sort((a, b) => a.domain.localeCompare(b.domain));

    // Find matching tab for current domain
    const matchingTab = authorizedTabs.find(tab => tab.matchesCurrent);

    // Create dropdown selected display part
    const dropdownSelected = document.createElement('div');
    dropdownSelected.className = 'dropdown-selected';

    // If there's matching tab, use its domain as display text
    // Otherwise use current tab's domain
    const selectedTab = matchingTab || currentTab;

    dropdownSelected.innerHTML = `
      <span id="selectedTabText" title="${selectedTab.title || selectedTab.displayName}">${selectedTab.displayName}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    const dropdownOptions = document.createElement('div');
    dropdownOptions.className = 'dropdown-options';

    // Add all options to dropdown list
    dropdownOptions.appendChild(currentTab.element);

    // Set current option as selected unless there's matching tab
    if (!hasMatchingTab) {
      currentTab.element.classList.add('selected');
    }

    authorizedTabs.forEach(tab => {
      dropdownOptions.appendChild(tab.element);

      // If this is matching tab for current domain, mark as selected
      if (tab.matchesCurrent) {
        tab.element.classList.add('selected');
        // Load matching tab data
        loadTabData(tab.tabId);
      }
    });

    // If no authorized tabs, show one information
    if (authorizedTabs.length === 0) {
      const noAuthOption = document.createElement('div');
      noAuthOption.className = 'dropdown-option disabled';
      noAuthOption.textContent = I18n.getText('noAuthorizedTabs');
      dropdownOptions.appendChild(noAuthOption);
    }

    // Add dropdown element to DOM
    customDropdown.appendChild(dropdownSelected);
    customDropdown.appendChild(dropdownOptions);
    tabSelectorWrapper.appendChild(customDropdown);

    // Click to show/hide dropdown menu
    dropdownSelected.addEventListener('click', () => {
      dropdownSelected.classList.toggle('active');
      dropdownOptions.classList.toggle('active');
    });

    // Click option to close dropdown menu
    dropdownOptions.addEventListener('click', async e => {
      const option = e.target.closest('.dropdown-option');
      if (!option || option.classList.contains('disabled')) return;

      // Update selected state
      dropdownOptions.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');

      // Update display text - only display domain part
      const domain =
        option.dataset.domain || option.querySelector('.tab-domain')?.textContent || '';
      document.getElementById('selectedTabText').textContent = domain;
      document.getElementById('selectedTabText').title = option.title || domain;

      // Close dropdown menu
      dropdownSelected.classList.remove('active');
      dropdownOptions.classList.remove('active');

      // Handle selected value
      const selectedTabId = option.dataset.value;

      if (selectedTabId === 'current') {
        // Get current active tab
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs && activeTabs.length > 0) {
          await loadTabData(activeTabs[0].id);
        }
      } else if (selectedTabId) {
        // Load selected tab data
        await loadTabData(parseInt(selectedTabId));
      }
    });

    // Click other areas to close dropdown menu
    document.addEventListener('click', e => {
      if (!e.target.closest('.custom-dropdown')) {
        dropdownSelected.classList.remove('active');
        dropdownOptions.classList.remove('active');
      }
    });
  } catch (error) {
    console.error('Error initializing tab selector:', error);
  }
}

// On DOM load completed, initialize page
document.addEventListener('DOMContentLoaded', init);

// Initialize page
async function init() {
  try {
    console.log('Initializing AI analysis page...');

    // Initialize theme manager
    ThemeManager.init();

    // Initialize internationalization
    await initI18n();

    // Initialize AI provider display
    await initAIProviderDisplay();

    // Initialize tab selector
    await initTabSelector();

    // Initialize page data
    await initPage();

    // Set event handlers
    setupEventHandlers();

    // 设置打开设置页面的点击事件
    const openOptionsLink = document.getElementById('openOptionsPage');
    if (openOptionsLink) {
      openOptionsLink.addEventListener('click', openOptionsPage);
    }

    // 检查URL参数中是否有自动开始分析的标志
    const urlParams = new URLSearchParams(window.location.search);
    const autoStart = urlParams.get('autoStart') === 'true';

    if (autoStart) {
      console.log('Auto-start parameter detected, automatically running analysis');
      // 等待一小段时间，确保页面和数据完全加载
      setTimeout(() => {
        runAiAnalysis();
      }, 800);
    } else {
      console.log('AI analysis page initialized, waiting for user to click run analysis');
    }
  } catch (error) {
    console.error('Error initializing AI analysis page:', error);
    ToastManager.error(`${I18n.getText('initPageError')}: ${error.message}`);
  }
}

// Initialize internationalization
async function initI18n() {
  try {
    await I18n.init();
    console.log('I18n initialized with language:', I18n.getCurrentLanguage());
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

// Set event handlers
function setupEventHandlers() {
  // Back to main page button
  const backToMainBtn = document.getElementById('backToMain');
  if (backToMainBtn) {
    backToMainBtn.addEventListener('click', e => {
      e.preventDefault();
      window.close(); // Close current tab
    });
  }

  // Run analysis button
  const runAiAnalysisBtn = document.getElementById('runAiAnalysisBtn');
  if (runAiAnalysisBtn) {
    runAiAnalysisBtn.addEventListener('click', runAiAnalysis);
  }

  // Stop analysis button
  const stopAiAnalysisBtn = document.getElementById('stopAiAnalysisBtn');
  if (stopAiAnalysisBtn) {
    stopAiAnalysisBtn.addEventListener('click', stopAiAnalysis);
    // Default hidden
    stopAiAnalysisBtn.style.display = 'none';
  }

  // Copy results button
  const copyAnalysisBtn = document.getElementById('copyAnalysisBtn');
  if (copyAnalysisBtn) {
    copyAnalysisBtn.addEventListener('click', copyAnalysisResults);
  }

  // Download report and data button
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', downloadReport);
  }

  // Clear cache button
  const clearCacheBtn = document.getElementById('clearAiCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      AiConnector.clearCache();
      ToastManager.success(I18n.getText('aiCacheCleared'));
    });
  }

  // Open settings page
  const openOptionsPage = document.getElementById('openOptionsPage');
  if (openOptionsPage) {
    openOptionsPage.addEventListener('click', e => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  }
}

/**
 * 检查API密钥配置
 */
async function checkApiKeyConfiguration() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['aiApiKey', 'aiProvider', 'aiModel'], result => {
      const apiKey = result.aiApiKey || '';

      // 如果没有配置API密钥，自动配置默认的OpenRouter设置
      if (!apiKey) {
        console.log('API key not configured, setting up default OpenRouter configuration');

        // 从AiConnector获取默认配置
        const { AI_PROVIDERS } = AiConnector;
        const defaultProvider = 'openrouter';
        const defaultModel = AI_PROVIDERS.OPENROUTER.defaultModel;
        const defaultApiKey = AI_PROVIDERS.OPENROUTER.defaultApiKey;

        // 保存默认设置到存储
        chrome.storage.sync.set(
          {
            aiProvider: defaultProvider,
            aiModel: defaultModel,
            aiApiKey: defaultApiKey,
          },
          () => {
            console.log('Default OpenRouter configuration applied successfully');

            // 自动配置成功，返回true
            resolve(true);
          }
        );
      } else {
        // 已配置API密钥，直接返回true
        resolve(true);
      }
    });
  });
}

/**
 * 禁用页面操作
 */
function disablePageOperations() {
  // 禁用运行分析按钮
  const runBtn = document.getElementById('runAiAnalysisBtn');
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.classList.add('disabled');
  }

  // 禁用标签页选择器
  const tabSelector = document.querySelector('.tab-selector-wrapper');
  if (tabSelector) {
    tabSelector.style.opacity = '0.5';
    tabSelector.style.pointerEvents = 'none';
  }

  // 禁用操作按钮
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
  });

  // 显示设置链接高亮提示
  const settingsLink = document.getElementById('openOptionsPage');
  if (settingsLink) {
    settingsLink.classList.add('highlight-link');
    settingsLink.style.animation = 'pulse 1.5s infinite';
  }

  // 设置API错误提示区域按钮点击事件
  const configBtn = document.getElementById('openOptionsPageFromError');
  if (configBtn) {
    configBtn.addEventListener('click', openOptionsPage);
  }
}

/**
 * 打开设置页面
 */
function openOptionsPage(e) {
  if (e) e.preventDefault();
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

// Initialize AI provider and model display
async function initAIProviderDisplay() {
  try {
    // 获取AI配置，这会自动应用默认值
    await checkApiKeyConfiguration();
    const config = await getAIConfig();
    updateAIProviderDisplay(config);

    // 确保显示AI提供商名称和模型
    const analysisProvider = document.getElementById('analysisProvider');
    const analysisModel = document.getElementById('analysisModel');

    if (analysisProvider && analysisModel) {
      if (!analysisProvider.textContent || analysisProvider.textContent === 'OpenAI') {
        const providerName = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
        analysisProvider.textContent = providerName;
      }

      if (!analysisModel.textContent || analysisModel.textContent === 'GPT-4') {
        analysisModel.textContent = config.model;
      }
    }
  } catch (error) {
    console.error('Error initializing AI provider display:', error);
  }
}
