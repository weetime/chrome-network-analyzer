/**
 * Toast Manager - Unified notification system
 */

// Save all active toasts
let activeToasts = [];
let toastContainer = null;
let counter = 0;

/**
 * Create toast container
 */
function createToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  return toastContainer;
}

/**
 * Create SVG icon
 */
function createIcon(type) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  let path = '';

  switch (type) {
    case 'success':
      // Success icon
      path = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>`;
      break;
    case 'error':
      // Error icon
      path = `<circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>`;
      break;
    case 'warning':
      // Warning icon
      path = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>`;
      break;
    case 'info':
    default:
      // Info icon
      path = `<circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>`;
      break;
  }

  svg.innerHTML = path;
  return svg;
}

/**
 * Show toast message
 * @param {string} message - Message content
 * @param {string} type - Message type: success, error, info, warning
 * @param {object} options - Configuration options
 */
function showToast(message, type = 'info', options = {}) {
  const { title = '', duration = 3000, closable = true } = options;

  // Ensure container exists
  const container = createToastContainer();

  // Create toast element
  const toast = document.createElement('div');
  const toastId = `toast-${++counter}`;
  toast.id = toastId;
  toast.className = `toast ${type}`;

  // Create icon
  const iconContainer = document.createElement('div');
  iconContainer.className = 'toast-icon';
  iconContainer.appendChild(createIcon(type));

  // Create content
  const content = document.createElement('div');
  content.className = 'toast-content';

  // Add title if provided
  if (title) {
    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    titleElement.textContent = title;
    content.appendChild(titleElement);
  }

  // Add message
  const messageElement = document.createElement('div');
  messageElement.className = 'toast-message';
  messageElement.textContent = message;
  content.appendChild(messageElement);

  // Add close button
  if (closable) {
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeButton.addEventListener('click', () => {
      removeToast(toastId);
    });

    toast.appendChild(closeButton);
  }

  // Add progress bar
  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  toast.appendChild(progress);

  // Assemble toast
  toast.appendChild(iconContainer);
  toast.appendChild(content);

  // Add to container
  container.appendChild(toast);

  // Record active toast
  activeToasts.push({
    id: toastId,
    element: toast,
    timeout: null,
  });

  // Show animation
  setTimeout(() => {
    toast.classList.add('show');

    // Progress bar animation
    progress.style.animation = `shrink ${duration / 1000}s linear forwards`;
    progress.style.width = '100%';

    // Auto remove
    const timeoutId = setTimeout(() => {
      removeToast(toastId);
    }, duration);

    // Update timeout reference
    const toastObj = activeToasts.find(t => t.id === toastId);
    if (toastObj) {
      toastObj.timeout = timeoutId;
    }
  }, 10);

  return toastId;
}

/**
 * Remove specified toast
 */
function removeToast(id) {
  const toastIndex = activeToasts.findIndex(t => t.id === id);
  if (toastIndex === -1) return;

  const { element, timeout } = activeToasts[toastIndex];

  // Clear timer
  if (timeout) {
    clearTimeout(timeout);
  }

  // Add fade-out animation
  element.classList.remove('show');
  element.classList.add('hide');

  // Remove element after animation completes
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }

    // Remove from active list
    activeToasts = activeToasts.filter(t => t.id !== id);

    // If no active toasts, remove container
    if (activeToasts.length === 0 && toastContainer && toastContainer.parentNode) {
      toastContainer.parentNode.removeChild(toastContainer);
      toastContainer = null;
    }
  }, 300);
}

/**
 * Remove all toasts
 */
function clearAllToasts() {
  activeToasts.forEach(toast => {
    if (toast.timeout) {
      clearTimeout(toast.timeout);
    }
    if (toast.element && toast.element.parentNode) {
      toast.element.parentNode.removeChild(toast.element);
    }
  });

  activeToasts = [];

  if (toastContainer && toastContainer.parentNode) {
    toastContainer.parentNode.removeChild(toastContainer);
    toastContainer = null;
  }
}

// Shortcut methods for predefined toast types
function success(message, options = {}) {
  return showToast(message, 'success', options);
}

function error(message, options = {}) {
  return showToast(message, 'error', options);
}

function info(message, options = {}) {
  return showToast(message, 'info', options);
}

function warning(message, options = {}) {
  return showToast(message, 'warning', options);
}

// Export Toast functionality
export const ToastManager = {
  show: showToast,
  success,
  error,
  info,
  warning,
  remove: removeToast,
  clear: clearAllToasts,
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
@keyframes shrink {
  0% { width: 100%; }
  100% { width: 0%; }
}
`;
document.head.appendChild(style);
