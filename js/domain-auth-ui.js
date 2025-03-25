/**
 * Domain Authorization UI - Manages UI for domain authorization
 */

// Variables to store domain info
let currentDomain = null;

/**
 * Initialize domain authorization UI
 */
function initDomainAuthUi() {
  // Add event listeners for domain management
  setupDomainSwitchListener();
  setupDomainManagementLinks();
}

/**
 * Set up domain authorization switch event listener
 */
function setupDomainSwitchListener() {
  const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
  const headerAuthStatus = document.getElementById('headerAuthStatus');
  
  if (headerAuthorizationSwitch) {
    headerAuthorizationSwitch.addEventListener('change', () => {
      if (headerAuthorizationSwitch.checked) {
        // Authorize domain
        if (currentDomain) {
          chrome.runtime.sendMessage(
            { action: "authorizeDomain", domain: currentDomain },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error authorizing domain:", chrome.runtime.lastError);
                // Reset switch
                headerAuthorizationSwitch.checked = false;
                return;
              }
              
              if (response && response.success) {
                // Update UI
                if (headerAuthStatus) {
                  headerAuthStatus.textContent = window.I18n ? window.I18n.getText('enable') : '启用';
                  headerAuthStatus.className = 'auth-status enabled';
                }
                
                // Show authorized content
                document.getElementById('authorizedContent').style.display = 'block';
                
                // Request network data
                requestNetworkData();
                
                // Update authorized domains list
                loadAuthorizedDomains();
              }
            }
          );
        }
      } else {
        // Remove domain authorization
        if (currentDomain) {
          chrome.runtime.sendMessage(
            { action: "removeDomainAuthorization", domain: currentDomain },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error removing domain authorization:", chrome.runtime.lastError);
                // Reset switch
                headerAuthorizationSwitch.checked = true;
                return;
              }
              
              if (response && response.success !== false) {
                // Update UI
                if (headerAuthStatus) {
                  headerAuthStatus.textContent = window.I18n ? window.I18n.getText('disable') : '禁用';
                  headerAuthStatus.className = 'auth-status disabled';
                }
                
                // Hide authorized content
                document.getElementById('authorizedContent').style.display = 'none';
                
                // Update authorized domains list
                loadAuthorizedDomains();
              }
            }
          );
        }
      }
    });
  }
}

/**
 * Set up domain management links
 */
function setupDomainManagementLinks() {
  // Domain settings link in header
  const openDomainSettings = document.getElementById('openDomainSettings');
  if (openDomainSettings) {
    openDomainSettings.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
  
  // AI settings link
  const openOptionsPage = document.getElementById('openOptionsPage');
  if (openOptionsPage) {
    openOptionsPage.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Hide authorized content UI
 */
function hideAuthorizedContent() {
  document.getElementById('authorizedContent').style.display = 'none';
  
  // Hide AI analysis panel if it exists
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  if (aiAnalysisContainer) {
    aiAnalysisContainer.classList.remove('visible');
  }
  
  // 不再隐藏domain-info，确保用户可以看到域名信息并重新授权
  // const domainInfoElement = document.querySelector('.domain-info');
  // if (domainInfoElement) {
  //   domainInfoElement.style.display = 'none';
  // }
}

/**
 * Load and display authorized domains
 */
function loadAuthorizedDomains() {
  chrome.runtime.sendMessage(
    { action: "getAuthorizedDomains" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error getting authorized domains:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.authorizedDomains) {
        displayAuthorizedDomains(response.authorizedDomains);
      }
    }
  );
}

/**
 * Display authorized domains in the UI
 */
function displayAuthorizedDomains(domains) {
  const headerDomainsList = document.getElementById('headerDomainsList');
  
  if (!headerDomainsList) return;
  
  // Clear list
  headerDomainsList.innerHTML = '';
  
  // Set current domain if we have it
  if (currentDomain) {
    const currentDomainItem = document.createElement('div');
    currentDomainItem.className = 'header-domain-item current';
    currentDomainItem.textContent = currentDomain;
    headerDomainsList.appendChild(currentDomainItem);
  }
}

/**
 * Remove domain authorization and update UI
 */
function removeDomainAuthorization(domain) {
  chrome.runtime.sendMessage(
    { action: "removeDomainAuthorization", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error removing domain authorization:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success !== false) {
        // If removed domain is current domain, update UI
        if (domain === currentDomain) {
          // Update header switch
          const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
          const headerAuthStatus = document.getElementById('headerAuthStatus');
          
          if (headerAuthorizationSwitch) {
            headerAuthorizationSwitch.checked = false;
          }
          if (headerAuthStatus) {
            headerAuthStatus.textContent = window.I18n ? window.I18n.getText('disable') : '禁用';
            headerAuthStatus.className = 'auth-status disabled';
          }
          
          // Show unauthorized content
          hideAuthorizedContent();
        }
        
        // Reload authorized domains list
        loadAuthorizedDomains();
      }
    }
  );
}

/**
 * Check domain authorization status and update UI
 */
function checkDomainAuthorization(domain) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "checkDomainAuthorization", domain },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error checking domain authorization:", chrome.runtime.lastError);
          resolve(false);
          return;
        }
        
        if (response && response.isAuthorized) {
          // Domain is authorized
          resolve(true);
        } else {
          // Domain is not authorized
          resolve(false);
        }
      }
    );
  });
}

/**
 * Set current domain and update UI
 */
async function setCurrentDomain(domain) {
  currentDomain = domain;
  
  // 无论授权状态如何，都显示域名信息区域
  const domainInfoElement = document.querySelector('.domain-info');
  if (domainInfoElement) {
    domainInfoElement.style.display = 'flex';
  }
  
  // Check if domain is authorized
  const isAuthorized = await checkDomainAuthorization(domain);
  
  // Update UI based on authorization status
  const headerAuthorizationSwitch = document.getElementById('headerAuthorizationSwitch');
  const headerAuthStatus = document.getElementById('headerAuthStatus');
  
  if (headerAuthorizationSwitch) {
    headerAuthorizationSwitch.checked = isAuthorized;
  }
  
  if (headerAuthStatus) {
    if (isAuthorized) {
      headerAuthStatus.textContent = window.I18n ? window.I18n.getText('enable') : '启用';
      headerAuthStatus.className = 'auth-status enabled';
    } else {
      headerAuthStatus.textContent = window.I18n ? window.I18n.getText('disable') : '禁用';
      headerAuthStatus.className = 'auth-status disabled';
    }
  }
  
  // Show appropriate content
  if (isAuthorized) {
    document.getElementById('authorizedContent').style.display = 'block';
    
    // Request network data if function available
    if (typeof requestNetworkData === 'function') {
      requestNetworkData();
    }
  } else {
    hideAuthorizedContent();
  }
  
  // Update authorized domains list
  loadAuthorizedDomains();
  
  return isAuthorized;
}

// Make functions available globally
(function(global) {
  global.DomainAuthUi = {
    init: initDomainAuthUi,
    hideAuthorizedContent,
    loadAuthorizedDomains,
    displayAuthorizedDomains,
    removeDomainAuthorization,
    checkDomainAuthorization,
    setCurrentDomain,
    getCurrentDomain: () => currentDomain
  };
})(typeof window !== 'undefined' ? window : self);