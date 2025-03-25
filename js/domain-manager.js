/**
 * Domain Manager - Handles domain authorization functionality
 */

// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error("Error extracting domain:", e);
    return null;
  }
}

// Function to check if a domain is authorized
function isDomainAuthorized(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authorizedDomains'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      resolve(authorizedDomains.includes(domain));
    });
  });
}

// Function to authorize a domain
function authorizeDomain(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authorizedDomains'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      if (!authorizedDomains.includes(domain)) {
        authorizedDomains.push(domain);
        chrome.storage.local.set({ authorizedDomains }, () => {
          resolve(true);
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Function to remove domain authorization
function removeDomainAuthorization(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authorizedDomains'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      const index = authorizedDomains.indexOf(domain);
      
      if (index !== -1) {
        authorizedDomains.splice(index, 1);
        chrome.storage.local.set({ authorizedDomains }, () => {
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  });
}

// Make functions available globally
(function(global) {
  global.DomainManager = {
    extractDomain,
    isDomainAuthorized,
    authorizeDomain,
    removeDomainAuthorization
  };
})(typeof window !== 'undefined' ? window : self);