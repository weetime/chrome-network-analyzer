/**
 * Anthropic Connector - Handles Anthropic API communication
 */

import { 
  AI_PROVIDERS, 
  MAX_RETRIES, 
  RETRY_DELAY,
  AiConnectorBase 
} from './ai-connector-base.js';

/**
 * 发送数据到Anthropic API (Claude)
 * @param {object} analysisData - 网络分析数据
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {number} maxTokens - 最大token数
 * @param {object} options - 附加选项，如语言设置
 * @returns {Promise<object>} 分析结果
 */
async function sendToAnthropic(analysisData, apiKey, model = AI_PROVIDERS.ANTHROPIC.defaultModel, maxTokens = 2000, options = {}) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.ANTHROPIC.models[model] || AI_PROVIDERS.ANTHROPIC.models[AI_PROVIDERS.ANTHROPIC.defaultModel];
    
    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions = language === 'zh' 
      ? '请用中文回答，并对以下网络性能数据进行分析。' 
      : 'Please respond in English and analyze the following network performance data.';
    
    // 为Claude API格式化消息
    const systemPrompt = `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`;
    const userContent = `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`;
    
    // 构建请求体
    const requestBody = AI_PROVIDERS.ANTHROPIC.buildRequest(modelId, systemPrompt, userContent, maxTokens);
    
    // 获取用户配置的API URL
    const apiUrl = AiConnectorBase.getApiUrl('ANTHROPIC');
    
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`Attempting to use Anthropic API, attempt ${retryCount + 1}`);
        
        const response = await AiConnectorBase.fetchWithTimeout(
          apiUrl,
          {
            method: 'POST',
            headers: AI_PROVIDERS.ANTHROPIC.buildHeaders(apiKey),
            body: JSON.stringify(requestBody)
          },
          'Anthropic API'
        );
        
        const data = await response.json();
        return {
          analysis: AI_PROVIDERS.ANTHROPIC.extractResponse(data),
          model: model,
          provider: 'Anthropic'
        };
      } catch (error) {
        console.error(`Error with Anthropic API (attempt ${retryCount + 1}):`, error);
        lastError = error;
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(r => setTimeout(r, RETRY_DELAY * retryCount));
        } else {
          break;
        }
      }
    }
    
    throw lastError || new Error('Failed to connect to Anthropic API');
  } catch (error) {
    console.error('Error sending data to Anthropic:', error);
    throw error;
  }
}

/**
 * 流式发送数据到Anthropic API
 */
async function streamAnthropic(analysisData, apiKey, model, maxTokens, options = {}, onChunk, abortController) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.ANTHROPIC.models[model] || AI_PROVIDERS.ANTHROPIC.models[AI_PROVIDERS.ANTHROPIC.defaultModel];
    
    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions = language === 'zh' 
      ? '请用中文回答，并对以下网络性能数据进行分析。' 
      : 'Please respond in English and analyze the following network performance data.';
    
    // 为Claude API格式化消息
    const systemPrompt = `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`;
    const userContent = `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`;
    
    // 构建请求体，启用流式传输
    const requestBody = AI_PROVIDERS.ANTHROPIC.buildRequest(modelId, systemPrompt, userContent, maxTokens, true);
    
    // 获取API端点
    const apiUrl = AiConnectorBase.getApiUrl('ANTHROPIC');
    
    // 发送请求
    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: AI_PROVIDERS.ANTHROPIC.buildHeaders(apiKey),
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    // 处理流式响应
    const completeText = await AiConnectorBase.handleStreamResponse(response.body, onChunk, 'ANTHROPIC', abortController);
    
    return {
      analysis: completeText,
      model: model,
      provider: 'Anthropic'
    };
  } catch (error) {
    console.error('Error in Anthropic stream:', error);
    throw error;
  }
}

// Export Anthropic-specific functionality
export const AiAnthropicConnector = {
  sendToAnthropic,
  streamAnthropic
};