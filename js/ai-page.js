/**
 * AI 分析页面脚本 - 处理独立的AI分析页面功能
 */

// 导入依赖的模块
import { I18n } from './i18n.js';
import './i18n/zh.js';
import './i18n/en.js';
import { AiConnector } from './ai-connector.js';
import { AiAnalysisManager } from './ai-analysis-manager.js';
import { ThemeManager } from './theme-manager.js';
import { StatsManager } from './stats-manager.js';
import { RequestDetailsManager } from './request-details-manager.js';

// 全局变量
let currentTabId = null;
let requestsData = {};

// 初始化国际化
async function initI18n() {
  try {
    await I18n.init();
    console.log('I18n initialized with language:', I18n.getCurrentLanguage());
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
  }
}

// 获取当前标签页ID和网络请求数据
async function initPage() {
  try {
    // 获取URL参数中的tabId
    const urlParams = new URLSearchParams(window.location.search);
    currentTabId = parseInt(urlParams.get('tabId'));
    
    if (!currentTabId) {
      // 如果没有提供tabId，获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0) {
        currentTabId = tabs[0].id;
      } else {
        showError('无法确定要分析的标签页');
        return;
      }
    }
    
    // 获取网络请求数据
    await fetchNetworkData();
    
    // 更新统计信息
    if (StatsManager) {
      // 初始化统计模块
      await StatsManager.init({
        containerId: 'statsContainer',
        getRequestData: () => requestsData
      });
      
      StatsManager.updateStatistics();
    }
    
  } catch (error) {
    console.error('初始化页面时出错:', error);
    showError('初始化页面时出错: ' + error.message);
  }
}

// 从后台脚本获取网络请求数据
async function fetchNetworkData() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getRequestData", tabId: currentTabId },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.requestData) {
          requestsData = response.requestData;
          resolve(requestsData);
        } else {
          reject(new Error('未能获取网络请求数据'));
        }
      }
    );
  });
}

// 运行AI分析
async function runAiAnalysis() {
  // 获取分析元素
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisContent = document.getElementById('analysisContent');
  const analysisText = document.getElementById('analysisText');
  const analysisError = document.getElementById('analysisError');
  
  if (!analysisLoading || !analysisContent || !analysisText || !analysisError) {
    console.error('未找到所需的AI分析元素');
    return;
  }
  
  // 显示加载中，隐藏内容和错误
  analysisLoading.style.display = 'flex';
  analysisText.style.display = 'none';
  analysisError.style.display = 'none';
  
  // 检查是否有请求数据
  if (Object.keys(requestsData).length === 0) {
    try {
      // 尝试重新获取数据
      await fetchNetworkData();
    } catch (error) {
      showError('没有可用的请求数据进行分析');
      analysisLoading.style.display = 'none';
      return;
    }
  }
  
  // 如果仍然没有数据，显示错误
  if (Object.keys(requestsData).length === 0) {
    showError('没有可用的请求数据进行分析');
    analysisLoading.style.display = 'none';
    return;
  }
  
  // 计算统计数据
  const statistics = calculateStatistics(requestsData);
  
  try {
    // 获取API配置
    const config = await new Promise((resolve) => {
      chrome.storage.local.get(['aiModel', 'aiApiKey'], (result) => {
        resolve({
          provider: 'openai',
          apiKey: result.aiApiKey || '',
          model: result.aiModel || 'gpt-4-turbo'
        });
      });
    });
    
    // 检查API密钥是否配置
    if (!config.apiKey) {
      showError('未配置API密钥。请在选项页面中配置API密钥。');
      analysisLoading.style.display = 'none';
      return;
    }
    
    // 格式化数据
    const analysisData = AiConnector.formatNetworkDataForAI(requestsData, statistics);
    
    // 发送到AI提供商
    const result = await AiConnector.sendToAI(
      analysisData, 
      config.provider, 
      config.apiKey, 
      config.model
    );
    
    // 显示分析结果
    displayAnalysisResult(result);
    
  } catch (error) {
    showError(`AI分析过程中出错: ${error.message}`);
    analysisLoading.style.display = 'none';
  }
}

// 计算统计数据
function calculateStatistics(requestsData) {
  const requests = Object.values(requestsData);
  
  // 过滤有效请求
  const validRequests = requests.filter(req => req.totalTime);
  
  // 如果没有有效请求，返回空统计
  if (validRequests.length === 0) {
    return {
      totalRequests: 0,
      averageLoadTime: 0,
      p95LoadTime: 0,
      errorRate: 0
    };
  }
  
  // 计算总加载时间
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  
  // 计算平均加载时间
  const averageLoadTime = totalLoadTime / validRequests.length;
  
  // 计算错误率
  const errorCount = requests.filter(req => req.error || (req.status && req.status >= 400)).length;
  const errorRate = (errorCount / requests.length) * 100;
  
  // 计算百分位数
  const times = validRequests.map(req => req.totalTime).sort((a, b) => a - b);
  const index = Math.floor(times.length * 0.95);
  const p95LoadTime = times[index] || 0;
  
  return {
    totalRequests: requests.length,
    averageLoadTime,
    p95LoadTime,
    errorRate
  };
}

