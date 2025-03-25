/**
 * Network Tracker - Handles network request monitoring and analysis
 */

// Object to store request data
let requestData = {};

// Store request data in local storage
function storeRequestData(tabId) {
  if (requestData[tabId]) {
    chrome.storage.local.set({ [`requestData_${tabId}`]: requestData[tabId] });
  }
}

/**
 * Initialize the network tracker
 * Requires DomainManager to be loaded
 */
function initNetworkTracker() {
  // Ensure DomainManager is available
  if (!DomainManager) {
    console.error("DomainManager is required for NetworkTracker to work properly");
    return;
  }
  
  // Listen for web request events
  chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
      const domain = DomainManager.extractDomain(details.url);
      if (!domain) return;
      
      const isAuthorized = await DomainManager.isDomainAuthorized(domain);
      if (!isAuthorized) return;
      
      if (!requestData[details.tabId]) {
        requestData[details.tabId] = {};
      }
      requestData[details.tabId][details.requestId] = {
        url: details.url,
        domain: domain,
        startTime: details.timeStamp,
        method: details.method,
        type: details.type
      };
    },
    { urls: ["<all_urls>"] }
  );

  // Track when headers are received
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (requestData[details.tabId] && requestData[details.tabId][details.requestId]) {
        requestData[details.tabId][details.requestId].headerReceivedTime = details.timeStamp;
        
        // Store response headers size
        if (details.responseHeaders) {
          requestData[details.tabId][details.requestId].responseHeadersSize = JSON.stringify(details.responseHeaders).length;
        }
      }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );

  // Track when request is completed
  chrome.webRequest.onCompleted.addListener(
    (details) => {
      if (requestData[details.tabId] && requestData[details.tabId][details.requestId]) {
        const request = requestData[details.tabId][details.requestId];
        request.endTime = details.timeStamp;
        request.totalTime = request.endTime - request.startTime;
        request.status = details.statusCode;
        
        // If we have header received time, calculate TTFB
        if (request.headerReceivedTime) {
          request.ttfb = request.headerReceivedTime - request.startTime;
        }
        
        // Calculate content download time (total time minus TTFB)
        if (request.ttfb) {
          request.contentDownloadTime = request.totalTime - request.ttfb;
        }
        
        // Store content size if available
        if (details.responseSize) {
          request.responseSize = details.responseSize;
        }
        
        // Send data to popup if it's open
        try {
          // Check if we can send a message by checking if any listeners exist
          chrome.runtime.sendMessage(
            {
              action: "requestCompleted",
              tabId: details.tabId,
              requestId: details.requestId,
              requestData: request
            },
            // Add a callback to handle the case where no receivers exist
            (response) => {
              if (chrome.runtime.lastError) {
                // This is expected if popup is not open, no need to log an error
                // console.debug("No receivers for message (this is normal if popup is closed)");
              }
            }
          );
        } catch (error) {
          console.error("Error sending requestCompleted message:", error);
        }
        
        // Store in local storage for persistence
        storeRequestData(details.tabId);
      }
    },
    { urls: ["<all_urls>"] }
  );

  // Track when request fails
  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      if (requestData[details.tabId] && requestData[details.tabId][details.requestId]) {
        const request = requestData[details.tabId][details.requestId];
        request.endTime = details.timeStamp;
        request.totalTime = request.endTime - request.startTime;
        request.error = details.error;
        
        // Send data to popup if it's open
        try {
          // Check if we can send a message by checking if any listeners exist
          chrome.runtime.sendMessage(
            {
              action: "requestFailed",
              tabId: details.tabId,
              requestId: details.requestId,
              requestData: request
            },
            // Add a callback to handle the case where no receivers exist
            (response) => {
              if (chrome.runtime.lastError) {
                // This is expected if popup is not open, no need to log an error
                // console.debug("No receivers for message (this is normal if popup is closed)");
              }
            }
          );
        } catch (error) {
          console.error("Error sending requestFailed message:", error);
        }
        
        // Store in local storage for persistence
        storeRequestData(details.tabId);
      }
    },
    { urls: ["<all_urls>"] }
  );

  // Clear data when tab is closed
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (requestData[tabId]) {
      delete requestData[tabId];
      chrome.storage.local.remove(`requestData_${tabId}`);
    }
  });
}

// Functions to handle request data
function getRequestData(tabId) {
  return requestData[tabId] || {};
}

function clearRequestData(tabId) {
  if (requestData[tabId]) {
    requestData[tabId] = {};
  }
  return chrome.storage.local.remove(`requestData_${tabId}`);
}

// Make functions available globally
(function(global) {
  global.NetworkTracker = {
    init: initNetworkTracker,
    getRequestData,
    clearRequestData,
    storeRequestData
  };
})(typeof window !== 'undefined' ? window : self);