/**
 * Toast Manager - 统一的消息通知系统
 */

// 保存所有活动的 toast
let activeToasts = [];
let toastContainer = null;
let counter = 0;

/**
 * 创建 toast 容器
 */
function createToastContainer() {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
  return toastContainer;
}

/**
 * 创建 SVG 图标
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
      // 成功图标
      path = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>`;
      break;
    case 'error':
      // 错误图标
      path = `<circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>`;
      break;
    case 'warning':
      // 警告图标
      path = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>`;
      break;
    case 'info':
    default:
      // 信息图标
      path = `<circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>`;
      break;
  }
  
  svg.innerHTML = path;
  return svg;
}

/**
 * 显示 toast 消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型: success, error, info, warning
 * @param {object} options - 配置选项
 */
function showToast(message, type = 'info', options = {}) {
  const {
    title = '',
    duration = 3000,
    closable = true,
    position = 'top-right'
  } = options;
  
  // 确保容器存在
  const container = createToastContainer();
  
  // 创建 toast 元素
  const toast = document.createElement('div');
  const toastId = `toast-${++counter}`;
  toast.id = toastId;
  toast.className = `toast ${type}`;
  
  // 创建图标
  const iconContainer = document.createElement('div');
  iconContainer.className = 'toast-icon';
  iconContainer.appendChild(createIcon(type));
  
  // 创建内容
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  // 添加标题如果有
  if (title) {
    const titleElement = document.createElement('div');
    titleElement.className = 'toast-title';
    titleElement.textContent = title;
    content.appendChild(titleElement);
  }
  
  // 添加消息
  const messageElement = document.createElement('div');
  messageElement.className = 'toast-message';
  messageElement.textContent = message;
  content.appendChild(messageElement);
  
  // 添加关闭按钮
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
  
  // 添加进度条
  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  toast.appendChild(progress);
  
  // 组装 toast
  toast.appendChild(iconContainer);
  toast.appendChild(content);
  
  // 添加到容器
  container.appendChild(toast);
  
  // 记录活动的 toast
  activeToasts.push({
    id: toastId,
    element: toast,
    timeout: null
  });
  
  // 显示动画
  setTimeout(() => {
    toast.classList.add('show');
    
    // 进度条动画
    progress.style.animation = `shrink ${duration / 1000}s linear forwards`;
    progress.style.width = '100%';
    
    // 自动移除
    const timeoutId = setTimeout(() => {
      removeToast(toastId);
    }, duration);
    
    // 更新 timeout 引用
    const toastObj = activeToasts.find(t => t.id === toastId);
    if (toastObj) {
      toastObj.timeout = timeoutId;
    }
  }, 10);
  
  return toastId;
}

/**
 * 移除指定的 toast
 */
function removeToast(id) {
  const toastIndex = activeToasts.findIndex(t => t.id === id);
  if (toastIndex === -1) return;
  
  const { element, timeout } = activeToasts[toastIndex];
  
  // 清除定时器
  if (timeout) {
    clearTimeout(timeout);
  }
  
  // 添加淡出动画
  element.classList.remove('show');
  element.classList.add('hide');
  
  // 动画完成后移除元素
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    
    // 从活动列表中移除
    activeToasts = activeToasts.filter(t => t.id !== id);
    
    // 如果没有活动的 toast，移除容器
    if (activeToasts.length === 0 && toastContainer && toastContainer.parentNode) {
      toastContainer.parentNode.removeChild(toastContainer);
      toastContainer = null;
    }
  }, 300);
}

/**
 * 移除所有 toast
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

// 预定义类型的 toast 快捷方法
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

// 导出 Toast 功能
export const ToastManager = {
  show: showToast,
  success,
  error,
  info,
  warning,
  remove: removeToast,
  clear: clearAllToasts
};

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
@keyframes shrink {
  0% { width: 100%; }
  100% { width: 0%; }
}
`;
document.head.appendChild(style); 