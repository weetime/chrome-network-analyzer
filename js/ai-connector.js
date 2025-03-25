/**
 * AI-Connector - Handles sending network analysis data to AI models
 */

// OpenAI API configuration
const OPENAI_MODELS = {
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-4': 'gpt-4',
  'gpt-3.5-turbo': 'gpt-3.5-turbo'
};

// Anthropic API configuration 
const ANTHROPIC_MODELS = {
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-sonnet': 'claude-3-sonnet-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307'
};

// Send network analysis data to OpenAI's API
async function sendToOpenAI(analysisData, apiKey, model = 'gpt-4-turbo', maxTokens = 2000) {
  try {
    // Choose model
    const modelId = OPENAI_MODELS[model] || OPENAI_MODELS['gpt-4-turbo'];
    
    // Create system prompt and user message from network data
    const messages = [
      {
        role: 'system',
        content: 'You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues.'
      },
      {
        role: 'user',
        content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`
      }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return {
      analysis: data.choices[0].message.content,
      model: model,
      provider: 'OpenAI'
    };
  } catch (error) {
    console.error('Error sending data to OpenAI:', error);
    throw error;
  }
}

// Send network analysis data to Anthropic's API (Claude)
async function sendToAnthropic(analysisData, apiKey, model = 'claude-3-sonnet', maxTokens = 2000) {
  try {
    // Choose model
    const modelId = ANTHROPIC_MODELS[model] || ANTHROPIC_MODELS['claude-3-sonnet'];
    
    // Format the message for Claude API
    const systemPrompt = 'You are a network performance analysis expert. Analyze the following web performance data and provide insights, recommendations for improvement, and identify critical performance issues.';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelId,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Please analyze this network performance data from Chrome Network Analyzer:\n\n${JSON.stringify(analysisData, null, 2)}`
          }
        ],
        max_tokens: maxTokens
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return {
      analysis: data.content[0].text,
      model: model,
      provider: 'Anthropic'
    };
  } catch (error) {
    console.error('Error sending data to Anthropic:', error);
    throw error;
  }
}

// Generic function to send data to specified AI provider
async function sendToAI(analysisData, provider, apiKey, model, maxTokens = 2000) {
  if (provider.toLowerCase() === 'openai') {
    return sendToOpenAI(analysisData, apiKey, model, maxTokens);
  } else if (provider.toLowerCase() === 'anthropic') {
    return sendToAnthropic(analysisData, apiKey, model, maxTokens);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Format network data for AI analysis
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

// Make functions available globally using a self-executing function
(function(global) {
  global.AiConnector = {
    sendToAI,
    sendToOpenAI,
    sendToAnthropic,
    formatNetworkDataForAI,
    OPENAI_MODELS,
    ANTHROPIC_MODELS
  };
})(typeof window !== 'undefined' ? window : self); 