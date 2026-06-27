/**
 * 游戏前端逻辑 — 落跑计划
 *
 * 路由：
 *   #/           → 游戏大厅
 *   #/join/:gameId → 角色选择
 *   #/play       → 主游戏界面
 *   #/clues      → 线索收集夹
 *   #/history    → 阶段历程
 */

// ============================================================
// 工具函数（escapeHtml 来自 utils.js）
// ============================================================

function showGameToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function showBottomNav(activeId) {
  document.getElementById('bottomNav').classList.add('show');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

function hideBottomNav() {
  document.getElementById('bottomNav').classList.remove('show');
}

function requireLogin() {
  if (!API.getToken('user')) {
    window.location.href = '/index.html#/login';
    return false;
  }
  return true;
}

function requireCharacter() {
  if (!localStorage.getItem('game_character') || !localStorage.getItem('game_id')) {
    gameRouter.navigate('#/');
    return false;
  }
  return true;
}

function showUnlockAnimation(stageTitle, sub) {
  const overlay = document.getElementById('unlockOverlay');
  document.getElementById('unlockText').textContent = stageTitle || '新阶段已解锁';
  document.getElementById('unlockSub').textContent = sub || '新的任务已到来';
  overlay.classList.add('show');
  return new Promise(resolve => {
    setTimeout(() => {
      overlay.classList.remove('show');
      resolve();
    }, 2400);
  });
}

// ============================================================
// 游戏大厅
// ============================================================

async function renderGameLobby() {
  if (!requireLogin()) return;
  hideBottomNav();

  const app = document.getElementById('game-app');
  const user = API.getUser('user');

  app.innerHTML = `
    <div class="game-app">
      <div class="game-header">
        <div class="game-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 8L8 48h48L32 8z" stroke="#FF3D14" stroke-width="2.5" fill="none"/>
              <path d="M20 48L32 28l12 20" stroke="#FF3D14" stroke-width="1.5" opacity="0.5"/>
              <circle cx="32" cy="36" r="3" fill="#FF3D14" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div class="game-brand-title">DEEPBEAT</div>
            <div class="game-brand-sub">落跑计划</div>
          </div>
        </div>
        <button class="logout-btn" onclick="window.location.href='/#/profile'">
          ${escapeHtml(user?.nickname || '返回')}
        </button>
      </div>
      <div id="lobbyContent">
        <div class="game-loading"><div class="spinner"></div>加载中...</div>
      </div>
    </div>
  `;

  try {
    const data = await GameAPI.getList();
    const games = Array.isArray(data) ? data : (data.games || []);
    const lobbyEl = document.getElementById('lobbyContent');

    if (games.length === 0) {
      lobbyEl.innerHTML = `
        <div class="empty-state-game">
          <div class="empty-icon">🎭</div>
          <p>暂无进行中的游戏</p>
          <p class="empty-sub">等待 NPC 开启本场剧本</p>
        </div>
      `;
      return;
    }

    lobbyEl.innerHTML = `
      <div class="lobby-section-title">选择你的剧本</div>
      <div class="game-list">
        ${games.map(g => `
          <div class="game-card" onclick="gameRouter.navigate('#/join/${encodeURIComponent(g.id)}')">
            <div class="game-card-header">
              <span class="game-card-icon">🎭</span>
              <div class="game-card-status ${g.status === 'active' ? 'status-active' : 'status-waiting'}">
                ${g.status === 'active' ? '进行中' : '准备中'}
              </div>
            </div>
            <div class="game-card-title">${escapeHtml(g.name)}</div>
            <div class="game-card-desc">${escapeHtml(g.description || '')}</div>
            <div class="game-card-footer">
              <span class="game-card-players">👥 ${g.player_count || 0} 名玩家</span>
              <span class="game-card-arrow">进入 →</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    document.getElementById('lobbyContent').innerHTML = `
      <div class="empty-state-game">
        <div class="empty-icon">⚠️</div>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ============================================================
// 角色选择
// ============================================================

async function renderJoinPage(params) {
  if (!requireLogin()) return;
  hideBottomNav();
  const gameId = params.gameId;
  const app = document.getElementById('game-app');
  // 先加载角色列表展示可用角色
  let characters = [];
  try {
    characters = await GameAPI.getCharacters(gameId);
  } catch (e) { /* ignore */ }

  app.innerHTML = `
    <div class="login-page">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M32 8L8 48h48L32 8z" stroke="#FF3D14" stroke-width="2.5" fill="none"/>
            <path d="M20 48L32 28l12 20" stroke="#FF3D14" stroke-width="1.5" opacity="0.5"/>
            <circle cx="32" cy="36" r="3" fill="#FF3D14" opacity="0.6"/>
          </svg>
        </div>
        <h1>落跑计划</h1>
        <p>选择你的角色，进入故事</p>
      </div>

      ${characters.length > 0 ? `
        <div style="margin-bottom:24px">
          <div class="form-label">可选角色</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${characters.map(c => `
              <div style="padding:8px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;font-size:0.8rem;cursor:${c.taken ? 'default' : 'pointer'};opacity:${c.taken ? '0.4' : '1'};color:var(--text-secondary)"
                   ${!c.taken ? `onclick="document.getElementById('joinCode').value='${escapeHtml(c.code)}'"` : ''}>
                <span style="color:var(--accent);font-family:var(--font-mono)">${escapeHtml(c.code)}</span>
                ${escapeHtml(c.name)}
                ${c.taken ? '<span style="color:var(--text-muted);margin-left:4px">已选</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">玩家编号</label>
        <input type="text" class="form-input" id="joinCode" placeholder="输入你的编号" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">通行密令</label>
        <input type="password" class="form-input" id="joinPass" placeholder="输入密令">
      </div>
      <button class="btn btn-primary" onclick="handleJoinFromForm(${Number(gameId)})">
        进入故事
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
      </button>
      <p style="text-align:center;margin-top:16px">
        <a href="#/" style="color:var(--text-muted);font-size:0.8rem;text-decoration:none">← 返回大厅</a>
      </p>
    </div>
  `;
}

function handleJoinFromForm(gameId) {
    const code = document.getElementById('joinCode').value.trim();
    const pass = document.getElementById('joinPass').value.trim();
    if (!code || !pass) {
      showGameToast('请输入编号和密令', 'error');
      return;
    }
    handleJoin(gameId, code, pass);
}

async function handleJoin(gameId, characterCode, characterPassword) {
  try {
    const data = await GameAPI.join(gameId, { characterCode, characterPassword });
    localStorage.setItem('game_id', String(gameId));
    localStorage.setItem('game_character', JSON.stringify(data.character || {}));
    showGameToast('角色选择成功，进入游戏', 'success');
    setTimeout(() => gameRouter.navigate('#/play'), 600);
  } catch (err) {
    showGameToast(err.message, 'error');
  }
}

// ============================================================
// 主游戏界面
// ============================================================

async function renderPlayPage() {
  if (!requireLogin()) return;
  if (!requireCharacter()) return;
  showBottomNav('navPlay');

  const app = document.getElementById('game-app');
  app.innerHTML = `
    <div class="game-app" style="padding-bottom:100px">
      <div class="game-loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const state = await GameAPI.getState();
    window._gameState = state;

    const charStored = localStorage.getItem('game_character');
    const char = state.character || (charStored ? JSON.parse(charStored) : {});
    const stages = state.stages || [];
    const clues = state.clues || [];

    const currentStage = state.currentStage;
    const script = currentStage?.script;
    const stageName = currentStage?.name || '';

    app.innerHTML = `
      <div class="game-app" style="padding-bottom:100px">

        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="avatar">${escapeHtml((char.name || '?')[0])}</div>
            <div class="header-info">
              <h2>${escapeHtml(char.name || '未知角色')}</h2>
              <span class="stage-badge">
                ${escapeHtml(stageName)} · 进行中
              </span>
            </div>
          </div>
          <button class="logout-btn" onclick="handleGameExit()">退出</button>
        </div>

        <!-- Progress -->
        <div class="progress-track">
          ${stages.map((s, i) => `
            <div class="progress-step ${s.status}">
              <div class="progress-dot">
                ${s.status === 'completed' ? '✓' : String(i + 1)}
              </div>
              <div class="progress-label">${escapeHtml(s.name)}</div>
            </div>
          `).join('')}
        </div>

        <!-- Story -->
        ${script?.background ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">📜</div>
              <div class="section-title">你的故事</div>
            </div>
            <div class="section-body">
              ${escapeHtml(script.background).split('\\n').join('<br>')}
            </div>
          </div>
        ` : ''}

        <!-- Task -->
        ${script ? `
          <div class="task-card">
            <div class="section-header">
              <div class="section-icon">🎯</div>
              <div class="section-title">当前任务</div>
            </div>
            <div class="task-title">${escapeHtml(script.taskTitle || '等待任务')}</div>
            <div class="task-desc">${escapeHtml(script.taskDesc || '')}</div>
            <div class="passcode-group">
              <input type="text" class="passcode-input" id="passcodeInput"
                     placeholder="输入通关码" autocomplete="off" spellcheck="false">
              <button class="passcode-submit" id="passcodeBtn" onclick="handlePasscode()">解锁</button>
            </div>
            <div class="passcode-hint" id="passcodeHint">找到 NPC 后获得通关码</div>
          </div>
        ` : ''}

        <!-- Clues preview -->
        ${clues.length > 0 ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">📎</div>
              <div class="section-title">
                已获线索
                <span style="color:var(--accent);font-size:0.85em;margin-left:4px">${clues.length}</span>
              </div>
            </div>
            <div class="clue-list">
              ${clues.slice(0, 3).map(c => `
                <div class="clue-item">
                  <div class="clue-marker"></div>
                  <div class="clue-text">
                    <strong>${escapeHtml(c.title)}</strong>
                    ${c.content ? ' — ' + escapeHtml(c.content) : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            ${clues.length > 3 ? `
              <div style="text-align:center;margin-top:10px">
                <button class="btn-link" onclick="gameRouter.navigate('#/clues')">
                  查看全部 ${clues.length} 条线索 →
                </button>
              </div>
            ` : ''}
          </div>
        ` : ''}

      </div>
    `;

    document.getElementById('passcodeInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handlePasscode();
    });

  } catch (err) {
    app.innerHTML = `
      <div class="game-app">
        <div class="empty-state-game">
          <div class="empty-icon">⚠️</div>
          <p>${escapeHtml(err.message)}</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="gameRouter.navigate('#/')">
            返回大厅
          </button>
        </div>
      </div>
    `;
  }
}

async function handlePasscode() {
  const input = document.getElementById('passcodeInput');
  const hint = document.getElementById('passcodeHint');
  const btn = document.getElementById('passcodeBtn');
  const code = input.value.trim();

  if (!code) {
    hint.className = 'passcode-error';
    hint.textContent = '请输入通关码';
    return;
  }

  btn.disabled = true;
  btn.textContent = '验证中...';

  try {
    const data = await GameAPI.submitPasscode(code);
    input.value = '';
    hint.className = 'passcode-success';
    hint.textContent = '✓ 通关码正确';

    setTimeout(async () => {
      const stageName = data.nextStage ? data.nextStage.name : null;
      await showUnlockAnimation(stageName ? stageName + ' · 已解锁' : '新阶段已解锁', '新的任务已到来');
      window._gameState = null;
      renderPlayPage();
    }, 400);
  } catch (err) {
    hint.className = 'passcode-error';
    hint.textContent = err.message || '通关码错误，请找 NPC 确认';
    input.value = '';
    input.focus();
    input.style.animation = 'none';
    void input.offsetHeight;
    input.style.animation = 'shake 0.4s ease';
  } finally {
    btn.disabled = false;
    btn.textContent = '解锁';
  }
}

function handleGameExit() {
  localStorage.removeItem('game_character');
  localStorage.removeItem('game_id');
  window._gameState = null;
  gameRouter.navigate('#/');
}

// ============================================================
// 线索收集夹
// ============================================================

async function renderCluesPage() {
  if (!requireLogin()) return;
  if (!requireCharacter()) return;
  showBottomNav('navClues');

  const app = document.getElementById('game-app');
  app.innerHTML = `
    <div class="game-app" style="padding-bottom:100px">
      <div class="game-loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const state = window._gameState || await GameAPI.getState();
    window._gameState = state;
    const clues = state.clues || [];

    app.innerHTML = `
      <div class="game-app" style="padding-bottom:100px">
        <div class="page-header">
          <h2 class="page-header-title">线索收集夹</h2>
          <span class="page-header-count">${clues.length} 条</span>
        </div>

        ${clues.length === 0 ? `
          <div class="empty-state-game" style="margin-top:40px">
            <div class="empty-icon">📎</div>
            <p>还没有收集到线索</p>
            <p class="empty-sub">完成任务后线索会自动归档</p>
          </div>
        ` : `
          <div class="clue-full-list">
            ${clues.map((c, i) => `
              <div class="clue-full-item">
                <div class="clue-full-index">${String(i + 1).padStart(2, '0')}</div>
                <div class="clue-full-content">
                  <div class="clue-full-title">${escapeHtml(c.stage_name || '线索')}</div>
                  ${c.clue_text ? `<div class="clue-full-text">${escapeHtml(c.clue_text)}</div>` : ''}
                  ${c.obtained_at ? `<div class="clue-full-time">${escapeHtml(c.obtained_at)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      <div class="game-app">
        <div class="empty-state-game">
          <div class="empty-icon">⚠️</div>
          <p>${escapeHtml(err.message)}</p>
        </div>
      </div>
    `;
  }
}

// ============================================================
// 阶段历程
// ============================================================

async function renderHistoryPage() {
  if (!requireLogin()) return;
  if (!requireCharacter()) return;
  showBottomNav('navHistory');

  const app = document.getElementById('game-app');
  app.innerHTML = `
    <div class="game-app" style="padding-bottom:100px">
      <div class="game-loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const state = window._gameState || await GameAPI.getState();
    window._gameState = state;
    const stages = state.stages || [];

    app.innerHTML = `
      <div class="game-app" style="padding-bottom:100px">
        <div class="page-header">
          <h2 class="page-header-title">阶段历程</h2>
        </div>

        <div class="section">
          <div class="timeline">
            ${stages.map(s => `
              <div class="timeline-item ${s.status}">
                <div class="timeline-dot"></div>
                <div class="timeline-stage">${escapeHtml(s.name)}</div>
                <div class="timeline-title">
                  ${s.status === 'locked'
                    ? '??? — 未解锁'
                    : escapeHtml(s.taskTitle || s.name)}
                </div>
                ${s.completed_at
                  ? `<div class="timeline-time">${escapeHtml(s.completed_at)}</div>`
                  : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      <div class="game-app">
        <div class="empty-state-game">
          <div class="empty-icon">⚠️</div>
          <p>${escapeHtml(err.message)}</p>
        </div>
      </div>
    `;
  }
}

// ============================================================
// 路由注册
// ============================================================
const gameRouter = new Router();

gameRouter.add('#/', renderGameLobby);
gameRouter.add('#/join/:gameId', renderJoinPage);
gameRouter.add('#/play', renderPlayPage);
gameRouter.add('#/clues', renderCluesPage);
gameRouter.add('#/history', renderHistoryPage);

gameRouter.start();
