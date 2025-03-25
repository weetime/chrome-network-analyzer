/**
 * Network Analyzer 配置页面脚本
 */

// DOM 元素
const aiProvider = document.getElementById('aiProvider');
const aiModel = document.getElementById('aiModel');
const apiKey = document.getElementById('apiKey');
const saveApiKey = document.getElementById('saveApiKey');
const showAiAnalysis = document.getElementById('showAiAnalysis');
const darkThemeDefault = document.getElementById('darkThemeDefault');
const defaultRowCount = document.getElementById('defaultRowCount');
const saveSettings = document.getElementById('saveSettings');
const statusMessage = document.getElementById('statusMessage');
const themeToggle = document.getElementById('themeToggle');
const languageSelector = document.getElementById('languageSelector');

// 域授权相关元素
const authorizedDomainsList = document.getElementById('authorizedDomainsList');
const noDomains = document.getElementById('noDomains');
const newDomain = document.getElementById('newDomain');
const addDomainBtn = document.getElementById('addDomainBtn');

// 初始化多语言支持
async function initI18n() {
  if (window.I18n) {
    try {
      // 初始化I18n并加载语言包
      await window.I18n.init();
      
      // 初始化语言选择器
      const currentLang = window.I18n.getCurrentLanguage();
      if (languageSelector) {
        languageSelector.value = currentLang;
      }
      
      console.log('I18n initialized with language:', currentLang);
    } catch (error) {
      console.error('Failed to initialize I18n:', error);
    }
  }
}

// 加载保存的设置
async function loadSavedSettings() {
  // 首先初始化I18n
  await initI18n();
  
  chrome.storage.local.get([
    'aiApiKey', 
    'aiProvider', 
    'aiModel', 
    'saveApiKey', 
    'showAiAnalysis',
    'darkThemeDefault',
    'defaultRowCount',
    'language'
  ], (result) => {
    // AI Provider 设置
    if (result.aiProvider) {
      aiProvider.value = result.aiProvider;
    }
    
    // AI Model 设置
    updateModelOptions(aiProvider.value);
    if (result.aiModel) {
      aiModel.value = result.aiModel;
    }
    
    // API Key 设置
    if (result.aiApiKey && result.saveApiKey) {
      apiKey.value = result.aiApiKey;
    }
    
    // 保存 API Key 设置
    saveApiKey.checked = result.saveApiKey || false;
    
    // 显示 AI 分析设置
    showAiAnalysis.checked = result.showAiAnalysis || false;
    
    // 默认深色主题设置
    const isDarkThemeDefault = result.darkThemeDefault || false;
    darkThemeDefault.checked = isDarkThemeDefault;
    
    // 应用当前的主题设置
    themeToggle.checked = isDarkThemeDefault;
    document.body.setAttribute('data-theme', isDarkThemeDefault ? 'dark' : 'light');
    
    // 默认显示行数设置
    if (result.defaultRowCount) {
      defaultRowCount.value = result.defaultRowCount;
    }
    
    // 应用语言设置
    if (result.language && window.I18n) {
      window.I18n.setLanguage(result.language);
      if (languageSelector) {
        languageSelector.value = result.language;
      }
    }
  });
  
  // 加载已授权域名
  loadAuthorizedDomains();
}

// 更新模型选项
function updateModelOptions(provider) {
  // 清空当前选项
  aiModel.innerHTML = '';
  
  // 添加模型选项
  if (provider === 'openai') {
    Object.keys(window.AiConnector.OPENAI_MODELS).forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      aiModel.appendChild(option);
    });
  } else if (provider === 'anthropic') {
    Object.keys(window.AiConnector.ANTHROPIC_MODELS).forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      aiModel.appendChild(option);
    });
  }
}

// 保存设置
function saveUserSettings() {
  const settings = {
    aiProvider: aiProvider.value,
    aiModel: aiModel.value,
    saveApiKey: saveApiKey.checked,
    showAiAnalysis: showAiAnalysis.checked,
    darkThemeDefault: darkThemeDefault.checked,
    defaultRowCount: defaultRowCount.value
  };
  
  // 如果用户选择保存 API 密钥
  if (saveApiKey.checked && apiKey.value) {
    settings.aiApiKey = apiKey.value;
  } else if (!saveApiKey.checked) {
    // 如果用户取消保存 API 密钥，则从存储中移除
    chrome.storage.local.remove(['aiApiKey']);
  }
  
  // 保存设置到 Chrome 存储
  chrome.storage.local.set(settings, () => {
    showStatusMessage(window.I18n ? window.I18n.getText('settingsSaved') : '设置已保存', 'success');
  });
}

