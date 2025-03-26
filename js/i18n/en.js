/**
 * English language pack
 */

// Export English translations
(function(global) {
  // Ensure the global I18n object exists
  if (!global.I18nMessages) {
    global.I18nMessages = {};
  }
  
  // English translations
  global.I18nMessages.en = {
    // Common
    settings: 'Settings',
    save: 'Save',
    saved: 'Saved',
    cancel: 'Cancel',
    confirm: 'Confirm',
    enable: 'Enable',
    disable: 'Disable',
    close: 'Close',
    
    // App name
    appName: 'Network Request Analyzer',
    
    // Domain Management
    domainManagement: 'Domain Management',
    domainManagementDesc: 'Manage domains for which this extension is authorized to capture network requests.',
    noDomains: 'No authorized domains yet. This extension will only work on authorized domains.',
    addNewDomain: 'Enter domain (e.g. example.com or *.example.com)',
    remove: 'Remove',
    addDomain: 'Add Domain',
    currentDomain: 'Current Domain:',
    invalidDomain: 'Please enter a valid domain',
    invalidDomainFormat: 'Please enter a valid domain format (e.g., example.com)',
    domainExist: 'Domain already exists',
    domainAddSuccess: 'Domain "{domain}" has been authorized',
    domainAddFailed: 'Failed to authorize domain "{domain}"',
    domainRemoveSuccess: 'Authorization for domain "{domain}" has been removed',
    domainRemoveConfirm: 'Are you sure you want to remove authorization for domain "{domain}"?',
    domainRemoveFailed: 'Failed to remove authorization for domain "{domain}"',
    domainName: 'Domain',
    actions: 'Actions',
    
    // AI Settings
    aiSettings: 'AI Analysis Settings',
    aiSettingsDesc: 'Configure settings for AI analysis functionality',
    apiProvider: 'API Provider',
    apiKey: 'API Key',
    model: 'AI Model',
    enterApiKey: 'Enter your OpenAI API key',
    saveApiKey: 'Save API Key',
    apiKeyWarning: 'Note: API key will be saved in local storage.',
    showAiAnalysis: 'Automatic Analysis',
    configRequired: 'API key not configured. Please configure API key in settings page.',
    
    // Interface Settings
    interfaceSettings: 'Interface Settings',
    interfaceSettingsDesc: 'Customize interface appearance and behavior',
    darkThemeDefault: 'Dark Theme',
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
    noDataMessage: 'No network requests captured yet. Browse a website to see data.',
    
    // Statistics
    noData: 'No Data',
    totalRequests: 'Total Requests',
    totalLoadTime: 'Total Load Time',
    slowestRequest: 'Slowest Request',
    avgResponse: 'Avg Response',
    p50Response: 'P50 Response',
    p95Response: 'P95 Response',
    type_document: 'Document',
    type_stylesheet: 'CSS',
    type_script: 'Script',
    type_image: 'Image',
    type_xmlhttprequest: 'XHR/Fetch',
    type_fetch: 'Fetch',
    type_font: 'Font',
    type_media: 'Media',
    type_websocket: 'WebSocket',
    type_manifest: 'Manifest',
    type_other: 'Other',
    status_2xx: 'Success',
    status_4xx: 'Client Error',
    status_5xx: 'Server Error'
  };
})(typeof window !== 'undefined' ? window : self); 