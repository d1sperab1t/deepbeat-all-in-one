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
// 【注册页面】用户注册
// ============================================================
router.post('/register', (req, res) => {
  const db = req.app.locals.db;
  const { phone, password, nickname, email } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({ error: '该手机号已注册' });
  }

  const hashed = bcrypt.hashSync(password, config.bcryptRounds);
  const result = db.prepare(
    'INSERT INTO users (phone, password, nickname, email) VALUES (?, ?, ?, ?)'
  ).run(phone, hashed, nickname || '', email || '');

  const token = jwt.sign(
    { id: result.lastInsertRowid, nickname: nickname || '', phone },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    message: '注册成功',
    token,
    user: { id: result.lastInsertRowid, nickname: nickname || '', phone }
  });
});

// ============================================================
// POST /api/auth/login
// 【登录页面】用户登录
// ============================================================
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, nickname: user.nickname, phone: user.phone },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, nickname: user.nickname, phone: user.phone }
  });
});

// ============================================================
// POST /api/auth/reset-password
// 【忘记密码页面】通过手机号重置密码
// ============================================================
router.post('/reset-password', (req, res) => {
  const db = req.app.locals.db;
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword) {
    return res.status(400).json({ error: '手机号和新密码不能为空' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  const user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(404).json({ error: '该手机号未注册' });
  }

  const hashed = bcrypt.hashSync(newPassword, config.bcryptRounds);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id);

  res.json({ message: '密码重置成功，请重新登录' });
});

module.exports = router;
