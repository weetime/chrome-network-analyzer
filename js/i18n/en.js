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
    domainManagementDesc:
      'Manage domains for which this extension is authorized to capture network requests.',
    noDomains: 'No authorized domains yet. This extension will only work on authorized domains.',
    addNewDomain: 'Enter domain (e.g. example.com or *.example.com)',
    remove: 'Remove',
    addDomain: 'Add Domain',
    currentDomain: 'Current Domain:',
    invalidDomain: 'Please enter a valid domain',
    invalidDomainFormat: 'Please enter a valid domain format (e.g., example.com)',
    domainExist: 'Domain already exists',
    domainAddSuccess: 'Domain "{domain}" has been authorized',
    domainRemoveSuccess: 'Authorization for domain "{domain}" has been removed',
    domainName: 'Domain',
    actions: 'Actions',

    // AI Settings
    aiSettings: 'AI Analysis Settings',
    aiSettingsDesc: 'Configure settings for AI analysis functionality',
    apiProvider: 'API Provider',
    apiKey: 'API Key',
    model: 'AI Model',
    enterApiKey: 'Enter your API key',
    apiUrl: 'Custom API URL',
    enterApiUrl: 'Enter custom API URL if needed',
    configRequired: 'API key not configured. Please configure API key in settings page.',

    // Status Messages
    settingsSaved: 'Settings saved',

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
    aiModelInfo: 'Analysis by: ',
    dataOverview: 'Data Overview',
    downloadReport: 'Download Report',
    downloadData: 'Download Data',
    reportFileName: 'Network Analysis Report',
    dataFileName: 'Network Request Data',
    downloadSuccess: 'Download Successful',
    downloadFailed: 'Download Failed',
    downloadReportAndData: 'Download Report & Data',
    downloadOptions: 'Download Options',
    downloadReportOnly: 'Report Only (MD)',
    downloadDataJSON: 'Data (JSON)',
    downloadDataCSV: 'Data (CSV)',
    downloadAll: 'Download All',
    requestsCount: 'Request Count',

    // Analysis process messages
    tabDataLoaded: 'Tab data loaded',
    tabDataLoadError: 'Error loading tab data',
    calculatingStats: 'Calculating statistics...',
    loadingAiConfig: 'Loading AI configuration...',
    preparingData: 'Preparing analysis data...',
    checkingCache: 'Checking cache status...',
    analysisStarting: 'Starting analysis...',
    dataLoading: 'Loading data...',
    connectingAi: 'Connecting to AI service...',
    generatingAnalysis: 'Generating analysis report...',
    analysisComplete: 'Analysis complete',
    analysisCancelled: 'Analysis cancelled',
    confirmClear: 'Are you sure you want to clear all network data?',
    currentTab: 'Current tab',
    noAuthorizedTabs: 'No other authorized tabs',

    // Notification messages
    noDataAvailable: 'No request data available for analysis',
    noApiKeyConfigured: 'No API key configured. Please configure API key in options page',
    aiAnalysisError: 'Error during AI analysis',
    noCopyContent: 'No analysis result to copy',
    copySuccess: 'Copied to clipboard',
    copyFailed: 'Copy failed',
    initPageError: 'Error initializing AI analysis page',
    cacheClearSuccess: 'AI analysis cache cleared',
    cacheClearError: 'Failed to clear cache',

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

    // Button Text
    stopAnalysis: 'Stop Analysis',
    clearCache: 'Clear Cache',
  };
}

// Export English translations for direct import if needed
export const enTranslations = {
  // English translations content (same as above)
};
