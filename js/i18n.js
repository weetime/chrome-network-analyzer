/**
 * 国际化支持模块 - 提供多语言支持功能
 */

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['zh', 'en'];

// 默认语言
const DEFAULT_LANGUAGE = 'zh';

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