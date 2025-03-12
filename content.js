// This content script can be used to inject performance monitoring code
// or communicate with the background script

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "getPageInfo") {
      // Collect page information if needed
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
      };
      
      sendResponse({ pageInfo });
    }
  } catch (error) {
    console.error("Error handling message in content script:", error);
    sendResponse({ error: error.message });
  }
  
  return true; // Required for async response
});