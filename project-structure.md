# Chrome Network Analyzer Project Structure

## Core Components

### Network Tracking (`js/network-tracker.js`)
Core functionality for monitoring network requests
#### Functions:
- `initNetworkTracker()`: Initializes network request monitoring
- `storeRequestData(tabId)`: Persists request data to local storage
- `getRequestData(tabId)`: Retrieves request data for a specific tab
- `clearRequestData(tabId)`: Cleans up request data for a tab

### AI Analysis (`js/ai-analysis-manager.js`)
Manages AI-powered analysis of network requests
#### Functions:
- `initAiAnalysisManager()`: Sets up AI analysis UI and handlers
- `runAiAnalysis()`: Executes AI analysis on current network data
- `calculateStatistics(requestsData)`: Computes request statistics
- `displayAnalysisResult(result, userConfig)`: Shows analysis results
- `formatAnalysisText(text)`: Formats analysis output
- `showAnalysisError(message)`: Handles error display
- `copyAnalysisResults()`: Copies analysis to clipboard
- `closeAnalysis()`: Closes analysis panel

### AI Connector (`js/ai-connector.js`)
Handles communication with AI services
#### Functions:
- `sendToAI(data, provider, apiKey, model)`: Sends data to AI service
- `formatNetworkDataForAI(data, stats)`: Prepares data for AI analysis

### Request Details (`js/request-details-manager.js`)
Manages detailed request information display
#### Functions:
- `showRequestDetails(requestId)`: Displays detailed request info
- `formatHeaders(headers)`: Formats request/response headers
- `analyzeTimings(request)`: Analyzes request timing data

### Statistics (`js/stats-manager.js`)
Handles statistical calculations and analysis
#### Functions:
- `calculatePercentile(data, percentile)`: Calculates percentile values
- `generateStatsSummary()`: Creates statistical summary
- `updateStatsDisplay()`: Updates statistics UI

### UI Components

#### Table Manager (`js/table-manager.js`)
Manages request table display and interaction
##### Functions:
- `initTable()`: Initializes request table
- `updateTable(data)`: Updates table with new data
- `sortTable(column)`: Handles table sorting
- `filterTable(criteria)`: Applies table filters

#### Theme Manager (`js/theme-manager.js`)
Handles theme switching and customization
##### Functions:
- `initTheme()`: Sets up theme system
- `switchTheme(theme)`: Changes current theme
- `applyTheme(theme)`: Applies theme styles

#### Toast Manager (`js/toast-manager.js`)
Manages notification displays
##### Functions:
- `showToast(message, type)`: Shows notification
- `hideToast()`: Hides current notification

### Data Management

#### Domain Manager (`js/domain-manager.js`)
Handles domain-related operations
##### Functions:
- `extractDomain(url)`: Extracts domain from URL
- `isDomainAuthorized(domain)`: Checks domain authorization
- `manageDomainAuth(domain)`: Manages domain permissions

## Styles

### Core Styles
- `main.css`: Base styles
- `layout.css`: Layout structure
- `theme.css`: Theme definitions

### Component Styles
- `ai-analysis.css`: AI analysis UI styles
- `details.css`: Request details styles
- `table.css`: Table component styles
- `controls.css`: UI controls styles
- `toast.css`: Notification styles

## Extension Pages

### Popup (`popup.html`, `popup.js`)
Main extension interface
#### Features:
- Request list display
- Quick statistics
- Analysis controls
- Filter options

### Options (`options.html`, `options.js`)
Extension configuration interface
#### Features:
- AI provider settings
- Theme preferences
- Domain management
- Display options

## Build System
- `build.sh`: Build and packaging script
- `manifest.json`: Extension manifest
- `package.json`: Project dependencies

## Internationalization
- `_locales/`: Language resources
- `i18n.js`: Translation management

## Assets
- `images/`: Icons and images
- `css/`: Stylesheets
- `js/`: JavaScript modules