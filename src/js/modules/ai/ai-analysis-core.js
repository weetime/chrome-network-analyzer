/**
 * AI Analysis Core - Core functionality for AI analysis of network requests
 */

import { AiConnector } from '../../ai-connector.js';
import { TableManager } from '../../table-manager.js';
import { StatsManager } from '../../stats-manager.js';
import { AiAnalysisUi } from './ai-analysis-ui.js';
import { AiDataProcessor } from './ai-data-processor.js';

// State variables
let isAnalysisLoading = false;
let currentAnalysisResult = null;
let getRequestDataFunction = null; // Store function to get request data
let currentTabId = null;

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

  // Get the analyze button
  const analyzeButton = document.getElementById('runAiAnalysisBtn');

  // Check if analysis is already running
  if (isAnalysisLoading) {
    console.log('Analysis already in progress');
    return;
  }

  // Disable the button and add loading state
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.classList.add('disabled');
  }

  // Toggle analysis container visibility
  aiAnalysisContainer.classList.add('visible');

  // Get analysis content and loading elements
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');

  if (!aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    // Re-enable the button before returning
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove('disabled');
    }
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
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'getRequestData', tabId: currentTabId }, response => {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
          resolve(response);
        });
      });

      if (response && response.requestData) {
        requestsData = response.requestData;
      }
    } catch (error) {
      AiAnalysisUi.showAnalysisError(`Error getting request data: ${error.message}`);
      // Re-enable the button before returning
      if (analyzeButton) {
        analyzeButton.disabled = false;
        analyzeButton.classList.remove('disabled');
      }
      return;
    }
  }

  // If no data, show error
  if (Object.keys(requestsData).length === 0) {
    AiAnalysisUi.showAnalysisError('No request data available for analysis.');
    // Re-enable the button before returning
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove('disabled');
    }
    return;
  }

  // Calculate statistics for AI analysis
  const statistics = AiDataProcessor.calculateStatistics(requestsData);

  // Flag to track loading state
  isAnalysisLoading = true;

  try {
    // Get API configuration from storage
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(
        ['aiProvider', 'aiModel', 'apiKey', 'apiUrl', 'openaiApiKey'],
        result => {
          console.log('Getting AI settings:', result); // Debug information

          const config = {
            provider: result.aiProvider || 'openai',
            apiKey: result.apiKey || result.openaiApiKey || '',
            model: result.aiModel || 'gpt-4-turbo',
            apiUrl: result.apiUrl || '',
          };

          console.log('Using AI configuration:', config.provider, config.model); // Debug information
          resolve(config);
        }
      );
    });

    // Check if API key is configured
    if (!config.apiKey) {
      AiAnalysisUi.showAnalysisError(
        'API key not configured. Please configure API key in the options page.'
      );
      return;
    }

    // Update model information display in advance
    const modelInfoElement = document.getElementById('aiModelInfo');
    if (modelInfoElement) {
      const providerName = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
      modelInfoElement.textContent = `Analyzed with ${providerName} ${config.model}`;
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

    console.log('AI analysis result:', result); // Debug information

    // Save result
    currentAnalysisResult = result;

    // Display analysis result
    AiAnalysisUi.displayAnalysisResult(result, config);
  } catch (error) {
    AiAnalysisUi.showAnalysisError(`Error during AI analysis: ${error.message}`);
  } finally {
    isAnalysisLoading = false;

    // Re-enable the button
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove('disabled');
    }
  }
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

/**
 * Copy analysis results to clipboard
 */
function copyAnalysisResults() {
  if (!currentAnalysisResult || !currentAnalysisResult.analysis) {
    return;
  }

  // Copy to clipboard
  navigator.clipboard
    .writeText(currentAnalysisResult.analysis)
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
    tabId = null,
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

// Get current analysis result
function getCurrentAnalysisResult() {
  return currentAnalysisResult;
}

// Set current analysis result
function setCurrentAnalysisResult(result) {
  currentAnalysisResult = result;
}

// Get analysis loading state
function getAnalysisLoadingState() {
  return isAnalysisLoading;
}

// Export functionality
export const AiAnalysisCore = {
  init,
  runAiAnalysis,
  closeAnalysis,
  copyAnalysisResults,
  getCurrentAnalysisResult,
  setCurrentAnalysisResult,
  getAnalysisLoadingState,
};
