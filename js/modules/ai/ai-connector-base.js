/**
 * AI-Connector Base - Base functionality for AI providers
 */

import { AiCacheManager } from '../../ai-cache-manager.js';

// AI Model Providers Configuration
export const AI_PROVIDERS = {
  // OpenAI configuration
  OPENAI: {
    name: 'OpenAI',
    models: {
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo'
    },
    defaultModel: 'gpt-4-turbo',
    defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
    proxyUrls: [
      'https://api.openaiapi.com/v1/chat/completions',
      'https://api.aiproxy.io/v1/chat/completions'
    ],
    buildRequest: (model, messages, maxTokens, stream = false) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    extractStreamResponse: (data) => {
      if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
        return data.choices[0].delta.content;
      }
      return "";
    },
    buildHeaders: (apiKey, isProxy = false) => isProxy ? 
      {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      } : 
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
  },
  
  // Anthropic (Claude) configuration
  ANTHROPIC: {
    name: 'Anthropic',
    models: {
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307'
    },
    defaultModel: 'claude-3-sonnet',
    defaultApiUrl: 'https://api.anthropic.com/v1/messages',
    buildRequest: (model, systemPrompt, userContent, maxTokens, stream = false) => ({
      model: model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: maxTokens,
      stream: stream
    }),
    extractResponse: (data) => data.content[0].text,
    extractStreamResponse: (data) => {
      if (data.delta && data.delta.text) {
        return data.delta.text;
      }
      return "";
    },
    buildHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    })
  },
  
  // Deepseek configuration
  DEEPSEEK: {
    name: 'Deepseek',
    models: {
      'deepseek-chat': 'deepseek-chat',
      'deepseek-coder': 'deepseek-coder'
    },
    defaultModel: 'deepseek-chat',
    defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    buildRequest: (model, messages, maxTokens, stream = false) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: stream
    }),
    extractResponse: (data) => data.choices[0].message.content,
    extractStreamResponse: (data) => {
      if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
        return data.choices[0].delta.content;
      }
      return "";
    },
    buildHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    })
  }
};

// 配置常量
export const MAX_RETRIES = 2;
export const RETRY_DELAY = 1000;
export const REQUEST_TIMEOUT = 30000;
export const STREAM_TIMEOUT = 60000; // 流式响应超时时间（60秒）
export const STREAM_CHUNK_TIMEOUT = 10000; // 每个数据块之间的最大超时时间（10秒）

// 存储用户自定义API URL的设置对象
let userApiSettings = {
  // 默认为每个提供商的默认URL
  OPENAI: AI_PROVIDERS.OPENAI.defaultApiUrl,
  ANTHROPIC: AI_PROVIDERS.ANTHROPIC.defaultApiUrl,
  DEEPSEEK: AI_PROVIDERS.DEEPSEEK.defaultApiUrl
};

/**
 * 设置用户自定义API URL
 * @param {string} provider - 提供商标识符 (OPENAI, ANTHROPIC, DEEPSEEK)
 * @param {string} apiUrl - 自定义API URL
 */
function setCustomApiUrl(provider, apiUrl) {
  if (AI_PROVIDERS[provider] && apiUrl) {
    userApiSettings[provider] = apiUrl;
  }
}

/**
 * 获取当前有效的API URL
 * @param {string} provider - 提供商标识符
 * @returns {string} 当前有效的API URL
 */
function getApiUrl(provider) {
  return userApiSettings[provider] || AI_PROVIDERS[provider].defaultApiUrl;
}

/**
 * 创建超时和请求处理
 * @param {string} url - API URL
 * @param {object} options - fetch选项
 * @param {string} endpointName - 端点名称，用于日志
 * @returns {Promise} 响应Promise
 */
