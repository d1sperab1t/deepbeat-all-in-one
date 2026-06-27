/**
 * 管理端 - 游戏系统管理
 *
 * 路由清单：
 *   #/admin/game/dashboard    - 游戏监控（统计 + 玩家列表）
 *   #/admin/game/games        - 场次管理（CRUD + 状态切换）
 *   #/admin/game/characters   - 角色管理（选游戏 → CRUD）
 *   #/admin/game/stages       - 阶段管理（选游戏 → CRUD）
 *   #/admin/game/scripts      - 剧本配置（选游戏 → 角色×阶段矩阵）
 *   #/admin/game/passcodes    - 通关码（选游戏 → CRUD）
 *   #/admin/game/players      - 玩家进度（选游戏 → 推进/重置）
 *
 * API 基路径：/api/admin/game/
 * 所有请求自动携带 Authorization: Bearer {admin_token}
 */

// ============================================================
// 游戏管理通用工具
// ============================================================

const GAME_API_BASE = '/admin/game';

/**
 * 游戏管理 API 封装
 */
const GameAdminAPI = {
  /** 获取游戏列表 */
  getGames()                              { return API.get(`${GAME_API_BASE}/games`, 'admin'); },
  /** 创建游戏 */
  createGame(body)                        { return API.post(`${GAME_API_BASE}/games`, body, 'admin'); },
  /** 更新游戏 */
  updateGame(id, body)                    { return API.put(`${GAME_API_BASE}/games/${id}`, body, 'admin'); },
  /** 删除游戏 */
  deleteGame(id)                          { return API.delete(`${GAME_API_BASE}/games/${id}`, 'admin'); },

  /** 获取游戏统计 */
  getStats(gameId)                        { return API.get(`${GAME_API_BASE}/stats?gameId=${gameId}`, 'admin'); },

  /** 获取角色列表 */
  getCharacters(gameId)                   { return API.get(`${GAME_API_BASE}/characters?gameId=${gameId}`, 'admin'); },
  /** 创建角色 (gameId, body) */
  createCharacter(gameId, body)           { return API.post(`${GAME_API_BASE}/characters`, { ...body, gameId }, 'admin'); },
  /** 更新角色 (gameId, charId, body) */
  updateCharacter(gameId, charId, body)   { return API.put(`${GAME_API_BASE}/characters/${charId}`, body, 'admin'); },
  /** 删除角色 (gameId, charId) */
  deleteCharacter(gameId, charId)         { return API.delete(`${GAME_API_BASE}/characters/${charId}`, 'admin'); },

  /** 获取阶段列表 */
  getStages(gameId)                       { return API.get(`${GAME_API_BASE}/stages?gameId=${gameId}`, 'admin'); },
  /** 创建阶段 (gameId, body) */
  createStage(gameId, body)               { return API.post(`${GAME_API_BASE}/stages`, { ...body, gameId }, 'admin'); },
  /** 更新阶段 (gameId, stageId, body) */
  updateStage(gameId, stageId, body)      { return API.put(`${GAME_API_BASE}/stages/${stageId}`, body, 'admin'); },
  /** 删除阶段 (gameId, stageId) */
  deleteStage(gameId, stageId)            { return API.delete(`${GAME_API_BASE}/stages/${stageId}`, 'admin'); },

  /** 获取剧本列表 */
  getScripts(gameId)                      { return API.get(`${GAME_API_BASE}/scripts?gameId=${gameId}`, 'admin'); },
  /** 保存剧本 (gameId, body) — body 包含 scripts 数组 */
  saveScripts(gameId, body) {
    // 批量 upsert：逐条调用 saveScript
    const results = [];
    for (const s of (body.scripts || [])) {
      results.push(API.post(`${GAME_API_BASE}/scripts`, {
        characterId: s.characterId, stageId: s.stageId,
        background: s.background, taskTitle: s.taskTitle, taskDesc: s.taskDesc,
        clueText: s.clueText, clueImage: s.clueImage
      }, 'admin'));
    }
    return Promise.all(results);
  },

  /** 获取通关码列表 */
  getPasscodes(gameId)                    { return API.get(`${GAME_API_BASE}/passcodes?gameId=${gameId}`, 'admin'); },
  /** 创建通关码 (gameId, body) */
  createPasscode(gameId, body)            { return API.post(`${GAME_API_BASE}/passcodes`, { ...body, gameId }, 'admin'); },
  /** 删除通关码 (gameId, codeId) */
  deletePasscode(gameId, codeId)          { return API.delete(`${GAME_API_BASE}/passcodes/${codeId}`, 'admin'); },

  /** 获取玩家列表 */
  getPlayers(gameId)                      { return API.get(`${GAME_API_BASE}/players?gameId=${gameId}`, 'admin'); },
  /** 手动推进玩家 (gameId, userId) */
  advancePlayer(gameId, userId, toStageId) { return API.post(`${GAME_API_BASE}/push-player`, { gameId, userId, toStageId }, 'admin'); },
  /** 重置玩家进度 (gameId, userId) */
  resetPlayer(gameId, userId)             { return API.post(`${GAME_API_BASE}/reset-player`, { gameId, userId }, 'admin'); },
};

