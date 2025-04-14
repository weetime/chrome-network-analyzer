/**
 * AI Connector Manager - Main entry point for AI model interactions
 */

import { AiCacheManager } from '../../ai-cache-manager.js';
import { AiConnectorBase, AI_PROVIDERS } from './ai-connector-base.js';
import { AiOpenAIConnector } from './ai-openai-connector.js';
import { AiAnthropicConnector } from './ai-anthropic-connector.js';
import { AiDeepseekConnector } from './ai-deepseek-connector.js';

/**
 * Send data to the specified AI based on provider
 * @param {object} analysisData - Network analysis data
 * @param {string} provider - AI provider identifier
 * @param {string} apiKey - API key
 * @param {string} model - Model name
 * @param {object|number} options - Additional options or max tokens
 * @param {number} maxTokens - Maximum number of tokens
 * @returns {Promise<object>} Analysis result
 */
async function sendToAI(analysisData, provider, apiKey, model, options = {}, maxTokens = 2000) {
  // Handle parameter compatibility (if the 5th parameter is a number, it's maxTokens in the old API)
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
 * Stream data to AI API, with support for caching and aborting
 * @param {object} analysisData - Network analysis data
 * @param {string} provider - AI provider
 * @param {string} apiKey - API key
 * @param {string} model - Model name
 * @param {object} options - Additional options, such as language settings
 * @param {number} maxTokens - Maximum number of tokens
 * @param {Function} onChunk - Callback for handling each data chunk
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<object>} Analysis result
 */
async function streamToAI(analysisData, provider, apiKey, model, options = {}, maxTokens = 2000, onChunk, signal) {
  const providerKey = provider.toUpperCase();
  const language = options?.language || 'en';
  
  // Check if abort signal is present
  if (signal && signal.aborted) {
    throw new Error('Request aborted by user before starting');
  }
  
  // Try to get result from cache
  try {
    const cachedResult = await AiCacheManager.getCachedAnalysis(
      provider, 
      model, 
      analysisData, 
      language
    );
    
    if (cachedResult) {
      console.log('Using cached AI analysis result');
      
      // If callback function exists, simulate streaming response
      if (onChunk && typeof onChunk === 'function') {
        // Send cached result in chunks to simulate streaming
        const chunkSize = 100;
        let sentText = "";
        
        for (let i = 0; i < cachedResult.analysis.length; i += chunkSize) {
          // Check for abort
          if (signal && signal.aborted) {
            throw new Error('Request aborted by user during cache streaming');
          }
          
          const chunk = cachedResult.analysis.substring(i, i + chunkSize);
          sentText += chunk;
          onChunk(chunk, sentText);
          
          // Add small delay to make it look like streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return cachedResult;
    }
  } catch (cacheError) {
    console.warn('Error checking cache:', cacheError);
    // Continue execution, don't let cache errors affect main process
  }
  
  // Create abort controller
  const abortController = new AbortController();
  
  // If signal was passed, connect it
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
    
    // Cache successful result
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
      // Don't let cache errors affect the return result
    }
    
    return result;
  } catch (error) {
    // If it's an abort error, add more detailed context
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