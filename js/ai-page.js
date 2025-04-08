/**
 * AI 分析页面脚本 - 处理独立的AI分析页面功能
 */

// ================ 导入依赖模块 ================
import { I18n } from './i18n.js';
import './i18n/zh.js';
import './i18n/en.js';
import { AiConnector } from './ai-connector.js';
import { AiAnalysisManager } from './ai-analysis-manager.js';
import { ThemeManager } from './theme-manager.js';
import { StatsManager } from './stats-manager.js';
import { RequestDetailsManager } from './request-details-manager.js';
import { ToastManager } from './toast-manager.js';

// ================ 全局变量 ================
let currentTabId = null;
let requestsData = {};

/**
 * 核心功能：数据获取与分析
 */

// ================ 页面数据初始化 ================
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

// ================ 数据获取与处理 ================
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
      const urlElement = document.getElementById('domainUrl');
      
      if (urlElement) urlElement.textContent = tab.url;
    }
  } catch (error) {
    console.error('获取标签页信息出错:', error);
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
    ToastManager.success(I18n.getText('tabDataLoaded'));
    
    return true;
  } catch (error) {
    console.error('加载标签页数据出错:', error);
    ToastManager.showError(`${I18n.getText('tabDataLoadError')}: ${error.message}`);
    return false;
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

/**
 * AI分析功能
 */

// ================ AI分析功能 ================
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
  
  // 重置UI状态
  resetAnalysisUI(elements);
  
  // 确保有请求数据
  if (!await ensureRequestData(elements)) {
    return;
  }
  
  updateProgress(20, elements, I18n.getText('calculatingStats'));
  
  // 计算统计数据
  const statistics = calculateStatistics(requestsData);
  
  try {
    // 获取AI配置并检查
    updateProgress(30, elements, I18n.getText('loadingAiConfig'));
    const config = await getAIConfig();
    
    if (!validateAIConfig(config, elements)) {
      return;
    }
    
    // 准备分析数据
    updateProgress(40, elements, I18n.getText('preparingData'));
    updateAIProviderDisplay(config);
    
    // 发送AI请求并处理结果
    await processAIAnalysis(requestsData, statistics, config, elements);
    
  } catch (error) {
    handleAnalysisError(error, elements);
  }
}

// 重置分析UI状态
function resetAnalysisUI(elements) {
  elements.progressBar.style.width = '0%';
  elements.progressText.textContent = I18n.getText('analysisStarting');
  elements.loading.style.display = 'block';
  elements.progress.style.display = 'block';
  elements.text.style.display = 'block'; // 使文本元素可见，以便流式显示结果
  elements.text.innerHTML = '<div class="stream-cursor"></div>'; // 添加一个闪烁光标
  elements.error.style.display = 'none';
  
  // 模拟数据加载进度
  updateProgress(10, elements, I18n.getText('dataLoading'));
}

// 确保有请求数据
async function ensureRequestData(elements) {
  if (Object.keys(requestsData).length === 0) {
    try {
      await fetchNetworkData();
      if (currentTabId) await updateTabInfo(currentTabId);
      updateDataOverview(requestsData);
    } catch (error) {
      showNoDataError(elements);
      return false;
    }
  }
  
  // 如果仍然没有数据，显示错误
  if (Object.keys(requestsData).length === 0) {
    showNoDataError(elements);
    return false;
  }
  
  return true;
}

// 验证AI配置
function validateAIConfig(config, elements) {
  if (!config.apiKey) {
    const errorMsg = I18n.getText('noApiKeyConfigured');
    showAnalysisError(errorMsg, elements);
    ToastManager.showError(errorMsg);
    elements.loading.style.display = 'none';
    elements.progress.style.display = 'none';
    return false;
  }
  return true;
}

// 处理AI分析过程
async function processAIAnalysis(requestsData, statistics, config, elements) {
  // 连接到AI服务
  updateProgress(50, elements, I18n.getText('connectingAi'));
  
  // 格式化数据并准备发送到AI
  const analysisData = AiConnector.formatNetworkDataForAI(requestsData, statistics);
  const currentLanguage = I18n.getCurrentLanguage();
  
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
      I18n.getText('generatingAnalysis')
    );
    
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
  updateProgress(100, elements, I18n.getText('analysisComplete'));
  
  // 隐藏进度条和加载区域
  setTimeout(() => {
    elements.loading.style.display = 'none';
    elements.progress.style.display = 'none';
  }, 500);
}

