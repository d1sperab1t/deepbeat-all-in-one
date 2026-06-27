/**
 * 共享工具函数
 * 
 * 所有 SPA 页面共用此模块，避免重复定义。
 * 必须在 api.js、router.js 之后、各 app.js 之前加载。
 */

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 显示 Toast 提示
 * @param {string} message - 提示文字
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * 检查用户是否已登录，未登录则跳转
 * @param {string} loginHash - 未登录时跳转的 hash，默认 '#/login'
 * @returns {boolean}
 */
function requireLogin(loginHash = '#/login') {
  if (!API.getToken('user')) {
    window.location.hash = loginHash;
    return false;
  }
  return true;
}
