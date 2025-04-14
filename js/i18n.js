/**
 * Internationalization Support Module - Provides multilingual support functionality
 */

// List of supported languages
const SUPPORTED_LANGUAGES = ['zh', 'en'];

// Default language
const DEFAULT_LANGUAGE = 'zh';

// Declare MutationObserver variable
let i18nObserver = null;

// Get current language
function getCurrentLanguage() {
  return localStorage.getItem('networkAnalyzerLanguage') || DEFAULT_LANGUAGE;
}

// Set current language
function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    localStorage.setItem('networkAnalyzerLanguage', lang);
    return true;
  }
  return false;
}

// Get translated text
function getText(key, replacements = {}) {
  const lang = getCurrentLanguage();

  // Ensure I18nMessages is loaded
  if (!window.I18nMessages || !window.I18nMessages[lang]) {
    console.error(`Language pack for ${lang} not loaded.`);
    return key;
  }

  const text =
    window.I18nMessages[lang][key] ||
    (window.I18nMessages[DEFAULT_LANGUAGE] ? window.I18nMessages[DEFAULT_LANGUAGE][key] : key);

  // Process replacement variables
  if (Object.keys(replacements).length > 0) {
    return Object.keys(replacements).reduce((result, placeholder) => {
      return result.replace(`{${placeholder}}`, replacements[placeholder]);
    }, text);
  }

  return text;
}

// Update all i18n elements on the page
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

// Set up DOM observer to monitor changes
function setupObserver() {
  // If observer already exists, disconnect first
  if (i18nObserver) {
    i18nObserver.disconnect();
  }

  // Create new MutationObserver
  i18nObserver = new MutationObserver(mutations => {
    let shouldUpdate = false;

    // Check if new elements need localization
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Element node
            // Check if the element itself has data-i18n attributes
            if (
              node.hasAttribute &&
              (node.hasAttribute('data-i18n') ||
                node.hasAttribute('data-i18n-placeholder') ||
                node.hasAttribute('data-i18n-title'))
            ) {
              shouldUpdate = true;
            }

            // Check if child elements have data-i18n attributes
            if (node.querySelectorAll) {
              const i18nNodes = node.querySelectorAll(
                '[data-i18n], [data-i18n-placeholder], [data-i18n-title]'
              );
              if (i18nNodes.length > 0) {
                shouldUpdate = true;
              }
            }
          }
        });
      }
    });

    // Only update when localization elements are detected
    if (shouldUpdate) {
      updatePageText();
    }
  });

  // Start observing the entire document
  i18nObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize internationalization module
async function init() {
  try {
    updatePageText();
    // Set up DOM observer
    setupObserver();
  } catch (error) {
    console.error('Failed to initialize i18n module:', error);
  }
}

// Export internationalization functionality
export const I18n = {
  init,
  getText,
  getCurrentLanguage,
  setLanguage,
  updatePageText,
  SUPPORTED_LANGUAGES,
};
