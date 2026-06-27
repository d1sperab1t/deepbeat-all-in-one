/**
 * 管理端 - 邀请码管理
 *
 * 功能：
 *   - 批量生成邀请码（绑定活动）
 *   - 查看邀请码列表（按活动/状态筛选）
 *   - 作废邀请码（单个/批量）
 *   - 删除未使用的邀请码
 *   - 统计概览
 */

// ============================================================
// 邀请码 API
// ============================================================
const InviteCodeAPI = {
  generate(body)         { return API.post('/admin/invite-codes/generate', body, 'admin'); },
  list(params)           { return API.get(`/admin/invite-codes?${new URLSearchParams(params)}`, 'admin'); },
  revoke(id)             { return API.put(`/admin/invite-codes/${id}/revoke`, {}, 'admin'); },
  batchRevoke(body)      { return API.put('/admin/invite-codes/batch-revoke', body, 'admin'); },
  delete(id)             { return API.delete(`/admin/invite-codes/${id}`, 'admin'); },
};

// ============================================================
// 渲染：邀请码管理主页
// ============================================================
async function renderInviteCodesAdmin() {
  if (!requireAdmin()) return;

  const app = document.getElementById('admin-app');
  app.innerHTML = `
    <div class="page-header">
      <h1>🎟️ 邀请码管理</h1>
      <button class="btn btn-primary" onclick="showGenerateModal()">+ 批量生成</button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar" style="display:flex;gap:12px;margin-bottom:20px;align-items:center;flex-wrap:wrap;">
      <select id="filterActivity" class="form-input" style="width:auto;min-width:160px;" onchange="loadInviteCodes()">
        <option value="">全部活动</option>
      </select>
      <select id="filterStatus" class="form-input" style="width:auto;" onchange="loadInviteCodes()">
        <option value="">全部状态</option>
        <option value="active">可用</option>
        <option value="used">已使用</option>
        <option value="revoked">已作废</option>
      </select>
      <button class="btn btn-sm" onclick="loadInviteCodes()" style="background:var(--bg-card);border:1px solid var(--border);">刷新</button>
    </div>

    <!-- 统计卡片 -->
    <div id="inviteStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;"></div>

    <!-- 邀请码列表 -->
    <div id="inviteList">
      <div class="loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  // 加载活动列表到筛选器
  try {
    const acts = await API.get('/admin/activities', 'admin');
    const actList = acts.activities || acts || [];
    const sel = document.getElementById('filterActivity');
    actList.forEach(a => {
      sel.innerHTML += `<option value="${a.id}">${escapeHtml(a.title)}</option>`;
    });
  } catch (e) {
    console.warn('加载活动列表失败', e);
  }

  loadInviteCodes();
}

// ============================================================
// 加载邀请码列表
// ============================================================
async function loadInviteCodes() {
  const listEl = document.getElementById('inviteList');
  const statsEl = document.getElementById('inviteStats');

  const activityId = document.getElementById('filterActivity')?.value || '';
  const status = document.getElementById('filterStatus')?.value || '';

  const params = {};
  if (activityId) params.activityId = activityId;
  if (status) params.status = status;

  try {
    const data = await InviteCodeAPI.list(params);
    const codes = data.codes || [];
    const stats = data.stats || [];

    // 渲染统计
    if (stats.length > 0) {
      const s = stats[0]; // 当前筛选的活动
      statsEl.innerHTML = `
        <div class="stat-card"><div class="stat-value">${s.total || 0}</div><div class="stat-label">总计</div></div>
        <div class="stat-card" style="border-color:rgba(92,184,92,0.3)"><div class="stat-value" style="color:var(--success)">${s.active_count || 0}</div><div class="stat-label">可用</div></div>
        <div class="stat-card" style="border-color:rgba(255,61,20,0.3)"><div class="stat-value" style="color:var(--text-muted)">${s.used_count || 0}</div><div class="stat-label">已使用</div></div>
        <div class="stat-card" style="border-color:rgba(217,83,79,0.3)"><div class="stat-value" style="color:var(--danger)">${s.revoked_count || 0}</div><div class="stat-label">已作废</div></div>
      `;
    } else {
      statsEl.innerHTML = '';
    }

    // 渲染列表
    if (codes.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="icon">🎟️</div><p>暂无邀请码</p></div>`;
      return;
    }

    // 批量操作按钮
    const activeCodes = codes.filter(c => c.status === 'active');

    listEl.innerHTML = `
      ${activeCodes.length > 0 ? `
        <div style="margin-bottom:12px;display:flex;gap:8px;">
          <button class="btn btn-sm" onclick="selectAllCodes()" style="background:var(--bg-card);border:1px solid var(--border);">全选</button>
          <button class="btn btn-sm" onclick="batchRevokeSelected()" style="background:rgba(217,83,79,0.1);border:1px solid rgba(217,83,79,0.3);color:var(--danger);">批量作废</button>
        </div>
      ` : ''}
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);text-align:left;">
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;width:40px;"><input type="checkbox" id="selectAll" onchange="toggleAllCheckboxes(this)"></th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">邀请码</th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">绑定活动</th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">状态</th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">使用者</th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">生成时间</th>
              <th style="padding:10px 12px;color:var(--text-muted);font-weight:500;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${codes.map(c => `
              <tr style="border-bottom:1px solid var(--border);${c.status === 'revoked' ? 'opacity:0.5;' : ''}">
                <td style="padding:10px 12px;">
                  ${c.status === 'active' ? `<input type="checkbox" class="code-checkbox" value="${c.id}">` : ''}
                </td>
                <td style="padding:10px 12px;font-family:var(--font-mono);color:var(--accent);font-weight:600;letter-spacing:0.05em;">${escapeHtml(c.code)}</td>
                <td style="padding:10px 12px;color:var(--text-secondary);">${escapeHtml(c.activity_title || '-')}</td>
                <td style="padding:10px 12px;">
                  <span class="status-badge status-${c.status}">${{active:'可用',used:'已使用',revoked:'已作废'}[c.status]}</span>
                </td>
                <td style="padding:10px 12px;color:var(--text-secondary);">
                  ${c.used_by_name ? escapeHtml(c.used_by_name) + ' (' + escapeHtml(c.used_by_phone || '') + ')' : '-'}
                </td>
                <td style="padding:10px 12px;color:var(--text-muted);font-size:0.8rem;">${escapeHtml(c.created_at || '')}</td>
                <td style="padding:10px 12px;">
                  ${c.status === 'active' ? `
                    <button class="btn btn-sm" onclick="revokeCode(${c.id})" style="background:rgba(217,83,79,0.1);border:1px solid rgba(217,83,79,0.3);color:var(--danger);font-size:0.75rem;padding:4px 10px;">作废</button>
                  ` : ''}
                  ${c.status !== 'used' ? `
                    <button class="btn btn-sm" onclick="deleteCode(${c.id})" style="background:transparent;border:1px solid var(--border);color:var(--text-muted);font-size:0.75rem;padding:4px 10px;margin-left:4px;">删除</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;color:var(--text-muted);font-size:0.8rem;">
        共 ${data.total} 条记录
      </div>
    `;
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${escapeHtml(err.message)}</p></div>`;
  }
}

// ============================================================
// 批量生成弹窗
// ============================================================
function showGenerateModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:28px;width:90%;max-width:440px;">
      <h3 style="margin:0 0 20px;font-size:1.1rem;">批量生成邀请码</h3>
      <form id="generateForm">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px;">绑定活动 *</label>
          <select id="genActivity" class="form-input" required style="width:100%;">
            <option value="">请选择活动</option>
          </select>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px;">生成数量</label>
          <input type="number" id="genCount" class="form-input" value="10" min="1" max="500" style="width:100%;">
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px;">批次名称（可选）</label>
          <input type="text" id="genBatchName" class="form-input" placeholder="如：早鸟票批次" style="width:100%;">
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" class="btn btn-sm" onclick="this.closest('.modal-overlay').remove()" style="background:var(--bg-card);border:1px solid var(--border);">取消</button>
          <button type="submit" class="btn btn-primary btn-sm">生成</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // 加载活动列表
  API.get('/admin/activities', 'admin').then(acts => {
    const actList = acts.activities || acts || [];
    const sel = document.getElementById('genActivity');
    actList.forEach(a => {
      sel.innerHTML += `<option value="${a.id}">${escapeHtml(a.title)}</option>`;
    });
  }).catch(() => {});

  // 提交
  document.getElementById('generateForm').onsubmit = async (e) => {
    e.preventDefault();
    const activityId = document.getElementById('genActivity').value;
    const count = parseInt(document.getElementById('genCount').value) || 10;
    const batchName = document.getElementById('genBatchName').value;

    if (!activityId) { showToast('请选择活动', 'error'); return; }

    try {
      const result = await InviteCodeAPI.generate({ activityId: parseInt(activityId), count, batchName });
      overlay.remove();
      showToast(result.message, 'success');
      loadInviteCodes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

// ============================================================
// 作废 / 删除 / 批量操作
// ============================================================
async function revokeCode(id) {
  if (!confirm('确定作废该邀请码？')) return;
  try {
    await InviteCodeAPI.revoke(id);
    showToast('邀请码已作废', 'success');
    loadInviteCodes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCode(id) {
  if (!confirm('确定删除该邀请码？此操作不可恢复。')) return;
  try {
    await InviteCodeAPI.delete(id);
    showToast('邀请码已删除', 'success');
    loadInviteCodes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function toggleAllCheckboxes(master) {
  document.querySelectorAll('.code-checkbox').forEach(cb => { cb.checked = master.checked; });
}

function selectAllCodes() {
  document.querySelectorAll('.code-checkbox').forEach(cb => { cb.checked = true; });
  document.getElementById('selectAll').checked = true;
}

async function batchRevokeSelected() {
  const ids = [...document.querySelectorAll('.code-checkbox:checked')].map(cb => parseInt(cb.value));
  if (ids.length === 0) { showToast('请先选择要作废的邀请码', 'error'); return; }
  if (!confirm(`确定作废 ${ids.length} 个邀请码？`)) return;

  try {
    const result = await InviteCodeAPI.batchRevoke({ ids });
    showToast(result.message, 'success');
    loadInviteCodes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 路由注册（在 admin-app.js 的 router 对象上追加）
// ============================================================
router.add('#/admin/invite-codes', renderInviteCodesAdmin);
