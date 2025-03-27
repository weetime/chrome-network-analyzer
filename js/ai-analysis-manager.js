/**
 * AI Analysis Manager - Handles AI analysis of network requests
 */

// State variables
let isAnalysisLoading = false;
let currentAnalysisResult = null;

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
  // Check if we have the AiConnector available
  if (!window.AiConnector) {
    showAnalysisError('AI Connector module not found.');
    return;
  }
  
  // Get the container for AI analysis
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  if (!aiAnalysisContainer) {
    console.error('AI analysis container not found');
    return;
  }
  
  // Toggle analysis container visibility
  aiAnalysisContainer.classList.add('visible');
  
  // Get analysis content and loading elements
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisContent = document.getElementById('analysisContent');
  const analysisError = document.getElementById('analysisError');
  
  if (!analysisLoading || !analysisContent || !analysisError) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Show loading, hide content and error
  analysisLoading.style.display = 'block';
  analysisContent.style.display = 'none';
  analysisError.style.display = 'none';
  
  // Get data for analysis
  let requestsData = {};
  
  // Try to get data from TableManager
  if (window.TableManager && window.TableManager.getRequestData) {
    requestsData = window.TableManager.getRequestData();
  } else {
    // Request from background script
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getRequestData", tabId: window.currentTabId },
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
    const analysisData = window.AiConnector.formatNetworkDataForAI(requestsData, statistics);
    
    // Send to AI provider
    const result = await window.AiConnector.sendToAI(
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
  if (window.StatsManager && window.StatsManager.calculatePercentile) {
    const times = validRequests.map(req => req.totalTime);
    p95LoadTime = window.StatsManager.calculatePercentile(times, 95);
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
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisContent = document.getElementById('analysisContent');
  const analysisText = document.getElementById('analysisText');
  const analysisModel = document.getElementById('analysisModel');
  const analysisProvider = document.getElementById('analysisProvider');
  
  if (!analysisLoading || !analysisContent || !analysisText || !analysisModel || !analysisProvider) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Hide loading, show content
  analysisLoading.style.display = 'none';
  analysisContent.style.display = 'block';
  
  // Set analysis text
  analysisText.innerHTML = formatAnalysisText(result.analysis);
  
  // Set model and provider info
  analysisModel.textContent = result.model || 'Unknown Model';
  analysisProvider.textContent = result.provider || 'Unknown Provider';
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
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisContent = document.getElementById('analysisContent');
  const analysisError = document.getElementById('analysisError');
  const analysisErrorText = document.getElementById('analysisErrorText');
  
  if (!aiAnalysisContainer || !analysisLoading || !analysisContent || !analysisError || !analysisErrorText) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Show container
  aiAnalysisContainer.classList.add('visible');
  
  // Hide loading and content, show error
  analysisLoading.style.display = 'none';
  analysisContent.style.display = 'none';
  analysisError.style.display = 'block';
  
  // Set error message
  analysisErrorText.textContent = message;
  
  // Reset loading state
  isAnalysisLoading = false;
}

/**
 * Copy analysis results to clipboard
 */
function copyAnalysisResults() {
  // Check if we have results
  if (!currentAnalysisResult || !currentAnalysisResult.analysis) {
    // Use RequestDetailsManager's showNotification if available
    if (window.RequestDetailsManager && window.RequestDetailsManager.showNotification) {
      window.RequestDetailsManager.showNotification('No analysis results to copy', true);
    } else {
      alert('No analysis results to copy');
    }
    return;
  }
  
  // Create formatted text
  let copyText = `Chrome Network Analyzer - AI Analysis\n\n`;
  copyText += `Provider: ${currentAnalysisResult.provider || 'Unknown'}\n`;
  copyText += `Model: ${currentAnalysisResult.model || 'Unknown'}\n\n`;
  copyText += `${currentAnalysisResult.analysis}\n`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(copyText).then(() => {
    // Show notification
    if (window.RequestDetailsManager && window.RequestDetailsManager.showNotification) {
      window.RequestDetailsManager.showNotification('Analysis copied to clipboard');
    } else {
      alert('Analysis copied to clipboard');
    }
  }).catch(err => {
    console.error('Failed to copy analysis: ', err);
    if (window.RequestDetailsManager && window.RequestDetailsManager.showNotification) {
      window.RequestDetailsManager.showNotification('Failed to copy analysis', true);
    } else {
      alert('Failed to copy analysis: ' + err.message);
    }
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

// Make functions available globally
(function(global) {
  global.AiAnalysisManager = {
    init: initAiAnalysisManager,
    runAnalysis: runAiAnalysis,
    copyAnalysisResults,
    closeAnalysis
  };
})(typeof window !== 'undefined' ? window : self);