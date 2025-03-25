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
    applyTheme(isDarkThemeDefault ? 'dark' : 'light');
    
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
  
  // 应用动画效果
  addSaveAnimation(saveSettings);
  
  // 保存设置到 Chrome 存储
  chrome.storage.local.set(settings, () => {
    showStatusMessage(window.I18n ? window.I18n.getText('settingsSaved') : '设置已保存', 'success');
  });
}

// 添加保存按钮动画
function addSaveAnimation(button) {
  button.classList.add('saving');
  
  setTimeout(() => {
    button.classList.remove('saving');
    button.classList.add('saved');
    
    setTimeout(() => {
      button.classList.remove('saved');
    }, 1500);
  }, 700);
}

// 显示状态消息
function showStatusMessage(message, type = 'success', className = '') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} ${className}`;
  statusMessage.style.opacity = '1';
  
  // 添加弹出动画
  statusMessage.classList.add('popup-animation');
  
  // 3秒后隐藏消息
  setTimeout(() => {
    statusMessage.classList.remove('popup-animation');
    statusMessage.style.opacity = '0';
  }, 3000);
}

// 切换主题
function toggleTheme() {
  const isDark = themeToggle.checked;
  applyTheme(isDark ? 'dark' : 'light', true);
}

// 应用主题并添加过渡效果
function applyTheme(theme, animate = false) {
  if (animate) {
    document.body.classList.add('theme-transition');
    
    // 添加闪光效果
    const flash = document.createElement('div');
    flash.className = 'theme-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.classList.add('active');
    }, 10);
    
    setTimeout(() => {
      document.documentElement.setAttribute('data-theme', theme);
      
      setTimeout(() => {
        flash.classList.remove('active');
        
        setTimeout(() => {
          document.body.removeChild(flash);
          document.body.classList.remove('theme-transition');
        }, 300);
      }, 500);
    }, 100);
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
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
  domains.sort().forEach((domain, index) => {
    const li = document.createElement('li');
    li.className = 'domain-item';
    
    // 添加延迟动画效果
    li.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
    li.style.opacity = '0';
    
    const domainName = document.createElement('span');
    domainName.className = 'domain-name';
    domainName.textContent = domain;
    
    // 创建操作单元格
    const actionCell = document.createElement('div');
    actionCell.className = 'action-cell';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = window.I18n ? window.I18n.getText('remove') : '移除';
    removeBtn.addEventListener('click', () => removeDomainAuthorization(domain));
    
    // 将按钮添加到操作单元格
    actionCell.appendChild(removeBtn);
    
    // 添加域名和操作单元格到表格行
    li.appendChild(domainName);
    li.appendChild(actionCell);
    
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
  
  // 找到对应的 li 元素
  const domainItems = Array.from(authorizedDomainsList.querySelectorAll('.domain-item'));
  const targetItem = domainItems.find(item => item.querySelector('.domain-name').textContent === domain);
  
  if (targetItem) {
    // 添加移除动画
    targetItem.classList.add('removing');
  }
  
  chrome.runtime.sendMessage(
    { action: "removeDomainAuthorization", domain },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("移除域授权时出错:", chrome.runtime.lastError);
        
        // 移除动画类
        if (targetItem) {
          targetItem.classList.remove('removing');
        }
        
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
        // 移除动画类
        if (targetItem) {
          targetItem.classList.remove('removing');
        }
        
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
    
    // 添加输入框晃动效果
    newDomain.classList.add('shake');
    setTimeout(() => {
      newDomain.classList.remove('shake');
    }, 500);
    
    return;
  }
  
  // 简单的域名格式验证
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(domain)) {
    const errorMsg = window.I18n ? window.I18n.getText('invalidDomainFormat') : '请输入有效的域名格式 (例如: example.com)';
    showStatusMessage(errorMsg, 'error', 'domain');
    
    // 添加输入框晃动效果
    newDomain.classList.add('shake');
    setTimeout(() => {
      newDomain.classList.remove('shake');
    }, 500);
    
    return;
  }
  
  // 添加加载动画到按钮
  addDomainBtn.classList.add('loading');
  
  chrome.runtime.sendMessage(
    { action: "authorizeDomain", domain },
    (response) => {
      // 移除加载动画
      addDomainBtn.classList.remove('loading');
      
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
    // 添加页面过渡效果
    document.body.classList.add('language-transition');
    
    setTimeout(() => {
      // 更新页面文本
      window.I18n.updatePageText();
      
      // 保存语言设置
      chrome.storage.local.set({ language: lang });
      
      // 更新域名列表中的按钮文本
      loadAuthorizedDomains();
      
      // 移除过渡效果
      setTimeout(() => {
        document.body.classList.remove('language-transition');
      }, 300);
    }, 150);
  }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
  // 添加自定义CSS
  addCustomStyles();
  
  // 使用IIFE包装async函数调用
  (async () => {
    try {
      await loadSavedSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  })();
});

// 添加自定义CSS
function addCustomStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 主题过渡效果 */
    .theme-transition * {
      transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s !important;
    }
    
    .theme-flash {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0);
      pointer-events: none;
      z-index: 9999;
      transition: background-color 0.5s ease;
    }
    
    .theme-flash.active {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    /* 域名项动画 */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .domain-item.removing {
      animation: slideOut 0.3s ease forwards;
    }
    
    @keyframes slideOut {
      to { opacity: 0; transform: translateX(30px); }
    }
    
    /* 保存按钮动画 */
    .saving {
      position: relative;
      overflow: hidden;
    }
    
    .saving::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--accent-color), transparent);
      animation: loading 1s infinite linear;
      width: 100%;
    }
    
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .saved {
      background-color: var(--terminal-green) !important;
    }
    
    /* 状态消息动画 */
    .status-message.popup-animation {
      animation: popupMessage 0.3s ease forwards;
    }
    
    @keyframes popupMessage {
      0% { transform: translateY(10px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    /* 输入框晃动动画 */
    .shake {
      animation: shakeEffect 0.4s ease;
    }
    
    @keyframes shakeEffect {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    /* 加载动画 */
    .loading {
      position: relative;
      pointer-events: none;
      opacity: 0.7;
    }
    
    .loading::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      margin: -6px 0 0 -6px;
      border: 2px solid transparent;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* 语言过渡效果 */
    .language-transition {
      opacity: 0.7;
      transition: opacity 0.3s;
    }
  `;
  document.head.appendChild(style);
}

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