/**
 * 简易 SPA 路由器 - hash-based
 * 
 * 使用方式：
 *   const router = new Router();
 *   router.add('#/login', renderLogin);
 *   router.add('#/profile', renderProfile);
 *   router.start();
 * 
 * 支持参数匹配：
 *   router.add('#/activities/:id', renderActivity);
 *   → 匹配 #/activities/42，params.id = '42'
 */

class Router {
  constructor() {
    this.routes = [];
    this.beforeEach = null;  // 全局前置守卫
  }

  /**
   * 注册路由
   * @param {string} pattern - 路由模式，如 '#/login' 或 '#/activities/:id'
   * @param {Function} handler - 渲染函数，接收 (params, query)
   */
  add(pattern, handler) {
    // 将模式转为正则，支持 :param 参数
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ pattern, regex, paramNames, handler });
  }

  /**
   * 解析当前 hash 并匹配路由
   */
  resolve() {
    const hash = window.location.hash || '#/';
    const [path, queryString] = hash.split('?');

    // 解析 query 参数
    const query = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    // 匹配路由
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        // 前置守卫
        if (this.beforeEach) {
          const allow = this.beforeEach(path, params);
          if (!allow) return;
        }

        route.handler(params, query);
        return;
      }
    }

    // 404 — 兼容用户端(#app)和管理端(#admin-app)
    const app = document.getElementById('app') || document.getElementById('admin-app');
    if (app) {
      app.innerHTML = `
        <div class="page-404">
          <h1>404</h1>
          <p>页面不存在</p>
          <a href="#/">返回首页</a>
        </div>
      `;
    }
  }

  /**
   * 启动路由监听
   */
  start() {
    window.addEventListener('hashchange', () => this.resolve());
    // 首次加载
    this.resolve();
  }

  /**
   * 编程式导航
   * @param {string} hash - 目标 hash，如 '#/login'
   */
  navigate(hash) {
    window.location.hash = hash;
  }
}