/**
 * 游戏选择器组件（复用于多处）
 */
function renderGameSelector(selectedId, onChangeAttr) {
  return `
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">选择游戏</label>
      <select class="form-input" id="gameSelector" style="width:300px" ${onChangeAttr || ''}>
        <option value="">请选择游戏</option>
      </select>
    </div>
  `;
}

/**
 * 异步加载游戏列表到选择器
 */
async function loadGameSelector(selectId) {
  try {
    const data = await GameAdminAPI.getGames();
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const games = data.games || [];
    sel.innerHTML = '<option value="">请选择游戏</option>' +
      games.map(g => `<option value="${g.id}">${escapeHtml(g.name)} (${g.status || 'draft'})</option>`).join('');
  } catch (err) {
    showToast('加载游戏列表失败: ' + err.message, 'error');
  }
}

/**
 * 游戏状态中文映射
 */
function gameStatusLabel(status) {
  const map = { draft: '草稿', active: '进行中', paused: '已暂停', completed: '已结束', archived: '已归档' };
  return map[status] || status;
}

/**
 * 游戏状态 tag class
 */
function gameStatusClass(status) {
  const map = { draft: 'draft', active: 'published', paused: 'pending', completed: 'archived', archived: 'archived' };
  return map[status] || 'pending';
}

// ============================================================
// 1. 游戏监控 — #/admin/game/dashboard
// ============================================================

