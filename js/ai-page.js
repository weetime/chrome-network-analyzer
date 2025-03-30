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
import { ToastManager } from './toast-manager.js';

// 全局变量
let currentTabId = null;
let requestsData = {};

/**
 * 核心功能：数据获取与分析
 */

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

// 获取并更新当前标签页信息
async function updateTabInfo(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      const domainElement = document.getElementById('currentDomain');
      const urlElement = document.getElementById('domainUrl');
      
      if (domainElement) domainElement.textContent = domain;
      if (urlElement) urlElement.textContent = tab.url;
    }
  } catch (error) {
    console.error('获取标签页信息出错:', error);
  }
}

// 更新数据概览区域
function updateDataOverview(requestsData) {
  const requests = Object.values(requestsData);
  
  // 更新请求计数
  updateElementText('requestsCount', '.highlight-text', requests.length);
  updateElementText('totalRequestsValue', null, requests.length);
  updateElementText('totalRequestsValue2', null, requests.length);
  
  // 计算性能指标
  const validRequests = requests.filter(req => req.totalTime);
  if (validRequests.length === 0) return;
  
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  const avgResponseTime = totalLoadTime / validRequests.length;
  const slowestRequest = validRequests.reduce((prev, current) => 
    (prev.totalTime > current.totalTime) ? prev : current, { totalTime: 0 });
  
  // 更新UI
  updateElementText('totalLoadTimeValue', null, totalLoadTime > 0 ? `${Math.round(totalLoadTime)}ms` : '--');
  updateElementText('avgResponseTimeValue', null, avgResponseTime > 0 ? `${Math.round(avgResponseTime)}ms` : '--');
  updateElementText('slowestRequestValue', null, slowestRequest.totalTime > 0 ? `${Math.round(slowestRequest.totalTime)}ms` : '--');
}

// 辅助函数：更新元素文本
function updateElementText(id, selector, value) {
  const element = document.getElementById(id);
  if (!element) return;
  
  if (selector) {
    const targetElement = element.querySelector(selector);
    if (targetElement) targetElement.textContent = value;
  } else {
    element.textContent = value;
  }
}

