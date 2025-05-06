/**
 * AI-Connector Base - Base functionality for AI providers
 */

// AI Model Providers Configuration
export const AI_PROVIDERS = {
  // OpenAI configuration
  OPENAI: {
    name: 'OpenAI',
    models: {
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-4': 'gpt-4',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
    },
    defaultModel: 'gpt-4-turbo',
    defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
    proxyUrls: [
      'https://api.openaiapi.com/v1/chat/completions',
      'https://api.aiproxy.io/v1/chat/completions',
    ],
    buildRequest: (model, messages, maxTokens, stream = false) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: stream,
    }),
    extractResponse: data => data.choices[0].message.content,
    extractStreamResponse: data => {
      if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
        return data.choices[0].delta.content;
      }
      return '';
    },
    buildHeaders: (apiKey, isProxy = false) =>
      isProxy
        ? {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
  },

  // Anthropic (Claude) configuration
  ANTHROPIC: {
    name: 'Anthropic',
    models: {
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-sonnet': 'claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
    },
    defaultModel: 'claude-3-sonnet',
    defaultApiUrl: 'https://api.anthropic.com/v1/messages',
    buildRequest: (model, systemPrompt, userContent, maxTokens, stream = false) => ({
      model: model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      max_tokens: maxTokens,
      stream: stream,
    }),
    extractResponse: data => data.content[0].text,
    extractStreamResponse: data => {
      if (data.delta && data.delta.text) {
        return data.delta.text;
      }
      return '';
    },
    buildHeaders: apiKey => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
  },

  // Deepseek configuration
  DEEPSEEK: {
    name: 'Deepseek',
    models: {
      'deepseek-chat': 'deepseek-chat',
      'deepseek-coder': 'deepseek-coder',
    },
    defaultModel: 'deepseek-chat',
    defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    buildRequest: (model, messages, maxTokens, stream = false) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: stream,
    }),
    extractResponse: data => data.choices[0].message.content,
    extractStreamResponse: data => {
      if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
        return data.choices[0].delta.content;
      }
      return '';
    },
    buildHeaders: apiKey => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    }),
  },

  // OpenRouter configuration
  OPENROUTER: {
    name: 'OpenRouter',
    models: {
      'deepseek-chat-v3-0324:free': 'deepseek/deepseek-chat-v3-0324:free',
      'deepseek-r1-zero:free': 'deepseek/deepseek-r1-zero:free',
      'qwen-vl-3b-instruct:free': 'qwen/qwen2.5-vl-3b-instruct:free',
      'qwq-32b-arliai-rpr-v1:free': 'arliai/qwq-32b-arliai-rpr-v1:free',
      'gemini-2.5-pro-exp-03-25:free': 'google/gemini-2.5-pro-exp-03-25:free',
    },
    defaultModel: 'deepseek-chat-v3-0324:free',
    defaultApiKey: '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',
    defaultApiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    buildRequest: (model, messages, maxTokens, stream = false) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: stream,
    }),
    extractResponse: data => data.choices[0].message.content,
    extractStreamResponse: data => {
      if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
        return data.choices[0].delta.content;
      }
      return '';
    },
    buildHeaders: apiKey => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://chrome-network-analyzer.extension',
      'X-Title': 'Chrome Network Analyzer',
    }),
  },
};

// Configuration constants
export const MAX_RETRIES = 2;
export const RETRY_DELAY = 1000;
export const REQUEST_TIMEOUT = 30000;
export const STREAM_TIMEOUT = 60000; // Stream response timeout (60 seconds)
export const STREAM_CHUNK_TIMEOUT = 10000; // Maximum timeout between data chunks (10 seconds)

// Store user-defined API URL settings
let userApiSettings = {
  // Default to the default URL for each provider
  OPENAI: AI_PROVIDERS.OPENAI.defaultApiUrl,
  ANTHROPIC: AI_PROVIDERS.ANTHROPIC.defaultApiUrl,
  DEEPSEEK: AI_PROVIDERS.DEEPSEEK.defaultApiUrl,
  OPENROUTER: AI_PROVIDERS.OPENROUTER.defaultApiUrl,
};