// 处理分析错误
function handleAnalysisError(error, elements) {
  showAnalysisError(`AI分析过程中出错: ${error.message}`, elements);
  ToastManager.showError(`${I18n.getText('aiAnalysisError')}: ${error.message}`);
  elements.loading.style.display = 'none';
  elements.progress.style.display = 'none';
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
  const noDataMsg = I18n.getText('noDataAvailable');
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

// ================ 导出功能 ================
// 复制分析结果到剪贴板
function copyAnalysisResults() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.innerHTML) {
    ToastManager.showError(I18n.getText('noCopyContent'));
    return;
  }
  
  // 转换为Markdown格式后复制
  const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
  
  navigator.clipboard.writeText(markdownText)
    .then(() => {
      ToastManager.success(I18n.getText('copySuccess'));
    })
    .catch(err => {
      console.error('复制分析结果失败:', err);
      ToastManager.showError(`${I18n.getText('copyFailed')}: ${err.message}`);
    });
}

// 下载分析报告和数据
function downloadReport() {
  const analysisText = document.getElementById('analysisText');
  if (!analysisText || !analysisText.textContent) {
    ToastManager.showError(I18n.getText('downloadFailed'));
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
    ToastManager.showError(`${I18n.getText('downloadFailed')}: ${error.message}`);
  }
}

// 创建下载选项菜单
function createDownloadDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'download-dropdown';
  dropdown.innerHTML = `
    <div class="download-dropdown-content">
      <div class="download-header">${I18n.getText('downloadOptions')}</div>
      <a href="#" id="downloadReportOnly">${I18n.getText('downloadReportOnly').replace('TXT', 'MD')}</a>
      <a href="#" id="downloadDataJSON">${I18n.getText('downloadDataJSON')}</a>
      <a href="#" id="downloadDataCSV">${I18n.getText('downloadDataCSV')}</a>
      <a href="#" id="downloadAll">${I18n.getText('downloadAll')}</a>
    </div>
  `;
  return dropdown;
}

