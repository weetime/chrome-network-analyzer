/**
 * Network Analyzer 选项页面脚本
 */

// 导入所需模块
import { I18n } from './i18n.js';
import './i18n/zh.js';
import './i18n/en.js';
import { ToastManager } from './toast-manager.js';
import { AiConnector } from './ai-connector.js';

// 定义全局变量
let authorizedDomainsList;

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
  // 首先初始化I18n
  await initI18n();
  
  // 初始化主题
  initTheme();
  
  // 初始化语言
  initLanguage();
  
  // 初始化域名管理
  initDomainManagement();
  
  // 初始化设置保存
  initSettingsSave();
  
  // 初始化侧边栏导航
  initSidebarNav();
  
  // 初始化所有选项卡的表单事件
  initFormEvents();
  
  // 初始化AI Provider选择器
  initAIProviderSelection();
  
  // 显示保存的AI设置
  loadAISettings();
  
  // 初始化扩展程序设置
  initExtensionSettings();
});

/**
 * 初始化国际化功能
 */
async function initI18n() {
  try {
    // 初始化I18n并加载语言包
    await I18n.init();
    
    // 获取当前语言
    const currentLang = I18n.getCurrentLanguage();
    
    // 设置语言选择器
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) languageSelect.value = currentLang;
    
    console.log('I18n initialized with language:', currentLang);
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

/**
 * 初始化主题切换功能
 */
function initTheme() {
  // 获取主题单选按钮
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  
  // 首先尝试从Chrome Storage获取主题设置
  chrome.storage.local.get(['theme'], (result) => {
    // 获取存储的主题，默认为light
    const storedTheme = result.theme || localStorage.getItem('networkAnalyzerTheme') || 'light';
    
    // 应用存储的主题
    document.documentElement.setAttribute('data-theme', storedTheme);
    
    // 设置对应的单选按钮
    // 修复大小写问题和特殊主题名称
    let radioId;
    
    // 根据主题名称生成正确的ID
    if (storedTheme === 'fireblack') {
      radioId = 'themeFireBlack'; // 注意大小写，与HTML中保持一致
    } else {
      // 对于light和dark主题，首字母大写
      radioId = `theme${storedTheme.charAt(0).toUpperCase() + storedTheme.slice(1)}`;
    }
    
    const radioToCheck = document.getElementById(radioId);
    console.log('Setting theme:', storedTheme, 'Radio ID:', radioId, 'Element:', radioToCheck);
    
    if (radioToCheck) {
      radioToCheck.checked = true;
    } else {
      console.warn('Theme radio button not found:', radioId);
    }
    
    // 确保localStorage和Chrome Storage同步
    localStorage.setItem('networkAnalyzerTheme', storedTheme);
    localStorage.setItem('theme', storedTheme); // 兼容popup.html
    chrome.storage.local.set({ theme: storedTheme });
  });
  
  // 为每个主题单选按钮添加事件监听
  themeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const theme = this.value;
        document.documentElement.setAttribute('data-theme', theme);
        
        // 同步保存到两个存储位置
        localStorage.setItem('networkAnalyzerTheme', theme);
        localStorage.setItem('theme', theme); // 兼容popup.html
        chrome.storage.local.set({ theme: theme });
      }
    });
  });
}

/**
 * 初始化语言选择功能
 */
