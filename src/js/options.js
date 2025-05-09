/**
 * Network Analyzer Options Page Script
 */

// Import required modules
import { I18n } from './i18n.js';
import './i18n/zh.js';
import './i18n/en.js';
import { ToastManager } from './toast-manager.js';
import { AiConnector } from './ai-connector.js';

// Define global variables
let authorizedDomainsList;

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function () {
  // First initialize I18n
  await initI18n();

  // Initialize theme
  initTheme();

  // Initialize language
  initLanguage();

  // Initialize domain management
  initDomainManagement();

  // Initialize settings save
  initSettingsSave();

  // Initialize sidebar navigation
  initSidebarNav();

  // Initialize form events for all tabs
  initFormEvents();

  // Initialize AI Provider selector
  initAIProviderSelection();

  // Display saved AI settings
  loadAISettings();

  // Initialize extension settings
  initExtensionSettings();
});

/**
 * Initialize internationalization functionality
 */
async function initI18n() {
  try {
    // Initialize I18n and load language packs
    await I18n.init();

    // Get current language
    const currentLang = I18n.getCurrentLanguage();

    // Set language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) languageSelect.value = currentLang;

    console.log('I18n initialized with language:', currentLang);
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

/**
 * Initialize theme switching functionality
 */
function initTheme() {
  // Get theme radio buttons
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  // First try to get theme settings from Chrome Storage
  chrome.storage.local.get(['theme'], result => {
    // Get stored theme, default to light
    const storedTheme = result.theme || localStorage.getItem('networkAnalyzerTheme') || 'light';

    // Apply stored theme
    document.documentElement.setAttribute('data-theme', storedTheme);

    // Set corresponding radio button
    // Fix case issues and special theme names
    let radioId;

    // Generate correct ID based on theme name
    if (storedTheme === 'fireblack') {
      radioId = 'themeFireBlack'; // Note case, keep consistent with HTML
    } else {
      // For light and dark themes, capitalize first letter
      radioId = `theme${storedTheme.charAt(0).toUpperCase() + storedTheme.slice(1)}`;
    }

    const radioToCheck = document.getElementById(radioId);
    console.log('Setting theme:', storedTheme, 'Radio ID:', radioId, 'Element:', radioToCheck);

    if (radioToCheck) {
      radioToCheck.checked = true;
    } else {
      console.warn('Theme radio button not found:', radioId);
    }

    // Ensure localStorage and Chrome Storage sync
    localStorage.setItem('networkAnalyzerTheme', storedTheme);
    localStorage.setItem('theme', storedTheme); // Compatible with popup.html
    chrome.storage.local.set({ theme: storedTheme });
  });

  // Add event listener for each theme radio button
  themeRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (this.checked) {
        const theme = this.value;
        document.documentElement.setAttribute('data-theme', theme);

        // Sync save to both storage locations
        localStorage.setItem('networkAnalyzerTheme', theme);
        localStorage.setItem('theme', theme); // Compatible with popup.html
        chrome.storage.local.set({ theme: theme });
      }
    });
  });
}

/**
 * Initialize language selection functionality
 */
