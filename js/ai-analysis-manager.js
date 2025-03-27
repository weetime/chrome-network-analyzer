/**
 * AI Analysis Manager - Handles AI analysis of network requests
 */

import { AiConnector } from './ai-connector.js';
import { TableManager } from './table-manager.js';
import { StatsManager } from './stats-manager.js';

// State variables
let isAnalysisLoading = false;
let currentAnalysisResult = null;
let getRequestDataFunction = null; // Store function to get request data
let currentTabId = null;

/**
 * Initialize the AI analysis manager
 */
function initAiAnalysisManager() {
  // Add event listener for analyze button
  const analyzeButton = document.getElementById('analyzeButton');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', runAiAnalysis);
  }
  
  // Add event listener for copy analysis button
  const copyAnalysisBtn = document.getElementById('copyAnalysisBtn');
  if (copyAnalysisBtn) {
    copyAnalysisBtn.addEventListener('click', copyAnalysisResults);
  }
  
  // Add event listener for close analysis button
  const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
  if (closeAnalysisBtn) {
    closeAnalysisBtn.addEventListener('click', closeAnalysis);
  }
}

/**
 * Run AI analysis on current network data
 */
async function runAiAnalysis() {
  // Get the container for AI analysis
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  if (!aiAnalysisContainer) {
    console.error('AI analysis container not found');
    return;
  }
  
  // Toggle analysis container visibility
  aiAnalysisContainer.classList.add('visible');
  
  // Get analysis content and loading elements
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  
  if (!aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Show loading, hide content
  aiAnalysisStatus.style.display = 'flex';
  aiAnalysisResult.innerHTML = '';
  
  // Get data for analysis
  let requestsData = {};
  
  // Try to get data from stored function first
  if (typeof getRequestDataFunction === 'function') {
    requestsData = getRequestDataFunction();
  } else if (TableManager && TableManager.getRequestData) {
    // Fall back to TableManager if available
    requestsData = TableManager.getRequestData();
  } else {
    // Request from background script as last resort
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getRequestData", tabId: currentTabId },
          (response) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }
            resolve(response);
          }
        );
      });
      
      if (response && response.requestData) {
        requestsData = response.requestData;
      }
    } catch (error) {
      showAnalysisError(`Error getting request data: ${error.message}`);
      return;
    }
  }
  
  // If no data, show error
  if (Object.keys(requestsData).length === 0) {
    showAnalysisError('No request data available for analysis.');
    return;
  }
  
  // Calculate statistics for AI analysis
  const statistics = calculateStatistics(requestsData);
  
  // Flag to track loading state
  isAnalysisLoading = true;
  
  try {
    // Get API configuration from storage
    const config = await new Promise((resolve) => {
      chrome.storage.local.get(['aiModel', 'aiApiKey'], (result) => {
        resolve({
          provider: 'openai',
          apiKey: result.aiApiKey || '',
          model: result.aiModel || 'gpt-4-turbo'
        });
      });
    });
    
    // Check if API key is configured
    if (!config.apiKey) {
      showAnalysisError('API key not configured. Please configure API key in the options page.');
      return;
    }
    
    // Format data for AI analysis
    const analysisData = AiConnector.formatNetworkDataForAI(requestsData, statistics);
    
    // Send to AI provider
    const result = await AiConnector.sendToAI(
      analysisData, 
      config.provider, 
      config.apiKey, 
      config.model
    );
    
    // Save result
    currentAnalysisResult = result;
    
    // Display analysis result
    displayAnalysisResult(result);
  } catch (error) {
    showAnalysisError(`Error during AI analysis: ${error.message}`);
  } finally {
    isAnalysisLoading = false;
  }
}

/**
 * Calculate statistics for AI analysis
 */
function calculateStatistics(requestsData) {
  const requests = Object.values(requestsData);
  
  // Filter requests with valid time data
  const validRequests = requests.filter(req => req.totalTime);
  
  // If no valid requests, return empty stats
  if (validRequests.length === 0) {
    return {
      totalRequests: 0,
      averageLoadTime: 0,
      p95LoadTime: 0,
      errorRate: 0
    };
  }
  
  // Calculate total load time
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  
  // Calculate average load time
  const averageLoadTime = totalLoadTime / validRequests.length;
  
  // Calculate error rate
  const errorCount = requests.filter(req => req.error || (req.status && req.status >= 400)).length;
  const errorRate = (errorCount / requests.length) * 100;
  
  // Calculate percentiles if we have the function available
  let p95LoadTime = 0;
  if (StatsManager && StatsManager.calculatePercentile) {
    const times = validRequests.map(req => req.totalTime);
    p95LoadTime = StatsManager.calculatePercentile(times, 95);
  } else {
    // Simple implementation if StatsManager not available
    const times = validRequests.map(req => req.totalTime).sort((a, b) => a - b);
    const index = Math.floor(times.length * 0.95);
    p95LoadTime = times[index] || 0;
  }
  
  return {
    totalRequests: requests.length,
    averageLoadTime,
    p95LoadTime,
    errorRate
  };
}

