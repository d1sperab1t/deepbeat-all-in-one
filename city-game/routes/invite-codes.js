/**
 * 邀请码管理路由 - /api/admin/invite-codes
 *
 * 管理员功能：批量生成、列表查询、作废、统计
 */

const express = require('express');
const crypto = require('crypto');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateAdmin);

/**
 * 生成随机邀请码
 * 格式：DB-XXXX-XXXX（DEEPBEAT 缩写 + 8位随机字符）
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的 I/O/0/1
  let code = 'DB-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}

// ============================================================
// POST /api/admin/invite-codes/generate
// 批量生成邀请码
// body: { activityId, count, batchName }
// ============================================================
router.post('/generate', (req, res) => {
  const db = req.app.locals.db;
  const { activityId, count = 10, batchName = '' } = req.body;

  if (!activityId) {
    return res.status(400).json({ error: '请选择活动' });
  }
  if (count < 1 || count > 500) {
    return res.status(400).json({ error: '数量需在 1-500 之间' });
  }

  const activity = db.prepare('SELECT id, title FROM activities WHERE id = ?').get(parseInt(activityId));
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const generated = [];
  const insert = db.prepare(
    'INSERT INTO invite_codes (code, activity_id, batch_name) VALUES (?, ?, ?)'
  );

  for (let i = 0; i < count; i++) {
    let code;
    let attempts = 0;
    // 碰撞重试，最多 10 次
    do {
      code = generateCode();
      attempts++;
    } while (attempts < 10);

    try {
      const result = insert.run(code, parseInt(activityId), batchName || activity.title);
      generated.push({ id: result.lastInsertRowid, code });
    } catch (e) {
      // UNIQUE 冲突则跳过（极小概率）
      if (e.message && e.message.includes('UNIQUE')) {
        continue;
      }
      throw e;
    }
  }

  req.app.locals.dbSave();
  res.status(201).json({
    message: `成功生成 ${generated.length} 个邀请码`,
    count: generated.length,
    codes: generated
  });
});

// ============================================================
// GET /api/admin/invite-codes
// 列表查询（支持按活动、状态筛选）
// query: activityId, status, page, pageSize
// ============================================================
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { activityId, status, page = 1, pageSize = 50 } = req.query;

  let where = [];
  let params = [];

  if (activityId) {
    where.push('ic.activity_id = ?');
    params.push(parseInt(activityId));
  }
  if (status) {
    where.push('ic.status = ?');
    params.push(status);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  // 总数
  const total = db.prepare(`SELECT COUNT(*) as c FROM invite_codes ic ${whereClause}`).get(...params).c;

  // 分页数据
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const codes = db.prepare(`
    SELECT ic.*, a.title as activity_title, u.nickname as used_by_name, u.phone as used_by_phone
    FROM invite_codes ic
    LEFT JOIN activities a ON a.id = ic.activity_id
    LEFT JOIN users u ON u.id = ic.used_by
    ${whereClause}
    ORDER BY ic.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  // 按活动统计
  const stats = db.prepare(`
    SELECT
      a.id as activity_id,
      a.title as activity_title,
      COUNT(*) as total,
      SUM(CASE WHEN ic.status = 'active' THEN 1 ELSE 0 END) as active_count,
      SUM(CASE WHEN ic.status = 'used' THEN 1 ELSE 0 END) as used_count,
      SUM(CASE WHEN ic.status = 'revoked' THEN 1 ELSE 0 END) as revoked_count
    FROM invite_codes ic
    LEFT JOIN activities a ON a.id = ic.activity_id
    GROUP BY ic.activity_id
    ORDER BY total DESC
  `).all();

  res.json({ codes, total, page: parseInt(page), pageSize: parseInt(pageSize), stats });
});

// ============================================================
// PUT /api/admin/invite-codes/:id/revoke
// 作废单个邀请码
// ============================================================
router.put('/:id/revoke', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const code = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(id);
  if (!code) {
    return res.status(404).json({ error: '邀请码不存在' });
  }
  if (code.status !== 'active') {
    return res.status(400).json({ error: `该邀请码状态为「${code.status}」，无法作废` });
  }

  db.prepare("UPDATE invite_codes SET status = 'revoked', revoked_at = datetime('now','localtime') WHERE id = ?").run(id);
  req.app.locals.dbSave();
  res.json({ message: '邀请码已作废' });
});

// ============================================================
// PUT /api/admin/invite-codes/batch-revoke
// 批量作废
// body: { ids: [1,2,3] } 或 { activityId, status: 'active' }
// ============================================================
router.put('/batch-revoke', (req, res) => {
  const db = req.app.locals.db;
  const { ids, activityId, status = 'active' } = req.body;

  let affected = 0;
  if (ids && Array.isArray(ids)) {
    const stmt = db.prepare("UPDATE invite_codes SET status = 'revoked', revoked_at = datetime('now','localtime') WHERE id = ? AND status = 'active'");
    for (const id of ids) {
      const r = stmt.run(parseInt(id));
      affected += r.changes;
    }
  } else if (activityId) {
    const r = db.prepare("UPDATE invite_codes SET status = 'revoked', revoked_at = datetime('now','localtime') WHERE activity_id = ? AND status = ?")
      .run(parseInt(activityId), status);
    affected = r.changes;
  } else {
    return res.status(400).json({ error: '请提供 ids 数组或 activityId' });
  }

  req.app.locals.dbSave();
  res.json({ message: `已作废 ${affected} 个邀请码`, affected });
});

// ============================================================
// DELETE /api/admin/invite-codes/:id
// 删除邀请码（仅限未使用的）
// ============================================================
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const code = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(id);
  if (!code) {
    return res.status(404).json({ error: '邀请码不存在' });
  }
  if (code.status === 'used') {
    return res.status(400).json({ error: '已使用的邀请码无法删除' });
  }

  db.prepare('DELETE FROM invite_codes WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '邀请码已删除' });
});

module.exports = router;
