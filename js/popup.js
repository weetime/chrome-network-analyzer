/**
 * Popup Main Script - Integrates all modules and initializes the popup functionality
 */

// Global variables
let currentTabId = null;

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
        }
      }
    }
  );
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
  const analyzeButton = document.getElementById('analyzeButton');
  if (analyzeButton) {
    if (window.AiAnalysisManager && window.AiAnalysisManager.runAnalysis) {
      // Use the module if available
      analyzeButton.addEventListener('click', window.AiAnalysisManager.runAnalysis);
    } else {
      // Fallback to legacy function
      analyzeButton.addEventListener('click', runAiAnalysis);
    }
  }
}

// Export data as JSON
function exportData() {
  const requestData = window.TableManager ? window.TableManager.getRequestData() : {};
  
  if (Object.keys(requestData).length === 0) {
    alert('No data to export.');
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
  if (confirm('Are you sure you want to clear all network data for this tab?')) {
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
      }
    }
  } catch (error) {
    console.error("Error initializing popup:", error);
  }
}

// Legacy function for domain checking
function checkDomainAndLoadData(domain) {
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
        
        // Show domain info in header
        const domainInfo = document.querySelector('.domain-info');
        if (domainInfo) {
          domainInfo.style.display = 'flex';
        }
        
        // Update header authorization switch
        const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
        const headerAuthStatus = document.getElementById('headerAuthStatus');
        
        if (headerAuthorizationSwitch) {
          headerAuthorizationSwitch.checked = true;
        }
        if (headerAuthStatus) {
          headerAuthStatus.textContent = '启用';
          headerAuthStatus.className = 'auth-status enabled';
        }
        
        requestNetworkData();
      } else {
        // Domain is not authorized, show authorization UI
        if (window.DomainAuthUi) {
          window.DomainAuthUi.showUnauthorizedContent();
        } else {
          document.getElementById('unauthorizedContent').style.display = 'block';
          document.getElementById('authorizedContent').style.display = 'none';
        }
        
        // Hide domain info in header
        const domainInfo = document.querySelector('.domain-info');
        if (domainInfo) {
          domainInfo.style.display = 'none';
        }
      }
    }
  );
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);