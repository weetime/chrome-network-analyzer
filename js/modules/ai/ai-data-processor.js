/**
 * AI Data Processor - Handles data processing for AI analysis
 */

import { StatsManager } from '../../stats-manager.js';

/**
 * Calculate statistics for AI analysis
 */
function calculateStatistics(requestsData) {
  const requests = Object.values(requestsData);
  
  // Filter requests with valid time data
  const validRequests = requests.filter(req => req.totalTime);
  
  // If no valid requests, return empty stats
  if (validRequests.length === 0) {
    return {
      totalRequests: 0,
      averageLoadTime: 0,
      p95LoadTime: 0,
      errorRate: 0
    };
  }
  
  // Calculate total load time
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  
  // Calculate average load time
  const averageLoadTime = totalLoadTime / validRequests.length;
  
  // Calculate error rate
  const errorCount = requests.filter(req => req.error || (req.status && req.status >= 400)).length;
  const errorRate = (errorCount / requests.length) * 100;
  
  // Calculate percentiles if we have the function available
  let p95LoadTime = 0;
  if (StatsManager && StatsManager.calculatePercentile) {
    const times = validRequests.map(req => req.totalTime);
    p95LoadTime = StatsManager.calculatePercentile(times, 95);
  } else {
    // Simple implementation if StatsManager not available
    const times = validRequests.map(req => req.totalTime).sort((a, b) => a - b);
    const index = Math.floor(times.length * 0.95);
    p95LoadTime = times[index] || 0;
  }
  
  return {
    totalRequests: requests.length,
    averageLoadTime,
    p95LoadTime,
    errorRate
  };
}

/**
 * Format analysis text with Markdown-like formatting
 */
function formatAnalysisText(text) {
  if (!text) return '';
  
  // Convert line breaks to HTML breaks
  let formatted = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
  
  // Convert headers
  formatted = formatted.replace(/#{3,6} (.+?)(?:<br>|$)/g, '<h4>$1</h4>');
  formatted = formatted.replace(/## (.+?)(?:<br>|$)/g, '<h3>$1</h3>');
  formatted = formatted.replace(/# (.+?)(?:<br>|$)/g, '<h2>$1</h2>');
  
  // Convert bold text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert lists
  formatted = formatted.replace(/- (.+?)(?:<br>|$)/g, '• $1<br>');
  
  return formatted;
}

// Export data processing functions
export const AiDataProcessor = {
  calculateStatistics,
  formatAnalysisText
};