// 显示状态消息
function showStatusMessage(message, type = 'success', className = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} ${className}`;
  statusMessage.style.opacity = '1';
  
  // 3秒后隐藏消息
  setTimeout(() => {
    statusMessage.style.opacity = '0';
  }, 3000);
}

// 切换主题
function toggleTheme() {
  const isDark = themeToggle.checked;
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// 加载已授权域名
function loadAuthorizedDomains() {
  chrome.runtime.sendMessage(
    { action: "getAuthorizedDomains" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("获取已授权域名时出错:", chrome.runtime.lastError);
        return;
      }
      
      if (response && response.authorizedDomains) {
        displayAuthorizedDomains(response.authorizedDomains);
      }
    }
  );
}

// 显示已授权域名
function displayAuthorizedDomains(domains) {
  authorizedDomainsList.innerHTML = '';
  
  if (!domains || domains.length === 0) {
    noDomains.style.display = 'block';
    return;
  }
  
  noDomains.style.display = 'none';
  
  // 按字母顺序排序域名
  domains.sort().forEach(domain => {
    const li = document.createElement('li');
    li.className = 'domain-item';
    
    const domainName = document.createElement('span');
    domainName.className = 'domain-name';
    domainName.textContent = domain;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = window.I18n ? window.I18n.getText('remove') : '移除';
    removeBtn.addEventListener('click', () => removeDomainAuthorization(domain));
    
    li.appendChild(domainName);
    li.appendChild(removeBtn);
    authorizedDomainsList.appendChild(li);
  });
}

// 移除域授权
function removeDomainAuthorization(domain) {
  const confirmMessage = window.I18n 
    ? window.I18n.getText('domainRemoveConfirm', { domain }) 
    : `确定要移除域名 "${domain}" 的授权吗？`;
    
  if (!confirm(confirmMessage)) {
    return;
  }
  
  chrome.runtime.sendMessage(
    { action: "removeDomainAuthorization", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("移除域授权时出错:", chrome.runtime.lastError);
        const errorMsg = window.I18n 
          ? window.I18n.getText('domainRemoveFailed', { domain }) 
          : `移除域名 "${domain}" 授权失败`;
        showStatusMessage(errorMsg, 'error', 'domain');
        return;
      }
      
      if (response && response.success) {
        // 重新加载授权域名列表
        loadAuthorizedDomains();
        const successMsg = window.I18n 
          ? window.I18n.getText('domainRemoveSuccess', { domain }) 
          : `已移除域名 "${domain}" 的授权`;
        showStatusMessage(successMsg, 'success', 'domain');
      } else {
        const errorMsg = window.I18n 
          ? window.I18n.getText('domainRemoveFailed', { domain }) 
          : `移除域名 "${domain}" 授权失败`;
        showStatusMessage(errorMsg, 'error', 'domain');
      }
    }
  );
}

// 添加新域名授权
function addDomainAuthorization(domain) {
  if (!domain) {
    const errorMsg = window.I18n ? window.I18n.getText('invalidDomain') : '请输入有效的域名';
    showStatusMessage(errorMsg, 'error', 'domain');
    return;
  }
  
  // 简单的域名格式验证
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(domain)) {
    const errorMsg = window.I18n ? window.I18n.getText('invalidDomainFormat') : '请输入有效的域名格式 (例如: example.com)';
    showStatusMessage(errorMsg, 'error', 'domain');
    return;
  }
  
  chrome.runtime.sendMessage(
    { action: "authorizeDomain", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("添加域授权时出错:", chrome.runtime.lastError);
        const errorMsg = window.I18n 
          ? window.I18n.getText('domainAddFailed', { domain }) 
          : `添加域名 "${domain}" 授权失败`;
        showStatusMessage(errorMsg, 'error', 'domain');
        return;
      }
      
      if (response && response.success) {
        // 清空输入框
        newDomain.value = '';
        
        // 重新加载授权域名列表
        loadAuthorizedDomains();
        const successMsg = window.I18n 
          ? window.I18n.getText('domainAddSuccess', { domain }) 
          : `已添加域名 "${domain}" 的授权`;
        showStatusMessage(successMsg, 'success', 'domain');
      } else {
        const errorMsg = window.I18n 
          ? window.I18n.getText('domainAddFailed', { domain }) 
          : `添加域名 "${domain}" 授权失败`;
        showStatusMessage(errorMsg, 'error', 'domain');
      }
    }
  );
}

// 切换语言
function changeLanguage(lang) {
  if (window.I18n && window.I18n.setLanguage(lang)) {
    // 更新页面文本
    window.I18n.updatePageText();
    
    // 保存语言设置
    chrome.storage.local.set({ language: lang });
    
    // 更新域名列表中的按钮文本
    loadAuthorizedDomains();
  }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  // 使用IIFE包装async函数调用
  (async () => {
    try {
      await loadSavedSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  })();
});

// AI Provider 变更
aiProvider.addEventListener('change', () => {
  updateModelOptions(aiProvider.value);
  
  // 如果保存 API 密钥已选中，则更新存储
  if (saveApiKey.checked) {
    chrome.storage.local.set({ aiProvider: aiProvider.value });
  }
});

// AI Model 变更
aiModel.addEventListener('change', () => {
  if (saveApiKey.checked) {
    chrome.storage.local.set({ aiModel: aiModel.value });
  }
});

// 保存按钮点击
saveSettings.addEventListener('click', saveUserSettings);

// 主题切换
themeToggle.addEventListener('change', toggleTheme);

// 打开扩展按钮点击
document.getElementById('openExtension').addEventListener('click', () => {
  chrome.action.openPopup();
});

// 添加域名按钮点击
addDomainBtn.addEventListener('click', () => {
  addDomainAuthorization(newDomain.value.trim());
});

// 域名输入框回车键处理
newDomain.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    addDomainAuthorization(newDomain.value.trim());
  }
});

// 语言选择器变更
if (languageSelector) {
  languageSelector.addEventListener('change', () => {
    changeLanguage(languageSelector.value);
  });
} 