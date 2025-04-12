/**
 * AI Cache Manager - 处理AI分析结果缓存
 * 提供分析结果的缓存和检索功能，避免重复分析相同数据
 */

// 缓存配置
const CACHE_CONFIG = {
  // 缓存过期时间（毫秒）
  EXPIRATION_TIME: 60 * 60 * 1000, // 1小时
  // 最大缓存条目数
  MAX_ENTRIES: 30,
  // 缓存存储键名
  STORAGE_KEY: 'aiAnalysisCache'
};

// 缓存内存结构
let cacheData = null;

/**
 * 初始化缓存
 * 从chrome.storage.local加载缓存数据
 */
async function initCache() {
  if (cacheData !== null) return;
  
  try {
    const result = await chrome.storage.local.get(CACHE_CONFIG.STORAGE_KEY);
    cacheData = result[CACHE_CONFIG.STORAGE_KEY] || {};
    
    // 清理过期的缓存条目
    cleanExpiredCache();
  } catch (error) {
    console.error('初始化AI分析缓存失败:', error);
    cacheData = {};
  }
}

/**
 * 生成用于缓存的键
 * 使用提供商、模型、数据特征和语言创建唯一键
 */
function generateCacheKey(provider, model, data, language) {
  // 从data中提取特征信息以创建指纹
  const dataFingerprint = generateDataFingerprint(data);
  return `${provider}_${model}_${language}_${dataFingerprint}`;
}

/**
 * 生成数据指纹
 * 从分析数据中提取关键特征以创建唯一标识符
 */
function generateDataFingerprint(data) {
  // If data is undefined or null, return a default fingerprint
  if (!data) {
    return 'empty-data';
  }
  
  try {
    // 从data中提取statistics数据
    const statistics = data.statistics || {};
    
    // 将statistics对象转换为字符串并计算MD5
    const statsString = JSON.stringify(statistics);
    
    // 使用内置的hashString函数生成MD5类似的哈希值
    // 注意：这里使用简化的哈希方法，实际MD5需要引入专门的库
    const fingerprint = hashString(statsString);
    
    return fingerprint;
  } catch (error) {
    console.error('Error creating data fingerprint:', error);
    return 'error-fingerprint';
  }
}

/**
 * 简单的字符串哈希函数
 */
function hashString(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString(16);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return hash.toString(16);
}

/**
 * 获取缓存的分析结果
 */
async function getCachedAnalysis(provider, model, data, language) {
  await initCache();
  
  const cacheKey = generateCacheKey(provider, model, data, language);
  const cachedItem = cacheData[cacheKey];
  
  if (!cachedItem) return null;
  
  // 检查是否过期
  if (Date.now() > cachedItem.expiration) {
    // 删除过期项
    delete cacheData[cacheKey];
    saveCache();
    return null;
  }
  
  // 更新访问时间
  cachedItem.lastAccessed = Date.now();
  saveCache();
  
  return cachedItem.result;
}

/**
 * 缓存分析结果
 * 将AI分析的结果保存到缓存中
 */
async function cacheAnalysisResult(provider, model, data, language, result) {
  await initCache();
  
  if (!data || !result) {
    console.warn('Attempted to cache with undefined data or result');
    return false;
  }
  
  try {
    const cacheKey = generateCacheKey(provider, model, data, language);
    const fingerprint = generateDataFingerprint(data);
    const timestamp = Date.now();
    
    // 创建缓存条目
    cacheData[cacheKey] = {
      result: JSON.parse(JSON.stringify(result)), // 创建深拷贝以避免引用问题
      fingerprint,
      timestamp,
      expiration: Date.now() + CACHE_CONFIG.EXPIRATION_TIME,
      lastAccessed: Date.now()
    };
    
    // 如果缓存条目超过最大数量，清理最旧的条目
    cleanOldestIfNeeded();
    
    // 保存缓存到存储
    saveCache();
    console.log(`AI analysis result cached with key: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error('Error caching analysis result:', error);
    return false;
  }
}

/**
 * 清理过期的缓存条目
 */
function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = false;
  
  for (const key in cacheData) {
    if (cacheData[key].expiration < now) {
      delete cacheData[key];
      cleaned = true;
    }
  }
  
  if (cleaned) {
    saveCache();
  }
}

/**
 * 如果缓存条目数量超过最大值，清理最旧的条目
 */
function cleanOldestIfNeeded() {
  const keys = Object.keys(cacheData);
  
  if (keys.length <= CACHE_CONFIG.MAX_ENTRIES) return;
  
  // 按最后访问时间排序
  keys.sort((a, b) => cacheData[a].lastAccessed - cacheData[b].lastAccessed);
  
  // 删除最旧的条目，直到数量符合限制
  const keysToRemove = keys.slice(0, keys.length - CACHE_CONFIG.MAX_ENTRIES);
  keysToRemove.forEach(key => {
    delete cacheData[key];
  });
}

/**
 * 保存缓存到存储
 */
function saveCache() {
  chrome.storage.local.set({ [CACHE_CONFIG.STORAGE_KEY]: cacheData })
    .catch(error => console.error('保存AI分析缓存失败:', error));
}

/**
 * 清除所有缓存
 */
async function clearCache() {
  cacheData = {};
  await chrome.storage.local.remove(CACHE_CONFIG.STORAGE_KEY);
  return true;
}

/**
 * 获取缓存统计信息
 */
async function getCacheStats() {
  await initCache();
  
  const keys = Object.keys(cacheData);
  
  return {
    totalEntries: keys.length,
    maxEntries: CACHE_CONFIG.MAX_ENTRIES,
    oldestEntry: keys.length > 0 ? 
      Math.min(...keys.map(k => cacheData[k].timestamp)) : null,
    newestEntry: keys.length > 0 ? 
      Math.max(...keys.map(k => cacheData[k].timestamp)) : null,
    memoryUsage: JSON.stringify(cacheData).length
  };
}

// 导出函数
export const AiCacheManager = {
  getCachedAnalysis,
  cacheAnalysisResult,
  clearCache,
  getCacheStats
};