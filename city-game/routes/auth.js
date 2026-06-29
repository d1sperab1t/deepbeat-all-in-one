/**
 * 认证路由 - /api/auth
 * 
 * 页面归属：
 *   - 注册页面 (register)
 *   - 登录页面 (login)
 *   - 忘记密码页面 (reset-password)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

// ============================================================
// POST /api/auth/register
// 【注册页面】用户注册（用户名 + 邀请码）
// ============================================================
router.post('/register', (req, res) => {
  const db = req.app.locals.db;
  const { username, password, nickname, invitationCode } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (username.trim().length < 2) {
    return res.status(400).json({ error: '用户名至少2个字符' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  // 检查用户名是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) {
    return res.status(409).json({ error: '该用户名已被注册' });
  }

  // 验证邀请码（如果提供了）
  let activityId = null;
  let isPaidUser = false;
  if (invitationCode && invitationCode.trim()) {
    const code = db.prepare(
      'SELECT * FROM invitation_codes WHERE code = ? AND used_by IS NULL'
    ).get(invitationCode.trim().toUpperCase());
    if (!code) {
      return res.status(400).json({ error: '邀请码无效或已被使用' });
    }
    activityId = code.activity_id;
    isPaidUser = true;
  }

  const hashed = bcrypt.hashSync(password, config.bcryptRounds);
  const result = db.prepare(
    'INSERT INTO users (username, password, nickname, is_paid_user) VALUES (?, ?, ?, ?)'
  ).run(username.trim(), hashed, nickname || '', isPaidUser ? 1 : 0);

  const userId = result.lastInsertRowid;

  // 如果有邀请码，标记已使用并关联活动
  if (invitationCode && invitationCode.trim()) {
    const code = db.prepare(
      'SELECT id FROM invitation_codes WHERE code = ?'
    ).get(invitationCode.trim().toUpperCase());
    if (code) {
      db.prepare("UPDATE invitation_codes SET used_by = ?, used_at = datetime('now', 'localtime') WHERE id = ?").run(userId, code.id);
    }
    // 如果有活动ID，自动报名
    if (activityId) {
      db.prepare("INSERT OR IGNORE INTO registrations (user_id, activity_id, status) VALUES (?, ?, 'confirmed')").run(userId, activityId);
    }
  }

  const token = jwt.sign(
    { id: userId, username: username.trim(), nickname: nickname || '' },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    message: '注册成功',
    token,
    user: { id: userId, username: username.trim(), nickname: nickname || '' }
  });
});

// ============================================================
// POST /api/auth/login
// 【登录页面】用户登录（用户名）
// ============================================================
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, nickname: user.nickname },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname }
  });
});

// ============================================================
// POST /api/auth/reset-password
// 【忘记密码页面】通过用户名 + 手机号验证身份后重置密码
// ============================================================
router.post('/reset-password', (req, res) => {
  const db = req.app.locals.db;
  const { username, phone, newPassword } = req.body;

  if (!username || !phone || !newPassword) {
    return res.status(400).json({ error: '用户名、手机号和新密码不能为空' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少6位' });
  }

  const user = db.prepare('SELECT id, phone FROM users WHERE username = ?').get(username.trim());
  // 统一返回同一错误信息，防止用户名枚举
  if (!user || !user.phone) {
    return res.status(400).json({ error: '验证失败，请联系管理员重置密码' });
  }
  if (user.phone !== phone.trim()) {
    return res.status(400).json({ error: '验证失败，手机号不匹配' });
  }

  const hashed = bcrypt.hashSync(newPassword, config.bcryptRounds);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);

  res.json({ message: '密码重置成功，请重新登录' });
});

module.exports = router;