async function fetchWithTimeout(url, options, endpointName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API Error (${endpointName}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 格式化网络数据用于AI分析
 * @param {object} requestsData - 请求数据
 * @param {object} statistics - 统计数据
 * @returns {object} 格式化后的摘要数据
 */
function formatNetworkDataForAI(requestsData, statistics) {
  // Create a summarized version of the data to avoid token limit issues
  const summary = {
    statistics: statistics,
    topSlowestRequests: [],
    requestTypes: {},
    statusCodeDistribution: {},
    domainDistribution: {}
  };
  
  // Get all requests as array
  const requests = Object.values(requestsData);
  
  // Count request types
  requests.forEach(req => {
    if (req.type) {
      summary.requestTypes[req.type] = (summary.requestTypes[req.type] || 0) + 1;
    }
    
    // Count status codes
    if (req.status) {
      const statusGroup = Math.floor(req.status / 100) * 100;
      const statusKey = `${statusGroup}-${statusGroup + 99}`;
      summary.statusCodeDistribution[statusKey] = (summary.statusCodeDistribution[statusKey] || 0) + 1;
    }
    
    // Count domains
    if (req.domain) {
      summary.domainDistribution[req.domain] = (summary.domainDistribution[req.domain] || 0) + 1;
    }
  });
  
  // Get top 10 slowest requests
  summary.topSlowestRequests = requests
    .filter(req => req.totalTime)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10)
    .map(req => ({
      url: req.url,
      type: req.type,
      totalTime: req.totalTime,
      status: req.status,
      method: req.method
    }));
  
  return summary;
}

/**
 * 处理流式响应数据
 * @param {ReadableStream} stream - 返回的流数据
 * @param {Function} onChunk - 处理每个数据块的回调
 * @param {string} provider - AI提供商
 * @param {AbortController} [abortController] - 可选的中断控制器
 * @returns {Promise<string>} 完整的响应文本
 */
async function handleStreamResponse(stream, onChunk, provider, abortController) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let completeText = "";
  let lastChunkTime = Date.now();
  
  // 设置整体超时
  const timeoutId = setTimeout(() => {
    if (abortController) {
      console.warn(`Stream response timeout after ${STREAM_TIMEOUT}ms`);
      abortController.abort();
    }
  }, STREAM_TIMEOUT);
  
  try {
    while (true) {
      // 检查数据块间隔超时
      const chunkTimeSinceLastUpdate = Date.now() - lastChunkTime;
      if (chunkTimeSinceLastUpdate > STREAM_CHUNK_TIMEOUT) {
        console.warn(`No data received for ${STREAM_CHUNK_TIMEOUT}ms, aborting stream`);
        if (abortController) abortController.abort();
        throw new Error(`Stream stalled: No data received for ${STREAM_CHUNK_TIMEOUT}ms`);
      }
      
      const { done, value } = await reader.read();
      if (done) break;
      
      // 更新最后数据块时间
      lastChunkTime = Date.now();
      
      // 解码返回的数据
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理数据行（处理SSE格式）
      const lines = chunk.split("\n").filter(line => line.trim() !== "");
      
      for (const line of lines) {
        // 跳过非数据行
        if (!line.startsWith("data:")) continue;
        
        // 提取数据部分
        const dataContent = line.slice(5).trim();
        
        // 如果是 [DONE] 标记，处理结束
        if (dataContent === "[DONE]") continue;
        
        try {
          // 解析JSON数据
          const data = JSON.parse(dataContent);
          
          // 根据不同提供商提取文本内容
          const providerKey = provider.toUpperCase();
          let textChunk = "";
          
          if (AI_PROVIDERS[providerKey]) {
            textChunk = AI_PROVIDERS[providerKey].extractStreamResponse(data);
          }
          
          if (textChunk) {
            completeText += textChunk;
            // 调用回调函数，实时处理返回的数据
            if (onChunk) onChunk(textChunk, completeText);
          }
        } catch (error) {
          console.warn("Error parsing SSE data:", error, dataContent);
        }
      }
    }
  } catch (error) {
    // 如果是中断错误，添加更多上下文
    if (error.name === 'AbortError') {
      error.message = `Stream aborted: ${error.message || 'Request was manually cancelled or timed out'}`;
    }
    
    console.error("Stream reading error:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    reader.releaseLock();
  }
  
  return completeText;
}

// Export base functionality
export const AiConnectorBase = {
  setCustomApiUrl,
  getApiUrl,
  fetchWithTimeout,
  formatNetworkDataForAI,
  handleStreamResponse
};