/**
 * Background Script - Main entry point for the Chrome extension
 * Loads and initializes all required modules
 */

// Import modules explicitly
importScripts('./domain-manager.js', './network-tracker.js');

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle domain-related actions
  if (message.action === "checkDomainAuthorization") {
    const domain = message.domain;
    DomainManager.isDomainAuthorized(domain).then(isAuthorized => {
      sendResponse({ isAuthorized });
    });
    return true; // Required for async response
  } else if (message.action === "authorizeDomain") {
    const domain = message.domain;
    DomainManager.authorizeDomain(domain).then(success => {
      sendResponse({ success });
    });
    return true; // Required for async response
  } else if (message.action === "getAuthorizedDomains") {
    // 使用sync存储而非local存储，确保与options.js保持一致
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      // 合并两个数组并去重
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];
      sendResponse({ authorizedDomains: allDomains });
    });
    return true; // Required for async response
  } else if (message.action === "removeDomainAuthorization") {
    const domain = message.domain;
    DomainManager.removeDomainAuthorization(domain).then(success => {
      sendResponse({ success });
    });
    return true; // Required for async response
  }
  
  // Handle network request data actions
  else if (message.action === "getRequestData") {
    const tabId = message.tabId;
    const data = NetworkTracker.getRequestData(tabId);
    
    if (Object.keys(data).length > 0) {
      sendResponse({ requestData: data });
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
    NetworkTracker.clearRequestData(tabId).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error("Error clearing request data:", error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Required for async response
  }
});

// Initialize when extension is loaded
console.log("Background script initializing...");
  
// 同步域名列表
if (DomainManager && DomainManager.syncDomainLists) {
  DomainManager.syncDomainLists().then(() => {
    console.log("Domain lists synchronized during initialization");
  });
} else {
  console.error("DomainManager module not found or syncDomainLists not available");
}

// Initialize network tracker
if (NetworkTracker) {
  NetworkTracker.init();
  console.log("Network tracker initialized");
} else {
  console.error("NetworkTracker module not found");
}