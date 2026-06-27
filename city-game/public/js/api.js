/**
 * API 封装层 - fetch + JWT 自动注入
 * 
 * 所有页面共用此模块，负责：
 *   1. 自动在请求头中附加 JWT token
 *   2. 统一处理 401 跳转登录
 *   3. 统一错误提示
 */

const API = {
  baseUrl: '/api',

  /**
   * 获取存储的 token
   * @param {string} type - 'user' 或 'admin'
   */
  getToken(type = 'user') {
    return localStorage.getItem(`${type}_token`);
  },

  /**
   * 存储 token
   * @param {string} token
   * @param {string} type - 'user' 或 'admin'
   */
  setToken(token, type = 'user') {
    localStorage.setItem(`${type}_token`, token);
  },

  /**
   * 清除 token
   * @param {string} type
   */
  clearToken(type = 'user') {
    localStorage.removeItem(`${type}_token`);
  },

  /**
   * 获取存储的用户信息
   * @param {string} type
   */
  getUser(type = 'user') {
    const data = localStorage.getItem(`${type}_info`);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 存储用户信息
   * @param {object} user
   * @param {string} type
   */
  setUser(user, type = 'user') {
    localStorage.setItem(`${type}_info`, JSON.stringify(user));
  },

  /**
   * 通用请求方法
   * @param {string} path - API 路径（不含 baseUrl）
   * @param {object} options - fetch 选项
   * @param {string} type - 'user' 或 'admin'（决定用哪个 token）
   * @returns {Promise<object>}
   */
  async request(path, options = {}, type = 'user') {
    const url = this.baseUrl + path;
    const token = this.getToken(type);

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: { ...headers, ...options.headers }
    };

    // 如果 body 是对象，自动序列化
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // 401 → 跳转登录
      if (response.status === 401) {
        this.clearToken(type);
        if (type === 'admin') {
          window.location.hash = '#/admin/login';
        } else {
          window.location.hash = '#/login';
        }
        throw new Error(data.error || '请重新登录');
      }

      // 其他错误
      if (!response.ok) {
        throw new Error(data.error || `请求失败 (${response.status})`);
      }

      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查网络');
      }
      throw err;
    }
  },

  // 快捷方法
  get(path, type) { return this.request(path, { method: 'GET' }, type); },
  post(path, body, type) { return this.request(path, { method: 'POST', body }, type); },
  put(path, body, type) { return this.request(path, { method: 'PUT', body }, type); },
  delete(path, type) { return this.request(path, { method: 'DELETE' }, type); },
};

// ============================================================
// 游戏系统 API
// ============================================================
const GameAPI = {
  getList:           ()                  => API.get('/game/list'),
  getCharacters:     (gameId)            => API.get(`/game/${gameId}/characters`),
  join:              (gameId, body)       => API.post(`/game/${gameId}/join`, body),
  getState:          ()                  => API.get('/game/state'),
  submitPasscode:    (code)              => API.post('/game/passcode', { code }),
  getNotifications:  ()                  => API.get('/game/notifications'),
  markRead:          (id)                => API.post(`/game/notifications/${id}/read`, {}),
};

// API(baseUrl: '/api') → GameAPI 路径自动加 /api 前缀，无需重复写
