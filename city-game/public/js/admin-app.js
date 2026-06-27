/**
 * 管理端应用 - admin-app.js
 * 
 * 所有管理端页面的渲染函数和交互逻辑
 * 使用 hash-based 路由
 * 
 * 页面清单：
 *   renderAdminLogin()       - 管理员登录页
 *   renderDashboard()        - 仪表盘首页
 *   renderActivitiesAdmin()  - 活动管理页
 *   renderUsersAdmin()       - 用户管理页
 *   renderInvitationsAdmin() - 邀请函管理页
 *   renderTasksAdmin()       - 任务配置页
 *   renderBrandsAdmin()      - 品牌/联名管理页
 *   renderSettingsAdmin()    - 系统设置页
 */

// ============================================================
// 工具函数（escapeHtml, showToast 来自 utils.js）
// ============================================================

function requireAdmin() {
  if (!API.getToken('admin')) {
    window.location.hash = '#/admin/login';
    return false;
  }
  return true;
}

/**
 * 【全局组件】管理端侧边栏
 */
function renderSidebar(activePage) {
  const admin = API.getUser('admin');
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>DEEPBEAT</h2>
        <small>ADMIN PANEL</small>
      </div>
      <nav class="sidebar-nav">
        <a class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}" href="#/admin/dashboard">📊 仪表盘</a>
        <a class="sidebar-link ${activePage === 'activities' ? 'active' : ''}" href="#/admin/activities">📋 活动管理</a>
        <a class="sidebar-link ${activePage === 'invitations' ? 'active' : ''}" href="#/admin/invitations">✉️ 邀请函管理</a>
        <a class="sidebar-link ${activePage === 'users' ? 'active' : ''}" href="#/admin/users">👥 用户管理</a>
        <a class="sidebar-link ${activePage === 'tasks' ? 'active' : ''}" href="#/admin/tasks">🎯 任务配置</a>
        <a class="sidebar-link ${activePage === 'brands' ? 'active' : ''}" href="#/admin/brands">🤝 品牌管理</a>
        <a class="sidebar-link ${activePage === 'settings' ? 'active' : ''}" href="#/admin/settings">⚙️ 系统设置</a>
        <a class="sidebar-link ${activePage === 'invite-codes' ? 'active' : ''}" href="#/admin/invite-codes">🎟️ 邀请码管理</a>
        <div style="margin:16px 20px 8px;border-top:1px solid var(--border)"></div>
        <div style="padding:8px 20px;font-size:11px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em">游戏系统</div>
        <a class="sidebar-link ${activePage === 'game-dashboard' ? 'active' : ''}" href="#/admin/game/dashboard">🎮 游戏监控</a>
        <a class="sidebar-link ${activePage === 'game-games' ? 'active' : ''}" href="#/admin/game/games">📁 场次管理</a>
        <a class="sidebar-link ${activePage === 'game-characters' ? 'active' : ''}" href="#/admin/game/characters">🎭 角色管理</a>
        <a class="sidebar-link ${activePage === 'game-stages' ? 'active' : ''}" href="#/admin/game/stages">📋 阶段管理</a>
        <a class="sidebar-link ${activePage === 'game-scripts' ? 'active' : ''}" href="#/admin/game/scripts">📖 剧本配置</a>
        <a class="sidebar-link ${activePage === 'game-passcodes' ? 'active' : ''}" href="#/admin/game/passcodes">🔑 通关码</a>
        <a class="sidebar-link ${activePage === 'game-players' ? 'active' : ''}" href="#/admin/game/players">👥 玩家进度</a>
      </nav>
      <div class="sidebar-footer">
        <span style="color:rgba(255,255,255,0.5);font-size:13px">👤 ${admin?.username || 'admin'}</span>
        <br>
        <a href="#" onclick="handleAdminLogout()" style="color:rgba(255,255,255,0.5);font-size:12px">退出登录</a>
      </div>
    </aside>
  `;
}

function handleAdminLogout() {
  API.clearToken('admin');
  localStorage.removeItem('admin_info');
  location.hash = '#/admin/login';
}

/**
 * 【全局组件】管理端主布局包装器
 */
function adminLayout(pageTitle, activePage, content) {
  return `
    <div class="admin-layout">
      ${renderSidebar(activePage)}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>${pageTitle}</h1>
        </div>
        <div class="admin-content">
          ${content}
        </div>
      </main>
    </div>
  `;
}

// ============================================================
// 页面渲染函数
// ============================================================

/**
 * 【管理员登录页】
 */
function renderAdminLogin() {
  const app = document.getElementById('admin-app');
  app.innerHTML = `
    <div class="admin-login-page">
      <div class="admin-login-card">
        <h2>🔧 管理后台</h2>
        <p>城市活动管理系统</p>
        <form id="adminLoginForm">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-input" name="username" placeholder="请输入用户名" required>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" name="password" placeholder="请输入密码" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">登录</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.post('/admin/login', {
        username: form.get('username'),
        password: form.get('password')
      }, 'admin');
      API.setToken(data.token, 'admin');
      API.setUser(data.admin, 'admin');
      showToast('登录成功', 'success');
      location.hash = '#/admin/dashboard';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/**
 * 【仪表盘首页】
 * 展示系统概览数据和最近动态
 */