// 显示分析结果
function displayAnalysisResult(result) {
  // 获取元素
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisText = document.getElementById('analysisText');
  const analysisModel = document.getElementById('analysisModel');
  const analysisProvider = document.getElementById('analysisProvider');
  
  if (!analysisLoading || !analysisText || !analysisModel || !analysisProvider) {
    console.error('未找到所需的AI分析元素');
    return;
  }
  
  // 隐藏加载中，显示内容
  analysisLoading.style.display = 'none';
  analysisText.style.display = 'block';
  
  // 设置分析文本
  analysisText.innerHTML = formatAnalysisText(result.analysis);
  
  // 设置模型和提供商信息
  analysisModel.textContent = result.model || '未知模型';
  analysisProvider.textContent = result.provider || '未知提供商';
}

// 使用类似Markdown的格式格式化分析文本
function formatAnalysisText(text) {
  if (!text) return '';
  
  // 转换换行符为HTML换行
  let formatted = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
  
  // 转换标题
  formatted = formatted.replace(/#{3,6} (.+?)(?:<br>|$)/g, '<h4>$1</h4>');
  formatted = formatted.replace(/## (.+?)(?:<br>|$)/g, '<h3>$1</h3>');
  formatted = formatted.replace(/# (.+?)(?:<br>|$)/g, '<h2>$1</h2>');
  
  // 转换粗体文本
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // 转换斜体文本
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 转换列表
  formatted = formatted.replace(/- (.+?)(?:<br>|$)/g, '• $1<br>');
  
  return formatted;
}

// 显示错误信息
function showError(message) {
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisText = document.getElementById('analysisText');
  const analysisError = document.getElementById('analysisError');
  const analysisErrorText = document.getElementById('analysisErrorText');
  
  if (!analysisLoading || !analysisText || !analysisError || !analysisErrorText) {
    console.error('未找到所需的AI分析元素');
    return;
  }
  
  // 隐藏加载和内容，显示错误
  analysisLoading.style.display = 'none';
  analysisText.style.display = 'none';
  analysisError.style.display = 'block';
  
  // 设置错误信息
  analysisErrorText.textContent = message;
}

// 复制分析结果到剪贴板
function copyAnalysisResults() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.textContent) {
    showError('没有可复制的分析结果');
    return;
  }
  
  navigator.clipboard.writeText(analysisText.textContent)
    .then(() => {
      const copyBtn = document.getElementById('copyAnalysisBtn');
      if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
          <span>已复制!</span>
        `;
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    })
    .catch(err => {
      console.error('复制分析结果失败:', err);
      showError('复制分析结果失败: ' + err.message);
    });
}

// 设置事件处理程序
function setupEventHandlers() {
  // 返回主页按钮
  const backToMainBtn = document.getElementById('backToMain');
  if (backToMainBtn) {
    backToMainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.close(); // 关闭当前标签页
    });
  }
  
  // 运行分析按钮
  const runAiAnalysisBtn = document.getElementById('runAiAnalysisBtn');
  if (runAiAnalysisBtn) {
    runAiAnalysisBtn.addEventListener('click', runAiAnalysis);
  }
  
  // 复制结果按钮
  const copyAnalysisBtn = document.getElementById('copyAnalysisBtn');
  if (copyAnalysisBtn) {
    copyAnalysisBtn.addEventListener('click', copyAnalysisResults);
  }
  
  // 打开设置页面
  const openOptionsPage = document.getElementById('openOptionsPage');
  if (openOptionsPage) {
    openOptionsPage.addEventListener('click', (e) => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      }
    });
  }
}

// 初始化页面
async function init() {
  try {
    console.log('Initializing AI analysis page...');
    
    // 初始化主题管理器
    ThemeManager.init();
    
    // 初始化国际化
    await initI18n();
    
    // 初始化页面数据
    await initPage();
    
    // 设置事件处理程序
    setupEventHandlers();
    
    // 如果有请求数据，自动运行分析
    if (Object.keys(requestsData).length > 0) {
      runAiAnalysis();
    }
  } catch (error) {
    console.error('初始化AI分析页面时出错:', error);
    showError('初始化AI分析页面时出错: ' + error.message);
  }
}

// 在DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', init);