function initLanguage() {
  const languageSelect = document.getElementById('languageSelect');
  const storedLanguage = localStorage.getItem('networkAnalyzerLanguage') || 'en';

  // Set saved language
  languageSelect.value = storedLanguage;

  // Allow only Chinese and English
  if (storedLanguage !== 'en' && storedLanguage !== 'zh') {
    languageSelect.value = 'en';
    localStorage.setItem('networkAnalyzerLanguage', 'en');
  }

  // Language change event
  languageSelect.addEventListener('change', function () {
    const language = this.value;
    localStorage.setItem('networkAnalyzerLanguage', language);
    // If language changes, page needs to be refreshed to apply new language
    const languageChangeMsg = I18n.getText('languageChangeMsg');
    ToastManager.success(languageChangeMsg);
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
}

/**
 * Initialize domain management functionality
 */
function initDomainManagement() {
  authorizedDomainsList = document.getElementById('authorizedDomainsList');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const newDomainInput = document.getElementById('newDomain');
  const noDomainsMessage = document.querySelector('.no-domains-message');

  // Load authorized domains
  loadAuthorizedDomains();

  // Add domain button event
  addDomainBtn.addEventListener('click', function () {
    addNewDomain();
  });

  // Input enter key event
  newDomainInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addNewDomain();
    }
  });

  /**
   * Add a new domain
   */
  function addNewDomain() {
    const domain = newDomainInput.value.trim();

    if (domain === '') {
      ToastManager.error(I18n.getText('invalidDomain'));
      return;
    }

    // Validate domain format
    if (!isValidDomain(domain)) {
      ToastManager.error(I18n.getText('invalidDomainFormat'));
      return;
    }

    // Check if domain already exists
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function (result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];

      if (allDomains.includes(domain)) {
        ToastManager.error(I18n.getText('domainExist'));
        return;
      }

      // Add new domain to authorizedDomains
      authorizedDomains.push(domain);

      // Also update headerDomainsList, ensure both are in sync
      headerDomains.push(domain);

      // Save data
      chrome.storage.sync.set(
        {
          authorizedDomains: authorizedDomains,
          headerDomainsList: headerDomains,
        },
        function () {
          // Clear input field
          newDomainInput.value = '';

          // Update domain list
          addDomainToList(domain);
          // Replace placeholder in success message with domain
          ToastManager.success(I18n.getText('domainAddSuccess', { domain }));

          // Hide "no domains" message
          if (noDomainsMessage) noDomainsMessage.style.display = 'none';
        }
      );
    });
  }

  /**
   * Load authorized domains
   */
  function loadAuthorizedDomains() {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function (result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];

      // Merge and deduplicate domain lists
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];

      // Clear list
      authorizedDomainsList.innerHTML = '';

      if (allDomains.length === 0) {
        if (noDomainsMessage) noDomainsMessage.style.display = 'block';
        return;
      }

      // Add domains to list
      allDomains.forEach(function (domain) {
        addDomainToList(domain);
      });

      if (noDomainsMessage) noDomainsMessage.style.display = 'none';

      // Sync both storages, ensure data consistency
      chrome.storage.sync.set({
        authorizedDomains: allDomains,
        headerDomainsList: allDomains,
      });
    });
  }

  /**
   * Validate domain format
   */
  function isValidDomain(domain) {
    // Basic domain format validation
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }
}

/**
 * Remove a domain
 */
function removeDomain(domain, listItem) {
  // Add removal animation
  listItem.classList.add('removing');

  setTimeout(() => {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function (result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];

      // Remove domain from both lists
      const newAuthorizedDomains = authorizedDomains.filter(d => d !== domain);
      const newHeaderDomains = headerDomains.filter(d => d !== domain);

      // Save updated data
      chrome.storage.sync.set(
        {
          authorizedDomains: newAuthorizedDomains,
          headerDomainsList: newHeaderDomains,
        },
        function () {
          // Remove from list
          listItem.remove();

          // Replace placeholder in success message with domain
          ToastManager.success(I18n.getText('domainRemoveSuccess', { domain }));

          // If no domains, show "no domains" message
          if (newAuthorizedDomains.length === 0 && document.querySelector('.no-domains-message')) {
            document.querySelector('.no-domains-message').style.display = 'block';
          }

          // Notify background script to update domain authorization status
          chrome.runtime.sendMessage({ action: 'removeDomainAuthorization', domain }, response => {
            if (chrome.runtime.lastError) {
              console.error(
                'Error notifying background about domain removal:',
                chrome.runtime.lastError
              );
            }
          });
        }
      );
    });
  }, 300);
}

/**
 * Add domain to list
 */