function initLanguage() {
  const languageSelect = document.getElementById('languageSelect');
  const storedLanguage = localStorage.getItem('networkAnalyzerLanguage') || 'en';
  
  // 设置已保存的语言
  languageSelect.value = storedLanguage;
  
  // 只允许中文和英文
  if (storedLanguage !== 'en' && storedLanguage !== 'zh') {
    languageSelect.value = 'en';
    localStorage.setItem('networkAnalyzerLanguage', 'en');
  }
  
  // 语言切换事件
  languageSelect.addEventListener('change', function() {
    const language = this.value;
    localStorage.setItem('networkAnalyzerLanguage', language);
    // 如果语言改变，需要刷新页面以应用新语言
    const languageChangeMsg = I18n.getText('languageChangeMsg');
    ToastManager.success(languageChangeMsg);
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
}

/**
 * 初始化域名管理功能
 */
function initDomainManagement() {
  authorizedDomainsList = document.getElementById('authorizedDomainsList');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const newDomainInput = document.getElementById('newDomain');
  const noDomainsMessage = document.querySelector('.no-domains-message');
  
  // 加载已授权的域名
  loadAuthorizedDomains();
  
  // 添加域名按钮事件
  addDomainBtn.addEventListener('click', function() {
    addNewDomain();
  });
  
  // 输入框回车事件
  newDomainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addNewDomain();
    }
  });
  
  /**
   * 添加新域名
   */
  function addNewDomain() {
    const domain = newDomainInput.value.trim();
    
    if (domain === '') {
      ToastManager.error(I18n.getText('invalidDomain'));
      return;
    }
    
    // 验证域名格式
    if (!isValidDomain(domain)) {
      ToastManager.error(I18n.getText('invalidDomainFormat'));
      return;
    }
    
    // 检查域名是否已存在
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function(result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];
      
      if (allDomains.includes(domain)) {
        ToastManager.error(I18n.getText('domainExist'));
        return;
      }
      
      // 添加新域名到authorizedDomains
      authorizedDomains.push(domain);
      
      // 同时更新headerDomainsList，确保两处保持同步
      headerDomains.push(domain);
      
      // 保存数据
      chrome.storage.sync.set({
        authorizedDomains: authorizedDomains,
        headerDomainsList: headerDomains
      }, function() {
        // 清空输入框
        newDomainInput.value = '';
        
        // 更新域名列表
        addDomainToList(domain);
        // 使用域名替换成功消息中的占位符
        ToastManager.success(I18n.getText('domainAddSuccess', { domain }) );
        
        // 隐藏"无域名"消息
        if (noDomainsMessage) noDomainsMessage.style.display = 'none';
      });
    });
  }
  
  /**
   * 加载已授权的域名
   */
  function loadAuthorizedDomains() {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function(result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      
      // 合并并去重domain列表
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];
      
      // 清空列表
      authorizedDomainsList.innerHTML = '';
      
      if (allDomains.length === 0) {
        if (noDomainsMessage) noDomainsMessage.style.display = 'block';
        return;
      }
      
      // 添加域名到列表
      allDomains.forEach(function(domain) {
        addDomainToList(domain);
      });
      
      if (noDomainsMessage) noDomainsMessage.style.display = 'none';
      
      // 同步两个存储，确保两处数据一致
      chrome.storage.sync.set({
        authorizedDomains: allDomains,
        headerDomainsList: allDomains
      });
    });
  }
  
  /**
   * 验证域名格式
   */
  function isValidDomain(domain) {
    // 基本域名格式验证
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }
}

/**
 * 删除域名
 */
function removeDomain(domain, listItem) {
  // 添加移除动画
  listItem.classList.add('removing');
  
  setTimeout(() => {
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function(result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      
      // 从两个列表中删除域名
      const newAuthorizedDomains = authorizedDomains.filter(d => d !== domain);
      const newHeaderDomains = headerDomains.filter(d => d !== domain);
      
      // 保存更新后的数据
      chrome.storage.sync.set({
        authorizedDomains: newAuthorizedDomains,
        headerDomainsList: newHeaderDomains
      }, function() {
        // 从列表中移除
        listItem.remove();
        
        // 使用域名替换成功消息中的占位符
        ToastManager.success(I18n.getText('domainRemoveSuccess', { domain }) );
        
        // 如果没有域名，显示"无域名"消息
        if (newAuthorizedDomains.length === 0 && document.querySelector('.no-domains-message')) {
          document.querySelector('.no-domains-message').style.display = 'block';
        }
        
        // 通知后台脚本更新域名授权状态
        chrome.runtime.sendMessage(
          { action: "removeDomainAuthorization", domain },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("通知后台移除域名授权时出错:", chrome.runtime.lastError);
            }
          }
        );
      });
    });
  }, 300);
}

/**
 * 添加域名到列表
 */
