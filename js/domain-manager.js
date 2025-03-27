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
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      
      // Only use sync storage as the source of truth
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];
      resolve(allDomains.includes(domain));
    });
  });
}

// Function to authorize a domain
function authorizeDomain(domain) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      
      let updated = false;
      
      if (!authorizedDomains.includes(domain)) {
        authorizedDomains.push(domain);
        updated = true;
      }
      
      if (!headerDomains.includes(domain)) {
        headerDomains.push(domain);
        updated = true;
      }
      
      if (updated) {
        chrome.storage.sync.set({ 
          authorizedDomains,
          headerDomainsList: headerDomains 
        }, () => {
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
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], (result) => {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      
      const authIndex = authorizedDomains.indexOf(domain);
      if (authIndex !== -1) {
        authorizedDomains.splice(authIndex, 1);
      }
      
      const headerIndex = headerDomains.indexOf(domain);
      if (headerIndex !== -1) {
        headerDomains.splice(headerIndex, 1);
      }
      
      if (authIndex !== -1 || headerIndex !== -1) {
        chrome.storage.sync.set({ 
          authorizedDomains, 
          headerDomainsList: headerDomains 
        }, () => {
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  });
}

// 同步本地存储和sync存储中的域名列表
function syncDomainLists() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], (syncResult) => {
      chrome.storage.local.get(['authorizedDomains'], (localResult) => {
        const syncAuthorizedDomains = syncResult.authorizedDomains || [];
        const syncHeaderDomains = syncResult.headerDomainsList || [];
        const localAuthorizedDomains = localResult.authorizedDomains || [];
        
        // Instead of blindly merging all domains, we need to respect domains
        // that have been explicitly removed from sync storage
        // Use sync storage as the source of truth
        const allDomains = [...new Set([
          ...syncAuthorizedDomains, 
          ...syncHeaderDomains
        ])];
        
        // Save the synchronized domains back to both storage locations
        chrome.storage.sync.set({
          authorizedDomains: allDomains,
          headerDomainsList: allDomains
        }, () => {
          chrome.storage.local.set({
            authorizedDomains: allDomains
          }, () => {
            resolve(true);
          });
        });
      });
    });
  });
}

// Make functions available globally
(function(global) {
  global.DomainManager = {
    extractDomain,
    isDomainAuthorized,
    authorizeDomain,
    removeDomainAuthorization,
    syncDomainLists
  };
  
  syncDomainLists().then(() => {
    console.log("Domain lists synchronized");
  });
})(typeof window !== 'undefined' ? window : self);