/**
 * Set custom API URL for a provider
 * @param {string} provider - Provider identifier (OPENAI, ANTHROPIC, DEEPSEEK)
 * @param {string} apiUrl - Custom API URL
 */
function setCustomApiUrl(provider, apiUrl) {
  if (AI_PROVIDERS[provider] && apiUrl) {
    userApiSettings[provider] = apiUrl;
  }
}

/**
 * Get the current valid API URL
 * @param {string} provider - Provider identifier
 * @returns {string} Current valid API URL
 */
function getApiUrl(provider) {
  return userApiSettings[provider] || AI_PROVIDERS[provider].defaultApiUrl;
}

/**
 * Create timeout and request handling
 * @param {string} url - API URL
 * @param {object} options - fetch options
 * @param {string} endpointName - Endpoint name, for logging
 * @returns {Promise} Response Promise
 */
async function fetchWithTimeout(url, options, endpointName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new Error(
        `API Error (${endpointName}): ${errorData.error?.message || response.statusText}`
      );
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
    domainDistribution: {},
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
      summary.statusCodeDistribution[statusKey] =
        (summary.statusCodeDistribution[statusKey] || 0) + 1;
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
      method: req.method,
    }));

  return summary;
}

/**
 * Handle stream response data
 * @param {ReadableStream} stream - Returned stream data
 * @param {Function} onChunk - Callback for processing each data chunk
 * @param {string} provider - AI provider
 * @param {AbortController} [abortController] - Optional abort controller
 * @returns {Promise<string>} Complete response text
 */
async function handleStreamResponse(stream, onChunk, provider, abortController) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let completeText = '';
  let lastChunkTime = Date.now();

  // Set overall timeout
  const timeoutId = setTimeout(() => {
    if (abortController) {
      console.warn(`Stream response timeout after ${STREAM_TIMEOUT}ms`);
      abortController.abort();
    }
  }, STREAM_TIMEOUT);

  try {
    let done = false;
    while (!done) {
      // Check for chunk interval timeout
      const chunkTimeSinceLastUpdate = Date.now() - lastChunkTime;
      if (chunkTimeSinceLastUpdate > STREAM_CHUNK_TIMEOUT) {
        console.warn(`No data received for ${STREAM_CHUNK_TIMEOUT}ms, aborting stream`);
        if (abortController) abortController.abort();
        throw new Error(`Stream stalled: No data received for ${STREAM_CHUNK_TIMEOUT}ms`);
      }

      const readResult = await reader.read();
      done = readResult.done;
      const value = readResult.value;

      if (done) break;

      // Update last chunk time
      lastChunkTime = Date.now();

      // Decode returned data
      const chunk = decoder.decode(value, { stream: true });

      // Process data lines (handle SSE format)
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        // Skip non-data lines
        if (!line.startsWith('data:')) continue;

        // Extract data portion
        const dataContent = line.slice(5).trim();

        // If it's a [DONE] marker, processing is done
        if (dataContent === '[DONE]') continue;

        try {
          // Parse JSON data
          const data = JSON.parse(dataContent);

          // Extract text content based on different providers
          const providerKey = provider.toUpperCase();
          let textChunk = '';

          if (AI_PROVIDERS[providerKey]) {
            textChunk = AI_PROVIDERS[providerKey].extractStreamResponse(data);
          }

          if (textChunk) {
            completeText += textChunk;
            // Call callback function to process returned data in real-time
            if (onChunk) onChunk(textChunk, completeText);
          }
        } catch (error) {
          console.warn('Error parsing SSE data:', error, dataContent);
        }
      }
    }
  } catch (error) {
    // If it's an abort error, add more context
    if (error.name === 'AbortError') {
      error.message = `Stream aborted: ${error.message || 'Request was manually cancelled or timed out'}`;
    }

    console.error('Stream reading error:', error);
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
  handleStreamResponse,
};