function addDomainToList(domain) {
  const li = document.createElement('li');
  li.className = 'domain-item';
  
  // 使用i18n翻译"删除"按钮
  const removeText = I18n ? I18n.getText('remove') : '删除';
  
  li.innerHTML = `
    <div class="domain-name">${domain}</div>
    <div class="action-cell">
      <button class="remove-btn">${removeText}</button>
    </div>
  `;
  
  // 删除按钮事件
  const removeBtn = li.querySelector('.remove-btn');
  removeBtn.addEventListener('click', function() {
    removeDomain(domain, li);
  });
  
  // 添加到列表
  authorizedDomainsList.appendChild(li);
}

/**
 * 初始化设置保存
 */
function initSettingsSave() {
  const saveAISettingsBtn = document.getElementById('saveAISettingsBtn');
  
  if (!saveAISettingsBtn) return;
  
  saveAISettingsBtn.addEventListener('click', function() {
    // 保存AI设置
    saveAISettings();
  });
}

/**
 * 保存AI设置
 */
function saveAISettings() {
  const aiProvider = document.getElementById('aiProvider').value;
  const aiModel = document.getElementById('aiModel').value;
  const apiKey = document.getElementById('aiApiKey').value;
  const apiUrl = document.getElementById('aiApiUrl').value;
  
  // 更新API URL设置（如果有）
  if (apiUrl) {
    const providerKey = aiProvider.toUpperCase();
    AiConnector.setCustomApiUrl(providerKey, apiUrl);
  }
  
  // 保存到Chrome Storage
  chrome.storage.sync.set({
    aiProvider: aiProvider,
    aiModel: aiModel,
    apiKey: apiKey,
    apiUrl: apiUrl
  }, function() {
    ToastManager.success(I18n.getText('aiSettingsSaved'));
    // 移除保存按钮的脉冲效果
    const saveButton = document.getElementById('saveAISettingsBtn');
    if (saveButton) saveButton.classList.remove('pulse');
  });
}

/**
 * 加载AI设置
 */
function loadAISettings() {
  chrome.storage.sync.get(['aiProvider', 'aiModel', 'apiKey', 'apiUrl', 'openaiApiKey'], function(result) {
    const aiProviderSelect = document.getElementById('aiProvider');
    const aiModelSelect = document.getElementById('aiModel');
    const apiKeyInput = document.getElementById('aiApiKey');
    const apiUrlInput = document.getElementById('aiApiUrl');
    
    // 设置AI提供商
    if (result.aiProvider) {
      aiProviderSelect.value = result.aiProvider;
      // 更新对应提供商的模型列表
      updateAIModels(result.aiProvider);
    }
    
    // 设置AI模型
    if (result.aiModel) {
      aiModelSelect.value = result.aiModel;
    }
    
    // 设置API密钥
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    } else if (result.openaiApiKey) {
      // 兼容旧版本设置
      apiKeyInput.value = result.openaiApiKey;
    }
    
    // 设置API URL
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
  });
}

/**
 * 初始化侧边栏导航
 */
function initSidebarNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentCards = document.querySelectorAll('.setting-card');
  const contentTitle = document.querySelector('.content-title');
  
  // 默认选中第一个导航项
  if (navItems.length > 0) {
    navItems[0].classList.add('active');
    
    // 显示对应的内容卡片
    const targetId = navItems[0].getAttribute('data-target');
    const targetCard = document.getElementById(targetId);
    
    if (targetCard) {
      targetCard.classList.add('active');
      
      // 更新内容标题
      const title = navItems[0].getAttribute('data-title');
      if (contentTitle) contentTitle.textContent = title;
    }
  }
  
  // 为每个导航项添加点击事件
  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      // 移除所有活动状态
      navItems.forEach(i => i.classList.remove('active'));
      contentCards.forEach(c => c.classList.remove('active'));
      
      // 添加活动状态
      this.classList.add('active');
      
      // 显示对应的内容卡片
      const targetId = this.getAttribute('data-target');
      const targetCard = document.getElementById(targetId);
      
      if (targetCard) {
        targetCard.classList.add('active');
        
        // 更新内容标题
        const title = this.getAttribute('data-title');
        if (contentTitle) contentTitle.textContent = title;
      }
    });
  });
  
  // 监听窗口大小变化，处理响应式布局
  window.addEventListener('resize', handleResponsiveLayout);
  handleResponsiveLayout();
}