// 计算统计数据
function calculateStatistics(requestsData) {
  const requests = Object.values(requestsData);
  const validRequests = requests.filter(req => req.totalTime);
  
  // 如果没有有效请求，返回空统计
  if (validRequests.length === 0) {
    return {
      totalRequests: requests.length,
      averageLoadTime: 0,
      p95LoadTime: 0,
      errorRate: 0
    };
  }
  
  // 计算关键指标
  const totalLoadTime = validRequests.reduce((sum, req) => sum + req.totalTime, 0);
  const averageLoadTime = totalLoadTime / validRequests.length;
  const errorCount = requests.filter(req => req.error || (req.status && req.status >= 400)).length;
  const errorRate = (errorCount / requests.length) * 100;
  
  // 计算p95响应时间
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

/**
 * AI分析功能
 */

// 运行AI分析
async function runAiAnalysis() {
  // 获取分析元素
  const elements = {
    loading: document.getElementById('analysisLoading'),
    content: document.getElementById('analysisContent'),
    text: document.getElementById('analysisText'),
    error: document.getElementById('analysisError'),
    progress: document.getElementById('analysisProgress'),
    progressBar: document.getElementById('analysisProgressBar'),
    progressText: document.getElementById('analysisProgressText')
  };
  
  if (!elements.loading || !elements.content || !elements.text || !elements.error) {
    console.error('未找到所需的AI分析元素');
    return;
  }
  
  // 重置并显示进度条，隐藏内容和错误
  elements.progressBar.style.width = '0%';
  elements.progressText.textContent = I18n.getText('analysisStarting') || '开始分析...';
  elements.loading.style.display = 'flex';
  elements.progress.style.display = 'block';
  elements.text.style.display = 'block'; // 使文本元素可见，以便流式显示结果
  elements.text.innerHTML = '<div class="stream-cursor"></div>'; // 添加一个闪烁光标
  elements.error.style.display = 'none';
  
  // 模拟数据加载进度
  updateProgress(10, elements, I18n.getText('dataLoading') || '加载数据...');
  
  // 确保有请求数据
  if (Object.keys(requestsData).length === 0) {
    try {
      await fetchNetworkData();
      if (currentTabId) await updateTabInfo(currentTabId);
      updateDataOverview(requestsData);
    } catch (error) {
      showNoDataError(elements);
      return;
    }
  }
  
  // 如果仍然没有数据，显示错误
  if (Object.keys(requestsData).length === 0) {
    showNoDataError(elements);
    return;
  }
  
  updateProgress(20, elements, I18n.getText('calculatingStats') || '计算统计数据...');
  
  // 计算统计数据
  const statistics = calculateStatistics(requestsData);
  
  try {
    updateProgress(30, elements, I18n.getText('loadingAiConfig') || '加载AI配置...');
    
    // 获取AI配置
    const config = await getAIConfig();
    
    // 检查API密钥是否配置
    if (!config.apiKey) {
      showAnalysisError('未配置API密钥。请在选项页面中配置API密钥。', elements);
      ToastManager.showError(I18n.getText('noApiKeyConfigured') || '未配置API密钥。请在选项页面中配置API密钥。');
      elements.loading.style.display = 'none';
      elements.progress.style.display = 'none';
      return;
    }
    
    updateProgress(40, elements, I18n.getText('preparingData') || '准备分析数据...');
    
    // 更新UI显示AI提供商和模型
    updateAIProviderDisplay(config);
    
    // 格式化数据并准备发送到AI
    const analysisData = AiConnector.formatNetworkDataForAI(requestsData, statistics);
    const currentLanguage = I18n.getCurrentLanguage();
    
    updateProgress(50, elements, I18n.getText('connectingAi') || '连接到AI服务...');
    
    // 创建一个变量跟踪生成进度
    let generationProgress = 0;
    const startGenerationPercent = 60;
    const endGenerationPercent = 95;
    
    // 使用流式API，定义处理每个数据块的回调函数
    const onChunkReceived = (chunk, fullText) => {
      // 更新生成进度
      generationProgress = Math.min(generationProgress + 1, 100);
      const progressPercent = startGenerationPercent + 
        (generationProgress / 100) * (endGenerationPercent - startGenerationPercent);
      
      updateProgress(
        progressPercent, 
        elements, 
        I18n.getText('generatingAnalysis') || '生成分析报告...'
      );
      
      // 格式化并追加新的文本块
      const formattedChunk = formatAnalysisText(chunk);
      
      // 更新显示（替换最后的光标元素）
      elements.text.innerHTML = formatAnalysisText(fullText) + '<div class="stream-cursor"></div>';
      
      // 当内容增加时，滚动到底部以便用户看到最新内容
      elements.content.scrollTop = elements.content.scrollHeight;
    };
    
    // 使用流式API发送请求
    const result = await AiConnector.streamToAI(
      analysisData,
      config.provider,
      config.apiKey,
      config.model,
      {language: currentLanguage},
      2000, // 最大tokens
      onChunkReceived // 回调函数
    );
    
    // 流式处理完成后，确保完整显示最终结果
    elements.text.innerHTML = formatAnalysisText(result.analysis);
    
    // 设置结果的提供商和模型信息
    updateProviderModelInfo(result, config);
    
    // 完成进度
    updateProgress(100, elements, I18n.getText('analysisComplete') || '分析完成');
    
    // 隐藏进度条和加载区域
    setTimeout(() => {
      elements.loading.style.display = 'none';
      elements.progress.style.display = 'none';
    }, 500);
    
  } catch (error) {
    showAnalysisError(`AI分析过程中出错: ${error.message}`, elements);
    ToastManager.showError(`${I18n.getText('aiAnalysisError') || 'AI分析过程中出错'}: ${error.message}`);
    elements.loading.style.display = 'none';
    elements.progress.style.display = 'none';
  }
}

// 获取AI配置
async function getAIConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aiProvider', 'aiModel', 'apiKey', 'apiUrl', 'openaiApiKey'], (result) => {
      const config = {
        provider: result.aiProvider || 'openai',
        apiKey: result.apiKey || result.openaiApiKey || '',
        model: result.aiModel || 'gpt-4-turbo',
        apiUrl: result.apiUrl || ''
      };
      resolve(config);
    });
  });
}

// 显示无数据错误
function showNoDataError(elements) {
  const noDataMsg = I18n.getText('noDataAvailable') || '没有可用的请求数据进行分析';
  showAnalysisError(noDataMsg, elements);
  ToastManager.showError(noDataMsg);
  elements.loading.style.display = 'none';
}

