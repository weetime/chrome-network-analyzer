/**
 * Theme Manager - Handles theme switching functionality
 */

// Theme management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update theme icon visibility
  updateThemeIcon(savedTheme);
  
  // Update tooltip text if tooltip element exists
  const themeTooltip = document.getElementById('themeTooltip');
  if (themeTooltip) {
    themeTooltip.textContent = savedTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
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

  // Theme toggle event listener
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Make functions available globally
(function(global) {
  global.ThemeManager = {
    init: initThemeManager,
    loadTheme,
    toggleTheme,
    updateThemeIcon
  };
})(typeof window !== 'undefined' ? window : self);