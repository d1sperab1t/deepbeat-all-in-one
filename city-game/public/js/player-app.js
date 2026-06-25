/**
 * 用户端应用 - player-app.js
 * 
 * 所有页面的渲染函数和交互逻辑
 * 使用 hash-based 路由，每个函数对应一个页面
 * 
 * 页面清单：
 *   renderNavbar()         - 导航栏（全局复用）
 *   renderHomePage()       - 品牌官网首页
 *   renderActivitiesPage() - 活动宣传/报名页
 *   renderActivityDetail() - 活动详情页
 *   renderLoginPage()      - 登录页
 *   renderRegisterPage()   - 注册页
 *   renderProfilePage()    - 个人中心首页
 *   renderProfileEdit()    - 个人信息编辑页
 *   renderInvitationPage() - 邀请函页面
 *   renderTasksPage()      - 活动信息/任务页
 *   renderTaskPlayPage()   - 线上任务卡页面
 *   renderCompletePage()   - 通关成功页
 *   renderStampsPage()     - 电子印章墙
 */

// ============================================================
// 工具函数
// ============================================================

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
  setTimeout(() => toast.remove(), 3000);
}

/**
 * 生成导航栏 HTML
 * 【全局组件】所有页面共用
 */
function renderNavbar() {
  const user = API.getUser('user');
  const isLoggedIn = !!API.getToken('user');

  return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand">DEEPBEAT</a>
        <div class="navbar-links">
          <a href="#/">首页</a>
          <a href="#/activities">活动</a>
          ${isLoggedIn ? `
            <a href="#/stamps">印章墙</a>
            <div class="navbar-user">
              <a href="#/profile" class="navbar-avatar">${escapeHtml((user?.nickname || '用')[0])}</a>
              <a href="#/profile">${escapeHtml(user?.nickname || '个人中心')}</a>
            </div>
          ` : `
            <a href="#/login" class="btn btn-primary btn-sm">登录</a>
          `}
        </div>
      </div>
    </nav>
  `;
}

/**
 * 检查是否已登录，未登录则跳转
 */
function requireLogin() {
  if (!API.getToken('user')) {
    window.location.hash = '#/login';
    return false;
  }
  return true;
}

// ============================================================
// 页面渲染函数
// ============================================================

/**
 * 【品牌官网首页】
 * 展示品牌介绍、最新活动预告
 */
async function renderHomePage() {
  const app = document.getElementById('app');

  // 获取最新活动
  let latestActivity = null;
  try {
    const data = await API.get('/player/activities');
    latestActivity = data.activities?.[0];
  } catch (e) { /* 静默失败 */ }

  app.innerHTML = `
    ${renderNavbar()}
    <section class="hero">
      <h1>MOVE · EXPLORE · CONQUER</h1>
      <p>每周一场城市探索挑战，用脚步重新定义你的边界</p>
      <a href="#/activities" class="btn btn-lg" style="background:#fff;color:var(--primary)">查看近期活动</a>
    </section>
    <div class="container">
      ${latestActivity ? `
        <h2 style="margin-top:32px;margin-bottom:8px">🔥 最新活动</h2>
        <div class="activity-grid">
          <div class="activity-card" onclick="location.hash='#/activities/${latestActivity.id}'">
            <div class="activity-card-poster">🎭</div>
            <div class="activity-card-body">
              <h3>${escapeHtml(latestActivity.title)}</h3>
              <div class="activity-card-meta">
                <span>📅 ${escapeHtml(latestActivity.date)}</span>
                <span>📍 ${escapeHtml(latestActivity.location || '待定')}</span>
              </div>
            </div>
            <div class="activity-card-footer">
              <span class="activity-price">¥${latestActivity.fee || 0}</span>
              <span class="tag tag-published">报名中</span>
            </div>
          </div>
        </div>
      ` : `
        <div class="empty-state" style="padding:40px">
          <div class="icon">🎯</div>
          <p>暂无活动，敬请期待</p>
        </div>
      `}
    </div>
    <footer style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px;">
      © 2026 DEEPBEAT ALLIANCE · REWIRE YOUR CITY
    </footer>
  `;
}

/**
 * 【活动宣传/报名页】
 * 展示所有已发布的活动列表
 */
async function renderActivitiesPage() {
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="container"><div class="loading"><div class="spinner"></div>加载中...</div></div>`;

  try {
    const data = await API.get('/player/activities');
    const activities = data.activities || [];

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <h2 style="margin-top:24px">📋 近期活动</h2>
        ${activities.length === 0 ? `
          <div class="empty-state">
            <div class="icon">🎯</div>
            <p>暂无活动，敬请期待</p>
          </div>
        ` : `
          <div class="activity-grid">
            ${activities.map(a => `
              <div class="activity-card" onclick="location.hash='#/activities/${a.id}'">
                <div class="activity-card-poster">🎭</div>
                <div class="activity-card-body">
                  <h3>${escapeHtml(a.title)}</h3>
                  <div class="activity-card-meta">
                    <span>📅 ${escapeHtml(a.date)}</span>
                    <span>📍 ${escapeHtml(a.location || '待定')}</span>
                  </div>
                  <p style="font-size:13px;color:var(--text-light);margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                    ${escapeHtml(a.description || '')}
                  </p>
                </div>
                <div class="activity-card-footer">
                  <span class="activity-price">¥${a.fee || 0}</span>
                  <span style="font-size:12px;color:var(--text-muted)">${a.registered_count}/${a.max_players || '∞'}人</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 【活动详情页】
 * 展示单个活动详情，提供报名入口
 * 路由: #/activities/:id
 */
async function renderActivityDetail(params) {
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="container"><div class="loading"><div class="spinner"></div>加载中...</div></div>`;

  try {
    const data = await API.get(`/player/activities/${params.id}`);
    const a = data.activity;

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container" style="max-width:700px;padding-top:24px;padding-bottom:40px;">
        <div class="card">
          <div style="height:200px;background:linear-gradient(135deg,var(--primary),var(--info));display:flex;align-items:center;justify-content:center;font-size:64px;">🎭</div>
          <div class="card-body">
            <h2>${escapeHtml(a.title)}</h2>
            <div style="display:flex;gap:20px;margin:12px 0;font-size:14px;color:var(--text-light)">
              <span>📅 ${escapeHtml(a.date)}</span>
              <span>📍 ${escapeHtml(a.location || '待定')}</span>
              <span>👥 ${a.registered_count}/${a.max_players || '不限'}人</span>
            </div>
            <div style="margin:16px 0;line-height:1.8;color:var(--text-light);font-size:14px;">
              ${escapeHtml(a.description || '暂无活动介绍')}
            </div>
            <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:24px;font-weight:700;color:var(--danger)">¥${a.fee || 0}</span>
              <button class="btn btn-primary btn-lg" onclick="handleRegister(${a.id})">立即报名</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 【活动报名】处理报名按钮点击
 */
async function handleRegister(activityId) {
  if (!requireLogin()) return;
  try {
    await API.post(`/player/activities/${activityId}/register`, {});
    showToast('报名成功！', 'success');
    setTimeout(() => location.hash = '#/profile', 1500);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【登录页】
 */
function renderLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="auth-page">
      <div class="auth-card">
        <h2>登录</h2>
        <form id="loginForm">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input type="tel" class="form-input" name="phone" placeholder="请输入手机号" required>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" name="password" placeholder="请输入密码" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">登录</button>
        </form>
        <div class="auth-footer">
          还没有账号？<a href="#/register">立即注册</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.post('/auth/login', {
        phone: form.get('phone'),
        password: form.get('password')
      });
      API.setToken(data.token, 'user');
      API.setUser(data.user, 'user');
      showToast('登录成功', 'success');
      setTimeout(() => location.hash = '#/profile', 500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/**
 * 【注册页】
 */
function renderRegisterPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="auth-page">
      <div class="auth-card">
        <h2>注册</h2>
        <form id="registerForm">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input type="tel" class="form-input" name="phone" placeholder="请输入手机号" required>
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" class="form-input" name="nickname" placeholder="给自己取个名字">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" name="password" placeholder="至少6位" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">注册</button>
        </form>
        <div class="auth-footer">
          已有账号？<a href="#/login">去登录</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.post('/auth/register', {
        phone: form.get('phone'),
        password: form.get('password'),
        nickname: form.get('nickname')
      });
      API.setToken(data.token, 'user');
      API.setUser(data.user, 'user');
      showToast('注册成功', 'success');
      setTimeout(() => location.hash = '#/profile', 500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/**
 * 【个人中心首页】
 * 展示个人信息卡片、活动统计、快捷入口
 */
async function renderProfilePage() {
  if (!requireLogin()) return;
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="loading"><div class="spinner"></div>加载中...</div>`;

  try {
    const data = await API.get('/user/profile');
    const u = data.user;
    const stats = data.stats;

    app.innerHTML = `
      ${renderNavbar()}
      <div class="profile-header">
        <div class="profile-avatar">${(u.nickname || '用')[0]}</div>
        <h2>${u.nickname || '未设置昵称'}</h2>
        <div class="profile-stats">
          <div>
            <div class="profile-stat-num">${stats.totalActivities}</div>
            <div class="profile-stat-label">参与活动</div>
          </div>
          <div>
            <div class="profile-stat-num">${stats.totalStamps}</div>
            <div class="profile-stat-label">获得印章</div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="profile-menu">
          <div class="profile-menu-item" onclick="location.hash='#/profile/edit'">
            <span>👤 个人信息</span><span>›</span>
          </div>
          <div class="profile-menu-item" onclick="location.hash='#/stamps'">
            <span>🏆 我的印章</span><span>›</span>
          </div>
          <div class="profile-menu-item" onclick="location.hash='#/activities'">
            <span>📋 浏览活动</span><span>›</span>
          </div>
          <div class="profile-menu-item" onclick="handleLogout()" style="color:var(--danger)">
            <span>🚪 退出登录</span><span></span>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 退出登录
 */
function handleLogout() {
  API.clearToken('user');
  localStorage.removeItem('user_info');
  showToast('已退出登录', 'info');
  location.hash = '#/';
}

/**
 * 【个人信息编辑页】
 */
async function renderProfileEdit() {
  if (!requireLogin()) return;
  const app = document.getElementById('app');

  try {
    const data = await API.get('/user/profile');
    const u = data.user;

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container" style="max-width:500px;padding-top:24px;">
        <div class="card">
          <div class="card-header">编辑个人信息</div>
          <div class="card-body">
            <form id="profileForm">
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input type="text" class="form-input" name="nickname" value="${u.nickname || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">真实姓名</label>
                <input type="text" class="form-input" name="real_name" value="${u.real_name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <input type="email" class="form-input" name="email" value="${u.email || ''}">
              </div>
              <button type="submit" class="btn btn-primary btn-block">保存</button>
            </form>

            <hr style="margin:24px 0;border:none;border-top:1px solid var(--border)">
            <h3 style="font-size:15px;margin-bottom:12px">修改密码</h3>
            <form id="passwordForm">
              <div class="form-group">
                <label class="form-label">旧密码</label>
                <input type="password" class="form-input" name="oldPassword" required>
              </div>
              <div class="form-group">
                <label class="form-label">新密码</label>
                <input type="password" class="form-input" name="newPassword" required minlength="6">
              </div>
              <button type="submit" class="btn btn-outline btn-block">修改密码</button>
            </form>
          </div>
        </div>
      </div>
    `;

    // 保存资料
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        const res = await API.put('/user/profile', {
          nickname: form.get('nickname'),
          real_name: form.get('real_name'),
          email: form.get('email')
        });
        API.setUser(res.user, 'user');
        showToast('资料已更新', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // 修改密码
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      try {
        await API.put('/user/password', {
          oldPassword: form.get('oldPassword'),
          newPassword: form.get('newPassword')
        });
        showToast('密码已修改', 'success');
        e.target.reset();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 【活动邀请函页面】
 * 展示邀请函详情，提供确认参与按钮
 * 路由: #/invitation/:code
 */
async function renderInvitationPage(params) {
  if (!requireLogin()) return;
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="loading"><div class="spinner"></div>加载中...</div>`;

  try {
    const data = await API.get(`/player/invitation/${params.code}`);
    const inv = data.invitation;

    app.innerHTML = `
      ${renderNavbar()}
      <div class="invitation-card">
        <div class="invitation-header">
          <h2>🎭 活动邀请函</h2>
          <p style="opacity:0.8;font-size:14px">诚挚邀请您参加</p>
        </div>
        <div class="invitation-body">
          <h3 style="font-size:18px;margin-bottom:16px">${escapeHtml(inv.activity_title)}</h3>
          <div class="invitation-info">
            <span class="label">📅 时间</span>
            <span>${escapeHtml(inv.activity_date)}</span>
          </div>
          <div class="invitation-info">
            <span class="label">📍 地点</span>
            <span>${escapeHtml(inv.activity_location || '待定')}</span>
          </div>
          <div class="invitation-info">
            <span class="label">👤 受邀人</span>
            <span>${escapeHtml(inv.nickname || inv.real_name || '尊贵的参与者')}</span>
          </div>
          <div class="invitation-info">
            <span class="label">⏰ 有效期</span>
            <span>${escapeHtml(inv.expires_at)}</span>
          </div>
          <div style="margin-top:8px">
            <span class="tag tag-${inv.status}">${
              inv.status === 'confirmed' ? '已确认' : inv.status === 'expired' ? '已过期' : '待确认'
            }</span>
          </div>
        </div>
        <div class="invitation-footer">
          ${inv.status === 'pending' ? `
            <button class="btn btn-primary btn-lg btn-block" onclick="handleConfirmInvitation('${params.code}')">
              ✅ 确认参与
            </button>
          ` : inv.status === 'confirmed' ? `
            <p style="color:var(--success);font-weight:500">✅ 你已确认参与，期待活动当天见！</p>
            <button class="btn btn-outline mt-2" onclick="location.hash='#/tasks/${inv.activity_id}'">
              查看活动任务
            </button>
          ` : `
            <p style="color:var(--danger)">邀请函已过期</p>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 处理邀请函确认
 */
async function handleConfirmInvitation(code) {
  try {
    await API.post(`/player/invitation/${code}/confirm`, {});
    showToast('确认成功！', 'success');
    // 刷新页面
    renderInvitationPage({ code });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【活动信息/任务页】
 * 展示活动详情和任务列表
 * 路由: #/tasks/:activityId
 */
async function renderTasksPage(params) {
  if (!requireLogin()) return;
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="loading"><div class="spinner"></div>加载中...</div>`;

  try {
    const data = await API.get(`/player/tasks/${params.activityId}`);
    const { tasks, total, completed, allDone } = data;

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container" style="max-width:600px;padding-top:24px;">
        <div class="card">
          <div class="card-header flex-between">
            <span>📋 活动任务</span>
            <span style="font-size:13px;color:var(--text-light)">${completed}/${total} 已完成</span>
          </div>
          <div class="card-body">
            ${total === 0 ? `
              <div class="empty-state">
                <div class="icon">📭</div>
                <p>暂无任务</p>
              </div>
            ` : `
              <div style="margin-bottom:16px">
                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${total ? (completed/total*100) : 0}%;background:var(--success);border-radius:4px;transition:width 0.3s"></div>
                </div>
              </div>
              <div class="task-list">
                ${tasks.map((t, i) => `
                  <div class="task-item ${t.completed ? 'completed' : ''}" ${!t.completed ? `onclick="location.hash='#/task-play/${t.id}'"` : ''}>
                    <div class="task-check">${t.completed ? '✓' : (i + 1)}</div>
                    <div style="flex:1">
                      <div style="font-weight:500">${t.title}</div>
                      <div style="font-size:13px;color:var(--text-light)">${t.description || ''}</div>
                    </div>
                    ${t.completed ? '' : '<span style="color:var(--primary);font-size:13px">去完成 →</span>'}
                  </div>
                `).join('')}
              </div>
            `}
            ${allDone ? `
              <div class="text-center mt-2">
                <button class="btn btn-success btn-lg" onclick="location.hash='#/complete/${params.activityId}'">
                  🎉 查看通关结果
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

/**
 * 【线上任务卡页面】
 * 用户在此输入从 NPC 处获得的密码
 * 路由: #/task-play/:taskId
 */
function renderTaskPlayPage(params) {
  if (!requireLogin()) return;
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderNavbar()}
    <div class="task-play-area">
      <div style="font-size:64px;margin-bottom:16px">🔐</div>
      <h2>输入任务密码</h2>
      <p style="color:var(--text-light);margin-bottom:24px">找到 NPC 并获得密码，在此输入验证</p>
      <div class="password-input-group">
        <input type="text" class="form-input" id="taskPassword" placeholder="请输入密码" autocomplete="off">
        <button class="btn btn-primary" onclick="handleVerifyTask(${params.taskId})">验证</button>
      </div>
      <div id="verifyResult" style="margin-top:16px"></div>
    </div>
  `;

  // 回车提交
  document.getElementById('taskPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleVerifyTask(params.taskId);
  });
}

/**
 * 处理任务密码验证
 */
async function handleVerifyTask(taskId) {
  const input = document.getElementById('taskPassword');
  const result = document.getElementById('verifyResult');
  const password = input.value.trim();

  if (!password) {
    result.innerHTML = '<p style="color:var(--danger)">请输入密码</p>';
    return;
  }

  try {
    const data = await API.post(`/player/tasks/${taskId}/verify`, { password });
    result.innerHTML = `<p style="color:var(--success);font-weight:500">✅ ${data.message}</p>`;

    if (data.stampEarned) {
      result.innerHTML += `<p style="color:var(--warning);margin-top:8px">🏆 恭喜获得电子印章！</p>`;
      setTimeout(() => location.hash = `#/complete/${data.activityId}`, 2000);
    } else {
      setTimeout(() => location.hash = `#/tasks/${data.activityId}`, 1500);
    }
  } catch (err) {
    result.innerHTML = `<p style="color:var(--danger)">❌ ${err.message}</p>`;
    input.value = '';
    input.focus();
  }
}

/**
 * 【通关成功页】
 * 所有任务完成后的祝贺页面
 * 路由: #/complete/:activityId
 */
function renderCompletePage(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="complete-page">
      <div class="complete-icon">🎉</div>
      <h1>CONQUERED</h1>
      <p>所有任务已完成，你做到了</p>
      <div style="margin:24px 0">
        <div class="stamp-icon" style="width:100px;height:100px;font-size:40px;margin:0 auto">🏅</div>
        <p style="margin-top:8px;font-weight:500">本期电子印章已收入囊中</p>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#/stamps" class="btn btn-primary">查看印章墙</a>
        <a href="#/profile" class="btn btn-outline">返回个人中心</a>
      </div>
    </div>
  `;
}

/**
 * 【电子印章墙】
 * 展示用户获得的所有电子印章
 */
async function renderStampsPage() {
  if (!requireLogin()) return;
  const app = document.getElementById('app');
  app.innerHTML = `${renderNavbar()}<div class="loading"><div class="spinner"></div>加载中...</div>`;

  try {
    const data = await API.get('/user/stamps');
    const stamps = data.stamps || [];

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <h2 style="margin-top:24px">🏆 我的印章墙</h2>
        <p style="color:var(--text-light);margin-bottom:16px">共获得 ${stamps.length} 枚印章</p>
        ${stamps.length === 0 ? `
          <div class="empty-state">
            <div class="icon">🏅</div>
            <p>还没有印章，参加活动并通关即可获得</p>
            <a href="#/activities" class="btn btn-primary mt-2">去参加活动</a>
          </div>
        ` : `
          <div class="stamps-grid">
            ${stamps.map(s => `
              <div class="stamp-item">
                <div class="stamp-icon">🏅</div>
                <div class="stamp-name">${s.activity_title}</div>
                <div class="stamp-date">${s.activity_date}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `${renderNavbar()}<div class="container"><div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div></div>`;
  }
}

// ============================================================
// 路由注册
// ============================================================
const router = new Router();

router.add('#/', renderHomePage);
router.add('#/activities', renderActivitiesPage);
router.add('#/activities/:id', renderActivityDetail);
router.add('#/login', renderLoginPage);
router.add('#/register', renderRegisterPage);
router.add('#/profile', renderProfilePage);
router.add('#/profile/edit', renderProfileEdit);
router.add('#/invitation/:code', renderInvitationPage);
router.add('#/tasks/:activityId', renderTasksPage);
router.add('#/task-play/:taskId', renderTaskPlayPage);
router.add('#/complete/:activityId', renderCompletePage);
router.add('#/stamps', renderStampsPage);

// 启动路由
router.start();