// 更新提供商和模型信息
function updateProviderModelInfo(result, config) {
  // 处理provider信息
  let provider = result.provider || '未知提供商';
  if (provider.includes('(')) {
    provider = provider.split('(')[0].trim();
  }
  
  // 优先使用用户配置
  if (config && config.provider) {
    provider = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
  }
  
  const model = config && config.model ? config.model : (result.model || '未知模型');
  
  // 设置模型和提供商信息
  updateElementText('analysisModel', null, model);
  updateElementText('analysisProvider', null, provider);
}

// 显示分析结果（保留兼容性，但流式API会直接更新内容）
function displayAnalysisResult(result, config, elements) {
  // 隐藏加载中，显示内容
  elements.loading.style.display = 'none';
  elements.text.style.display = 'block';
  
  // 设置分析文本
  elements.text.innerHTML = formatAnalysisText(result.analysis);
  
  // 更新提供商和模型信息
  updateProviderModelInfo(result, config);
}

// 显示错误信息
function showAnalysisError(message, elements) {
  if (!elements) {
    elements = {
      loading: document.getElementById('analysisLoading'),
      text: document.getElementById('analysisText'),
      error: document.getElementById('analysisError'),
      errorText: document.getElementById('analysisErrorText')
    };
  }
  
  if (!elements.loading || !elements.text || !elements.error || !elements.errorText) {
    console.error('未找到所需的AI分析元素');
    return;
  }
  
  // 隐藏加载和内容，显示错误
  elements.loading.style.display = 'none';
  elements.text.style.display = 'none';
  elements.error.style.display = 'block';
  
  // 设置错误信息
  elements.errorText.textContent = message;
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
  
  // 转换格式化文本
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 转换列表
  formatted = formatted.replace(/- (.+?)(?:<br>|$)/g, '• $1<br>');
  
  return formatted;
}

/**
 * 导出功能
 */

// 复制分析结果到剪贴板
function copyAnalysisResults() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.textContent) {
    ToastManager.showError(I18n.getText('noCopyContent') || '没有可复制的分析结果');
    return;
  }
  
  navigator.clipboard.writeText(analysisText.textContent)
    .then(() => {
      ToastManager.success(I18n.getText('copySuccess') || '已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制分析结果失败:', err);
      ToastManager.showError(`${I18n.getText('copyFailed') || '复制失败'}: ${err.message}`);
    });
}

// 下载分析报告和数据
function downloadReport() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.textContent) {
    ToastManager.showError(I18n.getText('downloadFailed') || '下载失败: 没有可下载的分析报告');
    return;
  }
  
  try {
    // 获取域名和时间信息
    const domainName = document.getElementById('currentDomain')?.textContent || 'unknown-domain';
    const currentDate = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // 创建下载选项菜单
    const dropdown = createDownloadDropdown();
    
    // 添加到页面并定位在按钮下方
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
      positionDropdown(dropdown, downloadBtn);
      setupDownloadListeners(dropdown, analysisText, domainName, currentDate);
    }
  } catch (error) {
    console.error('下载功能出错:', error);
    ToastManager.showError(`${I18n.getText('downloadFailed') || '下载失败'}: ${error.message}`);
  }
}

// 创建下载选项菜单
function createDownloadDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'download-dropdown';
  dropdown.innerHTML = `
    <div class="download-dropdown-content">
      <div class="download-header">${I18n.getText('downloadOptions') || '下载选项'}</div>
      <a href="#" id="downloadReportOnly">${I18n.getText('downloadReportOnly').replace('TXT', 'MD') || '仅下载报告 (MD)'}</a>
      <a href="#" id="downloadDataJSON">${I18n.getText('downloadDataJSON') || '数据 (JSON)'}</a>
      <a href="#" id="downloadDataCSV">${I18n.getText('downloadDataCSV') || '数据 (CSV)'}</a>
      <a href="#" id="downloadAll">${I18n.getText('downloadAll') || '全部下载'}</a>
    </div>
  `;
  return dropdown;
}

// 定位下拉菜单
function positionDropdown(dropdown, anchor) {
  const rect = anchor.getBoundingClientRect();
  dropdown.style.position = 'absolute';
  dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  document.body.appendChild(dropdown);
}

