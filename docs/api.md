# Network Request Analyzer API Documentation

## Core APIs

### Network Tracking API

#### `NetworkTracker`
```javascript
NetworkTracker.init()
NetworkTracker.getRequestData(tabId)
NetworkTracker.clearRequestData(tabId)
NetworkTracker.storeRequestData(tabId)
```

#### Request Object Structure
```javascript
{
  url: string,
  method: string,
  type: string,
  startTime: number,
  endTime: number,
  totalTime: number,
  status: number,
  responseSize: number,
  responseHeadersSize: number,
  ttfb: number,
  contentDownloadTime: number,
  error?: string
}
```

### AI Analysis API

#### `AiAnalysisManager`
```javascript
AiAnalysisManager.init()
AiAnalysisManager.runAnalysis()
AiAnalysisManager.getResults()
```

#### Analysis Configuration
```javascript
{
  provider: 'openai' | 'anthropic' | 'deepseek',
  model: string,
  apiKey: string,
  options: {
    temperature: number,
    maxTokens: number
  }
}
```

### Statistics API

#### `StatsManager`
```javascript
StatsManager.calculateStats()
StatsManager.getPercentiles()
StatsManager.generateReport()
```

## Event System

### Available Events
```javascript
// Request events
onRequestStart
onRequestComplete
onRequestError

// Analysis events
onAnalysisStart
onAnalysisComplete
onAnalysisError

// UI events
onTableUpdate
onFilterChange
onThemeChange
```

### Event Subscription
```javascript
EventManager.subscribe('eventName', callback)
EventManager.unsubscribe('eventName', callback)
```

## Storage API

### Local Storage
```javascript
StorageManager.saveData(key, value)
StorageManager.getData(key)
StorageManager.removeData(key)
```

### Chrome Storage
```javascript
ChromeStorage.sync.set(data)
ChromeStorage.sync.get(keys)
ChromeStorage.local.set(data)
ChromeStorage.local.get(keys)
```

## UI Components API

### Table Manager
```javascript
TableManager.init(options)
TableManager.updateData(data)
TableManager.sort(column)
TableManager.filter(criteria)
```

### Theme Manager
```javascript
ThemeManager.init()
ThemeManager.setTheme('light' | 'dark')
ThemeManager.getTheme()
```

## Integration Guidelines

### Custom AI Provider Integration
1. Implement provider interface
2. Register provider
3. Configure authentication
4. Handle responses

### Plugin Development
1. Use plugin API
2. Register handlers
3. Implement lifecycle methods
4. Package plugin

## Security Considerations

### API Key Management
- Secure storage
- Key rotation
- Access control
- Encryption

### Data Handling
- Request filtering
- Data sanitization
- Error handling
- Rate limiting

## Performance Guidelines

### Best Practices
- Batch operations
- Cache management
- Memory optimization
- Background processing

### Optimization Tips
- Use efficient queries
- Implement pagination
- Optimize storage
- Handle large datasets