function addDomainToList(domain) {
  const li = document.createElement('li');
  li.className = 'domain-item';

  // Use i18n to translate "Remove" button
  const removeText = I18n ? I18n.getText('remove') : 'Remove';

  li.innerHTML = `
    <div class="domain-name">${domain}</div>
    <div class="action-cell">
      <button class="remove-btn">${removeText}</button>
    </div>
  `;

  // Remove button event
  const removeBtn = li.querySelector('.remove-btn');
  removeBtn.addEventListener('click', function () {
    removeDomain(domain, li);
  });

  // Add to list
  authorizedDomainsList.appendChild(li);
}

/**
 * Initialize settings save functionality
 */
function initSettingsSave() {
  const saveAISettingsBtn = document.getElementById('saveAISettingsBtn');

  if (!saveAISettingsBtn) return;

  // 测试并保存按钮事件
  saveAISettingsBtn.addEventListener('click', async function () {
    // 先测试API连接，成功后再保存设置
    const success = await testApiConnection();
    if (success) {
      // 如果测试成功，保存设置
      saveAISettings();
    }
  });
}

/**
 * Test API connection with current settings
 * @returns {Promise<boolean>} 测试是否成功
 */
async function testApiConnection() {
  // Get current settings
  const provider = document.getElementById('aiProvider').value;
  const model = document.getElementById('aiModel').value;
  const apiKey = document.getElementById('aiApiKey').value;
  const apiUrl = document.getElementById('aiApiUrl').value;

  // 获取保存按钮元素和页面遮罩层
  const saveBtn = document.getElementById('saveAISettingsBtn');
  const pageOverlay = document.getElementById('pageOverlay');

  // Validate API key
  if (!apiKey || apiKey.trim() === '') {
    ToastManager.error(I18n.getText('apiKeyRequired'));
    return false;
  }

  // Change button state to loading
  const originalBtnText = saveBtn.innerHTML;
  saveBtn.innerHTML = `
    <span>${I18n.getText('testing')}</span>
    <div class="button-spinner"></div>
  `;
  saveBtn.classList.add('button-with-spinner');
  saveBtn.disabled = true;

  // 显示全屏遮罩，禁止其他操作
  pageOverlay.classList.add('active');

  // 禁用所有表单输入字段
  const formInputs = document.querySelectorAll('#aiSettings input, #aiSettings select');
  formInputs.forEach(input => {
    input.disabled = true;
  });

  try {
    // Update API URL settings (if provided)
    if (apiUrl) {
      const providerKey = provider.toUpperCase();
      AiConnector.setCustomApiUrl(providerKey, apiUrl);
    }

    // Create a simple test data payload
    const testData = {
      testMessage: 'Hello, this is a connection test from Chrome Network Analyzer.',
      timestamp: new Date().toISOString(),
    };

    // Call the API with a small test payload
    const result = await AiConnector.sendToAI(testData, provider, apiKey, model, {
      test: true,
      maxTokens: 50,
    });

    console.log('API test result:', result);
    return true;
  } catch (error) {
    // 测试失败显示错误消息
    ToastManager.error(`${I18n.getText('connectionError')}: ${error.message}`);

    console.error('API test error:', error);
    return false;
  } finally {
    // Restore button state
    saveBtn.innerHTML = originalBtnText;
    saveBtn.classList.remove('button-with-spinner');
    saveBtn.disabled = false;

    // 移除全屏遮罩
    pageOverlay.classList.remove('active');

    // 恢复所有表单输入字段
    formInputs.forEach(input => {
      input.disabled = false;
    });
  }
}

/**
 * Save AI settings
 */
function saveAISettings() {
  const provider = document.getElementById('aiProvider').value;
  const model = document.getElementById('aiModel').value;
  const apiKey = document.getElementById('aiApiKey').value;
  const apiUrl = document.getElementById('aiApiUrl').value;

  // Validate required fields
  if (!apiKey) {
    ToastManager.error(I18n.getText('apiKeyRequired'));
    return false;
  }

  // Check API URL format if provided
  if (apiUrl && !isValidURL(apiUrl)) {
    ToastManager.error(I18n.getText('invalidApiUrl'));
    return false;
  }

  // Save settings to Chrome storage
  chrome.storage.sync.set(
    {
      aiProvider: provider,
      aiModel: model,
      aiApiKey: apiKey,
      aiApiUrl: apiUrl,
    },
    function () {
      ToastManager.success(I18n.getText('settingsSaved'));
    }
  );

  return true;
}

