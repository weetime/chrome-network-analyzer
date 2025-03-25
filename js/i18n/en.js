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
    domainManagement: 'Management',
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
    domainName: 'Domain',
    actions: 'Actions',
    
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
  };
})(typeof window !== 'undefined' ? window : self); 