/**
 * OpenRouter Connector - Handles OpenRouter API communication
 */

import { AI_PROVIDERS, MAX_RETRIES, RETRY_DELAY, AiConnectorBase } from './ai-connector-base.js';

/**
 * 发送数据到OpenRouter API
 * @param {object} analysisData - 网络分析数据
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {number} maxTokens - 最大token数
 * @param {object} options - 附加选项，如语言设置
 * @returns {Promise<object>} 分析结果
 */
async function sendToOpenRouter(
  analysisData,
  apiKey,
  model = AI_PROVIDERS.OPENROUTER.defaultModel,
  maxTokens = 2000,
  options = {}
) {
  try {
    // 选择模型
    const modelId =
      AI_PROVIDERS.OPENROUTER.models[model] ||
      AI_PROVIDERS.OPENROUTER.models[AI_PROVIDERS.OPENROUTER.defaultModel];

    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions =
      language === 'zh'
        ? '请用中文回答，并对以下网络性能数据进行分析。'
        : 'Please respond in English and analyze the following network performance data.';

    // 创建提示和用户消息
    const messages = [
      {
        role: 'system',
        content: `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`,
      },
      {
        role: 'user',
        content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`,
      },
    ];

    // 构建请求体
    const requestBody = AI_PROVIDERS.OPENROUTER.buildRequest(modelId, messages, maxTokens);

    // 获取用户配置的API URL
    const apiUrl = AiConnectorBase.getApiUrl('OPENROUTER');

    let retryCount = 0;
    let lastError = null;

    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`Attempting to use OpenRouter API, attempt ${retryCount + 1}`);

        const response = await AiConnectorBase.fetchWithTimeout(
          apiUrl,
          {
            method: 'POST',
            headers: AI_PROVIDERS.OPENROUTER.buildHeaders(apiKey),
            body: JSON.stringify(requestBody),
          },
          'OpenRouter API'
        );

        const data = await response.json();
        return {
          analysis: AI_PROVIDERS.OPENROUTER.extractResponse(data),
          model: model,
          provider: 'OpenRouter',
        };
      } catch (error) {
        console.error(`Error with OpenRouter API (attempt ${retryCount + 1}):`, error);
        lastError = error;

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(r => setTimeout(r, RETRY_DELAY * retryCount));
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to connect to OpenRouter API');
  } catch (error) {
    console.error('Error sending data to OpenRouter:', error);
    throw error;
  }
}

/**
 * 流式发送数据到OpenRouter API
 */
async function streamOpenRouter(
  analysisData,
  apiKey,
  model,
  maxTokens,
  options = {},
  onChunk,
  abortController
) {
  try {
    // 选择模型
    const modelId =
      AI_PROVIDERS.OPENROUTER.models[model] ||
      AI_PROVIDERS.OPENROUTER.models[AI_PROVIDERS.OPENROUTER.defaultModel];

    // 添加语言指令
    const language = options?.language || 'en';
    const languageInstructions =
      language === 'zh'
        ? '请用中文回答，并对以下网络性能数据进行分析。'
        : 'Please respond in English and analyze the following network performance data.';

    // 创建提示和用户消息
    const messages = [
      {
        role: 'system',
        content: `You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues. ${languageInstructions}`,
      },
      {
        role: 'user',
        content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`,
      },
    ];

    // 构建请求体，启用流式传输
    const requestBody = AI_PROVIDERS.OPENROUTER.buildRequest(modelId, messages, maxTokens, true);

    // 获取API端点
    const apiUrl = AiConnectorBase.getApiUrl('OPENROUTER');

    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: AI_PROVIDERS.OPENROUTER.buildHeaders(apiKey),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    // 处理流式响应
    const completeText = await AiConnectorBase.handleStreamResponse(
      response.body,
      onChunk,
      'OPENROUTER',
      abortController
    );

    return {
      analysis: completeText,
      model: model,
      provider: 'OpenRouter',
    };
  } catch (error) {
    console.error('Error in OpenRouter stream:', error);
    throw error;
  }
}

// Export OpenRouter-specific functionality
export const AiOpenRouterConnector = {
  sendToOpenRouter,
  streamOpenRouter,
};
