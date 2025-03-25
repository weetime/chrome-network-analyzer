/**
 * 国际化支持模块 - 提供多语言支持功能
 */

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['zh', 'en'];

// 默认语言
const DEFAULT_LANGUAGE = 'zh';

// 语言文本
const translations = {
  // 中文翻译
  zh: {
    // 通用
    settings: '设置',
    save: '保存',
    saved: '已保存',
    cancel: '取消',
    confirm: '确认',
    enable: '启用',
    disable: '禁用',
    
    // 应用名称
    appName: '网络请求分析器',
    
    // 域名管理
    domainManagement: '域名授权管理',
    domainManagementDesc: '在下方管理已授权的域名，这些域名将允许收集网络请求数据。',
    noDomains: '暂无已授权的域名',
    addNewDomain: '添加新域名',
    remove: '移除',
    addDomain: '添加',
    currentDomain: '当前域名:',
    invalidDomain: '请输入有效的域名',
    invalidDomainFormat: '请输入有效的域名格式 (例如: example.com)',
    domainAddSuccess: '已添加域名 "{domain}" 的授权',
    domainAddFailed: '添加域名 "{domain}" 授权失败',
    domainRemoveSuccess: '已移除域名 "{domain}" 的授权',
    domainRemoveConfirm: '确定要移除域名 "{domain}" 的授权吗？',
    domainRemoveFailed: '移除域名 "{domain}" 授权失败',
    
    // AI设置
    aiSettings: 'AI 分析设置',
    aiSettingsDesc: '配置AI分析功能的相关设置',
    apiProvider: 'API 提供商',
    apiKey: 'API 密钥',
    model: '模型',
    saveApiKey: '保存 API 密钥',
    apiKeyWarning: '注意：API密钥将保存在本地存储中。',
    showAiAnalysis: '显示 AI 分析面板',
    configRequired: 'API 密钥未配置。请在设置页面配置 API 密钥。',
    
    // 界面设置
    interfaceSettings: '界面设置',
    interfaceSettingsDesc: '自定义界面外观和行为',
    darkThemeDefault: '默认使用深色主题',
    defaultRowCount: '默认显示行数',
    
    // 扩展操作
    extensionActions: '扩展操作',
    extensionActionsDesc: '点击下方按钮访问扩展分析页面。',
    openExtension: '打开扩展',
    
    // 状态消息
    settingsSaved: '设置已保存',
    errorOccurred: '发生错误',
    
    // 语言设置
    languageSettings: '语言设置',
    language: '语言',
    languageZh: '中文',
    languageEn: '英文',
    
    // 表格和筛选
    url: 'URL',
    type: '类型',
    method: '方法',
    status: '状态',
    time: '时间',
    ttfb: '首字节',
    visits: '访问次数',
    p99: 'P99',
    searchUrl: '搜索 URL...',
    allTypes: '所有类型',
    document: '文档',
    stylesheet: 'CSS',
    script: 'JavaScript',
    image: '图片',
    xhr: 'XHR/Fetch',
    font: '字体',
    other: '其他',
    allStatus: '所有状态',
    success: '成功 (2xx)',
    redirect: '重定向 (3xx)',
    clientError: '客户端错误 (4xx)',
    serverError: '服务器错误 (5xx)',
    networkError: '网络错误',
    
    // 操作按钮
    toggleDarkMode: '切换深色模式',
    clearData: '清除数据',
    exportData: '导出数据',
    aiAnalysis: 'AI 分析',
    runAnalysis: '运行分析',
    processing: '处理中...',
    copy: '复制',
    
    // 表格信息
    noDataMessage: '尚未捕获任何网络请求。浏览网站以查看数据。'
  },
  
  // 英文翻译
  en: {
    // Common
    settings: 'Settings',
    save: 'Save',
    saved: 'Saved',
    cancel: 'Cancel',
    confirm: 'Confirm',
    enable: 'Enable',
    disable: 'Disable',
    
    // App name
    appName: 'Network Request Analyzer',
    
    // Domain Management
    domainManagement: 'Domain Authorization Management',
    domainManagementDesc: 'Manage authorized domains below. These domains will be allowed to collect network request data.',
    noDomains: 'No authorized domains yet',
    addNewDomain: 'Add New Domain',
    remove: 'Remove',
    addDomain: 'Add',
    currentDomain: 'Current Domain:',
    invalidDomain: 'Please enter a valid domain',
    invalidDomainFormat: 'Please enter a valid domain format (e.g., example.com)',
    domainAddSuccess: 'Domain "{domain}" has been authorized',
    domainAddFailed: 'Failed to authorize domain "{domain}"',
    domainRemoveSuccess: 'Authorization for domain "{domain}" has been removed',
    domainRemoveConfirm: 'Are you sure you want to remove authorization for domain "{domain}"?',
    domainRemoveFailed: 'Failed to remove authorization for domain "{domain}"',
    
    // AI Settings
    aiSettings: 'AI Analysis Settings',
    aiSettingsDesc: 'Configure settings for AI analysis functionality',
    apiProvider: 'API Provider',
    apiKey: 'API Key',
    model: 'Model',
    saveApiKey: 'Save API Key',
    apiKeyWarning: 'Note: API key will be saved in local storage.',
    showAiAnalysis: 'Show AI Analysis Panel',
    configRequired: 'API key not configured. Please configure API key in settings page.',
    
    // Interface Settings
    interfaceSettings: 'Interface Settings',
    interfaceSettingsDesc: 'Customize interface appearance and behavior',
    darkThemeDefault: 'Use Dark Theme by Default',
    defaultRowCount: 'Default Row Count',
    
    // Extension Actions
    extensionActions: 'Extension Actions',
    extensionActionsDesc: 'Click the button below to access the extension analysis page.',
    openExtension: 'Open Extension',
    
    // Status Messages
    settingsSaved: 'Settings saved',
    errorOccurred: 'An error occurred',
    
    // Language Settings
    languageSettings: 'Language Settings',
    language: 'Language',
    languageZh: 'Chinese',
    languageEn: 'English',
    
    // Table and Filtering
    url: 'URL',
    type: 'Type',
    method: 'Method',
    status: 'Status',
    time: 'Time',
    ttfb: 'TTFB',
    visits: 'Visits',
    p99: 'P99',
    searchUrl: 'Search URL...',
    allTypes: 'All Types',
    document: 'Document',
    stylesheet: 'CSS',
    script: 'JavaScript',
    image: 'Image',
    xhr: 'XHR/Fetch',
    font: 'Font',
    other: 'Other',
    allStatus: 'All Status',
    success: 'Success (2xx)',
    redirect: 'Redirect (3xx)',
    clientError: 'Client Error (4xx)',
    serverError: 'Server Error (5xx)',
    networkError: 'Network Error',
    
    // Action Buttons
    toggleDarkMode: 'Toggle Dark Mode',
    clearData: 'Clear Data',
    exportData: 'Export Data',
    aiAnalysis: 'AI Analysis',
    runAnalysis: 'Run Analysis',
    processing: 'Processing...',
    copy: 'Copy',
    
    // Table Info
    noDataMessage: 'No network requests captured yet. Browse a website to see data.'
  }
};

// 获取当前语言
function getCurrentLanguage() {
  return localStorage.getItem('language') || DEFAULT_LANGUAGE;
}

// 设置当前语言
function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    localStorage.setItem('language', lang);
    return true;
  }
  return false;
}

// 获取翻译文本
function getText(key, replacements = {}) {
  const lang = getCurrentLanguage();
  const text = translations[lang][key] || translations[DEFAULT_LANGUAGE][key] || key;
  
  // 处理替换变量
  if (Object.keys(replacements).length > 0) {
    return Object.keys(replacements).reduce((result, placeholder) => {
      return result.replace(`{${placeholder}}`, replacements[placeholder]);
    }, text);
  }
  
  return text;
}

// 更新页面上的所有i18n元素
function updatePageText() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = getText(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getText(key);
  });
  
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = getText(key);
  });
}

// 导出国际化功能
(function(global) {
  global.I18n = {
    getText,
    getCurrentLanguage,
    setLanguage,
    updatePageText,
    SUPPORTED_LANGUAGES
  };
})(typeof window !== 'undefined' ? window : self); 