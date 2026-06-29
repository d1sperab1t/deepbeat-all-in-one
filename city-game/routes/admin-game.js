/**
 * 管理端游戏路由 - /api/admin/game
 * 全部接口均需管理员认证（authenticateAdmin）
 *
 * 涵盖：游戏CRUD、角色CRUD、阶段CRUD、剧本upsert、
 *        通关码CRUD、玩家进度监控、统计、通知CRUD
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateAdmin);

// ============================================================
// 游戏场次管理
// ============================================================

// GET /api/admin/game/games
router.get('/games', (req, res) => {
  const db = req.app.locals.db;
  const games = db.prepare(`
    SELECT g.*,
           (SELECT COUNT(*) FROM characters WHERE game_id = g.id) as character_count,
           (SELECT COUNT(*) FROM stages WHERE game_id = g.id) as stage_count,
           (SELECT COUNT(*) FROM user_characters WHERE game_id = g.id) as player_count
    FROM games g
    ORDER BY g.created_at DESC
  `).all();
  res.json(games);
});

// POST /api/admin/game/games
router.post('/games', (req, res) => {
  const db = req.app.locals.db;
  const { name, description = '', activityId = null } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '游戏名称不能为空' });
  }

  const result = db.prepare('INSERT INTO games (name, description, activity_id) VALUES (?, ?, ?)').run(name.trim(), description, activityId || null);
  req.app.locals.dbSave();
  res.status(201).json({ id: result.lastInsertRowid, message: '游戏创建成功' });
});

// PUT /api/admin/game/games/:id
router.put('/games/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);
  const { name, description, status, activityId } = req.body;

  const game = db.prepare('SELECT id FROM games WHERE id = ?').get(id);
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (activityId !== undefined) { fields.push('activity_id = ?'); values.push(activityId || null); }

  if (fields.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  values.push(id);
  db.prepare(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  req.app.locals.dbSave();
  res.json({ message: '游戏已更新' });
});

// DELETE /api/admin/game/games/:id
router.delete('/games/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const game = db.prepare('SELECT id FROM games WHERE id = ?').get(id);
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  db.prepare('DELETE FROM games WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '游戏已删除' });
});

// ============================================================
// 角色管理
// ============================================================

// GET /api/admin/game/characters?gameId=
router.get('/characters', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const characters = db.prepare(`
    SELECT c.*,
           CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as taken,
           u.nickname as player_nickname, u.phone as player_phone
    FROM characters c
    LEFT JOIN user_characters uc ON uc.character_id = c.id
    LEFT JOIN users u ON u.id = uc.user_id
    WHERE c.game_id = ?
    ORDER BY c.sort_order, c.id
  `).all(parseInt(gameId));

  res.json(characters);
});

// POST /api/admin/game/characters
router.post('/characters', (req, res) => {
  const db = req.app.locals.db;
  const { gameId, name, code, password, avatarChar = '', sortOrder = 0 } = req.body;

  if (!gameId || !name || !code || !password) {
    return res.status(400).json({ error: '游戏ID、角色名、编号、密码均为必填' });
  }

  const game = db.prepare('SELECT id FROM games WHERE id = ?').get(parseInt(gameId));
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, config.bcryptRounds);
    const result = db.prepare('INSERT INTO characters (game_id, name, code, password, avatar_char, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(parseInt(gameId), name.trim(), code.trim(), hashedPassword, avatarChar, sortOrder);
    req.app.locals.dbSave();
    res.status(201).json({ id: result.lastInsertRowid, message: '角色创建成功' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该游戏中已存在相同编号的角色' });
    }
    console.error('[admin-game/characters POST error]', e);
    return res.status(500).json({ error: '创建失败，请重试' });
  }
});

// PUT /api/admin/game/characters/:id
router.put('/characters/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);
  const { name, code, password, avatarChar, sortOrder } = req.body;

  const char = db.prepare('SELECT id FROM characters WHERE id = ?').get(id);
  if (!char) {
    return res.status(404).json({ error: '角色不存在' });
  }

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
  if (code !== undefined) { fields.push('code = ?'); values.push(code.trim()); }
  if (password !== undefined) { fields.push('password = ?'); values.push(bcrypt.hashSync(password, config.bcryptRounds)); }
  if (avatarChar !== undefined) { fields.push('avatar_char = ?'); values.push(avatarChar); }
  if (sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(sortOrder); }

  if (fields.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  values.push(id);
  db.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  req.app.locals.dbSave();
  res.json({ message: '角色已更新' });
});

// DELETE /api/admin/game/characters/:id
router.delete('/characters/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const char = db.prepare('SELECT id FROM characters WHERE id = ?').get(id);
  if (!char) {
    return res.status(404).json({ error: '角色不存在' });
  }

  db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '角色已删除' });
});

// ============================================================
// 阶段管理
// ============================================================

// GET /api/admin/game/stages?gameId=
router.get('/stages', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const stages = db.prepare('SELECT * FROM stages WHERE game_id = ? ORDER BY sort_order, id').all(parseInt(gameId));
  const stageOrder = db.prepare('SELECT * FROM stage_order WHERE game_id = ?').all(parseInt(gameId));

  res.json({ stages, stageOrder });
});

// POST /api/admin/game/stages
router.post('/stages', (req, res) => {
  const db = req.app.locals.db;
  const { gameId, name, sortOrder = 0 } = req.body;

  if (!gameId || !name) {
    return res.status(400).json({ error: '游戏ID和阶段名称均为必填' });
  }

  const result = db.prepare('INSERT INTO stages (game_id, name, sort_order) VALUES (?, ?, ?)').run(parseInt(gameId), name.trim(), sortOrder);
  req.app.locals.dbSave();
  res.status(201).json({ id: result.lastInsertRowid, message: '阶段创建成功' });
});

// PUT /api/admin/game/stages/:id
router.put('/stages/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);
  const { name, sortOrder, fromStage, toStage } = req.body;

  const stage = db.prepare('SELECT * FROM stages WHERE id = ?').get(id);
  if (!stage) {
    return res.status(404).json({ error: '阶段不存在' });
  }

  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
  if (sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(sortOrder); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE stages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // 更新阶段顺序关系
  if (fromStage !== undefined && toStage !== undefined) {
    db.prepare('INSERT OR IGNORE INTO stage_order (game_id, from_stage, to_stage) VALUES (?, ?, ?)').run(stage.game_id, parseInt(fromStage), parseInt(toStage));
  }

  req.app.locals.dbSave();
  res.json({ message: '阶段已更新' });
});

// DELETE /api/admin/game/stages/:id
router.delete('/stages/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const stage = db.prepare('SELECT id FROM stages WHERE id = ?').get(id);
  if (!stage) {
    return res.status(404).json({ error: '阶段不存在' });
  }

  db.prepare('DELETE FROM stages WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '阶段已删除' });
});

// DELETE /api/admin/game/stage-order/:id
router.delete('/stage-order/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM stage_order WHERE id = ?').run(parseInt(req.params.id));
  req.app.locals.dbSave();
  res.json({ message: '阶段顺序已删除' });
});

// ============================================================
// 剧本管理（upsert）
// ============================================================

// GET /api/admin/game/scripts?gameId=
router.get('/scripts', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const scripts = db.prepare(`
    SELECT s.*, c.name as character_name, st.name as stage_name
    FROM scripts s
    JOIN characters c ON c.id = s.character_id
    JOIN stages st ON st.id = s.stage_id
    WHERE c.game_id = ?
    ORDER BY c.sort_order, st.sort_order
  `).all(parseInt(gameId));

  res.json(scripts);
});

// POST /api/admin/game/scripts（upsert 语义）
router.post('/scripts', (req, res) => {
  const db = req.app.locals.db;
  const { characterId, stageId, background, taskTitle, taskDesc, clueText, clueImage } = req.body;

  if (!characterId || !stageId) {
    return res.status(400).json({ error: '角色ID和阶段ID均为必填' });
  }

  db.prepare(`
    INSERT INTO scripts (character_id, stage_id, background, task_title, task_desc, clue_text, clue_image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(character_id, stage_id) DO UPDATE SET
      background  = excluded.background,
      task_title  = excluded.task_title,
      task_desc   = excluded.task_desc,
      clue_text   = excluded.clue_text,
      clue_image  = excluded.clue_image
  `).run(parseInt(characterId), parseInt(stageId), background || null, taskTitle || null, taskDesc || null, clueText || null, clueImage || null);

  req.app.locals.dbSave();
  res.json({ message: '剧本已保存' });
});

// ============================================================
// 通关码管理
// ============================================================

// GET /api/admin/game/passcodes?gameId=
router.get('/passcodes', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const passcodes = db.prepare(`
    SELECT p.*, sf.name as from_stage_name, st.name as to_stage_name,
           c.name as used_by_name
    FROM passcodes p
    JOIN stages sf ON sf.id = p.from_stage
    JOIN stages st ON st.id = p.to_stage
    LEFT JOIN characters c ON c.id = p.used_by
    WHERE p.game_id = ?
    ORDER BY sf.sort_order, p.code
  `).all(parseInt(gameId));

  res.json(passcodes);
});

// POST /api/admin/game/passcodes
router.post('/passcodes', (req, res) => {
  const db = req.app.locals.db;
  const { gameId, code, fromStage, toStage } = req.body;

  if (!gameId || !code || !fromStage || !toStage) {
    return res.status(400).json({ error: '游戏ID、通关码、起始阶段、目标阶段均为必填' });
  }

  try {
    const result = db.prepare('INSERT INTO passcodes (game_id, code, from_stage, to_stage) VALUES (?, ?, ?, ?)').run(parseInt(gameId), code.trim().toUpperCase(), parseInt(fromStage), parseInt(toStage));
    req.app.locals.dbSave();
    res.status(201).json({ id: result.lastInsertRowid, message: '通关码创建成功' });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该游戏中已存在相同通关码' });
    }
    console.error('[admin-game/passcodes POST error]', e);
    return res.status(500).json({ error: '创建失败，请重试' });
  }
});

// DELETE /api/admin/game/passcodes/:id
router.delete('/passcodes/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const passcode = db.prepare('SELECT id FROM passcodes WHERE id = ?').get(id);
  if (!passcode) {
    return res.status(404).json({ error: '通关码不存在' });
  }

  db.prepare('DELETE FROM passcodes WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '通关码已删除' });
});

// ============================================================
// 玩家进度监控
// ============================================================

// GET /api/admin/game/stats?gameId=
router.get('/stats', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const gid = parseInt(gameId);

  const totalPlayers = db.prepare('SELECT COUNT(*) as c FROM player_progress WHERE game_id = ?').get(gid).c;

  // 已完成：current_stage 无后续阶段（stage_order 中无 from_stage = current_stage）
  const finished = db.prepare(`
    SELECT COUNT(*) as c FROM player_progress pp
    WHERE pp.game_id = ?
      AND NOT EXISTS (SELECT 1 FROM stage_order so WHERE so.from_stage = pp.current_stage)
  `).get(gid).c;

  const inProgress = totalPlayers - finished;

  // 各阶段人数分布
  const stageDistribution = db.prepare(`
    SELECT s.id, s.name, s.sort_order, COUNT(pp.id) as player_count
    FROM stages s
    LEFT JOIN player_progress pp ON pp.current_stage = s.id AND pp.game_id = ?
    WHERE s.game_id = ?
    GROUP BY s.id
    ORDER BY s.sort_order
  `).all(gid, gid);

  res.json({ totalPlayers, inProgress, finished, stageDistribution });
});

// GET /api/admin/game/players?gameId=
router.get('/players', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const players = db.prepare(`
    SELECT
      pp.id, pp.user_id, pp.character_id, pp.current_stage,
      pp.started_at, pp.updated_at,
      u.nickname, u.phone,
      c.name as character_name, c.code as character_code,
      s.name as current_stage_name,
      CASE WHEN NOT EXISTS (SELECT 1 FROM stage_order so WHERE so.from_stage = pp.current_stage)
           THEN '已通关' ELSE '进行中' END as status
    FROM player_progress pp
    JOIN users u ON u.id = pp.user_id
    JOIN characters c ON c.id = pp.character_id
    JOIN stages s ON s.id = pp.current_stage
    WHERE pp.game_id = ?
    ORDER BY pp.updated_at DESC
  `).all(parseInt(gameId));

  res.json(players);
});

// POST /api/admin/game/push-player — 手动推进玩家到指定阶段
router.post('/push-player', (req, res) => {
  const db = req.app.locals.db;
  const { userId, gameId, toStageId } = req.body;

  if (!userId || !gameId || !toStageId) {
    return res.status(400).json({ error: 'userId、gameId、toStageId 均为必填' });
  }

  const progress = db.prepare('SELECT id FROM player_progress WHERE user_id = ? AND game_id = ?').get(parseInt(userId), parseInt(gameId));
  if (!progress) {
    return res.status(404).json({ error: '玩家进度不存在' });
  }

  const stage = db.prepare('SELECT id FROM stages WHERE id = ? AND game_id = ?').get(parseInt(toStageId), parseInt(gameId));
  if (!stage) {
    return res.status(404).json({ error: '目标阶段不存在或不属于该游戏' });
  }

  db.prepare("UPDATE player_progress SET current_stage = ?, updated_at = datetime('now', 'localtime') WHERE user_id = ? AND game_id = ?").run(parseInt(toStageId), parseInt(userId), parseInt(gameId));
  req.app.locals.dbSave();
  res.json({ message: '玩家进度已推进' });
});

// POST /api/admin/game/reset-player — 重置玩家进度
router.post('/reset-player', (req, res) => {
  const db = req.app.locals.db;
  const { userId, gameId } = req.body;

  if (!userId || !gameId) {
    return res.status(400).json({ error: 'userId 和 gameId 均为必填' });
  }

  const uid = parseInt(userId);
  const gid = parseInt(gameId);

  const progress = db.prepare('SELECT * FROM player_progress WHERE user_id = ? AND game_id = ?').get(uid, gid);
  if (!progress) {
    return res.status(404).json({ error: '玩家进度不存在' });
  }

  const firstStage = db.prepare('SELECT * FROM stages WHERE game_id = ? ORDER BY sort_order, id LIMIT 1').get(gid);
  if (!firstStage) {
    return res.status(500).json({ error: '游戏尚未配置阶段' });
  }

  try {
    db.transaction(() => {
      // 重置进度
      db.prepare("UPDATE player_progress SET current_stage = ?, updated_at = datetime('now', 'localtime') WHERE user_id = ? AND game_id = ?").run(firstStage.id, uid, gid);
      // 清除线索记录
      db.prepare('DELETE FROM player_clues WHERE user_id = ? AND character_id = ?').run(uid, progress.character_id);
      // 重置该角色使用过的通关码
      db.prepare("UPDATE passcodes SET is_used = 0, used_by = NULL, used_at = NULL WHERE game_id = ? AND used_by = ?").run(gid, progress.character_id);
    });
  } catch (e) {
    console.error('[admin-game/reset-player error]', e);
    return res.status(500).json({ error: '重置失败，请重试' });
  }

  req.app.locals.dbSave();
  res.json({ message: '玩家进度已重置' });
});

// ============================================================
// 通知管理
// ============================================================

// GET /api/admin/game/notifications?gameId=
router.get('/notifications', (req, res) => {
  const db = req.app.locals.db;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ error: '请提供 gameId 参数' });
  }

  const notifications = db.prepare(`
    SELECT gn.*, u.nickname as target_user_nickname
    FROM game_notifications gn
    LEFT JOIN users u ON u.id = gn.target_user
    WHERE gn.game_id = ?
    ORDER BY gn.created_at DESC
  `).all(parseInt(gameId));

  res.json(notifications);
});

// POST /api/admin/game/notifications
router.post('/notifications', (req, res) => {
  const db = req.app.locals.db;
  const { gameId, title, content, type = 'system', targetUser = null } = req.body;

  if (!gameId || !title || !content) {
    return res.status(400).json({ error: '游戏ID、标题、内容均为必填' });
  }

  const result = db.prepare('INSERT INTO game_notifications (game_id, title, content, type, target_user) VALUES (?, ?, ?, ?, ?)').run(parseInt(gameId), title.trim(), content, type, targetUser || null);
  req.app.locals.dbSave();
  res.status(201).json({ id: result.lastInsertRowid, message: '通知已发送' });
});

// DELETE /api/admin/game/notifications/:id
router.delete('/notifications/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const notification = db.prepare('SELECT id FROM game_notifications WHERE id = ?').get(id);
  if (!notification) {
    return res.status(404).json({ error: '通知不存在' });
  }

  db.prepare('DELETE FROM game_notifications WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '通知已删除' });
});

module.exports = router;
