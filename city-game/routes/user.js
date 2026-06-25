/**
 * 用户信息路由 - /api/user
 * 
 * 页面归属：
 *   - 个人中心首页 (profile)
 *   - 个人信息页 (profile/edit)
 *   - 电子印章墙 (stamps)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();
router.use(authenticate);

// ============================================================
// GET /api/user/profile
// 【个人中心首页】+【个人信息页】获取当前用户信息
// ============================================================
router.get('/profile', (req, res) => {
  const db = req.app.locals.db;
  const user = db.prepare(
    'SELECT id, nickname, real_name, phone, email, avatar, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const stats = db.prepare(
    "SELECT COUNT(DISTINCT activity_id) as total_activities FROM registrations WHERE user_id = ? AND status = 'paid'"
  ).get(req.user.id);

  const stampCount = db.prepare('SELECT COUNT(*) as count FROM stamps WHERE user_id = ?').get(req.user.id);

  res.json({
    user,
    stats: { totalActivities: stats.total_activities, totalStamps: stampCount.count }
  });
});

// ============================================================
// PUT /api/user/profile
// 【个人信息页】更新个人资料
// ============================================================
router.put('/profile', (req, res) => {
  const db = req.app.locals.db;
  const { nickname, real_name, email, avatar } = req.body;

  db.prepare(
    'UPDATE users SET nickname = COALESCE(?, nickname), real_name = COALESCE(?, real_name), email = COALESCE(?, email), avatar = COALESCE(?, avatar) WHERE id = ?'
  ).run(nickname || null, real_name || null, email || null, avatar || null, req.user.id);

  const user = db.prepare('SELECT id, nickname, real_name, phone, email, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: '资料更新成功', user });
});

// ============================================================
// PUT /api/user/password
// 【个人信息页】修改密码
// ============================================================
router.put('/password', (req, res) => {
  const db = req.app.locals.db;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请输入旧密码和新密码' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(401).json({ error: '旧密码错误' });
  }

  const hashed = bcrypt.hashSync(newPassword, config.bcryptRounds);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

  res.json({ message: '密码修改成功' });
});

// ============================================================
// GET /api/user/activities
// 【个人中心】获取用户的活动历史
// ============================================================
router.get('/activities', (req, res) => {
  const db = req.app.locals.db;
  const activities = db.prepare(
    `SELECT a.id, a.title, a.date, a.location, a.poster_url,
            r.status as reg_status, r.paid_at,
            (SELECT COUNT(*) FROM stamps WHERE user_id = ? AND activity_id = a.id) as has_stamp
     FROM registrations r
     JOIN activities a ON r.activity_id = a.id
     WHERE r.user_id = ? AND r.status != 'cancelled'
     ORDER BY a.date DESC`
  ).all(req.user.id, req.user.id);

  res.json({ activities });
});

// ============================================================
// GET /api/user/stamps
// 【电子印章墙】获取用户的全部印章
// ============================================================
router.get('/stamps', (req, res) => {
  const db = req.app.locals.db;
  const stamps = db.prepare(
    `SELECT s.id, s.design_url, s.earned_at,
            a.title as activity_title, a.date as activity_date, a.location as activity_location
     FROM stamps s
     JOIN activities a ON s.activity_id = a.id
     WHERE s.user_id = ?
     ORDER BY s.earned_at DESC`
  ).all(req.user.id);

  res.json({ stamps });
});

module.exports = router;