/**
 * Load saved AI settings
 */
function loadAISettings() {
  chrome.storage.sync.get(['aiProvider', 'aiModel', 'aiApiKey', 'aiApiUrl'], function (data) {
    const aiProviderSelect = document.getElementById('aiProvider');
    const aiModelSelect = document.getElementById('aiModel');
    const aiApiKeyInput = document.getElementById('aiApiKey');
    const aiApiUrlInput = document.getElementById('aiApiUrl');

    // Import AI provider information
    const { AI_PROVIDERS } = AiConnector;

    // If no AI settings exist (new installation), set default to OpenRouter
    if (!data.aiProvider) {
      // Set OpenRouter as default
      data.aiProvider = 'openrouter';
      data.aiModel = AI_PROVIDERS.OPENROUTER.defaultModel;
      data.aiApiKey = AI_PROVIDERS.OPENROUTER.defaultApiKey;

      // Save default settings
      chrome.storage.sync.set({
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
        aiApiKey: data.aiApiKey,
      });
    }

    // Set provider in dropdown
    if (data.aiProvider && aiProviderSelect) {
      aiProviderSelect.value = data.aiProvider;
      // Update model options based on provider
      updateAIModels(data.aiProvider);
    }

    // Set model in dropdown
    if (data.aiModel && aiModelSelect) {
      // Wait a bit for the models to be loaded
      setTimeout(() => {
        aiModelSelect.value = data.aiModel;
      }, 100);
    }

    // Set API key and URL
    if (data.aiApiKey && aiApiKeyInput) {
      aiApiKeyInput.value = data.aiApiKey;
    }

    if (data.aiApiUrl && aiApiUrlInput) {
      aiApiUrlInput.value = data.aiApiUrl;
    }
  });
}

/**
 * Initialize sidebar navigation
 */
function initSidebarNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentCards = document.querySelectorAll('.setting-card');
  const contentTitle = document.querySelector('.content-title');

  // Default select first navigation item
  if (navItems.length > 0) {
    navItems[0].classList.add('active');

    // Show corresponding content card
    const targetId = navItems[0].getAttribute('data-target');
    const targetCard = document.getElementById(targetId);

    if (targetCard) {
      targetCard.classList.add('active');

      // Update content title
      const title = navItems[0].getAttribute('data-title');
      if (contentTitle) contentTitle.textContent = title;
    }
  }

  // Add click event for each navigation item
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      // Remove all active states
      navItems.forEach(i => i.classList.remove('active'));
      contentCards.forEach(c => c.classList.remove('active'));

      // Add active state
      this.classList.add('active');

      // Show corresponding content card
      const targetId = this.getAttribute('data-target');
      const targetCard = document.getElementById(targetId);

      if (targetCard) {
        targetCard.classList.add('active');

        // Update content title
        const title = this.getAttribute('data-title');
        if (contentTitle) contentTitle.textContent = title;
      }
    });
  });

  // Listen for window size changes, handle responsive layout
  window.addEventListener('resize', handleResponsiveLayout);
  handleResponsiveLayout();
}

/**
 * Handle responsive layout
 */
function handleResponsiveLayout() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  if (window.innerWidth < 768) {
    sidebar.classList.add('mobile');
    mainContent.classList.add('mobile');
  } else {
    sidebar.classList.remove('mobile');
    mainContent.classList.remove('mobile');
  }
}

/**
 * Initialize form events for all tabs
 */
function initFormEvents() {
  // Listen for changes in AI settings form elements
  document
    .querySelectorAll('#aiSettings input, #aiSettings select, #aiSettings textarea')
    .forEach(element => {
      element.addEventListener('change', function () {
        // Show save button pulse effect
        const saveButton = document.getElementById('saveAISettingsBtn');
        if (saveButton) saveButton.classList.add('pulse');
      });
    });
}

