/**
 * AI-Connector - Handles sending network analysis data to AI models
 */

// AI Model Providers Configuration
const AI_PROVIDERS = {
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
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 30000;

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
        url: getApiUrl('OPENAI'),
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
          
          const response = await fetchWithTimeout(
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
    const apiUrl = getApiUrl('ANTHROPIC');
    
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`Attempting to use Anthropic API, attempt ${retryCount + 1}`);
        
        const response = await fetchWithTimeout(
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
 * 发送数据到Deepseek API
 * @param {object} analysisData - 网络分析数据
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {number} maxTokens - 最大token数
 * @param {object} options - 附加选项，如语言设置
 * @returns {Promise<object>} 分析结果
 */
async function sendToDeepseek(analysisData, apiKey, model = AI_PROVIDERS.DEEPSEEK.defaultModel, maxTokens = 2000, options = {}) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.DEEPSEEK.models[model] || AI_PROVIDERS.DEEPSEEK.models[AI_PROVIDERS.DEEPSEEK.defaultModel];
    
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
    const requestBody = AI_PROVIDERS.DEEPSEEK.buildRequest(modelId, messages, maxTokens);
    
    // 获取用户配置的API URL
    const apiUrl = getApiUrl('DEEPSEEK');
    
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`Attempting to use Deepseek API, attempt ${retryCount + 1}`);
        
        const response = await fetchWithTimeout(
          apiUrl,
          {
            method: 'POST',
            headers: AI_PROVIDERS.DEEPSEEK.buildHeaders(apiKey),
            body: JSON.stringify(requestBody)
          },
          'Deepseek API'
        );
        
        const data = await response.json();
        return {
          analysis: AI_PROVIDERS.DEEPSEEK.extractResponse(data),
          model: model,
          provider: 'Deepseek'
        };
      } catch (error) {
        console.error(`Error with Deepseek API (attempt ${retryCount + 1}):`, error);
        lastError = error;
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(r => setTimeout(r, RETRY_DELAY * retryCount));
        } else {
          break;
        }
      }
    }
    
    throw lastError || new Error('Failed to connect to Deepseek API');
  } catch (error) {
    console.error('Error sending data to Deepseek:', error);
    throw error;
  }
}

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
      return sendToOpenAI(analysisData, apiKey, model, maxTokens, options);
    case 'ANTHROPIC':
      return sendToAnthropic(analysisData, apiKey, model, maxTokens, options);
    case 'DEEPSEEK':
      return sendToDeepseek(analysisData, apiKey, model, maxTokens, options);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
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

// 新增流式数据处理函数
/**
 * 处理流式响应数据
 * @param {ReadableStream} stream - 返回的流数据
 * @param {Function} onChunk - 处理每个数据块的回调
 * @param {string} provider - AI提供商
 * @returns {Promise<string>} 完整的响应文本
 */
async function handleStreamResponse(stream, onChunk, provider) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let completeText = "";
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
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
    console.error("Stream reading error:", error);
    throw error;
  } finally {
    reader.releaseLock();
  }
  
  return completeText;
}

/**
 * 流式发送数据到OpenAI API
 */
async function streamOpenAI(analysisData, apiKey, model, maxTokens, options = {}, onChunk) {
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
      url: getApiUrl('OPENAI'),
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
    const completeText = await handleStreamResponse(response.body, onChunk, 'OPENAI');
    
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

/**
 * 流式发送数据到Anthropic API
 */
async function streamAnthropic(analysisData, apiKey, model, maxTokens, options = {}, onChunk) {
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
    const apiUrl = getApiUrl('ANTHROPIC');
    
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
    const completeText = await handleStreamResponse(response.body, onChunk, 'ANTHROPIC');
    
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

/**
 * 流式发送数据到Deepseek API
 */
async function streamDeepseek(analysisData, apiKey, model, maxTokens, options = {}, onChunk) {
  try {
    // 选择模型
    const modelId = AI_PROVIDERS.DEEPSEEK.models[model] || AI_PROVIDERS.DEEPSEEK.models[AI_PROVIDERS.DEEPSEEK.defaultModel];
    
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
    const requestBody = AI_PROVIDERS.DEEPSEEK.buildRequest(modelId, messages, maxTokens, true);
    
    // 获取API端点
    const apiUrl = getApiUrl('DEEPSEEK');
    
    // 发送请求
    const response = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: AI_PROVIDERS.DEEPSEEK.buildHeaders(apiKey),
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    // 处理流式响应
    const completeText = await handleStreamResponse(response.body, onChunk, 'DEEPSEEK');
    
    return {
      analysis: completeText,
      model: model,
      provider: 'Deepseek'
    };
  } catch (error) {
    console.error('Error in Deepseek stream:', error);
    throw error;
  }
}

/**
 * 根据提供商以流模式发送数据到指定AI
 * @param {object} analysisData - 网络分析数据
 * @param {string} provider - AI提供商标识
 * @param {string} apiKey - API密钥
 * @param {string} model - 模型名称
 * @param {object} options - 附加选项
 * @param {number} maxTokens - 最大token数
 * @param {Function} onChunk - 处理每个数据块的回调
 * @returns {Promise<object>} 分析结果
 */
async function streamToAI(analysisData, provider, apiKey, model, options = {}, maxTokens = 2000, onChunk) {
  const providerKey = provider.toUpperCase();
  
  switch (providerKey) {
    case 'OPENAI':
      return streamOpenAI(analysisData, apiKey, model, maxTokens, options, onChunk);
    case 'ANTHROPIC':
      return streamAnthropic(analysisData, apiKey, model, maxTokens, options, onChunk);
    case 'DEEPSEEK':
      return streamDeepseek(analysisData, apiKey, model, maxTokens, options, onChunk);
    default:
      throw new Error(`Unsupported AI provider for streaming: ${provider}`);
  }
}

// Export the AI Connector functionality
export const AiConnector = {
  // Core functions
  sendToAI,
  streamToAI,  // 添加新的流式API
  formatNetworkDataForAI,
  setCustomApiUrl,
  
  // Provider-specific functions
  sendToOpenAI,
  sendToAnthropic,
  sendToDeepseek,
  streamOpenAI,  // 添加流式版本的函数
  streamAnthropic,
  streamDeepseek,
  
  // Configuration constants
  AI_PROVIDERS,
  
  // For backward compatibility
  OPENAI_MODELS: AI_PROVIDERS.OPENAI.models,
  ANTHROPIC_MODELS: AI_PROVIDERS.ANTHROPIC.models
}; 