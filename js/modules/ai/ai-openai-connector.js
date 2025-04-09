/**
 * OpenAI Connector - Handles OpenAI API communication
 */

import { 
  AI_PROVIDERS, 
  MAX_RETRIES, 
  RETRY_DELAY,
  AiConnectorBase 
} from './ai-connector-base.js';

/**
 * 发送数据到OpenAI API
 * @param {object} analysisData - 网络分析数据
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {number} maxTokens - 最大token数
 * @param {object} options - 附加选项，如语言设置
 * @returns {Promise<object>} 分析结果
 */
async function sendToOpenAI(analysisData, apiKey, model = AI_PROVIDERS.OPENAI.defaultModel, maxTokens = 2000, options = {}) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.OPENAI.models[model] || AI_PROVIDERS.OPENAI.models[AI_PROVIDERS.OPENAI.defaultModel];
    
    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions = language === 'zh' 
      ? '请用中文回答，并对以下网络性能数据进行分析。' 
      : 'Please respond in English and analyze the following network performance data.';
    
    // 创建提示和用户消息
    const messages = [
      {
        role: 'system',
        content: `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`
      },
      {
        role: 'user',
        content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`
      }
    ];
    
    // 构建请求体
    const requestBody = AI_PROVIDERS.OPENAI.buildRequest(modelId, messages, maxTokens);
    
    // 定义要尝试的API端点
    const apiEndpoints = [
      { 
        url: AiConnectorBase.getApiUrl('OPENAI'),
        headers: AI_PROVIDERS.OPENAI.buildHeaders(apiKey, false),
        name: 'Custom OpenAI API'
      },
      ...AI_PROVIDERS.OPENAI.proxyUrls.map((url, index) => ({
        url: url,
        headers: AI_PROVIDERS.OPENAI.buildHeaders(apiKey, true),
        name: `Proxy ${index + 1}`
      }))
    ];
    
    let lastError = null;
    
    // 为每个端点添加重试逻辑
    for (const endpoint of apiEndpoints) {
      let retryCount = 0;
      
      while (retryCount <= MAX_RETRIES) {
        try {
          console.log(`Attempting to use ${endpoint.name}, attempt ${retryCount + 1}`);
          
          const response = await AiConnectorBase.fetchWithTimeout(
            endpoint.url, 
            {
              method: 'POST',
              headers: endpoint.headers,
              body: JSON.stringify(requestBody)
            },
            endpoint.name
          );
          
          const data = await response.json();
          return {
            analysis: AI_PROVIDERS.OPENAI.extractResponse(data),
            model: model,
            provider: `OpenAI (via ${endpoint.name})`
          };
        } catch (error) {
          console.error(`Error with ${endpoint.name} (attempt ${retryCount + 1}):`, error);
          
          // 捕获和显示DOMException
          if (error.name === 'AbortError' || error.name === 'DOMException') {
            console.warn(`Request to ${endpoint.name} was aborted: ${error.message}`);
            lastError = new Error(`Connection to ${endpoint.name} failed: Request timed out or was aborted`);
          } else {
            lastError = error;
          }
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            // 指数退避重试
            await new Promise(r => setTimeout(r, RETRY_DELAY * retryCount));
          } else {
            console.log(`Max retries exceeded for ${endpoint.name}, trying next endpoint`);
            break;
          }
        }
      }
    }
    
    // 所有尝试都失败了
    throw lastError || new Error('Failed to connect to any OpenAI API endpoint');
  } catch (error) {
    console.error('Error sending data to OpenAI:', error);
    throw error;
  }
}

/**
 * 流式发送数据到OpenAI API
 */
async function streamOpenAI(analysisData, apiKey, model, maxTokens, options = {}, onChunk, abortController) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.OPENAI.models[model] || AI_PROVIDERS.OPENAI.models[AI_PROVIDERS.OPENAI.defaultModel];
    
    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions = language === 'zh' 
      ? '请用中文回答，并对以下网络性能数据进行分析。' 
      : 'Please respond in English and analyze the following network performance data.';
    
    // 创建提示和用户消息
    const messages = [
      {
        role: 'system',
        content: `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`
      },
      {
        role: 'user',
        content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`
      }
    ];
    
    // 构建请求体，启用流式传输
    const requestBody = AI_PROVIDERS.OPENAI.buildRequest(modelId, messages, maxTokens, true);
    
    // 获取API端点
    const endpoint = {
      url: AiConnectorBase.getApiUrl('OPENAI'),
      headers: AI_PROVIDERS.OPENAI.buildHeaders(apiKey, false),
      name: 'Custom OpenAI API'
    };
    
    // 发送请求
    const response = await fetch(
      endpoint.url,
      {
        method: 'POST',
        headers: endpoint.headers,
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    // 处理流式响应
    const completeText = await AiConnectorBase.handleStreamResponse(response.body, onChunk, 'OPENAI', abortController);
    
    return {
      analysis: completeText,
      model: model,
      provider: `OpenAI (via ${endpoint.name})`
    };
  } catch (error) {
    console.error('Error in OpenAI stream:', error);
    throw error;
  }
}

// Export OpenAI-specific functionality
export const AiOpenAIConnector = {
  sendToOpenAI,
  streamOpenAI
};