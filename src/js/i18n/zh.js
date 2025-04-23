/**
 * 中文语言包
 */

// 确保全局I18nMessages对象存在
if (typeof window !== 'undefined') {
  if (!window.I18nMessages) {
    window.I18nMessages = {};
  }

  // 中文翻译
  window.I18nMessages.zh = {
    // 通用
    settings: '设置',
    save: '保存',
    saved: '已保存',
    cancel: '取消',
    confirm: '确认',
    enable: '启用',
    disable: '禁用',
    close: '关闭',

    // API测试功能
    testApi: '测试API连接',
    testing: '正在测试...',
    testingConnection: '正在测试连接...',
    testingApiConnection: '正在测试API连接，请稍候...',
    connectionError: '连接错误',
    apiKeyRequired: 'API密钥不能为空',
    testAndSave: '测试并保存',

    // 应用名称
    appName: '网络请求分析器',

    // 域名管理
    domainManagement: '域名管理',
    domainManagementDesc: '管理已授权的域名，这些域名将允许收集网络请求数据。',
    noDomains: '暂无已授权的域名，扩展程序只会在授权域名上工作。',
    addNewDomain: '输入域名（例如：example.com 或 *.example.com）',
    remove: '移除',
    addDomain: '添加域名',
    currentDomain: '当前域名:',
    invalidDomain: '请输入有效的域名',
    invalidDomainFormat: '请输入有效的域名格式 (例如: example.com)',
    domainExist: '域名已存在',
    domainAddSuccess: '已添加域名 "{domain}" 的授权',
    domainAddFailed: '添加域名 "{domain}" 授权失败',
    domainRemoveSuccess: '已移除域名 "{domain}" 的授权',
    domainRemoveConfirm: '确定要移除域名 "{domain}" 的授权吗？',
    domainRemoveFailed: '移除域名 "{domain}" 授权失败',
    domainName: '域名',
    actions: '操作',

    // AI设置
    aiSettings: 'AI 分析设置',
    aiSettingsDesc: '配置AI分析功能的相关设置',
    apiProvider: 'API 提供商',
    apiKey: 'API 密钥',
    model: 'AI 模型',
    enterApiKey: '输入您的 API 密钥',
    saveApiKey: '保存 API 密钥',
    apiKeyWarning: '注意：API密钥将保存在本地存储中。',
    apiUrl: '自定义 API 地址',
    enterApiUrl: '输入自定义 API 地址（可选）',
    configRequired: 'API 密钥未配置。请在设置页面配置 API 密钥。',
    configureNow: '立即配置',

    // 界面设置
    interfaceSettings: '界面设置',
    interfaceSettingsDesc: '自定义界面外观和行为',
    darkThemeDefault: '深色主题',
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

    // 操作按钮
    toggleDarkMode: '切换深色模式',
    clearData: '清除数据',
    exportData: '导出数据',
    aiAnalysis: 'AI 分析',
    runAnalysis: '运行分析',
    processing: '处理中...',
    copy: '复制',

    // 表格信息
    noDataMessage: '尚未捕获任何网络请求。浏览网站以查看数据。',

    // 统计信息
    noData: '暂无数据',
    totalRequests: '总请求数',
    totalLoadTime: '总加载时间',
    slowestRequest: '最慢请求',
    avgResponse: '平均响应时间',
    p50Response: 'P50响应时间',
    p95Response: 'P95响应时间',
    type_document: '文档',
    type_stylesheet: 'CSS样式',
    type_script: '脚本',
    type_image: '图片',
    type_xmlhttprequest: 'XHR/Fetch',
    type_fetch: 'Fetch请求',
    type_font: '字体',
    type_media: '媒体文件',
    type_websocket: 'WebSocket',
    type_manifest: '清单文件',
    type_other: '其他',
    status_2xx: '成功请求',
    status_4xx: '客户端错误',
    status_5xx: '服务器错误',

    // AI分析页面
    aiAnalysisTitle: '网络请求 AI 分析',
    backToMain: '返回主页',
    aiTips: 'AI 分析使用提示',
    aiTip1: 'AI分析能够识别网络性能瓶颈，并提供优化建议',
    aiTip2: '分析结果基于当前捕获的网络请求数据，请确保有足够的请求样本',
    aiTip3: '您可以在扩展设置中配置偏好的AI提供商和API密钥',
    aiTip4: '分析过程视请求量和响应而定，可能需要几秒钟时间',
    aiModelInfo: '分析提供: ',
    dataOverview: '数据概览',
    downloadReport: '下载报告',
    downloadData: '下载数据',
    reportFileName: '网络分析报告',
    dataFileName: '网络请求数据',
    downloadSuccess: '下载成功',
    downloadFailed: '下载失败',
    downloadReportAndData: '下载报告和数据',
    downloadOptions: '下载选项',
    downloadReportOnly: '仅下载报告 (MD)',
    downloadDataJSON: '下载数据 (JSON)',
    downloadDataCSV: '下载数据 (CSV)',
    downloadAll: '全部下载',
    requestsCount: '请求统计',

    // 分析过程消息
    tabDataLoaded: '已加载标签页数据',
    tabDataLoadError: '加载标签页数据出错',
    calculatingStats: '计算统计数据...',
    loadingAiConfig: '加载AI配置...',
    preparingData: '准备分析数据...',
    checkingCache: '检查缓存状态...',
    analysisStarting: '开始分析...',
    dataLoading: '加载数据...',
    connectingAi: '连接到AI服务...',
    generatingAnalysis: '生成分析报告...',
    analysisComplete: '分析完成',
    analysisCancelled: '分析已取消',
    confirmClear: '确定要清除所有网络数据吗？',
    currentTab: '当前标签页',
    noAuthorizedTabs: '没有其他授权的标签页',

    // 通知消息
    noDataAvailable: '没有可用的请求数据进行分析',
    noApiKeyConfigured: '未配置API密钥。请在选项页面中配置API密钥',
    aiAnalysisError: 'AI分析过程中出错',
    noCopyContent: '没有可复制的分析结果',
    copySuccess: '已复制到剪贴板',
    copyFailed: '复制失败',
    initPageError: '初始化AI分析页面时出错',
    cacheClearSuccess: 'AI分析缓存已清除',
    cacheClearError: '清除缓存失败',

    // 优化建议
    optimizationTips: '优化建议',
    optimizationTip1: '合并小型资源文件，减少HTTP请求次数',
    optimizationTip2: '启用图片懒加载，优先加载可视区域内容',
    optimizationTip3: '使用HTTP/2协议可以并行处理多个请求',
    optimizationTip4: '设置合理的缓存策略，减少重复请求',
    optimizationTip5: '压缩JS和CSS文件，减少传输体积',

    languageChangeMsg: '正在切换到中文...',

    aiSettingsSaved: 'AI 分析设置已保存成功',

    // 扩展程序设置
    extensionSettings: '扩展程序设置',
    extensionSettingsDesc: '自定义扩展程序的外观和行为。',

    // 主题设置
    themeSettings: '主题设置',
    lightTheme: '浅色主题',
    darkTheme: '深色主题',
    fireBlackTheme: '火焰黑主题',

    // 按钮文本
    stopAnalysis: '停止分析',
    clearCache: '清除缓存',
  };
}

// 导出中文翻译数据，以便在需要时直接导入
export const zhTranslations = {
  // 中文翻译内容（与上面相同）
};
