/**
 * English language pack
 */

// Ensure the global I18nMessages object exists
if (typeof window !== 'undefined') {
  if (!window.I18nMessages) {
    window.I18nMessages = {};
  }
  
  // English translations
  window.I18nMessages.en = {
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
    enterApiKey: 'Enter your API key',
    saveApiKey: 'Save API Key',
    apiKeyWarning: 'Note: API key will be saved in local storage.',
    apiUrl: 'Custom API URL',
    enterApiUrl: 'Enter custom API URL if needed',
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
    status_5xx: 'Server Error',
    
    // AI Analysis page
    aiAnalysisTitle: 'Network Request AI Analysis',
    backToMain: 'Back to Home',
    aiTips: 'AI Analysis Tips',
    aiTip1: 'AI analysis can identify network performance bottlenecks and provide optimization suggestions',
    aiTip2: 'Analysis results are based on currently captured network request data, ensure you have sufficient request samples',
    aiTip3: 'You can configure your preferred AI provider and API key in the extension settings',
    aiTip4: 'Processing time depends on request volume and response, it may take a few seconds',
    aiModelInfo: 'Analysis by: ',
    
    // Optimization Suggestions
    optimizationTips: 'Optimization Suggestions',
    optimizationTip1: 'Combine small resource files to reduce HTTP request count',
    optimizationTip2: 'Enable image lazy loading to prioritize visible content',
    optimizationTip3: 'Using HTTP/2 protocol allows parallel processing of multiple requests',
    optimizationTip4: 'Set appropriate caching policies to reduce redundant requests',
    optimizationTip5: 'Compress JS and CSS files to reduce transfer size',

    languageChangeMsg: 'Switching to English...',
    
    aiSettingsSaved: 'AI analysis settings saved successfully',
    
    // Extension Settings Tab
    extensionSettings: 'Extension Settings',
    extensionSettingsDesc: 'Customize the appearance and behavior of the extension.',
    
    // Theme Settings
    themeSettings: 'Theme Settings',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    fireBlackTheme: 'Fire Black Theme',
  };
}

// Export English translations for direct import if needed
export const enTranslations = {
  // English translations content (same as above)
}; 