// 设置下载按钮监听器
function setupDownloadListeners(dropdown, analysisText, domainName, currentDate) {
  // 点击其他地方关闭下拉菜单
  document.addEventListener('click', closeDropdownOnOutsideClick);
  
  // 防止点击下拉菜单本身时关闭
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // 下载报告按钮
  document.getElementById('downloadReportOnly').addEventListener('click', (e) => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(markdownText, `${I18n.getText('reportFileName') || '网络分析报告'}-${domainName}-${currentDate}.md`);
    closeDropdown();
  });
  
  // 下载JSON数据按钮
  document.getElementById('downloadDataJSON').addEventListener('click', (e) => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(requestsData, `${I18n.getText('dataFileName') || '网络请求数据'}-${domainName}-${currentDate}.json`);
    } else {
      ToastManager.showError(I18n.getText('noDataAvailable') || '没有可用的请求数据');
    }
    closeDropdown();
  });
  
  // 下载CSV数据按钮
  document.getElementById('downloadDataCSV').addEventListener('click', (e) => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName') || '网络请求数据'}-${domainName}-${currentDate}.csv`);
    } else {
      ToastManager.showError(I18n.getText('noDataAvailable') || '没有可用的请求数据');
    }
    closeDropdown();
  });
  
  // 下载全部按钮
  document.getElementById('downloadAll').addEventListener('click', (e) => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(markdownText, `${I18n.getText('reportFileName') || '网络分析报告'}-${domainName}-${currentDate}.md`);
    
    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(requestsData, `${I18n.getText('dataFileName') || '网络请求数据'}-${domainName}-${currentDate}.json`);
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName') || '网络请求数据'}-${domainName}-${currentDate}.csv`);
    }
    closeDropdown();
  });
  
  // 关闭下拉菜单函数
  function closeDropdown() {
    const dropdown = document.querySelector('.download-dropdown');
    if (dropdown) {
      document.body.removeChild(dropdown);
      document.removeEventListener('click', closeDropdownOnOutsideClick);
    }
  }
  
  // 点击外部区域关闭下拉菜单
  function closeDropdownOnOutsideClick(e) {
    if (!e.target.closest('#downloadReportBtn')) {
      closeDropdown();
    }
  }
}

// 下载文件相关函数
function downloadTextFile(text, filename) {
  downloadFile(new Blob([text], {type: 'text/plain'}), filename);
}

function downloadJsonFile(data, filename) {
  downloadFile(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}), filename);
}

function downloadMarkdownFile(text, filename) {
  downloadFile(new Blob([text], {type: 'text/markdown'}), filename);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  ToastManager.success(`${I18n.getText('downloadSuccess') || '下载成功'}: ${filename}`);
}

// 将HTML格式转换回Markdown
function convertHtmlToMarkdown(html) {
  if (!html) return '';
  
  let markdown = html;
  
  // 替换HTML标签为Markdown格式
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '# $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '## $1\n\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '### $1\n\n');
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  
  // 替换列表项
  markdown = markdown.replace(/• (.*?)<br>/g, '- $1\n');
  
  // 替换换行
  markdown = markdown.replace(/<br>/g, '\n');
  
  // 清理可能的HTML实体
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  
  return markdown;
}

// 将请求数据转换为CSV格式
function convertRequestsToCSV(requestsData) {
  const requests = Object.values(requestsData);
  if (requests.length === 0) return '';
  
  // CSV头部
  const headers = [
    'URL', 'Type', 'Method', 'Status', 
    'Total Time (ms)', 'TTFB (ms)', 'Domain',
    'Transferred Size (bytes)', 'Content Size (bytes)',
    'Protocol', 'Priority', 'Cache Control'
  ];
  
  // 创建CSV内容
  let csvContent = headers.join(',') + '\n';
  
  // 转义CSV字段
  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // 添加每个请求的行
  requests.forEach(req => {
    const row = [
      escapeCSV(req.url),
      escapeCSV(req.type),
      escapeCSV(req.method),
      escapeCSV(req.status),
      escapeCSV(req.totalTime),
      escapeCSV(req.ttfb),
      escapeCSV(req.domain),
      escapeCSV(req.transferSize),
      escapeCSV(req.contentSize),
      escapeCSV(req.protocol),
      escapeCSV(req.priority),
      escapeCSV(req.cacheControl)
    ];
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * 初始化和设置
 */

// 更新AI提供商和模型显示
function updateAIProviderDisplay(config) {
  const analysisProvider = document.getElementById('analysisProvider');
  const analysisModel = document.getElementById('analysisModel');
  
  if (analysisProvider && analysisModel) {
    const providerName = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
    analysisProvider.textContent = providerName;
    analysisModel.textContent = config.model;
  }
}

// 初始化AI提供商和模型显示
async function initAIProviderDisplay() {
  try {
    const config = await getAIConfig();
    updateAIProviderDisplay(config);
  } catch (error) {
    console.error('初始化AI提供商显示出错:', error);
  }
}

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
        console.error('无法确定要分析的标签页');
        return;
      }
    }
    
    // 获取当前标签页信息以显示域名
    if (currentTabId) {
      await updateTabInfo(currentTabId);
    }
    
    // 获取网络请求数据
    await fetchNetworkData();
    
    // 更新数据概览
    updateDataOverview(requestsData);
    
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
    ToastManager.showError('初始化页面时出错: ' + error.message);
  }
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
  
  // 下载报告和数据按钮
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', downloadReport);
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
    
    // 初始化AI提供商显示
    await initAIProviderDisplay();
    
    // 初始化标签页选择器
    await initTabSelector();
    
    // 初始化页面数据
    await initPage();
    
    // 设置事件处理程序
    setupEventHandlers();
    
    console.log('AI分析页面初始化完成，等待用户点击运行分析');
  } catch (error) {
    console.error('初始化AI分析页面时出错:', error);
    ToastManager.showError(`${I18n.getText('initPageError') || '初始化AI分析页面时出错'}: ${error.message}`);
  }
}

