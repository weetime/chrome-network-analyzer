/**
 * 中文语言包
 */

// 导出中文翻译
(function(global) {
  // 确保全局I18n对象存在
  if (!global.I18nMessages) {
    global.I18nMessages = {};
  }
  
  // 中文翻译
  global.I18nMessages.zh = {
    // 通用
    settings: '设置',
    save: '保存',
    saved: '已保存',
    cancel: '取消',
    confirm: '确认',
    enable: '启用',
    disable: '禁用',
    close: '关闭',
    
    // 应用名称
    appName: '网络请求分析器',
    
    // 域名管理
    domainManagement: '设置',
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
  };
})(typeof window !== 'undefined' ? window : self); 