// 定位下拉菜单
function positionDropdown(dropdown, anchor) {
  const rect = anchor.getBoundingClientRect();
  
  // 计算最佳显示位置
  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX;
  
  // 检查是否超出页面底部
  const dropdownHeight = 200; // 估计高度
  const windowHeight = window.innerHeight;
  const windowBottom = window.scrollY + windowHeight;
  
  // 如果下拉菜单会超出底部，则显示在按钮上方
  if (top + dropdownHeight > windowBottom) {
    top = rect.top + window.scrollY - dropdownHeight - 5;
  }
  
  // 确保不会超出页面左侧
  if (left < 10) {
    left = 10;
  }
  
  // 确保不会超出页面右侧
  const dropdownWidth = 200; // 估计宽度
  if (left + dropdownWidth > document.documentElement.clientWidth - 10) {
    left = document.documentElement.clientWidth - dropdownWidth - 10;
  }
  
  dropdown.style.position = 'absolute';
  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
  dropdown.style.zIndex = '2000'; // 确保更高的z-index
  
  document.body.appendChild(dropdown);
  
  // 滚动到下拉菜单可见
  setTimeout(() => {
    dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// 设置下载按钮监听器
function setupDownloadListeners(dropdown, analysisText, domainName, currentDate) {
  // 点击其他地方关闭下拉菜单
  document.addEventListener('click', closeDropdownOnOutsideClick);
  
  // 防止点击下拉菜单本身时关闭
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // 设置各下载选项的事件监听器
  setupDownloadOptionListeners(dropdown, analysisText, domainName, currentDate);
  
  // 点击外部区域关闭下拉菜单
  function closeDropdownOnOutsideClick(e) {
    if (!e.target.closest('#downloadReportBtn')) {
      closeDropdown();
    }
  }
}

// 设置各下载选项的事件监听器
function setupDownloadOptionListeners(dropdown, analysisText, domainName, currentDate) {
  // 下载报告按钮
  document.getElementById('downloadReportOnly').addEventListener('click', (e) => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(markdownText, `${I18n.getText('reportFileName')}-${domainName}-${currentDate}.md`);
    closeDropdown();
  });
  
  // 下载JSON数据按钮
  document.getElementById('downloadDataJSON').addEventListener('click', (e) => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(requestsData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.json`);
    } else {
      ToastManager.showError(I18n.getText('noDataAvailable'));
    }
    closeDropdown();
  });
  
  // 下载CSV数据按钮
  document.getElementById('downloadDataCSV').addEventListener('click', (e) => {
    e.preventDefault();
    if (requestsData && Object.keys(requestsData).length > 0) {
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.csv`);
    } else {
      ToastManager.showError(I18n.getText('noDataAvailable'));
    }
    closeDropdown();
  });
  
  // 下载全部按钮
  document.getElementById('downloadAll').addEventListener('click', (e) => {
    e.preventDefault();
    const markdownText = convertHtmlToMarkdown(analysisText.innerHTML);
    downloadMarkdownFile(markdownText, `${I18n.getText('reportFileName')}-${domainName}-${currentDate}.md`);
    
    if (requestsData && Object.keys(requestsData).length > 0) {
      downloadJsonFile(requestsData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.json`);
      const csvData = convertRequestsToCSV(requestsData);
      downloadTextFile(csvData, `${I18n.getText('dataFileName')}-${domainName}-${currentDate}.csv`);
    }
    closeDropdown();
  });
}

// 关闭下拉菜单函数
function closeDropdown() {
  const dropdown = document.querySelector('.download-dropdown');
  if (dropdown) {
    document.body.removeChild(dropdown);
    document.removeEventListener('click', closeDropdownOnOutsideClick);
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
  
  ToastManager.success(`${I18n.getText('downloadSuccess')}: ${filename}`);
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
 * 域名和授权管理
 */

// ================ 域名和授权管理 ================
// 辅助函数：截取标题，避免重复显示域名
function truncateTitle(title, domain) {
  if (!title) return '';
  
  // 移除域名部分，避免重复
  let shortTitle = title.replace(domain, '').trim();
  shortTitle = shortTitle.replace(/^[-–—\s|]*/, '').trim(); // 移除开头的分隔符
  
  // 如果标题过长，截取
  if (shortTitle.length > 20) {
    shortTitle = shortTitle.substring(0, 18) + '...';
  }
  
  return shortTitle;
}

// 检查域名是否为授权域名
function isAuthorizedDomain(domain, authorizedDomains) {
  if (!domain || !authorizedDomains || !authorizedDomains.length) return false;
  
  // 检查完全匹配
  if (authorizedDomains.includes(domain)) return true;
  
  // 检查子域名匹配 (如果authorizedDomains包含 example.com，则 sub.example.com 也是授权的)
  return authorizedDomains.some(authDomain => {
    return domain.endsWith('.' + authDomain);
  });
}

// 检查是否为本地开发地址
function isLocalhost(domain) {
  return domain === 'localhost' || domain === '127.0.0.1' || domain.match(/^192\.168\.\d{1,3}\.\d{1,3}$/);
}

// 获取授权域名列表
async function getAuthorizedDomains() {
  try {
    // 尝试从存储中获取授权域名列表
    const result = await chrome.storage.sync.get('authorizedDomains');
    const domains = result.authorizedDomains || [];
    
    // 始终允许常见的开发和测试域名
    const defaultDomains = ['localhost', '127.0.0.1', 'example.com'];
    
    // 合并默认域名和存储的域名，确保无重复
    return [...new Set([...defaultDomains, ...domains])];
  } catch (error) {
    console.error('获取授权域名列表出错:', error);
    return ['localhost', '127.0.0.1']; // 出错时返回基本本地域名
  }
}

/**
 * 初始化和设置
 */

// 初始化标签页选择器
async function initTabSelector() {
  const tabSelectorWrapper = document.querySelector('.tab-selector-wrapper');
  if (!tabSelectorWrapper) return;
  
  try {
    // 获取当前页面的域名
    const currentDomainUrl = document.getElementById('domainUrl')?.textContent;
    let currentDomain = '';
    let displayDomain = I18n.getText('currentTab');
    
    try {
      if (currentDomainUrl && currentDomainUrl !== '--') {
        const url = new URL(currentDomainUrl);
        currentDomain = url.hostname;
        // 设置显示用的域名（简短版本）
        displayDomain = currentDomain;
      }
    } catch (e) {
      console.error('解析当前域名出错:', e);
    }
    
    // 创建自定义下拉菜单元素
    tabSelectorWrapper.innerHTML = '';
    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown';
    
    // 获取所有标签页
    const tabs = await chrome.tabs.query({});
    
    // 获取授权域名列表
    const authorizedDomains = await getAuthorizedDomains();
    
    // 创建标签页选项数据结构
    const authorizedTabs = [];
    let hasMatchingTab = false;
    
    // 处理当前标签页
    const currentTab = {
      element: document.createElement('div'),
      domain: currentDomain.toLowerCase(),
      tabId: 'current',
      matchesCurrent: true,
      displayName: displayDomain
    };
    
    currentTab.element.className = 'dropdown-option';
    currentTab.element.dataset.value = 'current';
    currentTab.element.dataset.domain = currentDomain;
    currentTab.element.title = currentDomainUrl;
    currentTab.element.innerHTML = `<span class="tab-domain">${displayDomain}</span>`;
    
    // 添加其他符合条件的标签页选项
    tabs.forEach(tab => {
      // 忽略当前页面
      if (tab.id === chrome.devtools?.inspectedWindow?.tabId) return;
      
      try {
        // 检查标签页是否有URL且是否为授权域名
        if (tab.url) {
          const url = new URL(tab.url);
          const domain = url.hostname;
          
          // 只添加授权域名或本地开发地址
          if (isAuthorizedDomain(domain, authorizedDomains) || isLocalhost(domain)) {
            // 截取标题长度，仅显示有意义的部分
            const title = tab.title || '';
            const shortTitle = truncateTitle(title, domain);
            
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.dataset.value = tab.id;
            option.dataset.domain = domain;
            option.title = `${domain} - ${tab.title || ''}`;
            
            // 使用更简洁的显示形式
            option.innerHTML = `<span class="tab-domain">${domain}</span>`;
            if (shortTitle) {
              option.innerHTML += `<span class="tab-title">${shortTitle}</span>`;
            }
            
            const matchesCurrent = currentDomain && domain.toLowerCase() === currentDomain.toLowerCase();
            
            // 如果找到匹配当前域名的标签页，标记它
            if (matchesCurrent) {
              hasMatchingTab = true;
            }
            
            authorizedTabs.push({
              element: option,
              domain: domain.toLowerCase(),
              tabId: tab.id,
              matchesCurrent: matchesCurrent,
              displayName: domain
            });
          }
        }
      } catch (e) {
        // 如果URL解析失败，跳过这个标签页
        console.error('解析标签页URL出错:', e);
      }
    });
    
    // 按域名排序
    authorizedTabs.sort((a, b) => a.domain.localeCompare(b.domain));
    
    // 查找匹配当前域名的标签页
    const matchingTab = authorizedTabs.find(tab => tab.matchesCurrent);
    
    // 创建下拉选择框的显示部分
    const dropdownSelected = document.createElement('div');
    dropdownSelected.className = 'dropdown-selected';
    
    // 如果有匹配的标签页，使用它的域名作为显示文本
    // 否则使用当前标签页的域名
    const selectedTab = matchingTab || currentTab;
    
    dropdownSelected.innerHTML = `
      <span id="selectedTabText" title="${selectedTab.title || selectedTab.displayName}">${selectedTab.displayName}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    
    const dropdownOptions = document.createElement('div');
    dropdownOptions.className = 'dropdown-options';
    
    // 添加所有选项到下拉列表
    dropdownOptions.appendChild(currentTab.element);
    
    // 设置当前选项为选中状态，除非有匹配的标签页
    if (!hasMatchingTab) {
      currentTab.element.classList.add('selected');
    }
    
    authorizedTabs.forEach(tab => {
      dropdownOptions.appendChild(tab.element);
      
      // 如果这是匹配当前域名的标签页，标记为选中
      if (tab.matchesCurrent) {
        tab.element.classList.add('selected');
        // 加载匹配标签页的数据
        loadTabData(tab.tabId);
      }
    });
    
    // 如果没有授权的标签页，显示一条信息
    if (authorizedTabs.length === 0) {
      const noAuthOption = document.createElement('div');
      noAuthOption.className = 'dropdown-option disabled';
      noAuthOption.textContent = I18n.getText('noAuthorizedTabs');
      dropdownOptions.appendChild(noAuthOption);
    }
    
    // 添加下拉元素到DOM
    customDropdown.appendChild(dropdownSelected);
    customDropdown.appendChild(dropdownOptions);
    tabSelectorWrapper.appendChild(customDropdown);
    
    // 点击显示/隐藏下拉菜单
    dropdownSelected.addEventListener('click', () => {
      dropdownSelected.classList.toggle('active');
      dropdownOptions.classList.toggle('active');
    });
    
    // 点击选项后关闭下拉菜单
    dropdownOptions.addEventListener('click', async (e) => {
      const option = e.target.closest('.dropdown-option');
      if (!option || option.classList.contains('disabled')) return;
      
      // 更新选中状态
      dropdownOptions.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
      
      // 更新显示文本 - 只显示域名部分
      const domain = option.dataset.domain || option.querySelector('.tab-domain')?.textContent || '';
      document.getElementById('selectedTabText').textContent = domain;
      document.getElementById('selectedTabText').title = option.title || domain;
      
      // 关闭下拉菜单
      dropdownSelected.classList.remove('active');
      dropdownOptions.classList.remove('active');
      
      // 处理选中的值
      const selectedTabId = option.dataset.value;
      
      if (selectedTabId === 'current') {
        // 获取当前活动标签页
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs && activeTabs.length > 0) {
          await loadTabData(activeTabs[0].id);
        }
      } else if (selectedTabId) {
        // 加载选中的标签页数据
        await loadTabData(parseInt(selectedTabId));
      }
    });
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        dropdownSelected.classList.remove('active');
        dropdownOptions.classList.remove('active');
      }
    });
    
  } catch (error) {
    console.error('初始化标签页选择器出错:', error);
  }
}

// 在DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', init);

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
    ToastManager.showError(`${I18n.getText('initPageError')}: ${error.message}`);
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

// 初始化AI提供商和模型显示
async function initAIProviderDisplay() {
  try {
    const config = await getAIConfig();
    updateAIProviderDisplay(config);
  } catch (error) {
    console.error('初始化AI提供商显示出错:', error);
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