async function renderGameDashboard() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('游戏监控', 'game-dashboard', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const content = document.querySelector('.admin-content');
    content.innerHTML = `
      ${renderGameSelector('', 'onchange="loadGameStats()"')}
      <div id="gameDashboardStats" style="display:none">
        <div class="dashboard-stats" id="gameStatsCards"></div>
        <div class="data-table" id="gamePlayerTableWrap">
          <table>
            <thead>
              <tr>
                <th>玩家昵称</th>
                <th>手机号</th>
                <th>当前阶段</th>
                <th>加入时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody id="gamePlayerTableBody">
              <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">请选择游戏</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="gameDashboardEmpty" class="empty-state">
        <div class="icon">🎮</div>
        <p>请选择一个游戏查看监控数据</p>
      </div>
    `;
    await loadGameSelector('gameSelector');
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

async function loadGameStats() {
  const gameId = document.getElementById('gameSelector')?.value;
  const statsDiv = document.getElementById('gameDashboardStats');
  const emptyDiv = document.getElementById('gameDashboardEmpty');

  if (!gameId) {
    if (statsDiv) statsDiv.style.display = 'none';
    if (emptyDiv) emptyDiv.style.display = '';
    return;
  }

  if (statsDiv) statsDiv.style.display = '';
  if (emptyDiv) emptyDiv.style.display = 'none';

  try {
    const data = await GameAdminAPI.getStats(gameId);
    const stats = data.stats || {};
    const players = data.players || [];

    document.getElementById('gameStatsCards').innerHTML = `
      <div class="stat-card">
        <div class="label">总玩家数</div>
        <div class="value">${stats.totalPlayers || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">进行中</div>
        <div class="value">${stats.inProgress || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">已完成</div>
        <div class="value">${stats.completed || 0}</div>
      </div>
      <div class="stat-card">
        <div class="label">当前阶段</div>
        <div class="value" style="font-size:20px">${stats.currentStage || '-'}</div>
      </div>
    `;

    const tbody = document.getElementById('gamePlayerTableBody');
    if (players.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">暂无玩家</td></tr>';
    } else {
      tbody.innerHTML = players.map(p => `
        <tr>
          <td>${escapeHtml(p.nickname || p.username || '-')}</td>
          <td>${escapeHtml(p.phone || '-')}</td>
          <td>${escapeHtml(p.current_stage_name || '-')}</td>
          <td>${p.joined_at || '-'}</td>
          <td><span class="tag tag-${p.status === 'completed' ? 'archived' : 'published'}">${p.status === 'completed' ? '已完成' : '进行中'}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showToast('加载统计数据失败: ' + err.message, 'error');
  }
}

// ============================================================
// 2. 场次管理 — #/admin/game/games
// ============================================================

async function renderGameSessions() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('场次管理', 'game-games', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  try {
    const data = await GameAdminAPI.getGames();
    const games = data.games || [];

    document.querySelector('.admin-content').innerHTML = `
      <div class="table-toolbar">
        <div class="filter-bar">
          <span class="filter-chip active" onclick="filterGameSessions('', event)">全部</span>
          <span class="filter-chip" onclick="filterGameSessions('draft', event)">草稿</span>
          <span class="filter-chip" onclick="filterGameSessions('active', event)">进行中</span>
          <span class="filter-chip" onclick="filterGameSessions('paused', event)">已暂停</span>
          <span class="filter-chip" onclick="filterGameSessions('completed', event)">已结束</span>
        </div>
        <button class="btn btn-primary" onclick="showGameModal()">+ 创建游戏</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>游戏名称</th>
              <th>描述</th>
              <th>最大人数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="gameSessionsBody">
            ${games.map(g => renderGameRow(g)).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无游戏</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    document.querySelector('.admin-content').innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${err.message}</p></div>`;
  }
}

function renderGameRow(g) {
  return `
    <tr>
      <td>${g.id}</td>
      <td><strong>${escapeHtml(g.name)}</strong></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(g.description || '-')}</td>
      <td>${g.max_players || '∞'}</td>
      <td><span class="tag tag-${gameStatusClass(g.status)}">${gameStatusLabel(g.status)}</span></td>
      <td>${g.created_at || '-'}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline" onclick="showGameModal(${g.id})">编辑</button>
        ${g.status === 'draft' ? `<button class="btn btn-sm btn-primary" onclick="toggleGameStatus(${g.id}, 'active')">启动</button>` : ''}
        ${g.status === 'active' ? `<button class="btn btn-sm btn-outline" onclick="toggleGameStatus(${g.id}, 'paused')">暂停</button>` : ''}
        ${g.status === 'paused' ? `<button class="btn btn-sm btn-primary" onclick="toggleGameStatus(${g.id}, 'active')">恢复</button>` : ''}
        ${g.status === 'active' || g.status === 'paused' ? `<button class="btn btn-sm btn-outline" onclick="toggleGameStatus(${g.id}, 'completed')">结束</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="deleteGameSession(${g.id})">删除</button>
      </td>
    </tr>
  `;
}

async function showGameModal(id) {
  let game = { name: '', description: '', max_players: 0, status: 'draft' };

  if (id) {
    try {
      const data = await GameAdminAPI.getGames();
      game = (data.games || []).find(g => g.id === id) || game;
    } catch (e) {
      showToast('加载游戏信息失败', 'error');
      return;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${id ? '编辑游戏' : '创建游戏'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="gameForm">
          <div class="form-group">
            <label class="form-label">游戏名称 *</label>
            <input type="text" class="form-input" name="name" value="${escapeHtml(game.name)}" required placeholder="例：城市迷踪·第三季">
          </div>
          <div class="form-group">
            <label class="form-label">游戏描述</label>
            <textarea class="form-input" name="description" rows="3" placeholder="游戏简介...">${escapeHtml(game.description || '')}</textarea>
          </div>
          <div style="display:flex;gap:12px">
            <div class="form-group" style="flex:1">
              <label class="form-label">最大人数 (0=不限)</label>
              <input type="number" class="form-input" name="max_players" value="${game.max_players || 0}" min="0">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">状态</label>
              <select class="form-input" name="status">
                <option value="draft" ${game.status === 'draft' ? 'selected' : ''}>草稿</option>
                <option value="active" ${game.status === 'active' ? 'selected' : ''}>进行中</option>
                <option value="paused" ${game.status === 'paused' ? 'selected' : ''}>已暂停</option>
                <option value="completed" ${game.status === 'completed' ? 'selected' : ''}>已结束</option>
                <option value="archived" ${game.status === 'archived' ? 'selected' : ''}>已归档</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveGameSession(${id || 'null'})">${id ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function saveGameSession(id) {
  const form = document.getElementById('gameForm');
  const formData = new FormData(form);
  const body = {
    name: formData.get('name'),
    description: formData.get('description'),
    max_players: parseInt(formData.get('max_players')) || 0,
    status: formData.get('status')
  };

  try {
    if (id) {
      await GameAdminAPI.updateGame(id, body);
      showToast('游戏已更新', 'success');
    } else {
      await GameAdminAPI.createGame(body);
      showToast('游戏已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    renderGameSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleGameStatus(id, newStatus) {
  try {
    await GameAdminAPI.updateGame(id, { status: newStatus });
    showToast(`游戏状态已切换为「${gameStatusLabel(newStatus)}」`, 'success');
    renderGameSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteGameSession(id) {
  if (!confirm('确定删除该游戏？删除后不可恢复！')) return;
  try {
    await GameAdminAPI.deleteGame(id);
    showToast('游戏已删除', 'success');
    renderGameSessions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function filterGameSessions(status, evt) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');

  try {
    const data = await GameAdminAPI.getGames();
    let games = data.games || [];
    if (status) {
      games = games.filter(g => g.status === status);
    }
    document.getElementById('gameSessionsBody').innerHTML =
      games.map(g => renderGameRow(g)).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无游戏</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 3. 角色管理 — #/admin/game/characters
// ============================================================

async function renderGameCharacters() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('角色管理', 'game-characters', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  document.querySelector('.admin-content').innerHTML = `
    ${renderGameSelector('', 'onchange="loadCharacters()"')}
    <div id="charactersContent" style="display:none">
      <div class="table-toolbar">
        <span></span>
        <button class="btn btn-primary" onclick="showCharacterModal()">+ 创建角色</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>角色名称</th>
              <th>描述</th>
              <th>阵营</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="charactersBody">
            <tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">请选择游戏</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  await loadGameSelector('gameSelector');
}

async function loadCharacters() {
  const gameId = document.getElementById('gameSelector')?.value;
  const content = document.getElementById('charactersContent');
  if (!gameId) {
    content.style.display = 'none';
    return;
  }
  content.style.display = '';

  try {
    const data = await GameAdminAPI.getCharacters(gameId);
    const characters = data.characters || [];

    document.getElementById('charactersBody').innerHTML =
      characters.map(c => `
        <tr>
          <td>${c.id}</td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.description || '-')}</td>
          <td>${escapeHtml(c.faction || '-')}</td>
          <td>${c.sort_order || 0}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="showCharacterModal(${c.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCharacterItem(${c.id})">删除</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">暂无角色</td></tr>';
  } catch (err) {
    showToast('加载角色失败: ' + err.message, 'error');
  }
}

async function showCharacterModal(charId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  let character = { name: '', description: '', faction: '', sort_order: 0, avatar_url: '' };

  if (charId) {
    try {
      const data = await GameAdminAPI.getCharacters(gameId);
      character = (data.characters || []).find(c => c.id === charId) || character;
    } catch (e) {}
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${charId ? '编辑角色' : '创建角色'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="characterForm">
          <div class="form-group">
            <label class="form-label">角色名称 *</label>
            <input type="text" class="form-input" name="name" value="${escapeHtml(character.name)}" required placeholder="例：侦探·林默">
          </div>
          <div class="form-group">
            <label class="form-label">阵营</label>
            <input type="text" class="form-input" name="faction" value="${escapeHtml(character.faction || '')}" placeholder="例：正义阵营">
          </div>
          <div class="form-group">
            <label class="form-label">角色描述</label>
            <textarea class="form-input" name="description" rows="3">${escapeHtml(character.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">排序 (数字越小越靠前)</label>
            <input type="number" class="form-input" name="sort_order" value="${character.sort_order || 0}" min="0">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveCharacterItem(${charId || 'null'})">${charId ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function saveCharacterItem(charId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  const form = document.getElementById('characterForm');
  const formData = new FormData(form);
  const body = {
    name: formData.get('name'),
    description: formData.get('description'),
    faction: formData.get('faction'),
    sort_order: parseInt(formData.get('sort_order')) || 0
  };

  try {
    if (charId) {
      await GameAdminAPI.updateCharacter(gameId, charId, body);
      showToast('角色已更新', 'success');
    } else {
      await GameAdminAPI.createCharacter(gameId, body);
      showToast('角色已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    loadCharacters();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCharacterItem(charId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return;
  if (!confirm('确定删除该角色？')) return;
  try {
    await GameAdminAPI.deleteCharacter(gameId, charId);
    showToast('角色已删除', 'success');
    loadCharacters();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 4. 阶段管理 — #/admin/game/stages
// ============================================================

async function renderGameStages() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('阶段管理', 'game-stages', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  document.querySelector('.admin-content').innerHTML = `
    ${renderGameSelector('', 'onchange="loadStages()"')}
    <div id="stagesContent" style="display:none">
      <div class="table-toolbar">
        <span></span>
        <button class="btn btn-primary" onclick="showStageModal()">+ 创建阶段</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>阶段名称</th>
              <th>描述</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="stagesBody">
            <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">请选择游戏</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  await loadGameSelector('gameSelector');
}

async function loadStages() {
  const gameId = document.getElementById('gameSelector')?.value;
  const content = document.getElementById('stagesContent');
  if (!gameId) {
    content.style.display = 'none';
    return;
  }
  content.style.display = '';

  try {
    const data = await GameAdminAPI.getStages(gameId);
    const stages = data.stages || [];

    document.getElementById('stagesBody').innerHTML =
      stages.map(s => `
        <tr>
          <td>${s.id}</td>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(s.description || '-')}</td>
          <td>${s.sort_order || 0}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="showStageModal(${s.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteStageItem(${s.id})">删除</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">暂无阶段</td></tr>';
  } catch (err) {
    showToast('加载阶段失败: ' + err.message, 'error');
  }
}

async function showStageModal(stageId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  let stage = { name: '', description: '', sort_order: 0 };

  if (stageId) {
    try {
      const data = await GameAdminAPI.getStages(gameId);
      stage = (data.stages || []).find(s => s.id === stageId) || stage;
    } catch (e) {}
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${stageId ? '编辑阶段' : '创建阶段'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="stageForm">
          <div class="form-group">
            <label class="form-label">阶段名称 *</label>
            <input type="text" class="form-input" name="name" value="${escapeHtml(stage.name)}" required placeholder="例：序章·迷雾降临">
          </div>
          <div class="form-group">
            <label class="form-label">阶段描述</label>
            <textarea class="form-input" name="description" rows="3">${escapeHtml(stage.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">排序 (数字越小越靠前)</label>
            <input type="number" class="form-input" name="sort_order" value="${stage.sort_order || 0}" min="0">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="saveStageItem(${stageId || 'null'})">${stageId ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function saveStageItem(stageId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  const form = document.getElementById('stageForm');
  const formData = new FormData(form);
  const body = {
    name: formData.get('name'),
    description: formData.get('description'),
    sort_order: parseInt(formData.get('sort_order')) || 0
  };

  try {
    if (stageId) {
      await GameAdminAPI.updateStage(gameId, stageId, body);
      showToast('阶段已更新', 'success');
    } else {
      await GameAdminAPI.createStage(gameId, body);
      showToast('阶段已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    loadStages();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteStageItem(stageId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return;
  if (!confirm('确定删除该阶段？')) return;
  try {
    await GameAdminAPI.deleteStage(gameId, stageId);
    showToast('阶段已删除', 'success');
    loadStages();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 5. 剧本配置 — #/admin/game/scripts
// ============================================================

async function renderGameScripts() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('剧本配置', 'game-scripts', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  document.querySelector('.admin-content').innerHTML = `
    ${renderGameSelector('', 'onchange="loadScriptsMatrix()"')}
    <div id="scriptsContent" style="display:none">
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">编辑角色在各阶段的剧本内容（角色 × 阶段矩阵），填写完成后点击保存。</p>
      <div id="scriptsMatrixContainer"></div>
      <div style="margin-top:16px;text-align:right">
        <button class="btn btn-primary" onclick="saveScriptsMatrix()">💾 保存剧本配置</button>
      </div>
    </div>
  `;
  await loadGameSelector('gameSelector');
}

async function loadScriptsMatrix() {
  const gameId = document.getElementById('gameSelector')?.value;
  const content = document.getElementById('scriptsContent');
  if (!gameId) {
    content.style.display = 'none';
    return;
  }
  content.style.display = '';

  try {
    const data = await GameAdminAPI.getScripts(gameId);
    const characters = data.characters || [];
    const stages = data.stages || [];
    const scripts = data.scripts || []; // [{character_id, stage_id, content}]

    if (characters.length === 0 || stages.length === 0) {
      document.getElementById('scriptsMatrixContainer').innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <p>请先创建角色和阶段后再配置剧本</p>
        </div>
      `;
      return;
    }

    // 构建 script map: { "charId-stageId": content }
    const scriptMap = {};
    scripts.forEach(s => {
      scriptMap[`${s.character_id}-${s.stage_id}`] = s.content || '';
    });

    let html = '<div class="data-table"><table><thead><tr><th style="min-width:120px">角色 \\ 阶段</th>';
    stages.forEach(s => {
      html += `<th style="min-width:180px">${escapeHtml(s.name)}</th>`;
    });
    html += '</tr></thead><tbody>';

    characters.forEach(c => {
      html += `<tr><td><strong>${escapeHtml(c.name)}</strong></td>`;
      stages.forEach(s => {
        const key = `${c.id}-${s.id}`;
        const val = scriptMap[key] || '';
        html += `<td><textarea class="form-input script-cell" data-char="${c.id}" data-stage="${s.id}" rows="3" style="width:100%;font-size:12px;min-height:60px">${escapeHtml(val)}</textarea></td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    document.getElementById('scriptsMatrixContainer').innerHTML = html;
  } catch (err) {
    showToast('加载剧本配置失败: ' + err.message, 'error');
  }
}

async function saveScriptsMatrix() {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  const cells = document.querySelectorAll('.script-cell');
  const entries = [];
  cells.forEach(cell => {
    const characterId = parseInt(cell.dataset.char);
    const stageId = parseInt(cell.dataset.stage);
    const content = cell.value.trim();
    entries.push({ character_id: characterId, stage_id: stageId, content });
  });

  try {
    await GameAdminAPI.saveScripts(gameId, { scripts: entries });
    showToast('剧本配置已保存', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 6. 通关码管理 — #/admin/game/passcodes
// ============================================================

async function renderGamePasscodes() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('通关码', 'game-passcodes', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  document.querySelector('.admin-content').innerHTML = `
    ${renderGameSelector('', 'onchange="loadPasscodes()"')}
    <div id="passcodesContent" style="display:none">
      <div class="table-toolbar">
        <span></span>
        <button class="btn btn-primary" onclick="showPasscodeModal()">+ 创建通关码</button>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>通关码</th>
              <th>关联阶段</th>
              <th>描述</th>
              <th>使用次数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="passcodesBody">
            <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">请选择游戏</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  await loadGameSelector('gameSelector');
}

async function loadPasscodes() {
  const gameId = document.getElementById('gameSelector')?.value;
  const content = document.getElementById('passcodesContent');
  if (!gameId) {
    content.style.display = 'none';
    return;
  }
  content.style.display = '';

  try {
    const data = await GameAdminAPI.getPasscodes(gameId);
    const passcodes = data.passcodes || [];

    document.getElementById('passcodesBody').innerHTML =
      passcodes.map(p => `
        <tr>
          <td>${p.id}</td>
          <td><strong style="font-family:var(--font-mono,monospace);letter-spacing:1px">${escapeHtml(p.code)}</strong></td>
          <td>${escapeHtml(p.stage_name || '-')}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.description || '-')}</td>
          <td>${p.used_count || 0}</td>
          <td><span class="tag tag-${p.active ? 'published' : 'archived'}">${p.active ? '启用' : '禁用'}</span></td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="showPasscodeModal(${p.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deletePasscodeItem(${p.id})">删除</button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无通关码</td></tr>';
  } catch (err) {
    showToast('加载通关码失败: ' + err.message, 'error');
  }
}

async function showPasscodeModal(codeId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  let passcode = { code: '', stage_id: '', description: '', active: true };

  // 获取阶段列表用于下拉选择
  let stages = [];
  try {
    const stageData = await GameAdminAPI.getStages(gameId);
    stages = stageData.stages || [];
  } catch (e) {}

  if (codeId) {
    try {
      const data = await GameAdminAPI.getPasscodes(gameId);
      passcode = (data.passcodes || []).find(p => p.id === codeId) || passcode;
    } catch (e) {}
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${codeId ? '编辑通关码' : '创建通关码'}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="passcodeForm">
          <div class="form-group">
            <label class="form-label">通关码 *</label>
            <input type="text" class="form-input" name="code" value="${escapeHtml(passcode.code || '')}" required placeholder="例：ABC123" style="font-family:monospace;letter-spacing:2px">
          </div>
          <div class="form-group">
            <label class="form-label">关联阶段</label>
            <select class="form-input" name="stage_id">
              <option value="">不关联阶段</option>
              ${stages.map(s => `<option value="${s.id}" ${passcode.stage_id == s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <input type="text" class="form-input" name="description" value="${escapeHtml(passcode.description || '')}" placeholder="通关码用途说明">
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select class="form-input" name="active">
              <option value="true" ${passcode.active !== false ? 'selected' : ''}>启用</option>
              <option value="false" ${passcode.active === false ? 'selected' : ''}>禁用</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="savePasscodeItem(${codeId || 'null'})">${codeId ? '保存' : '创建'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function savePasscodeItem(codeId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return showToast('请先选择游戏', 'error');

  const form = document.getElementById('passcodeForm');
  const formData = new FormData(form);
  const body = {
    code: formData.get('code'),
    stage_id: formData.get('stage_id') ? parseInt(formData.get('stage_id')) : null,
    description: formData.get('description'),
    active: formData.get('active') === 'true'
  };

  try {
    if (codeId) {
      await GameAdminAPI.updatePasscode(gameId, codeId, body);
      showToast('通关码已更新', 'success');
    } else {
      await GameAdminAPI.createPasscode(gameId, body);
      showToast('通关码已创建', 'success');
    }
    document.querySelector('.modal-overlay').remove();
    loadPasscodes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePasscodeItem(codeId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return;
  if (!confirm('确定删除该通关码？')) return;
  try {
    await GameAdminAPI.deletePasscode(gameId, codeId);
    showToast('通关码已删除', 'success');
    loadPasscodes();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 7. 玩家进度 — #/admin/game/players
// ============================================================

async function renderGamePlayers() {
  if (!requireAdmin()) return;
  const app = document.getElementById('admin-app');
  app.innerHTML = adminLayout('玩家进度', 'game-players', '<div class="loading"><div class="spinner"></div>加载中...</div>');

  document.querySelector('.admin-content').innerHTML = `
    ${renderGameSelector('', 'onchange="loadGamePlayers()"')}
    <div id="playersContent" style="display:none">
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>玩家昵称</th>
              <th>手机号</th>
              <th>当前阶段</th>
              <th>进度</th>
              <th>加入时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="playersBody">
            <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">请选择游戏</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  await loadGameSelector('gameSelector');
}

async function loadGamePlayers() {
  const gameId = document.getElementById('gameSelector')?.value;
  const content = document.getElementById('playersContent');
  if (!gameId) {
    content.style.display = 'none';
    return;
  }
  content.style.display = '';

  try {
    const data = await GameAdminAPI.getPlayers(gameId);
    const players = data.players || [];
    const totalStages = data.totalStages || 1;

    document.getElementById('playersBody').innerHTML =
      players.map(p => {
        const progressPct = totalStages > 0 ? Math.round(((p.current_stage_index || 0) / totalStages) * 100) : 0;
        return `
          <tr>
            <td><strong>${escapeHtml(p.nickname || p.username || '-')}</strong></td>
            <td>${escapeHtml(p.phone || '-')}</td>
            <td>${escapeHtml(p.current_stage_name || '未开始')}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:var(--border);border-radius:3px;max-width:100px">
                  <div style="height:100%;width:${progressPct}%;background:var(--primary);border-radius:3px"></div>
                </div>
                <span style="font-size:12px;color:var(--text-muted)">${progressPct}%</span>
              </div>
            </td>
            <td>${p.joined_at || '-'}</td>
            <td><span class="tag tag-${p.status === 'completed' ? 'archived' : 'published'}">${p.status === 'completed' ? '已完成' : '进行中'}</span></td>
            <td class="table-actions">
              ${p.status !== 'completed' ? `<button class="btn btn-sm btn-primary" onclick="advancePlayerItem(${p.id})">推进</button>` : ''}
              <button class="btn btn-sm btn-outline" onclick="resetPlayerItem(${p.id})">重置</button>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">暂无玩家</td></tr>';
  } catch (err) {
    showToast('加载玩家列表失败: ' + err.message, 'error');
  }
}

async function advancePlayerItem(playerId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return;
  if (!confirm('确定手动推进该玩家到下一阶段？')) return;
  try {
    await GameAdminAPI.advancePlayer(gameId, playerId);
    showToast('玩家已推进', 'success');
    loadGamePlayers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function resetPlayerItem(playerId) {
  const gameId = document.getElementById('gameSelector')?.value;
  if (!gameId) return;
  if (!confirm('确定重置该玩家的游戏进度？此操作不可撤销！')) return;
  try {
    await GameAdminAPI.resetPlayer(gameId, playerId);
    showToast('玩家进度已重置', 'success');
    loadGamePlayers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 路由注册（需在 admin-app.js 路由注册之后执行）
// ============================================================

router.add('#/admin/game/dashboard', renderGameDashboard);
router.add('#/admin/game/games', renderGameSessions);
router.add('#/admin/game/characters', renderGameCharacters);
router.add('#/admin/game/stages', renderGameStages);
router.add('#/admin/game/scripts', renderGameScripts);
router.add('#/admin/game/passcodes', renderGamePasscodes);
router.add('#/admin/game/players', renderGamePlayers);
