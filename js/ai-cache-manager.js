/**
 * AI Cache Manager - Manages caching of AI analysis results
 * Provides caching and retrieval of analysis results to avoid redundant analysis of identical data
 */

// Cache configuration constants
const CACHE_CONFIG = {
  // Cache expiration time (milliseconds)
  EXPIRATION_TIME: 60 * 60 * 1000, // 1 hour
  // Maximum number of cache entries
  MAX_ENTRIES: 30,
  // Cache storage key
  STORAGE_KEY: 'aiAnalysisCache'
};

// In-memory cache structure
let cacheData = null;

/**
 * Initialize cache
 * Loads cache data from chrome.storage.local
 */
async function initCache() {
  if (cacheData !== null) return;
  
  try {
    const result = await chrome.storage.local.get(CACHE_CONFIG.STORAGE_KEY);
    cacheData = result[CACHE_CONFIG.STORAGE_KEY] || {};
    
    // Clean expired cache entries
    await cleanExpiredCache();
  } catch (error) {
    console.error('Failed to initialize AI analysis cache:', error);
    cacheData = {};
  }
}

/**
 * Generate a cache key
 * Creates a unique key using provider, model, data characteristics and language
 * @returns {Object} Object containing the cache key and data fingerprint
 */
async function generateCacheKey(provider, model, data, language) {
  const dataFingerprint = await generateDataFingerprint(data);
  const cacheKey = `${provider}_${model}_${language}_${dataFingerprint}`;
  return { cacheKey, fingerprint: dataFingerprint };
}

/**
 * Generate data fingerprint (SHA-256)
 * Creates a unique identifier from key data characteristics
 * @returns {string} Data fingerprint hash
 */
async function generateDataFingerprint(data) {
  // Handle empty data case
  if (!data) {
    return 'empty-data';
  }
  
  // Check crypto API availability
  if (!window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
    console.error('Crypto API not available in current context');
    return 'crypto-unavailable';
  }
  
  try {
    // Extract and serialize statistics data
    const statistics = data.statistics || {};
    const statsString = JSON.stringify(statistics);

    // Encode as Uint8Array
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(statsString);

    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray);

    // Convert to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return fingerprint;
  } catch (error) {
    console.error('Failed to generate data fingerprint:', error);
    return 'error-fingerprint'; 
  }
}

/**
 * Retrieve cached analysis result
 * @returns {Object|null} Cached analysis result or null
 */
async function getCachedAnalysis(provider, model, data, language) {
  await initCache();
  
  const { cacheKey } = await generateCacheKey(provider, model, data, language);
  const cachedItem = cacheData[cacheKey];
  
  if (!cachedItem) return null;
  
  // Check if expired
  if (Date.now() > cachedItem.expiration) {
    // Remove expired item
    delete cacheData[cacheKey];
    await saveCache();
    return null;
  }
  
  // Update last accessed time
  cachedItem.lastAccessed = Date.now();
  await saveCache();
  
  return cachedItem.result;
}

/**
 * Cache analysis result
 * @returns {boolean} Whether caching operation was successful
 */
async function cacheAnalysisResult(provider, model, data, language, result) {
  await initCache();
  
  if (!data || !result) {
    console.warn('Attempted to cache undefined data or result');
    return false;
  }
  
  try {
    const { cacheKey, fingerprint } = await generateCacheKey(provider, model, data, language);
    const timestamp = Date.now();
    
    // Create cache entry
    cacheData[cacheKey] = {
      result: JSON.parse(JSON.stringify(result)), // Create deep copy to avoid reference issues
      fingerprint,
      timestamp,
      expiration: timestamp + CACHE_CONFIG.EXPIRATION_TIME,
      lastAccessed: timestamp
    };
    
    // Clean oldest entries if exceeding maximum count
    await cleanOldestIfNeeded();
    
    // Save cache to storage
    await saveCache();
    return true;
  } catch (error) {
    console.error('Failed to cache analysis result:', error);
    return false;
  }
}

/**
 * Clean expired cache entries
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
 * Clean oldest entries if cache exceeds maximum size
 */
async function cleanOldestIfNeeded() {
  const keys = Object.keys(cacheData);
  
  if (keys.length <= CACHE_CONFIG.MAX_ENTRIES) return;
  
  // Sort by last accessed time
  keys.sort((a, b) => cacheData[a].lastAccessed - cacheData[b].lastAccessed);
  
  // Remove oldest entries until count is within limit
  const keysToRemove = keys.slice(0, keys.length - CACHE_CONFIG.MAX_ENTRIES);
  keysToRemove.forEach(key => {
    delete cacheData[key];
  });
  
  await saveCache();
}

/**
 * Save cache to storage
 */
async function saveCache() {
  try {
    await chrome.storage.local.set({ [CACHE_CONFIG.STORAGE_KEY]: cacheData });
  } catch (error) {
    console.error('Failed to save AI analysis cache:', error);
  }
}

/**
 * Clear all cache
 * @returns {boolean} Whether operation was successful
 */
async function clearCache() {
  cacheData = {};
  await chrome.storage.local.remove(CACHE_CONFIG.STORAGE_KEY);
  return true;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics data
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

// Export API interface
export const AiCacheManager = {
  getCachedAnalysis,
  cacheAnalysisResult,
  clearCache,
  getCacheStats
};