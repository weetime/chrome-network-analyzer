/**
 * Network Analyzer 选项页面脚本
 */

// 当DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
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
  
  // 显示保存的AI设置
  loadAISettings();
  
  // 显示保存的接口设置
  loadInterfaceSettings();
  
  // 显示清除数据按钮
  initClearDataButton();
});

/**
 * 初始化主题切换功能
 */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('networkAnalyzerTheme') || 'light';
  
  // 应用存储的主题
  document.documentElement.setAttribute('data-theme', storedTheme);
  themeToggle.checked = storedTheme === 'dark';
  
  // 主题切换事件
  themeToggle.addEventListener('change', function() {
    const theme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('networkAnalyzerTheme', theme);
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
  
  // 语言切换事件
  languageSelect.addEventListener('change', function() {
    const language = this.value;
    localStorage.setItem('networkAnalyzerLanguage', language);
    
    // 如果语言改变，需要刷新页面以应用新语言
    showStatusMessage('Language changed to ' + language + '. Refreshing...', 'success');
    setTimeout(() => {
      location.reload();
    }, 1000);
  });
}

/**
 * 初始化域名管理功能
 */
function initDomainManagement() {
  const authorizedDomainsList = document.getElementById('authorizedDomainsList');
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
      showStatusMessage('请输入域名', 'error', 'domain');
      return;
    }
    
    // 验证域名格式
    if (!isValidDomain(domain)) {
      showStatusMessage('域名格式无效', 'error', 'domain');
      return;
    }
    
    // 检查域名是否已存在
    chrome.storage.sync.get(['authorizedDomains', 'headerDomainsList'], function(result) {
      const authorizedDomains = result.authorizedDomains || [];
      const headerDomains = result.headerDomainsList || [];
      const allDomains = [...new Set([...authorizedDomains, ...headerDomains])];
      
      if (allDomains.includes(domain)) {
        showStatusMessage('域名已存在', 'error', 'domain');
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
        showStatusMessage('域名添加成功', 'success', 'domain');
        
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
   * 添加域名到列表
   */
  function addDomainToList(domain) {
    const li = document.createElement('li');
    li.className = 'domain-item';
    li.innerHTML = `
      <div class="domain-name">${domain}</div>
      <div class="action-cell">
        <button class="remove-btn">删除</button>
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
          showStatusMessage('域名已删除', 'success', 'domain');
          
          // 如果没有域名，显示"无域名"消息
          if (newAuthorizedDomains.length === 0 && noDomainsMessage) {
            noDomainsMessage.style.display = 'block';
          }
        });
      });
    }, 300); // 等待动画完成
  }
  
  /**
   * 验证域名格式
   */
  function isValidDomain(domain) {
    // 简单域名验证，允许通配符
    if (domain === '*') return true;
    
    // 通配符子域名格式 (*.example.com)
    if (domain.startsWith('*.')) {
      domain = domain.substring(2);
    }
    
    // 基本域名格式验证
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }
}

/**
 * 初始化设置保存功能
 */
function initSettingsSave() {
  const saveButton = document.querySelector('.save-button');
  
  if (!saveButton) return;
  
  saveButton.addEventListener('click', function() {
    // 保存AI分析设置
    saveAISettings();
    
    // 保存接口设置
    saveInterfaceSettings();
    
    // 显示保存成功消息
    showStatusMessage('Settings saved successfully', 'success');
    
    // 移除脉冲动画
    saveButton.classList.remove('pulse');
  });
}

/**
 * 保存AI分析设置
 */
function saveAISettings() {
  const aiModelSelect = document.getElementById('aiModel');
  const apiKeyInput = document.getElementById('openaiApiKey');
  const autoAnalysisCheckbox = document.getElementById('autoAnalysis');
  
  if (!aiModelSelect || !apiKeyInput || !autoAnalysisCheckbox) return;
  
  const settings = {
    aiModel: aiModelSelect.value,
    openaiApiKey: apiKeyInput.value.trim(),
    autoAnalysis: autoAnalysisCheckbox.checked
  };
  
  chrome.storage.sync.set({aiSettings: settings});
}

/**
 * 加载AI分析设置
 */
function loadAISettings() {
  const aiModelSelect = document.getElementById('aiModel');
  const apiKeyInput = document.getElementById('openaiApiKey');
  const autoAnalysisCheckbox = document.getElementById('autoAnalysis');
  
  if (!aiModelSelect || !apiKeyInput || !autoAnalysisCheckbox) return;
  
  chrome.storage.sync.get(['aiSettings'], function(result) {
    const settings = result.aiSettings || {};
    
    if (settings.aiModel) aiModelSelect.value = settings.aiModel;
    if (settings.openaiApiKey) apiKeyInput.value = settings.openaiApiKey;
    autoAnalysisCheckbox.checked = settings.autoAnalysis || false;
  });
}

/**
 * 保存接口设置
 */
function saveInterfaceSettings() {
  const showStatusbarCheckbox = document.getElementById('showStatusbar');
  const darkModeStartCheckbox = document.getElementById('darkModeStart');
  const dataRetentionSelect = document.getElementById('dataRetention');
  
  if (!showStatusbarCheckbox || !darkModeStartCheckbox || !dataRetentionSelect) return;
  
  const settings = {
    showStatusbar: showStatusbarCheckbox.checked,
    darkModeStart: darkModeStartCheckbox.checked,
    dataRetention: dataRetentionSelect.value
  };
  
  chrome.storage.sync.set({interfaceSettings: settings});
}

/**
 * 加载接口设置
 */
function loadInterfaceSettings() {
  const showStatusbarCheckbox = document.getElementById('showStatusbar');
  const darkModeStartCheckbox = document.getElementById('darkModeStart');
  const dataRetentionSelect = document.getElementById('dataRetention');
  
  if (!showStatusbarCheckbox || !darkModeStartCheckbox || !dataRetentionSelect) return;
  
  chrome.storage.sync.get(['interfaceSettings'], function(result) {
    const settings = result.interfaceSettings || {};
    
    showStatusbarCheckbox.checked = settings.showStatusbar !== undefined ? settings.showStatusbar : true;
    darkModeStartCheckbox.checked = settings.darkModeStart || false;
    if (settings.dataRetention) dataRetentionSelect.value = settings.dataRetention;
  });
}

/**
 * 初始化清除数据按钮
 */
function initClearDataButton() {
  const clearDataBtn = document.getElementById('clearDataBtn');
  
  if (!clearDataBtn) return;
  
  clearDataBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all stored network data?')) {
      chrome.storage.local.remove(['networkRequests'], function() {
        showStatusMessage('All stored network data has been cleared', 'success');
      });
    }
  });
}

/**
 * 显示状态消息
 * @param {string} message 消息内容
 * @param {string} type 消息类型 ('success' 或 'error')
 * @param {string} id 消息ID，用于特定消息
 */
function showStatusMessage(message, type, id = 'main') {
  const statusMessageId = id === 'main' ? 'statusMessage' : `statusMessage-${id}`;
  let statusMessage = document.getElementById(statusMessageId);
  
  // 如果元素不存在，创建一个
  if (!statusMessage) {
    statusMessage = document.createElement('div');
    statusMessage.id = statusMessageId;
    statusMessage.className = 'status-message';
    
    // 找到对应的添加位置
    let container;
    if (id === 'domain') {
      container = document.querySelector('.domain-management');
    } else {
      container = document.querySelector('.settings-container');
    }
    
    if (container) {
      container.appendChild(statusMessage);
    }
  }
  
  // 设置消息内容和类型
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // 显示消息
  statusMessage.style.opacity = '1';
  
  // 3秒后隐藏消息
  setTimeout(() => {
    statusMessage.style.opacity = '0';
  }, 3000);
}

/**
 * 初始化侧边栏导航
 */
function initSidebarNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const settingCards = document.querySelectorAll('.setting-card');
  const contentTitle = document.querySelector('.content-title');
  
  // 默认显示第一个选项卡
  if (navItems.length > 0 && settingCards.length > 0) {
    navItems[0].classList.add('active');
    settingCards[0].classList.add('active');
    if (contentTitle) {
      contentTitle.textContent = navItems[0].getAttribute('data-title') || 'Settings';
    }
  }
  
  // 为每个导航项添加点击事件
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // 切换激活状态
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // 获取目标选项卡ID
      const targetId = this.getAttribute('data-target');
      
      // 切换内容显示
      settingCards.forEach(card => {
        if (card.id === targetId) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
      
      // 更新标题
      if (contentTitle) {
        contentTitle.textContent = this.getAttribute('data-title') || 'Settings';
      }
      
      // 在移动视图下，点击后滚动到内容区
      if (window.innerWidth <= 900) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResponsiveLayout);
  handleResponsiveLayout();
}

/**
 * 处理响应式布局
 */
function handleResponsiveLayout() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  
  if (window.innerWidth <= 900) {
    if (sidebar) sidebar.style.position = 'relative';
    if (mainContent) mainContent.style.marginLeft = '0';
  } else {
    if (sidebar) sidebar.style.position = 'fixed';
    if (mainContent) mainContent.style.marginLeft = 'var(--sidebar-width)';
  }
}

/**
 * 初始化所有选项卡的表单事件
 */
function initFormEvents() {
  // 监听所有表单元素的变化
  document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('change', function() {
      // 显示保存按钮
      const saveButton = document.querySelector('.save-button');
      if (saveButton) saveButton.classList.add('pulse');
    });
  });
} 