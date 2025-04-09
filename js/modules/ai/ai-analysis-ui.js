/**
 * AI Analysis UI - Handles UI elements for AI analysis
 */

import { AiDataProcessor } from './ai-data-processor.js';
import { AiAnalysisCore } from './ai-analysis-core.js';

/**
 * Display AI analysis result
 */
function displayAnalysisResult(result, userConfig) {
  // Get elements
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  const modelInfoElement = document.getElementById('aiModelInfo');
  
  if (!aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Hide loading indicator
  aiAnalysisStatus.style.display = 'none';
  
  // Set analysis text with formatted content
  aiAnalysisResult.innerHTML = AiDataProcessor.formatAnalysisText(result.analysis);
  
  // 处理provider信息
  let provider = result.provider || '';
  // 如果provider包含括号内容（如"OpenAI (via Custom OpenAI API)"），则提取主要提供商名称
  if (provider.includes('(')) {
    provider = provider.split('(')[0].trim();
  }
  
  // 优先使用用户配置的提供商
  if (userConfig && userConfig.provider) {
    provider = userConfig.provider.charAt(0).toUpperCase() + userConfig.provider.slice(1);
    console.log('使用用户配置的提供商:', provider); // 调试信息
  }
  
  const model = userConfig && userConfig.model ? userConfig.model : (result.model || 'AI');
  
  // Set model info if element exists
  if (modelInfoElement) {
    modelInfoElement.textContent = `Analyzed with ${provider} ${model}`;
    console.log('显示模型信息:', `Analyzed with ${provider} ${model}`); // 调试信息
  }
  
  // Save current result for copy function
  AiAnalysisCore.setCurrentAnalysisResult(result);
}

/**
 * Show error message for AI analysis
 */
function showAnalysisError(message) {
  // Get elements
  const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
  const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
  const aiAnalysisResult = document.getElementById('aiAnalysisResult');
  
  if (!aiAnalysisContainer || !aiAnalysisStatus || !aiAnalysisResult) {
    console.error('Required AI analysis elements not found');
    return;
  }
  
  // Show container
  aiAnalysisContainer.classList.add('visible');
  
  // Hide loading and show error in result
  aiAnalysisStatus.style.display = 'none';
  
  // Set error message in result div
  aiAnalysisResult.innerHTML = `
    <div class="analysis-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>${message}</p>
    </div>
  `;
}

// Export UI-related functions
export const AiAnalysisUi = {
  displayAnalysisResult,
  showAnalysisError
};