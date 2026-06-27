/**
 * 管理端邀请码路由 - /api/admin/invitations
 * 
 * 管理员可以：
 * - 生成邀请码（关联到活动）
 * - 查看邀请码列表
 * - 删除邀请码
 */

const express = require('express');
const crypto = require('crypto');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateAdmin);

// ============================================================
// GET /api/admin/invitations/codes
// 查看邀请码列表
// ============================================================
router.get('/codes', (req, res) => {
  const db = req.app.locals.db;
  const { activityId } = req.query;

  let query = `
    SELECT ic.*, a.title as activity_title, u.username as used_by_username
    FROM invitation_codes ic
    LEFT JOIN activities a ON a.id = ic.activity_id
    LEFT JOIN users u ON u.id = ic.used_by
  `;
  const params = [];

  if (activityId) {
    query += ' WHERE ic.activity_id = ?';
    params.push(parseInt(activityId));
  }

  query += ' ORDER BY ic.created_at DESC';

  const codes = db.prepare(query).all(...params);
  res.json(codes);
});

// ============================================================
// POST /api/admin/invitations/codes
// 生成邀请码
// body: { activityId, count, prefix }
// ============================================================
router.post('/codes', (req, res) => {
  const db = req.app.locals.db;
  const { activityId, count = 1, prefix = '' } = req.body;

  if (!activityId) {
    return res.status(400).json({ error: '请选择关联活动' });
  }

  const activity = db.prepare('SELECT id FROM activities WHERE id = ?').get(parseInt(activityId));
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const codes = [];
  for (let i = 0; i < Math.min(count, 50); i++) {
    // 生成 8 位随机码
    const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const code = prefix ? `${prefix}-${randomCode}` : randomCode;

    try {
      db.prepare(
        'INSERT INTO invitation_codes (code, activity_id, created_by) VALUES (?, ?, ?)'
      ).run(code, parseInt(activityId), req.admin.id);
      codes.push(code);
    } catch (e) {
      // 重复码跳过
      if (!e.message.includes('UNIQUE')) throw e;
    }
  }

  req.app.locals.dbSave();
  res.status(201).json({ message: `生成 ${codes.length} 个邀请码`, codes });
});

// ============================================================
// DELETE /api/admin/invitations/codes/:id
// 删除邀请码（仅未使用的可删除）
// ============================================================
router.delete('/codes/:id', (req, res) => {
  const db = req.app.locals.db;
  const id = parseInt(req.params.id);

  const code = db.prepare('SELECT * FROM invitation_codes WHERE id = ?').get(id);
  if (!code) {
    return res.status(404).json({ error: '邀请码不存在' });
  }
  if (code.used_by) {
    return res.status(400).json({ error: '已使用的邀请码不能删除' });
  }

  db.prepare('DELETE FROM invitation_codes WHERE id = ?').run(id);
  req.app.locals.dbSave();
  res.json({ message: '邀请码已删除' });
});

module.exports = router;