async function renderDashboard() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('仪表盘', 'dashboard', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await API.get('/admin/dashboard', 'admin');
    const { totalUsers, newUsersWeek, currentActivity, currentStats, recentEvents } = data;

    document.querySelector('.admin-content').innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="label">总用户数</div>
          <div class="value">${totalUsers}</div>
        </div>
        <div class="stat-card">
          <div class="label">本周新增</div>
          <div class="value">${newUsersWeek}</div>
        </div>
        <div class="stat-card">
          <div class="label">当前活动报名</div>
          <div class="value">${currentStats?.registrations || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">邀请函已发</div>
          <div class="value">${currentStats?.invitations || 0}</div>
        </div>
      </div>

      ${currentActivity ? `
        <div class="card mb-2">
          <div class="card-header">📌 当前活动：${escapeHtml(currentActivity.title)}</div>
          <div class="card-body">
            <p style="font-size:14px;color:var(--text-light)">
              📅 ${currentActivity.date} &nbsp; 📍 ${currentActivity.location || '待定'}
            </p>
          </div>
        </div>
      ` : ''}

      <div class="recent-events">
        <div class="recent-events-header">最近动态</div>
        ${recentEvents && recentEvents.length > 0 ? recentEvents.map(e => `
          <div class="event-item">
            <span class="event-type">${e.type}</span>
            <span style="flex:1">${e.detail}</span>
            <span style="font-size:12px;color:var(--text-muted)">${e.created_at}</span>
          </div>
        `).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted)">暂无动态</div>'}
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

/**
 * 【活动管理页】
 * 活动的列表、创建、编辑、删除
 */
async function renderActivitiesAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('活动管理', 'activities', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await API.get('/admin/activities', 'admin');
    const activities = data.activities || [];

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <div class="filter-bar">
          <span class="filter-chip active" onclick="filterActivities('', event)">全部</span>
          <span class="filter-chip" onclick="filterActivities('draft', event)">草稿</span>
          <span class="filter-chip" onclick="filterActivities('published', event)">已发布</span>
          <span class="filter-chip" onclick="filterActivities('archived', event)">已归档</span>
        </div>
        <button class="btn btn-primary" onclick="showActivityModal()">+ 创建活动</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>活动名称</th>
              <th>日期</th>
              <th>地点</th>
              <th>费用</th>
              <th>报名</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="activitiesTableBody">
            ${activities.map(a => `
              <tr>
                <td><strong>${escapeHtml(a.title)}</strong></td>
                <td>${escapeHtml(a.date)}</td>
                <td>${escapeHtml(a.location || '-')}</td>
                <td>¥${a.fee || 0}</td>
                <td>${a.registered_count}/${a.max_players || '∞'}</td>
                <td><span class="tag tag-${a.status}">${a.status === 'draft' ? '草稿' : a.status === 'published' ? '已发布' : '已归档'}</span></td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-outline" onclick="showActivityModal(${a.id})">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteActivity(${a.id})">删除</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

/**
 * 【活动管理】显示创建/编辑弹窗
 */
async function showActivityModal(id) {
  let activity = { title: '', description: '', date: '', location: '', fee: 0, max_players: 0, status: 'draft' };

  if (id) {
    try {
      const data = await API.get(`/admin/activities/${id}`, 'admin');
      activity = data.activity;
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${id ? '编辑活动' : '创建活动'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="activityForm">
          <div class="form-group">
            <label class="form-label">活动名称 *</label>
            <input type="text" class="form-input" name="title" value="${activity.title}" required>
          </div>
          <div class="form-group">
            <label class="form-label">活动日期 *</label>
            <input type="date" class="form-input" name="date" value="${activity.date}" required>
          </div>
          <div class="form-group">
            <label class="form-label">地点</label>
            <input type="text" class="form-input" name="location" value="${activity.location || ''}">
          </div>
          <div style="display:flex;gap:12px">
            <div class="form-group" style="flex:1">
              <label class="form-label">费用 (元)</label>
              <input type="number" class="form-input" name="fee" value="${activity.fee || 0}" min="0">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">人数上限 (0=不限)</label>
              <input type="number" class="form-input" name="max_players" value="${activity.max_players || 0}" min="0">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select class="form-input" name="status">
              <option value="draft" ${activity.status === 'draft' ? 'selected' : ''}>草稿</option>
              <option value="published" ${activity.status === 'published' ? 'selected' : ''}>已发布</option>
              <option value="archived" ${activity.status === 'archived' ? 'selected' : ''}>已归档</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">活动介绍</label>
            <textarea class="form-input" name="description" rows="4">${activity.description || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveActivity(${id || 'null'})">${id ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

/**
 * 【活动管理】保存活动
 */
async function saveActivity(id) {
  const form = document.getElementById('activityForm');
  const formData = new FormData(form);
  const body = {
    title: formData.get('title'),
    description: formData.get('description'),
    date: formData.get('date'),
    location: formData.get('location'),
    fee: parseFloat(formData.get('fee')) || 0,
    max_players: parseInt(formData.get('max_players')) || 0,
    status: formData.get('status')
  };

  try {
    if (id) {
      await API.put(`/admin/activities/${id}`, body, 'admin');
      showToast('活动已更新', 'success');
    } else {
      await API.post('/admin/activities', body, 'admin');
      showToast('活动已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    renderActivitiesAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteActivity(id) {
  if (!confirm('确定删除该活动？')) return;
  try {
    await API.delete(`/admin/activities/${id}`, 'admin');
    showToast('活动已删除', 'success');
    renderActivitiesAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function filterActivities(status, evt) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');
  try {
    const url = status ? `/admin/activities?status=${status}` : '/admin/activities';
    const data = await API.get(url, 'admin');
    const activities = data.activities || [];
    document.getElementById('activitiesTableBody').innerHTML = activities.map(a => `
      <tr>
        <td><strong>${a.title}</strong></td>
        <td>${a.date}</td>
        <td>${a.location || '-'}</td>
        <td>¥${a.fee || 0}</td>
        <td>${a.registered_count}/${a.max_players || '∞'}</td>
        <td><span class="tag tag-${a.status}">${a.status === 'draft' ? '草稿' : a.status === 'published' ? '已发布' : '已归档'}</span></td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="showActivityModal(${a.id})">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="deleteActivity(${a.id})">删除</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无活动</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【用户管理页】
 * 用户列表、搜索、查看详情
 */
async function renderUsersAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('用户管理', 'users', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await API.get('/admin/users', 'admin');

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <div class="table-search">
          <input type="text" class="form-input" id="userSearch" placeholder="搜索昵称/手机/邮箱..." onkeydown="if(event.key==='Enter')searchUsers()">
          <button class="btn btn-outline" onclick="searchUsers()">搜索</button>
        </div>
        <a href="/api/admin/users/export/csv" class="btn btn-outline" target="_blank">📥 导出CSV</a>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>昵称</th>
              <th>姓名</th>
              <th>手机</th>
              <th>邮箱</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            ${data.users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.nickname || '-'}</td>
                <td>${u.real_name || '-'}</td>
                <td>${u.phone}</td>
                <td>${u.email || '-'}</td>
                <td>${u.created_at}</td>
                <td>
                  <button class="btn btn-sm btn-outline" onclick="showUserDetail(${u.id})">详情</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="table-pagination">
          <span>共 ${data.total} 位用户</span>
        </div>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

async function searchUsers() {
  const search = document.getElementById('userSearch').value.trim();
  try {
    const data = await API.get(`/admin/users?search=${encodeURIComponent(search)}`, 'admin');
    document.getElementById('usersTableBody').innerHTML = data.users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.nickname || '-'}</td>
        <td>${u.real_name || '-'}</td>
        <td>${u.phone}</td>
        <td>${u.email || '-'}</td>
        <td>${u.created_at}</td>
        <td><button class="btn btn-sm btn-outline" onclick="showUserDetail(${u.id})">详情</button></td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">未找到用户</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function showUserDetail(id) {
  try {
    const data = await API.get(`/admin/users/${id}`, 'admin');
    const { user, activities, stamps } = data;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3>用户详情</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <p><strong>昵称：</strong>${escapeHtml(user.nickname || '-')}</p>
          <p><strong>姓名：</strong>${escapeHtml(user.real_name || '-')}</p>
          <p><strong>手机：</strong>${escapeHtml(user.phone)}</p>
          <p><strong>邮箱：</strong>${escapeHtml(user.email || '-')}</p>
          <p><strong>注册时间：</strong>${user.created_at}</p>
          <hr style="margin:12px 0;border:none;border-top:1px solid var(--border)">
          <h4 style="font-size:14px;margin-bottom:8px">活动历史 (${activities.length})</h4>
          ${activities.map(a => `<p style="font-size:13px">📋 ${a.title} · ${a.date} <span class="tag tag-${a.status}">${a.status}</span></p>`).join('') || '<p style="color:var(--text-muted);font-size:13px">暂无</p>'}
          <hr style="margin:12px 0;border:none;border-top:1px solid var(--border)">
          <h4 style="font-size:14px;margin-bottom:8px">电子印章 (${stamps.length})</h4>
          ${stamps.map(s => `<p style="font-size:13px">🏅 ${s.activity_title} · ${s.earned_at}</p>`).join('') || '<p style="color:var(--text-muted);font-size:13px">暂无</p>'}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【邀请函管理页】
 * 邀请函列表、批量生成、作废
 */
async function renderInvitationsAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('邀请函管理', 'invitations', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const [invData, actData] = await Promise.all([
      API.get('/admin/invitations', 'admin'),
      API.get('/admin/activities', 'admin')
    ]);

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <div class="flex gap-1">
          <select class="form-input" id="invActivityFilter" style="width:200px" onchange="filterInvitations()">
            <option value="">全部活动</option>
            ${actData.activities.map(a => `<option value="${a.id}">${a.title}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="showGenerateInvModal()">+ 生成邀请函</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>手机</th>
              <th>活动</th>
              <th>状态</th>
              <th>有效期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="invTableBody">
            ${invData.invitations.map(i => `
              <tr>
                <td>${i.nickname || '-'}</td>
                <td>${i.phone}</td>
                <td>${i.activity_title}</td>
                <td><span class="tag tag-${i.status}">${i.status === 'confirmed' ? '已确认' : i.status === 'expired' ? '已过期' : '待确认'}</span></td>
                <td>${i.expires_at}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-outline" onclick="copyInvLink('${i.unique_code}')">复制链接</button>
                  <button class="btn btn-sm btn-outline" onclick="editInvitationContent(${i.id})">编辑</button>
                  ${i.status !== 'expired' ? `<button class="btn btn-sm btn-danger" onclick="revokeInvitation(${i.id})">作废</button>` : ''}
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">暂无邀请函</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

function copyInvLink(code) {
  const url = `${window.location.origin}/invitation/view/${code}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast('链接已复制', 'success'))
      .catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('链接已复制', 'success');
  } catch (e) {
    showToast('复制失败，请手动复制: ' + text, 'error');
  }
  document.body.removeChild(ta);
}

/**
 * 【邀请函管理】编辑已有邀请函内容
 */
async function editInvitationContent(id) {
  try {
    const data = await API.get('/admin/invitations', 'admin');
    const inv = data.invitations.find(i => i.id === id);
    if (!inv) return showToast('邀请函不存在', 'error');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3>编辑邀请函内容</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">受邀人</label>
            <input type="text" class="form-input" id="editGuestName" value="${escapeHtml(inv.guest_name || inv.nickname || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">标题</label>
            <input type="text" class="form-input" id="editInvTitle" value="${escapeHtml(inv.title || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">副标题</label>
            <input type="text" class="form-input" id="editInvSubtitle" value="${escapeHtml(inv.subtitle || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">正文</label>
            <textarea class="form-input" id="editInvBody" rows="3">${escapeHtml(inv.body || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">底部备注</label>
            <input type="text" class="form-input" id="editInvFooter" value="${escapeHtml(inv.footer || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">模板</label>
            <select class="form-input" id="editInvTemplate">
              <option value="classic" ${inv.template === 'classic' ? 'selected' : ''}>经典红</option>
              <option value="golden" ${inv.template === 'golden' ? 'selected' : ''}>黑金</option>
              <option value="minimal" ${inv.template === 'minimal' ? 'selected' : ''}>极简</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
          <button class="btn btn-primary" onclick="saveInvitationContent(${id})">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveInvitationContent(id) {
  const body = {
    guest_name: document.getElementById('editGuestName').value,
    title: document.getElementById('editInvTitle').value,
    subtitle: document.getElementById('editInvSubtitle').value,
    body: document.getElementById('editInvBody').value,
    footer: document.getElementById('editInvFooter').value,
    template: document.getElementById('editInvTemplate').value
  };
  try {
    await API.put(`/admin/invitations/${id}/content`, body, 'admin');
    showToast('邀请函内容已更新', 'success');
    document.querySelector('.modal-overlay').remove();
    renderInvitationsAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function revokeInvitation(id) {
  if (!confirm('确定作废该邀请函？')) return;
  try {
    await API.put(`/admin/invitations/${id}/revoke`, {}, 'admin');
    showToast('邀请函已作废', 'success');
    renderInvitationsAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function filterInvitations() {
  const activityId = document.getElementById('invActivityFilter').value;
  try {
    const url = activityId ? `/admin/invitations?activity_id=${activityId}` : '/admin/invitations';
    const data = await API.get(url, 'admin');
    document.getElementById('invTableBody').innerHTML = data.invitations.map(i => `
      <tr>
        <td>${i.nickname || '-'}</td>
        <td>${i.phone}</td>
        <td>${i.activity_title}</td>
        <td><span class="tag tag-${i.status}">${i.status === 'confirmed' ? '已确认' : i.status === 'expired' ? '已过期' : '待确认'}</span></td>
        <td>${i.expires_at}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="copyInvLink('${i.unique_code}')">复制链接</button>
          <button class="btn btn-sm btn-outline" onclick="editInvitationContent(${i.id})">编辑</button>
          ${i.status !== 'expired' ? `<button class="btn btn-sm btn-danger" onclick="revokeInvitation(${i.id})">作废</button>` : ''}
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无邀请函</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【邀请函管理】显示批量生成弹窗（带内容编辑 + 模板选择）
 */
async function showGenerateInvModal() {
  try {
    const [actData, userData] = await Promise.all([
      API.get('/admin/activities', 'admin'),
      API.get('/admin/users', 'admin')
    ]);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:640px;max-height:90vh">
        <div class="modal-header">
          <h3>生成邀请函</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body" style="max-height:70vh;overflow-y:auto">
          <!-- 第一步：选活动和用户 -->
          <div class="form-group">
            <label class="form-label">选择活动 *</label>
            <select class="form-input" id="genInvActivity">
              <option value="">请选择</option>
              ${actData.activities.filter(a => a.status === 'published').map(a => `<option value="${a.id}">${a.title} (${a.date})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">选择受邀人 *</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);padding:8px">
              ${userData.users.map(u => `
                <label style="display:flex;align-items:center;gap:8px;padding:6px 4px;font-size:14px;cursor:pointer">
                  <input type="checkbox" name="user_ids" value="${u.id}">
                  ${escapeHtml(u.nickname || u.phone)} (${u.phone})
                </label>
              `).join('')}
            </div>
          </div>

          <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">

          <!-- 第二步：编辑内容 -->
          <div class="form-group">
            <label class="form-label">邀请函标题</label>
            <input type="text" class="form-input" id="invTitle" value="诚挚邀请" placeholder="例：诚挚邀请">
          </div>
          <div class="form-group">
            <label class="form-label">副标题</label>
            <input type="text" class="form-input" id="invSubtitle" placeholder="留空则使用活动名称">
          </div>
          <div class="form-group">
            <label class="form-label">受邀人称呼</label>
            <input type="text" class="form-input" id="invGuestName" placeholder="留空则使用用户昵称">
          </div>
          <div class="form-group">
            <label class="form-label">正文内容</label>
            <textarea class="form-input" id="invBody" rows="3" placeholder="留空则自动生成"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">底部备注</label>
            <input type="text" class="form-input" id="invFooter" value="请凭此邀请函准时出席" placeholder="">
          </div>

          <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">

          <!-- 第三步：选模板 -->
          <div class="form-group">
            <label class="form-label">邀请函模板</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <label class="template-option" style="flex:1;min-width:100px">
                <input type="radio" name="invTemplate" value="classic" checked style="display:none">
                <div class="template-preview" style="padding:12px;border:2px solid var(--border);border-radius:var(--radius);text-align:center;cursor:pointer;transition:var(--transition)">
                  <div style="font-size:20px;margin-bottom:4px">🔥</div>
                  <div style="font-size:12px;font-weight:600">经典红</div>
                </div>
              </label>
              <label class="template-option" style="flex:1;min-width:100px">
                <input type="radio" name="invTemplate" value="golden" style="display:none">
                <div class="template-preview" style="padding:12px;border:2px solid var(--border);border-radius:var(--radius);text-align:center;cursor:pointer;transition:var(--transition)">
                  <div style="font-size:20px;margin-bottom:4px">✨</div>
                  <div style="font-size:12px;font-weight:600">黑金</div>
                </div>
              </label>
              <label class="template-option" style="flex:1;min-width:100px">
                <input type="radio" name="invTemplate" value="minimal" style="display:none">
                <div class="template-preview" style="padding:12px;border:2px solid var(--border);border-radius:var(--radius);text-align:center;cursor:pointer;transition:var(--transition)">
                  <div style="font-size:20px;margin-bottom:4px">◻️</div>
                  <div style="font-size:12px;font-weight:600">极简</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="previewInvitation()">👁 预览</button>
          <button class="btn btn-primary" onclick="generateInvitations()">生成邀请函</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 模板选择高亮
    document.querySelectorAll('.template-option input[type=radio]').forEach(radio => {
      radio.addEventListener('change', function() {
        document.querySelectorAll('.template-preview').forEach(p => {
          p.style.borderColor = 'var(--border)';
          p.style.background = 'transparent';
        });
        if (this.checked) {
          this.nextElementSibling.style.borderColor = 'var(--primary)';
          this.nextElementSibling.style.background = 'rgba(255,61,20,0.06)';
        }
      });
      // 默认选中高亮
      if (radio.checked) {
        radio.nextElementSibling.style.borderColor = 'var(--primary)';
        radio.nextElementSibling.style.background = 'rgba(255,61,20,0.06)';
      }
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【邀请函管理】预览邀请函
 */
function previewInvitation() {
  const title = document.getElementById('invTitle').value || '诚挚邀请';
  const subtitle = document.getElementById('invSubtitle').value || '活动名称';
  const body = document.getElementById('invBody').value || '邀请函正文内容...';
  const footer = document.getElementById('invFooter').value || '';
  const guestName = document.getElementById('invGuestName').value || '尊敬的嘉宾';
  const template = document.querySelector('input[name=invTemplate]:checked')?.value || 'classic';

  // 打开预览窗口
  const previewWin = window.open('', '_blank', 'width=520,height=700');
  previewWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>邀请函预览</title><style>body{margin:0;padding:24px;background:#0D0C0B;display:flex;justify-content:center}</style></head><body></body></html>`);

  // 加载 invitation.html 的样式，然后填充预览数据
  const link = previewWin.document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/common.css';
  previewWin.document.head.appendChild(link);

  // 直接用模板渲染
  renderPreviewInWindow(previewWin, { title, subtitle, body, footer, guest_name: guestName, template, activity_date: '预览', activity_location: '预览', status: 'pending' });
}

function renderPreviewInWindow(win, inv) {
  var tpl = inv.template || 'classic';
  var html = `
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
      :root { --primary:#FF3D14; --gold:#FFD24A; --bg:#0D0C0B; --card:#100E0C; --text:#F6F1E9; --text-light:#B8AEA4; --text-muted:#8A8178; --border:rgba(255,255,255,0.08); --font-display:"Anton","Noto Sans SC",sans-serif; --font-body:"Space Grotesk","Noto Sans SC",sans-serif; }
      body { background:var(--bg); color:var(--text); font-family:var(--font-body); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; -webkit-font-smoothing:antialiased; }
      .invitation { width:100%; max-width:480px; }
      .inv-card { background:var(--card); border:1px solid var(--border); border-radius:18px; overflow:hidden; position:relative; }
      .tpl-golden .inv-card { background:linear-gradient(165deg,#1A1714,#0D0C0B); border-color:rgba(255,210,74,0.15); }
      .tpl-minimal .inv-card { border-radius:4px; }
      .inv-glow { position:absolute; top:-40%; left:50%; transform:translateX(-50%); width:300px; height:300px; background:radial-gradient(circle,rgba(255,61,20,0.12) 0%,transparent 70%); pointer-events:none; }
      .tpl-golden .inv-glow { background:radial-gradient(circle,rgba(255,210,74,0.08) 0%,transparent 70%); }
      .tpl-minimal .inv-glow { display:none; }
      .inv-header { padding:48px 32px 32px; text-align:center; border-bottom:1px solid var(--border); position:relative; }
      .tpl-golden .inv-header { border-bottom-color:rgba(255,210,74,0.1); }
      .tpl-minimal .inv-header { text-align:left; padding:40px 32px 28px; }
      .inv-badge { display:inline-block; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--primary); background:rgba(255,61,20,0.1); padding:6px 16px; border-radius:999px; margin-bottom:20px; }
      .tpl-golden .inv-badge { color:var(--gold); background:none; letter-spacing:3px; }
      .tpl-minimal .inv-badge { background:none; font-family:monospace; color:var(--text-muted); letter-spacing:1px; }
      .inv-title { font-family:var(--font-display); font-size:40px; letter-spacing:1px; line-height:1.1; margin-bottom:8px; }
      .tpl-golden .inv-title { font-size:44px; color:var(--gold); letter-spacing:2px; }
      .tpl-minimal .inv-title { font-size:36px; letter-spacing:0; }
      .inv-subtitle { font-size:16px; color:var(--text-light); font-weight:500; }
      .tpl-minimal .inv-subtitle { font-size:14px; color:var(--text-muted); }
      .inv-body { padding:32px; position:relative; }
      .tpl-minimal .inv-body { padding:0 32px 32px; }
      .inv-guest { font-size:20px; font-weight:700; margin-bottom:16px; }
      .tpl-golden .inv-guest { color:var(--gold); font-size:22px; }
      .tpl-minimal .inv-guest { font-size:16px; font-weight:600; }
      .inv-text { font-size:15px; line-height:1.8; color:var(--text-light); margin-bottom:24px; }
      .inv-details { display:flex; flex-direction:column; gap:12px; padding:20px 24px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; }
      .tpl-golden .inv-details { background:rgba(255,210,74,0.04); border-color:rgba(255,210,74,0.1); }
      .tpl-minimal .inv-details { background:none; border:none; border-top:1px solid var(--border); border-radius:0; padding:16px 0; }
      .inv-detail-row { display:flex; align-items:center; gap:10px; font-size:14px; }
      .inv-detail-label { color:var(--text-muted); min-width:48px; font-size:12px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; }
      .tpl-golden .inv-detail-label { color:var(--gold); opacity:0.7; }
      .tpl-minimal .inv-detail-label { min-width:40px; font-size:11px; }
      .inv-detail-value { color:var(--text); font-weight:500; }
      .inv-footer { padding:20px 32px 28px; text-align:center; border-top:1px solid var(--border); }
      .tpl-golden .inv-footer { border-top-color:rgba(255,210,74,0.1); }
      .tpl-minimal .inv-footer { border-top:1px solid var(--border); }
      .inv-footer-text { font-size:13px; color:var(--text-muted); }
      .inv-status { display:inline-block; margin-top:16px; padding:8px 20px; border-radius:10px; font-size:14px; font-weight:600; }
      .inv-status-pending { background:rgba(255,210,74,0.15); color:var(--gold); }
    </style>
    <div class="invitation tpl-${tpl}">
      <div class="inv-card">
        <div class="inv-glow"></div>
        <div class="inv-header">
          <div class="inv-badge">INVITATION</div>
          <div class="inv-title">${escapeHtml(inv.title)}</div>
          <div class="inv-subtitle">${escapeHtml(inv.subtitle)}</div>
        </div>
        <div class="inv-body">
          <div class="inv-guest">${escapeHtml(inv.guest_name)}</div>
          <div class="inv-text">${escapeHtml(inv.body)}</div>
          <div class="inv-details">
            <div class="inv-detail-row"><span class="inv-detail-label">时间</span><span class="inv-detail-value">${escapeHtml(inv.activity_date)}</span></div>
            <div class="inv-detail-row"><span class="inv-detail-label">地点</span><span class="inv-detail-value">${escapeHtml(inv.activity_location)}</span></div>
          </div>
        </div>
        <div class="inv-footer">
          <div class="inv-footer-text">${escapeHtml(inv.footer)}</div>
          <div class="inv-status inv-status-pending">待确认</div>
        </div>
      </div>
    </div>
  `;
  win.document.body.innerHTML = html;
}

async function generateInvitations() {
  const activityId = document.getElementById('genInvActivity').value;
  const checkboxes = document.querySelectorAll('input[name="user_ids"]:checked');
  const userIds = Array.from(checkboxes).map(c => parseInt(c.value));

  if (!activityId) return showToast('请选择活动', 'error');
  if (userIds.length === 0) return showToast('请至少选择一个用户', 'error');

  const body = {
    activity_id: parseInt(activityId),
    user_ids: userIds,
    title: document.getElementById('invTitle').value || undefined,
    subtitle: document.getElementById('invSubtitle').value || undefined,
    body: document.getElementById('invBody').value || undefined,
    footer: document.getElementById('invFooter').value || undefined,
    guest_name: document.getElementById('invGuestName').value || undefined,
    template: document.querySelector('input[name=invTemplate]:checked')?.value || 'classic'
  };

  try {
    const data = await API.post('/admin/invitations/generate', body, 'admin');
    showToast(data.message, 'success');
    document.querySelector('.modal-overlay').remove();
    renderInvitationsAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【任务配置页】
 * 任务的列表、创建、编辑、删除
 */
async function renderTasksAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('任务配置', 'tasks', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const [taskData, actData] = await Promise.all([
      API.get('/admin/tasks', 'admin'),
      API.get('/admin/activities', 'admin')
    ]);

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <select class="form-input" id="taskActivityFilter" style="width:200px" onchange="filterTasks()">
          <option value="">全部活动</option>
          ${actData.activities.map(a => `<option value="${a.id}">${a.title}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="showTaskModal()">+ 创建任务</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>排序</th>
              <th>任务名称</th>
              <th>描述</th>
              <th>所属活动</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="tasksTableBody">
            ${taskData.tasks.map(t => `
              <tr>
                <td>${t.sort_order}</td>
                <td><strong>${t.title}</strong></td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description || '-'}</td>
                <td>${actData.activities.find(a => a.id === t.activity_id)?.title || '-'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-outline" onclick="showTaskModal(${t.id})">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">删除</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">暂无任务</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

async function filterTasks() {
  const activityId = document.getElementById('taskActivityFilter').value;
  try {
    const url = activityId ? `/admin/tasks?activity_id=${activityId}` : '/admin/tasks';
    const [taskData, actData] = await Promise.all([
      API.get(url, 'admin'),
      API.get('/admin/activities', 'admin')
    ]);
    document.getElementById('tasksTableBody').innerHTML = taskData.tasks.map(t => `
      <tr>
        <td>${t.sort_order}</td>
        <td><strong>${t.title}</strong></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description || '-'}</td>
        <td>${actData.activities.find(a => a.id === t.activity_id)?.title || '-'}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="showTaskModal(${t.id})">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">删除</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">暂无任务</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function showTaskModal(id) {
  let task = { activity_id: '', title: '', description: '', password: '', sort_order: 0 };
  if (id) {
    try {
      const data = await API.get(`/admin/tasks?activity_id=`, 'admin');
      task = data.tasks.find(t => t.id === id) || task;
    } catch (e) {}
  }

  let activities = [];
  try {
    const data = await API.get('/admin/activities', 'admin');
    activities = data.activities;
  } catch (e) {}

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${id ? '编辑任务' : '创建任务'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="taskForm">
          <div class="form-group">
            <label class="form-label">所属活动 *</label>
            <select class="form-input" name="activity_id" required>
              <option value="">请选择</option>
              ${activities.map(a => `<option value="${a.id}" ${task.activity_id === a.id ? 'selected' : ''}>${a.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">任务名称 *</label>
            <input type="text" class="form-input" name="title" value="${task.title}" required>
          </div>
          <div class="form-group">
            <label class="form-label">NPC密码 *</label>
            <input type="text" class="form-input" name="password" placeholder="${id ? '留空则不修改' : '设置NPC给玩家的密码'}" ${id ? '' : 'required'}>
          </div>
          <div class="form-group">
            <label class="form-label">排序 (数字越小越靠前)</label>
            <input type="number" class="form-input" name="sort_order" value="${task.sort_order || 0}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">任务描述</label>
            <textarea class="form-input" name="description" rows="3">${task.description || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveTask(${id || 'null'})">${id ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function saveTask(id) {
  const form = document.getElementById('taskForm');
  const formData = new FormData(form);
  const body = {
    activity_id: parseInt(formData.get('activity_id')),
    title: formData.get('title'),
    description: formData.get('description'),
    sort_order: parseInt(formData.get('sort_order')) || 0
  };
  const password = formData.get('password');
  if (password) body.password = password;

  if (!body.activity_id) return showToast('请选择活动', 'error');

  try {
    if (id) {
      await API.put(`/admin/tasks/${id}`, body, 'admin');
      showToast('任务已更新', 'success');
    } else {
      body.password = password;
      await API.post('/admin/tasks', body, 'admin');
      showToast('任务已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    renderTasksAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('确定删除该任务？')) return;
  try {
    await API.delete(`/admin/tasks/${id}`, 'admin');
    showToast('任务已删除', 'success');
    renderTasksAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【品牌/联名管理页】
 */
async function renderBrandsAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('品牌管理', 'brands', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await API.get('/admin/brands', 'admin');
    const brands = data.brands || [];

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <span></span>
        <button class="btn btn-primary" onclick="showBrandModal()">+ 添加品牌</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>品牌名称</th>
              <th>类型</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${brands.map(b => `
              <tr>
                <td><strong>${b.name}</strong></td>
                <td><span class="tag tag-${b.type === 'self' ? 'published' : 'pending'}">${b.type === 'self' ? '自有品牌' : '联名合作'}</span></td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.description || '-'}</td>
                <td class="table-actions">
                  <button class="btn btn-sm btn-outline" onclick="showBrandModal(${b.id})">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteBrand(${b.id})">删除</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">暂无品牌</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

async function showBrandModal(id) {
  let brand = { name: '', type: 'self', description: '', logo_url: '', content: '' };
  if (id) {
    try {
      const data = await API.get('/admin/brands', 'admin');
      brand = data.brands.find(b => b.id === id) || brand;
    } catch (e) {}
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${id ? '编辑品牌' : '添加品牌'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="brandForm">
          <div class="form-group">
            <label class="form-label">品牌名称 *</label>
            <input type="text" class="form-input" name="name" value="${brand.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">类型</label>
            <select class="form-input" name="type">
              <option value="self" ${brand.type === 'self' ? 'selected' : ''}>自有品牌</option>
              <option value="collab" ${brand.type === 'collab' ? 'selected' : ''}>联名合作</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea class="form-input" name="description" rows="3">${brand.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Logo URL</label>
            <input type="text" class="form-input" name="logo_url" value="${brand.logo_url || ''}">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveBrand(${id || 'null'})">${id ? '保存' : '添加'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function saveBrand(id) {
  const form = document.getElementById('brandForm');
  const formData = new FormData(form);
  const body = {
    name: formData.get('name'),
    type: formData.get('type'),
    description: formData.get('description'),
    logo_url: formData.get('logo_url')
  };

  try {
    if (id) {
      await API.put(`/admin/brands/${id}`, body, 'admin');
      showToast('品牌已更新', 'success');
    } else {
      await API.post('/admin/brands', body, 'admin');
      showToast('品牌已添加', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    renderBrandsAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteBrand(id) {
  if (!confirm('确定删除该品牌？')) return;
  try {
    await API.delete(`/admin/brands/${id}`, 'admin');
    showToast('品牌已删除', 'success');
    renderBrandsAdmin();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * 【系统设置页】
 */
async function renderSettingsAdmin() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('系统设置', 'settings', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await API.get('/admin/settings', 'admin');
    const s = data.settings || {};

    document.querySelector('.admin-content').innerHTML = `
      <div class="card" style="max-width:600px">
        <div class="card-header">网站基础设置</div>
        <div class="card-body">
          <form id="settingsForm">
            <div class="form-group">
              <label class="form-label">网站名称</label>
              <input type="text" class="form-input" name="site_name" value="${s.site_name || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Logo URL</label>
              <input type="text" class="form-input" name="site_logo" value="${s.site_logo || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">页脚文字</label>
              <input type="text" class="form-input" name="site_footer" value="${s.site_footer || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">备案号</label>
              <input type="text" class="form-input" name="icp_number" value="${s.icp_number || ''}">
            </div>
            <button type="submit" class="btn btn-primary">保存设置</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const body = {};
      formData.forEach((v, k) => { body[k] = v; });
      try {
        await API.put('/admin/settings', body, 'admin');
        showToast('设置已保存', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

// ============================================================
// 路由注册
// ============================================================
const router = new Router();

// 空 hash 重定向到登录页
router.add('#/', () => { window.location.hash = '#/admin/login'; });
router.add('#/admin', () => { window.location.hash = '#/admin/login'; });
router.add('#/admin/login', renderAdminLogin);
router.add('#/admin/dashboard', renderDashboard);
router.add('#/admin/activities', renderActivitiesAdmin);
router.add('#/admin/users', renderUsersAdmin);
router.add('#/admin/invitations', renderInvitationsAdmin);
router.add('#/admin/tasks', renderTasksAdmin);
router.add('#/admin/brands', renderBrandsAdmin);
router.add('#/admin/settings', renderSettingsAdmin);

// 未登录默认跳转登录页
router.beforeEach = (path) => {
  if (path.startsWith('#/admin') && path !== '#/admin/login' && !API.getToken('admin')) {
    window.location.hash = '#/admin/login';
    return false;
  }
  return true;
};

// 延迟启动路由，确保所有脚本（admin-game.js、admin-invite-codes.js）都已加载并注册路由
window.addEventListener('load', () => {
  router.start();
});
