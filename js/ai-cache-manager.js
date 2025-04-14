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
    await cleanExpiredCache();
  } catch (error) {
    console.error('初始化AI分析缓存失败:', error);
    cacheData = {};
  }
}

/**
 * 生成用于缓存的键
 * 使用提供商、模型、数据特征和语言创建唯一键
 * Returns an object containing the cache key and the data fingerprint.
 */
async function generateCacheKey(provider, model, data, language) {
  // 从data中提取特征信息以创建指纹
  const dataFingerprint = await generateDataFingerprint(data);
  const cacheKey = `${provider}_${model}_${language}_${dataFingerprint}`;
  return { cacheKey, fingerprint: dataFingerprint };
}

/**
 * 生成数据指纹 (SHA-256)
 * 从分析数据中提取关键特征以创建唯一标识符
 */
async function generateDataFingerprint(data) {
  // If data is undefined or null, return a default fingerprint
  if (!data) {
    return 'empty-data';
  }
  
  // 检查 crypto API 的可用性
  if (!window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
    console.error('Crypto API not available in this context');
    return 'crypto-unavailable';
  }
  
  try {
    // 从data中提取statistics数据
    const statistics = data.statistics || {};
    const statsString = JSON.stringify(statistics);

    // Encode the string into a Uint8Array
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(statsString);

    // Calculate the SHA-256 hash (更安全且更广泛支持的算法)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray);

    // Convert the ArrayBuffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('fingerprint', fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Error creating data fingerprint (SHA-256):', error);
    // 记录详细错误信息以便调试
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    // Provide a distinct fingerprint for errors during hashing
    return 'error-sha256-fingerprint'; 
  }
}

/**
 * 获取缓存的分析结果
 */
async function getCachedAnalysis(provider, model, data, language) {
  await initCache();
  
  const { cacheKey } = await generateCacheKey(provider, model, data, language);
  const cachedItem = cacheData[cacheKey];
  
  if (!cachedItem) return null;
  
  // 检查是否过期
  if (Date.now() > cachedItem.expiration) {
    // 删除过期项
    delete cacheData[cacheKey];
    await saveCache();
    return null;
  }
  
  // 更新访问时间
  cachedItem.lastAccessed = Date.now();
  await saveCache();
  
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
    const { cacheKey, fingerprint } = await generateCacheKey(provider, model, data, language);
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
    await cleanOldestIfNeeded();
    
    // 保存缓存到存储
    await saveCache();
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
async function cleanExpiredCache() {
  const now = Date.now();
  let cleaned = false;
  
  for (const key in cacheData) {
    if (cacheData[key].expiration < now) {
      delete cacheData[key];
      cleaned = true;
    }
  }
  
  if (cleaned) {
    await saveCache();
  }
}

/**
 * 如果缓存条目数量超过最大值，清理最旧的条目
 */
async function cleanOldestIfNeeded() {
  const keys = Object.keys(cacheData);
  
  if (keys.length <= CACHE_CONFIG.MAX_ENTRIES) return;
  
  // 按最后访问时间排序
  keys.sort((a, b) => cacheData[a].lastAccessed - cacheData[b].lastAccessed);
  
  // 删除最旧的条目，直到数量符合限制
  const keysToRemove = keys.slice(0, keys.length - CACHE_CONFIG.MAX_ENTRIES);
  keysToRemove.forEach(key => {
    delete cacheData[key];
  });
  
  await saveCache();
}

/**
 * 保存缓存到存储
 */
async function saveCache() {
  try {
    await chrome.storage.local.set({ [CACHE_CONFIG.STORAGE_KEY]: cacheData });
  } catch (error) {
    console.error('保存AI分析缓存失败:', error);
  }
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