/**
 * 处理响应式布局
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
 * 初始化所有选项卡的表单事件
 */
function initFormEvents() {
  // 监听AI设置表单元素的变化
  document.querySelectorAll('#aiSettings input, #aiSettings select, #aiSettings textarea').forEach(element => {
    element.addEventListener('change', function() {
      // 显示保存按钮脉冲效果
      const saveButton = document.getElementById('saveAISettingsBtn');
      if (saveButton) saveButton.classList.add('pulse');
    });
  });
}

/**
 * 初始化扩展程序设置
 */
function initExtensionSettings() {
  const saveExtensionSettingsBtn = document.getElementById('saveExtensionSettingsBtn');
  
  // 保存扩展程序设置
  if (saveExtensionSettingsBtn) {
    saveExtensionSettingsBtn.addEventListener('click', function() {
      saveExtensionSettings();
    });
  }
}

/**
 * 保存扩展程序设置
 */
function saveExtensionSettings() {
  // 获取当前选中的主题
  const selectedTheme = document.querySelector('input[name="theme"]:checked');
  const theme = selectedTheme ? selectedTheme.value : 'light';
  
  // 获取当前选中的语言
  const selectedLanguage = document.getElementById('languageSelect');
  const language = selectedLanguage ? selectedLanguage.value : 'en';
  
  // 保存设置
  localStorage.setItem('networkAnalyzerTheme', theme);
  localStorage.setItem('theme', theme);
  localStorage.setItem('networkAnalyzerLanguage', language);
  
  // 同步到Chrome Storage
  chrome.storage.local.set({ 
    theme: theme,
    darkThemeDefault: theme === 'dark' // 兼容旧版设置
  });
  
  // 显示成功消息
  ToastManager.success(I18n.getText('settingsSaved'));
  
  // 应用设置
  document.documentElement.setAttribute('data-theme', theme);
  
  // 如果语言改变，需要刷新页面以应用新语言
  if (language !== I18n.getCurrentLanguage()) {
    const languageChangeMsg = I18n.getText('languageChangeMsg');
    ToastManager.success(languageChangeMsg);
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
}

/**
 * 初始化AI Provider选择器
 */
function initAIProviderSelection() {
  const aiProviderSelect = document.getElementById('aiProvider');
  const aiModelSelect = document.getElementById('aiModel');
  
  if (!aiProviderSelect || !aiModelSelect) {
    console.error('AI settings elements not found');
    return;
  }
  
  // 根据选择的提供商更新模型列表
  aiProviderSelect.addEventListener('change', function() {
    updateAIModels(this.value);
  });
  
  // 初始设置模型列表
  updateAIModels(aiProviderSelect.value);
}

/**
 * 根据选择的AI Provider更新模型列表
 * @param {string} provider - 选择的AI提供商
 */
function updateAIModels(provider) {
  const aiModelSelect = document.getElementById('aiModel');
  
  // 清空当前选项
  aiModelSelect.innerHTML = '';
  
  let models = {};
  
  // 根据提供商获取模型列表
  switch(provider.toLowerCase()) {
    case 'openai':
      models = AiConnector.AI_PROVIDERS.OPENAI.models;
      break;
    case 'anthropic':
      models = AiConnector.AI_PROVIDERS.ANTHROPIC.models;
      break;
    case 'deepseek':
      models = AiConnector.AI_PROVIDERS.DEEPSEEK.models;
      break;
    default:
      models = AiConnector.AI_PROVIDERS.OPENAI.models;
  }
  
  // 添加模型选项
  Object.keys(models).forEach(modelKey => {
    const option = document.createElement('option');
    option.value = modelKey;
    option.textContent = modelKey;
    aiModelSelect.appendChild(option);
  });
  
  // 选择默认模型
  const providerKey = provider.toUpperCase();
  if (AiConnector.AI_PROVIDERS[providerKey] && AiConnector.AI_PROVIDERS[providerKey].defaultModel) {
    aiModelSelect.value = AiConnector.AI_PROVIDERS[providerKey].defaultModel;
  }
}

