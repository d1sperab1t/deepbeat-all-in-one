/**
 * 用户端游戏路由 - /api/game
 *
 * 公开接口（无需登录）：GET /list, GET /:gameId/characters
 * 需要登录：POST /:gameId/join, POST /notifications/:id/read
 * 需要登录且已入场：GET /state, POST /passcode, GET /notifications
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, gameAuthenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/game/list
// 获取进行中的游戏列表（公开）
// ============================================================
router.get('/list', (req, res) => {
  const db = req.app.locals.db;
  const games = db.prepare(`
    SELECT g.id, g.name, g.description, g.status, g.created_at,
           (SELECT COUNT(*) FROM characters WHERE game_id = g.id) as character_count
    FROM games g
    WHERE g.status = 'active'
    ORDER BY g.created_at DESC
  `).all();
  res.json(games);
});

// ============================================================
// GET /api/game/:gameId/characters
// 角色列表，含 taken 状态（公开）
// ============================================================
router.get('/:gameId/characters', (req, res) => {
  const db = req.app.locals.db;
  const gameId = parseInt(req.params.gameId);

  const game = db.prepare('SELECT id FROM games WHERE id = ?').get(gameId);
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  const characters = db.prepare(`
    SELECT c.id, c.name, c.code, c.avatar_char, c.sort_order,
           CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as taken
    FROM characters c
    LEFT JOIN user_characters uc ON uc.character_id = c.id
    WHERE c.game_id = ?
    ORDER BY c.sort_order, c.id
  `).all(gameId);

  res.json(characters);
});

// ============================================================
// POST /api/game/:gameId/join
// 选择角色入场（需登录）
// body: { characterCode, characterPassword }
// ============================================================
router.post('/:gameId/join', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const gameId = parseInt(req.params.gameId);
  const { characterCode, characterPassword } = req.body;
  const userId = req.user.id;

  if (!characterCode || !characterPassword) {
    return res.status(400).json({ error: '请提供角色编号和密码' });
  }

  const game = db.prepare("SELECT * FROM games WHERE id = ? AND status = 'active'").get(gameId);
  if (!game) {
    return res.status(404).json({ error: '游戏不存在或已结束' });
  }

  const alreadyJoined = db.prepare('SELECT id FROM user_characters WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  if (alreadyJoined) {
    return res.status(409).json({ error: '你已经加入了此游戏' });
  }

  const character = db.prepare('SELECT * FROM characters WHERE game_id = ? AND code = ?').get(gameId, characterCode.trim());
  if (!character || !bcrypt.compareSync(characterPassword.trim(), character.password)) {
    return res.status(401).json({ error: '角色编号或密码错误' });
  }

  const taken = db.prepare('SELECT id FROM user_characters WHERE character_id = ?').get(character.id);
  if (taken) {
    return res.status(409).json({ error: '该角色已被其他玩家选择' });
  }

  const firstStage = db.prepare('SELECT * FROM stages WHERE game_id = ? ORDER BY sort_order, id LIMIT 1').get(gameId);
  if (!firstStage) {
    return res.status(500).json({ error: '游戏尚未配置阶段，请联系管理员' });
  }

  try {
    db.transaction(() => {
      db.prepare('INSERT INTO user_characters (user_id, character_id, game_id) VALUES (?, ?, ?)').run(userId, character.id, gameId);
      db.prepare('INSERT INTO player_progress (user_id, character_id, game_id, current_stage) VALUES (?, ?, ?, ?)').run(userId, character.id, gameId, firstStage.id);
    });
  } catch (e) {
    console.error('[game/join error]', e);
    return res.status(500).json({ error: '加入游戏失败，请重试' });
  }

  req.app.locals.dbSave();
  res.json({
    message: '成功加入游戏',
    character: { id: character.id, name: character.name, code: character.code, avatarChar: character.avatar_char },
    firstStage: { id: firstStage.id, name: firstStage.name }
  });
});

// ============================================================
// GET /api/game/state
// 当前游戏完整状态（需登录+已入场）
// ============================================================
router.get('/state', gameAuthenticate, (req, res) => {
  const db = req.app.locals.db;
  const { characterId, gameId } = req.user;
  const userId = req.user.id;

  const character = db.prepare('SELECT id, name, code, avatar_char FROM characters WHERE id = ?').get(characterId);
  const progress = db.prepare('SELECT * FROM player_progress WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  if (!progress) {
    return res.status(404).json({ error: '进度数据不存在' });
  }

  const currentStage = db.prepare('SELECT * FROM stages WHERE id = ?').get(progress.current_stage);
  const script = db.prepare('SELECT * FROM scripts WHERE character_id = ? AND stage_id = ?').get(characterId, progress.current_stage);

  const clues = db.prepare(`
    SELECT pc.id, pc.stage_id, pc.clue_text, pc.clue_image, pc.obtained_at, s.name as stage_name
    FROM player_clues pc
    JOIN stages s ON s.id = pc.stage_id
    WHERE pc.user_id = ? AND pc.character_id = ?
    ORDER BY pc.obtained_at
  `).all(userId, characterId);

  const isFinished = db.prepare('SELECT COUNT(*) as c FROM stage_order WHERE from_stage = ?').get(progress.current_stage).c === 0;
  // 获取所有阶段及玩家完成状态
  const allStages = db.prepare('SELECT * FROM stages WHERE game_id = ? ORDER BY sort_order, id').all(gameId);
  const currentIndex = allStages.findIndex(s => s.id === progress.current_stage);
  const stagesWithStatus = allStages.map((s, i) => {
    let status;
    if (i < currentIndex) status = 'completed';
    else if (i === currentIndex) status = 'current';
    else status = 'locked';
    // 获取该阶段的剧本任务标题
    const stScript = db.prepare('SELECT task_title FROM scripts WHERE character_id = ? AND stage_id = ?').get(characterId, s.id);
    return { id: s.id, name: s.name, sortOrder: s.sort_order, status, taskTitle: stScript?.task_title || null };
  });

  res.json({
    character: { id: character.id, name: character.name, code: character.code, avatarChar: character.avatar_char },
    currentStage: { ...currentStage, script: script || null },
    stages: stagesWithStatus,
    clues,
    isFinished
  });
});

// ============================================================
// POST /api/game/passcode
// 提交通关码解锁下一阶段（需登录+已入场）
// body: { code }
// ============================================================
router.post('/passcode', gameAuthenticate, (req, res) => {
  const db = req.app.locals.db;
  const { characterId, gameId } = req.user;
  const userId = req.user.id;
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: '请输入通关码' });
  }

  const progress = db.prepare('SELECT * FROM player_progress WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  if (!progress) {
    return res.status(404).json({ error: '进度数据不存在' });
  }

  const passcode = db.prepare(`
    SELECT * FROM passcodes
    WHERE game_id = ? AND LOWER(code) = LOWER(?) AND from_stage = ? AND is_used = 0
  `).get(gameId, code.trim(), progress.current_stage);

  if (!passcode) {
    return res.status(400).json({ error: '通关码无效或已被使用' });
  }

  const script = db.prepare('SELECT * FROM scripts WHERE character_id = ? AND stage_id = ?').get(characterId, progress.current_stage);
  const nextStage = db.prepare('SELECT * FROM stages WHERE id = ?').get(passcode.to_stage);

  try {
    db.transaction(() => {
      if (script && (script.clue_text || script.clue_image)) {
        db.prepare('INSERT INTO player_clues (user_id, character_id, stage_id, clue_text, clue_image) VALUES (?, ?, ?, ?, ?)').run(userId, characterId, progress.current_stage, script.clue_text || null, script.clue_image || null);
      }
      db.prepare("UPDATE player_progress SET current_stage = ?, updated_at = datetime('now', 'localtime') WHERE user_id = ? AND game_id = ?").run(passcode.to_stage, userId, gameId);
      db.prepare("UPDATE passcodes SET is_used = 1, used_by = ?, used_at = datetime('now', 'localtime') WHERE id = ?").run(characterId, passcode.id);
    });
  } catch (e) {
    console.error('[game/passcode error]', e);
    return res.status(500).json({ error: '提交失败，请重试' });
  }

  req.app.locals.dbSave();
  res.json({
    success: true,
    nextStage: nextStage ? { id: nextStage.id, name: nextStage.name } : null,
    clue: script ? { clueText: script.clue_text, clueImage: script.clue_image } : null
  });
});

// ============================================================
// GET /api/game/notifications
// 游戏通知（需登录+已入场）
// ============================================================
router.get('/notifications', gameAuthenticate, (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.user;
  const userId = req.user.id;

  const notifications = db.prepare(`
    SELECT gn.id, gn.title, gn.content, gn.type, gn.created_at,
           CASE WHEN un.id IS NOT NULL THEN 1 ELSE 0 END as is_read
    FROM game_notifications gn
    LEFT JOIN user_notifications un ON un.notification_id = gn.id AND un.user_id = ?
    WHERE gn.game_id = ? AND (gn.target_user IS NULL OR gn.target_user = ?)
    ORDER BY gn.created_at DESC
  `).all(userId, gameId, userId);

  res.json(notifications);
});

// ============================================================
// POST /api/game/notifications/:id/read
// 标记通知已读（需登录）
// ============================================================
router.post('/notifications/:id/read', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);

  const notification = db.prepare('SELECT id FROM game_notifications WHERE id = ?').get(notificationId);
  if (!notification) {
    return res.status(404).json({ error: '通知不存在' });
  }

  db.prepare('INSERT OR IGNORE INTO user_notifications (user_id, notification_id) VALUES (?, ?)').run(userId, notificationId);
  req.app.locals.dbSave();
  res.json({ success: true });
});

module.exports = router;
