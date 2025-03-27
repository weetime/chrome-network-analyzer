/**
 * Theme Manager - Handles theme switching functionality
 */

// Theme management
function loadTheme() {
  // 从 Chrome Storage 中读取主题设置
  chrome.storage.local.get(['darkThemeDefault'], (result) => {
    // 如果 Storage 中有设置值，使用它
    if (result.hasOwnProperty('darkThemeDefault')) {
      const theme = result.darkThemeDefault ? 'dark' : 'light';
      // 应用主题到页面
      document.documentElement.setAttribute('data-theme', theme);
      // 确保 localStorage 和 Chrome Storage 同步
      localStorage.setItem('theme', theme);
    } else {
      // 如果 Storage 中没有设置，则使用 localStorage 中的设置
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      // 将设置同步到 Chrome Storage
      chrome.storage.local.set({ darkThemeDefault: savedTheme === 'dark' });
    }
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // 同步更新 Chrome Storage 中的深色主题默认设置
  const isDark = newTheme === 'dark';
  chrome.storage.local.set({ darkThemeDefault: isDark });
  
  // Update theme icon visibility
  updateThemeIcon(newTheme);
  
  // Update tooltip text if tooltip element exists
  const themeTooltip = document.getElementById('themeTooltip');
  if (themeTooltip) {
    themeTooltip.textContent = newTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';
  }
}

function updateThemeIcon(theme) {
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');
  const sunRays = document.querySelectorAll('[id^="sunRay"]');
  const themeToggle = document.getElementById('themeToggle');
  
  if (!moonIcon || !sunIcon || !themeToggle) return;
  
  if (theme === 'light') {
    // Show sun icon for light theme
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
    sunRays.forEach(ray => ray.style.display = 'block');
    themeToggle.classList.remove('dark-mode');
  } else {
    // Show moon icon for dark theme
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
    sunRays.forEach(ray => ray.style.display = 'none');
    themeToggle.classList.add('dark-mode');
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
  updateThemeIcon
};