/**
 * Initialize extension settings
 */
function initExtensionSettings() {
  const saveExtensionSettingsBtn = document.getElementById('saveExtensionSettingsBtn');

  // Save extension settings
  if (saveExtensionSettingsBtn) {
    saveExtensionSettingsBtn.addEventListener('click', function () {
      saveExtensionSettings();
    });
  }
}

/**
 * Save extension settings
 */
function saveExtensionSettings() {
  // Get currently selected theme
  const selectedTheme = document.querySelector('input[name="theme"]:checked');
  const theme = selectedTheme ? selectedTheme.value : 'light';

  // Get currently selected language
  const selectedLanguage = document.getElementById('languageSelect');
  const language = selectedLanguage ? selectedLanguage.value : 'en';

  // Save settings
  localStorage.setItem('networkAnalyzerTheme', theme);
  localStorage.setItem('theme', theme);
  localStorage.setItem('networkAnalyzerLanguage', language);

  // Sync to Chrome Storage
  chrome.storage.local.set({
    theme: theme,
    darkThemeDefault: theme === 'dark', // Backward compatibility
  });

  // Show success message
  ToastManager.success(I18n.getText('settingsSaved'));

  // Apply settings
  document.documentElement.setAttribute('data-theme', theme);

  // If language changes, page needs to be refreshed to apply new language
  if (language !== I18n.getCurrentLanguage()) {
    const languageChangeMsg = I18n.getText('languageChangeMsg');
    ToastManager.success(languageChangeMsg);
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
}

/**
 * Initialize AI Provider selector
 */
function initAIProviderSelection() {
  const aiProviderSelect = document.getElementById('aiProvider');
  const aiModelSelect = document.getElementById('aiModel');

  if (!aiProviderSelect || !aiModelSelect) {
    console.error('AI settings elements not found');
    return;
  }

  // Set default provider to OpenRouter if not already selected
  if (aiProviderSelect.value === '') {
    aiProviderSelect.value = 'openrouter';
  }

  // Update model list based on selected provider
  aiProviderSelect.addEventListener('change', function () {
    updateAIModels(this.value);

    // If changed to OpenRouter and API key is empty, set default key
    if (this.value === 'openrouter') {
      const apiKeyInput = document.getElementById('aiApiKey');
      if (apiKeyInput && !apiKeyInput.value.trim()) {
        const defaultKey = AiConnector.AI_PROVIDERS.OPENROUTER.defaultApiKey;
        if (defaultKey) {
          apiKeyInput.value = defaultKey;
        }
      }
    }
  });

  // Initial model list setup
  updateAIModels(aiProviderSelect.value);
}

/**
 * Update AI models list based on selected AI Provider
 * @param {string} provider - The selected AI provider
 */
function updateAIModels(provider) {
  const aiModelSelect = document.getElementById('aiModel');

  // Clear current options
  aiModelSelect.innerHTML = '';

  let models = {};

  // Get model list based on provider
  switch (provider.toLowerCase()) {
    case 'openai':
      models = AiConnector.AI_PROVIDERS.OPENAI.models;
      break;
    case 'anthropic':
      models = AiConnector.AI_PROVIDERS.ANTHROPIC.models;
      break;
    case 'deepseek':
      models = AiConnector.AI_PROVIDERS.DEEPSEEK.models;
      break;
    case 'openrouter':
      models = AiConnector.AI_PROVIDERS.OPENROUTER.models;
      break;
    default:
      models = AiConnector.AI_PROVIDERS.OPENAI.models;
  }

  // Add model options
  Object.keys(models).forEach(modelKey => {
    const option = document.createElement('option');
    option.value = modelKey;
    option.textContent = modelKey;
    aiModelSelect.appendChild(option);
  });

  // Select default model
  const providerKey = provider.toUpperCase();
  if (AiConnector.AI_PROVIDERS[providerKey] && AiConnector.AI_PROVIDERS[providerKey].defaultModel) {
    aiModelSelect.value = AiConnector.AI_PROVIDERS[providerKey].defaultModel;
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
