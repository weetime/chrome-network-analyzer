/**
 * AI Connector Manager - Main entry point for AI model interactions
 */

import { AiCacheManager } from '../../ai-cache-manager.js';
import { AiConnectorBase, AI_PROVIDERS } from './ai-connector-base.js';
import { AiOpenAIConnector } from './ai-openai-connector.js';
import { AiAnthropicConnector } from './ai-anthropic-connector.js';
import { AiDeepseekConnector } from './ai-deepseek-connector.js';

/**
 * 根据提供商发送数据到指定AI
 * @param {object} analysisData - 网络分析数据
 * @param {string} provider - AI提供商标识
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {object|number} options - 附加选项或最大token数
 * @param {number} maxTokens - 最大token数
 * @returns {Promise<object>} 分析结果
 */
async function sendToAI(analysisData, provider, apiKey, model, options = {}, maxTokens = 2000) {
  // 处理参数兼容性（如果第5个参数是数字，则它是旧版API中的maxTokens）
  if (typeof options === 'number') {
    maxTokens = options;
    options = {};
  }
  
  const providerKey = provider.toUpperCase();
  
  switch (providerKey) {
    case 'OPENAI':
      return AiOpenAIConnector.sendToOpenAI(analysisData, apiKey, model, maxTokens, options);
    case 'ANTHROPIC':
      return AiAnthropicConnector.sendToAnthropic(analysisData, apiKey, model, maxTokens, options);
    case 'DEEPSEEK':
      return AiDeepseekConnector.sendToDeepseek(analysisData, apiKey, model, maxTokens, options);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * 流式发送数据到AI API，支持缓存和中断
 * @param {object} analysisData - 网络分析数据
 * @param {string} provider - AI提供商
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {object} options - 附加选项，如语言设置
 * @param {number} maxTokens - 最大token数
 * @param {Function} onChunk - 处理每个数据块的回调
 * @param {AbortSignal} signal - 可选的中断信号
 * @returns {Promise<object>} 分析结果
 */
async function streamToAI(analysisData, provider, apiKey, model, options = {}, maxTokens = 2000, onChunk, signal) {
  const providerKey = provider.toUpperCase();
  const language = options?.language || 'en';
  
  // 检查是否有中断信号
  if (signal && signal.aborted) {
    throw new Error('Request aborted by user before starting');
  }
  
  // 尝试从缓存获取结果
  try {
    const cachedResult = await AiCacheManager.getCachedAnalysis(
      provider, 
      model, 
      analysisData, 
      language
    );
    
    if (cachedResult) {
      console.log('Using cached AI analysis result');
      
      // 如果有回调函数，模拟流式响应
      if (onChunk && typeof onChunk === 'function') {
        // 分块发送缓存结果以模拟流式响应
        const chunkSize = 100;
        let sentText = "";
        
        for (let i = 0; i < cachedResult.analysis.length; i += chunkSize) {
          // 检查是否中断
          if (signal && signal.aborted) {
            throw new Error('Request aborted by user during cache streaming');
          }
          
          const chunk = cachedResult.analysis.substring(i, i + chunkSize);
          sentText += chunk;
          onChunk(chunk, sentText);
          
          // 添加小延迟使其看起来像流式传输
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return cachedResult;
    }
  } catch (cacheError) {
    console.warn('Error checking cache:', cacheError);
    // 继续执行，不让缓存错误影响主流程
  }
  
  // 创建中断控制器
  const abortController = new AbortController();
  
  // 如果传入了信号，则连接它
  if (signal) {
    signal.addEventListener('abort', () => {
      abortController.abort();
    });
  }
  
  try {
    let result;
    
    switch (providerKey) {
      case 'OPENAI':
        result = await AiOpenAIConnector.streamOpenAI(analysisData, apiKey, model, maxTokens, options, onChunk, abortController);
        break;
      case 'ANTHROPIC':
        result = await AiAnthropicConnector.streamAnthropic(analysisData, apiKey, model, maxTokens, options, onChunk, abortController);
        break;
      case 'DEEPSEEK':
        result = await AiDeepseekConnector.streamDeepseek(analysisData, apiKey, model, maxTokens, options, onChunk, abortController);
        break;
      default:
        throw new Error(`Unsupported AI provider for streaming: ${provider}`);
    }
    
    // 缓存成功的结果
    try {
      await AiCacheManager.cacheAnalysisResult(
        provider,
        model,
        analysisData,
        language,
        result
      );
    } catch (cacheSaveError) {
      console.warn('Error saving to cache:', cacheSaveError);
      // 不让缓存错误影响返回结果
    }
    
    return result;
  } catch (error) {
    // 如果是中断错误，添加更详细的上下文
    if (error.name === 'AbortError') {
      throw new Error(`AI analysis aborted: ${error.message || 'Request was cancelled or timed out'}`);
    }
    throw error;
  }
}

// Export the unified AI Connector functionality
export const AiConnectorManager = {
  // Core functions
  sendToAI,
  streamToAI,
  formatNetworkDataForAI: AiConnectorBase.formatNetworkDataForAI,
  setCustomApiUrl: AiConnectorBase.setCustomApiUrl,
  
  // Provider-specific functions
  sendToOpenAI: AiOpenAIConnector.sendToOpenAI,
  sendToAnthropic: AiAnthropicConnector.sendToAnthropic,
  sendToDeepseek: AiDeepseekConnector.sendToDeepseek,
  streamOpenAI: AiOpenAIConnector.streamOpenAI,
  streamAnthropic: AiAnthropicConnector.streamAnthropic,
  streamDeepseek: AiDeepseekConnector.streamDeepseek,
  
  // Cache management
  clearAnalysisCache: AiCacheManager.clearCache,
  getCacheStats: AiCacheManager.getCacheStats,
  
  // Configuration constants
  AI_PROVIDERS,
  
  // For backward compatibility
  OPENAI_MODELS: AI_PROVIDERS.OPENAI.models,
  ANTHROPIC_MODELS: AI_PROVIDERS.ANTHROPIC.models
};