/**
 * Theme Manager - Handles theme switching functionality
 */

// Theme management
function loadTheme() {
  // 从 Chrome Storage 中读取主题设置
  chrome.storage.local.get(['theme'], result => {
    // 如果 Storage 中有设置值，使用它
    if (Object.prototype.hasOwnProperty.call(result, 'theme')) {
      const theme = result.theme;
      // 应用主题到页面
      document.documentElement.setAttribute('data-theme', theme);
      // 确保 localStorage 同步
      localStorage.setItem('theme', theme);
      localStorage.setItem('networkAnalyzerTheme', theme);

      // 更新主题图标
      updateThemeIcon(theme);
    } else {
      // 如果 Storage 中没有设置，则使用 localStorage 中的设置
      const savedTheme =
        localStorage.getItem('networkAnalyzerTheme') || localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      // 将设置同步到 Chrome Storage
      chrome.storage.local.set({
        theme: savedTheme,
        darkThemeDefault: savedTheme === 'dark', // 兼容旧版设置
      });

      // 更新主题图标
      updateThemeIcon(savedTheme);
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  let newTheme;

  // 轮换三种主题
  switch (currentTheme) {
    case 'light':
      newTheme = 'dark';
      break;
    case 'dark':
      newTheme = 'fireblack';
      break;
    case 'fireblack':
    default:
      newTheme = 'light';
      break;
  }

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  localStorage.setItem('networkAnalyzerTheme', newTheme);

  // 同步更新 Chrome Storage 中的主题设置
  chrome.storage.local.set({
    theme: newTheme,
    darkThemeDefault: newTheme === 'dark', // 兼容旧版设置
  });

  // Update theme icon visibility
  updateThemeIcon(newTheme);

  // Update tooltip text if tooltip element exists
  const themeTooltip = document.getElementById('themeTooltip');
  if (themeTooltip) {
    if (newTheme === 'light') {
      themeTooltip.textContent = 'Toggle Dark Mode';
    } else if (newTheme === 'dark') {
      themeTooltip.textContent = 'Toggle Fire Black Mode';
    } else {
      themeTooltip.textContent = 'Toggle Light Mode';
    }
  }
}

function updateThemeIcon(theme) {
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  const fireIcon = document.getElementById('fireIcon');
  const sunRays = document.querySelectorAll('[id^="sunRay"]');
  const themeToggle = document.getElementById('themeToggle');

  if (!themeToggle) return;

  if (moonIcon && sunIcon) {
    // 基于主题显示不同图标
    if (theme === 'light') {
      // 显示太阳图标
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
      if (fireIcon) fireIcon.style.display = 'none';
      if (sunRays) sunRays.forEach(ray => (ray.style.display = 'block'));
      themeToggle.classList.remove('dark-mode', 'fire-mode');
    } else if (theme === 'dark') {
      // 显示月亮图标
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
      if (fireIcon) fireIcon.style.display = 'none';
      if (sunRays) sunRays.forEach(ray => (ray.style.display = 'none'));
      themeToggle.classList.add('dark-mode');
      themeToggle.classList.remove('fire-mode');
    } else if (theme === 'fireblack') {
      // 显示火焰图标（如果存在）
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'none';
      if (sunRays) sunRays.forEach(ray => (ray.style.display = 'none'));
      themeToggle.classList.remove('dark-mode');
      themeToggle.classList.add('fire-mode');
      if (fireIcon) {
        fireIcon.style.display = 'block';
      } else {
        // 如果没有火焰图标，显示月亮图标并添加火焰效果类
        moonIcon.style.display = 'block';
        moonIcon.classList.add('fire-effect');
      }
    }
  }
}

function initThemeManager() {
  // Initialize theme
  loadTheme();

  // Theme toggle event listener - only attach if element exists
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Export the theme manager functionality
export const ThemeManager = {
  init: initThemeManager,
  loadTheme,
  toggleTheme,
  updateThemeIcon,
};
