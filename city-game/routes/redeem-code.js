/**
 * 邀请码兑换路由 - /api/auth/redeem-code
 *
 * 用户输入邀请码 → 自动报名对应活动 → 标记为已付费
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/redeem-code
 * 兑换邀请码
 * body: { code }
 *
 * 流程：
 * 1. 验证邀请码存在且状态为 active
 * 2. 检查用户是否已报名该活动
 * 3. 创建报名记录（status=pending, paid_at=now）
 * 4. 标记邀请码为 used
 * 5. 返回活动信息
 */
router.post('/redeem-code', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: '请输入邀请码' });
  }

  const trimmedCode = code.trim().toUpperCase();

  // 查找邀请码
  const inviteCode = db.prepare(`
    SELECT ic.*, a.title as activity_title, a.date as activity_date, a.location as activity_location
    FROM invite_codes ic
    LEFT JOIN activities a ON a.id = ic.activity_id
    WHERE ic.code = ?
  `).get(trimmedCode);

  if (!inviteCode) {
    return res.status(404).json({ error: '邀请码不存在' });
  }
  if (inviteCode.status !== 'active') {
    const statusMap = { used: '已被使用', revoked: '已作废' };
    return res.status(400).json({ error: `该邀请码${statusMap[inviteCode.status] || '已失效'}` });
  }

  // 检查活动是否存在且可报名
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(inviteCode.activity_id);
  if (!activity) {
    return res.status(404).json({ error: '关联活动不存在' });
  }
  if (activity.status === 'ended') {
    return res.status(400).json({ error: '该活动已结束' });
  }

  // 检查用户是否已报名
  const existing = db.prepare('SELECT id FROM registrations WHERE user_id = ? AND activity_id = ?').get(userId, inviteCode.activity_id);
  if (existing) {
    // 已报名，只标记邀请码为已用
    db.prepare("UPDATE invite_codes SET status = 'used', used_by = ?, used_at = datetime('now','localtime') WHERE id = ?").run(userId, inviteCode.id);
    req.app.locals.dbSave();
    return res.json({
      message: '你已报名该活动，邀请码已记录',
      activity: { id: activity.id, title: activity.title, date: activity.date, location: activity.location },
      alreadyRegistered: true
    });
  }

  // 创建报名记录（邀请码兑换 = 已付费用户）
  db.prepare(
    "INSERT INTO registrations (user_id, activity_id, status, paid_at) VALUES (?, ?, 'confirmed', datetime('now','localtime'))"
  ).run(userId, inviteCode.activity_id);

  // 标记邀请码为已用
  db.prepare("UPDATE invite_codes SET status = 'used', used_by = ?, used_at = datetime('now','localtime') WHERE id = ?").run(userId, inviteCode.id);

  req.app.locals.dbSave();

  res.json({
    message: '兑换成功！你已成功报名活动',
    activity: { id: activity.id, title: activity.title, date: activity.date, location: activity.location }
  });
});

module.exports = router;
