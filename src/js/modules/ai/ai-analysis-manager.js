/**
 * AI Analysis Manager - Main entry point for AI analysis functionality
 * Modular version that coordinates other components
 */

import { AiAnalysisCore } from './ai-analysis-core.js';
import { AiDataProcessor } from './ai-data-processor.js';
import { AiAnalysisUi } from './ai-analysis-ui.js';

// Export a unified API for backwards compatibility
export const AiAnalysisManager = {
  // Core functions
  init: AiAnalysisCore.init,
  runAiAnalysis: AiAnalysisCore.runAiAnalysis,
  closeAnalysis: AiAnalysisCore.closeAnalysis,
  copyAnalysisResults: AiAnalysisCore.copyAnalysisResults,

  // Data processing functions
  calculateStatistics: AiDataProcessor.calculateStatistics,
  formatAnalysisText: AiDataProcessor.formatAnalysisText,

  // UI functions
  displayAnalysisResult: AiAnalysisUi.displayAnalysisResult,
  showAnalysisError: AiAnalysisUi.showAnalysisError,
};
