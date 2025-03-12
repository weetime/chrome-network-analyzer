// Object to store request data
let requestData = {};

// Listen for web request events
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!requestData[details.tabId]) {
      requestData[details.tabId] = {};
    }
    requestData[details.tabId][details.requestId] = {
      url: details.url,
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
        chrome.runtime.sendMessage({
          action: "requestCompleted",
          tabId: details.tabId,
          requestId: details.requestId,
          requestData: request
        });
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
        chrome.runtime.sendMessage({
          action: "requestFailed",
          tabId: details.tabId,
          requestId: details.requestId,
          requestData: request
        });
      } catch (error) {
        console.error("Error sending requestFailed message:", error);
      }
      
      // Store in local storage for persistence
      storeRequestData(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Store request data in local storage
function storeRequestData(tabId) {
  if (requestData[tabId]) {
    chrome.storage.local.set({ [`requestData_${tabId}`]: requestData[tabId] });
  }
}

// Clear data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (requestData[tabId]) {
    delete requestData[tabId];
    chrome.storage.local.remove(`requestData_${tabId}`);
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getRequestData") {
    const tabId = message.tabId;
    if (requestData[tabId]) {
      sendResponse({ requestData: requestData[tabId] });
    } else {
      // Try to get from storage
      chrome.storage.local.get([`requestData_${tabId}`], (result) => {
        const storedData = result[`requestData_${tabId}`] || {};
        sendResponse({ requestData: storedData });
      });
      return true; // Required for async response
    }
  } else if (message.action === "clearRequestData") {
    const tabId = message.tabId;
    // Clear data for the tab
    if (requestData[tabId]) {
      requestData[tabId] = {};
    }
    // Clear from storage
    chrome.storage.local.remove(`requestData_${tabId}`, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
});