/**
 * Display AI analysis result
 */
function displayAnalysisResult(result) {
  // Get elements
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  const modelInfoElement = document.getElementById('aiModelInfo');
  
  if (!aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Hide loading indicator
  aiAnalysisStatus.style.display = 'none';
  
  // Set analysis text with formatted content
  aiAnalysisResult.innerHTML = formatAnalysisText(result.analysis);
  
  // Set model info if element exists
  if (modelInfoElement) {
    modelInfoElement.textContent = `Analyzed with ${result.model || 'AI'}`;
  }
  
  // Save current result for copy function
  currentAnalysisResult = result;
}

/**
 * Format analysis text with Markdown-like formatting
 */
function formatAnalysisText(text) {
  if (!text) return '';
  
  // Convert line breaks to HTML breaks
  let formatted = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
  
  // Convert headers
  formatted = formatted.replace(/#{3,6} (.+?)(?:<br>|$)/g, '<h4>$1</h4>');
  formatted = formatted.replace(/## (.+?)(?:<br>|$)/g, '<h3>$1</h3>');
  formatted = formatted.replace(/# (.+?)(?:<br>|$)/g, '<h2>$1</h2>');
  
  // Convert bold text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert lists
  formatted = formatted.replace(/- (.+?)(?:<br>|$)/g, '• $1<br>');
  
  return formatted;
}

/**
 * Show error message for AI analysis
 */
function showAnalysisError(message) {
  // Get elements
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  
  if (!aiAnalysisContainer || !aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Show container
  aiAnalysisContainer.classList.add('visible');
  
  // Hide loading and show error in result
  aiAnalysisStatus.style.display = 'none';
  
  // Set error message in result div
  aiAnalysisResult.innerHTML = `
    <div class="analysis-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>${message}</p>
    </div>
  `;
  
  // Reset loading state
  isAnalysisLoading = false;
}

/**
 * Copy analysis results to clipboard
 */
function copyAnalysisResults() {
  if (!currentAnalysisResult || !currentAnalysisResult.analysis) {
    return;
  }
  
  // Copy to clipboard
  navigator.clipboard.writeText(currentAnalysisResult.analysis)
    .then(() => {
      // Show temporary success message
      const copyBtn = document.getElementById('copyAiResultBtn');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
          <span>Copied!</span>
        `;
        
        // Restore original text after 2 seconds
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    })
    .catch(err => {
      console.error('Failed to copy analysis results:', err);
    });
}

/**
 * Close the analysis panel
 */
function closeAnalysis() {
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  if (aiAnalysisContainer) {
    aiAnalysisContainer.classList.remove('visible');
  }
}

// Initialize options
function init(options = {}) {
  // Handle options
  const {
    containerId = 'aiAnalysisContainer',
    statusId = 'aiAnalysisStatus',
    resultId = 'aiAnalysisResult',
    modelInfoId = 'aiModelInfo',
    copyButtonId = 'copyAiResultBtn',
    getRequestData = null,
    tabId = null
  } = options;
  
  // Store options for later use
  if (getRequestData) {
    getRequestDataFunction = getRequestData;
  }
  
  // Store current tab ID if provided
  if (tabId) {
    currentTabId = tabId;
  } else {
    // Try to get from current URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tabIdParam = urlParams.get('tabId');
    if (tabIdParam) {
      currentTabId = parseInt(tabIdParam, 10);
    }
  }
  
  // Add event listener for analyze button
  const analyzeButton = document.getElementById('runAiAnalysisBtn');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', runAiAnalysis);
  }
  
  // Add event listener for copy button
  const copyButton = document.getElementById(copyButtonId);
  if (copyButton) {
    copyButton.addEventListener('click', copyAnalysisResults);
  }
  
  return Promise.resolve();
}

// Export the AI Analysis Manager functionality
export const AiAnalysisManager = {
  init,
  runAiAnalysis,
  calculateStatistics,
  displayAnalysisResult,
  formatAnalysisText,
  showAnalysisError,
  copyAnalysisResults,
  closeAnalysis
};