// 在DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', init);

// 更新进度条
function updateProgress(percent, elements, statusText) {
  if (!elements.progressBar || !elements.progressText) return;
  
  elements.progressBar.style.width = `${percent}%`;
  elements.progressText.textContent = statusText;
  
  // 如果进度接近完成，改变进度条颜色
  if (percent >= 90) {
    elements.progressBar.classList.add('progress-complete');
  } else {
    elements.progressBar.classList.remove('progress-complete');
  }
}

// 获取并加载指定标签页数据
async function loadTabData(tabId) {
  try {
    // 更新当前标签页ID
    currentTabId = tabId;
    
    // 获取标签页信息并显示域名
    await updateTabInfo(tabId);
    
    // 获取网络请求数据
    await fetchNetworkData();
    
    // 更新数据概览
    updateDataOverview(requestsData);
    
    // 更新统计信息
    if (StatsManager) {
      StatsManager.updateStatistics();
    }
    
    // 显示成功消息
    ToastManager.success(I18n.getText('tabDataLoaded') || '已加载标签页数据');
    
    return true;
  } catch (error) {
    console.error('加载标签页数据出错:', error);
    ToastManager.showError(`${I18n.getText('tabDataLoadError') || '加载标签页数据出错'}: ${error.message}`);
    return false;
  }
}

// 初始化标签页选择器
async function initTabSelector() {
  const tabSelector = document.getElementById('tabSelector');
  if (!tabSelector) return;
  
  try {
    // 获取所有标签页
    const tabs = await chrome.tabs.query({});
    
    // 清空现有选项
    tabSelector.innerHTML = '';
    
    // 添加当前选项
    const currentOption = document.createElement('option');
    currentOption.value = 'current';
    currentOption.textContent = I18n.getText('currentTab') || '当前标签页';
    tabSelector.appendChild(currentOption);
    
    // 添加其他标签页选项
    tabs.forEach(tab => {
      // 忽略当前页面
      if (tab.id === chrome.devtools?.inspectedWindow?.tabId) return;
      
      const option = document.createElement('option');
      option.value = tab.id;
      
      // 获取显示名称 (使用域名或标题的一部分)
      let displayName = '';
      try {
        const url = new URL(tab.url);
        displayName = url.hostname;
      } catch (e) {
        // 如果URL解析失败，使用标题
        displayName = tab.title || `Tab ${tab.id}`;
      }
      
      // 截取标题长度
      const title = tab.title && tab.title.length > 30 
        ? tab.title.substring(0, 27) + '...'
        : (tab.title || 'Unknown');
      
      option.textContent = `${displayName} - ${title}`;
      tabSelector.appendChild(option);
    });
    
    // 监听选择变化事件
    tabSelector.addEventListener('change', async (e) => {
      const selectedTabId = e.target.value;
      
      if (selectedTabId === 'current') {
        // 获取当前活动标签页
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs && activeTabs.length > 0) {
          await loadTabData(activeTabs[0].id);
        }
      } else {
        // 加载选中的标签页数据
        await loadTabData(parseInt(selectedTabId));
      }
    });
    
  } catch (error) {
    console.error('初始化标签页选择器出错:', error);
  }
}