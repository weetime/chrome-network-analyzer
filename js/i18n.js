/**
 * 国际化支持模块 - 提供多语言支持功能
 */

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['zh', 'en'];

// 默认语言
const DEFAULT_LANGUAGE = 'zh';

// 声明 MutationObserver 变量
let i18nObserver = null;

// 获取当前语言
function getCurrentLanguage() {
  return localStorage.getItem('language') || DEFAULT_LANGUAGE;
}

// 设置当前语言
function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    localStorage.setItem('language', lang);
    return true;
  }
  return false;
}

// 获取翻译文本
function getText(key, replacements = {}) {
  const lang = getCurrentLanguage();
  
  // 确保I18nMessages已经加载
  if (!window.I18nMessages || !window.I18nMessages[lang]) {
    console.error(`Language pack for ${lang} not loaded.`);
    return key;
  }
  
  const text = window.I18nMessages[lang][key] || 
               (window.I18nMessages[DEFAULT_LANGUAGE] ? window.I18nMessages[DEFAULT_LANGUAGE][key] : key);
  
  // 处理替换变量
  if (Object.keys(replacements).length > 0) {
    return Object.keys(replacements).reduce((result, placeholder) => {
      return result.replace(`{${placeholder}}`, replacements[placeholder]);
    }, text);
  }
  
  return text;
}

// 更新页面上的所有i18n元素
function updatePageText() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = getText(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getText(key);
  });
  
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = getText(key);
  });
}

// 设置 DOM 观察器来监听变化
function setupObserver() {
  // 如果已经有观察器，则先断开连接
  if (i18nObserver) {
    i18nObserver.disconnect();
  }
  
  // 创建新的 MutationObserver
  i18nObserver = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    // 检查是否有新增的需要本地化的元素
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // 元素节点
            // 检查元素本身是否有 data-i18n 属性
            if (node.hasAttribute && (
                node.hasAttribute('data-i18n') || 
                node.hasAttribute('data-i18n-placeholder') || 
                node.hasAttribute('data-i18n-title')
            )) {
              shouldUpdate = true;
            }
            
            // 检查子元素是否有 data-i18n 属性
            if (node.querySelectorAll) {
              const i18nNodes = node.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title]');
              if (i18nNodes.length > 0) {
                shouldUpdate = true;
              }
            }
          }
        });
      }
    });
    
    // 只有在检测到需要本地化的元素时才更新
    if (shouldUpdate) {
      updatePageText();
    }
  });
  
  // 开始观察整个文档
  i18nObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// 加载语言包
function loadLanguagePacks() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    let errors = 0;
    
    // 加载所有支持的语言
    SUPPORTED_LANGUAGES.forEach(lang => {
      loadScript(`js/i18n/${lang}.js`)
        .then(() => {
          console.log(`Language pack ${lang} loaded.`);
          loaded++;
          if (loaded + errors === SUPPORTED_LANGUAGES.length) {
            if (errors === 0) {
              resolve();
            } else {
              reject(new Error(`Failed to load ${errors} language packs.`));
            }
          }
        })
        .catch(err => {
          console.error(`Failed to load language pack ${lang}:`, err);
          errors++;
          if (loaded + errors === SUPPORTED_LANGUAGES.length) {
            reject(new Error(`Failed to load ${errors} language packs.`));
          }
        });
    });
  });
}

// 辅助函数：加载脚本
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// 初始化国际化模块
async function init() {
  try {
    await loadLanguagePacks();
    console.log('All language packs loaded.');
    updatePageText();
    
    // 设置 DOM 观察器
    setupObserver();
  } catch (error) {
    console.error('Failed to initialize i18n module:', error);
  }
}

// 导出国际化功能
(function(global) {
  global.I18n = {
    init,
    getText,
    getCurrentLanguage,
    setLanguage,
    updatePageText,
    SUPPORTED_LANGUAGES
  };
})(typeof window !== 'undefined' ? window : self); 