/**
 * 用户端路由 - /api/player
 * 
 * 页面归属：
 *   - 活动宣传/报名页 (activities)
 *   - 活动邀请函页面 (invitation)
 *   - 活动信息/任务页 (tasks)
 *   - 线上任务卡页面 (task-play)
 *   - 通关成功页 (complete)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// GET /api/player/activities
// 【活动宣传/报名页】获取已发布的活动列表
// ============================================================
router.get('/activities', (req, res) => {
  const db = req.app.locals.db;
  const activities = db.prepare(
    `SELECT id, title, description, date, location, fee, max_players, poster_url, status,
            (SELECT COUNT(*) FROM registrations WHERE activity_id = activities.id AND status != 'cancelled') as registered_count
     FROM activities
     WHERE status = 'published'
     ORDER BY date DESC`
  ).all();

  res.json({ activities });
});

// ============================================================
// GET /api/player/activities/:id
// 【活动宣传/报名页】获取单个活动详情
// ============================================================
router.get('/activities/:id', (req, res) => {
  const db = req.app.locals.db;
  const activity = db.prepare(
    `SELECT *,
            (SELECT COUNT(*) FROM registrations WHERE activity_id = activities.id AND status != 'cancelled') as registered_count
     FROM activities WHERE id = ? AND status = 'published'`
  ).get(parseInt(req.params.id));

  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  res.json({ activity });
});

// ============================================================
// POST /api/player/activities/:id/register
// 【活动宣传/报名页】报名活动
// ============================================================
router.post('/activities/:id/register', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const activityId = parseInt(req.params.id);

  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND status = ?').get(activityId, 'published');
  if (!activity) {
    return res.status(404).json({ error: '活动不存在或未开放报名' });
  }

  const existing = db.prepare('SELECT id FROM registrations WHERE user_id = ? AND activity_id = ?').get(userId, activityId);
  if (existing) {
    return res.status(409).json({ error: '你已报名该活动' });
  }

  if (activity.max_players > 0) {
    const count = db.prepare("SELECT COUNT(*) as c FROM registrations WHERE activity_id = ? AND status != 'cancelled'").get(activityId);
    if (count.c >= activity.max_players) {
      return res.status(409).json({ error: '报名人数已满' });
    }
  }

  db.prepare(
    "INSERT INTO registrations (user_id, activity_id, status, paid_at) VALUES (?, ?, 'paid', datetime('now', 'localtime'))"
  ).run(userId, activityId);

  res.status(201).json({ message: '报名成功' });
});

// ============================================================
// GET /api/player/invitation/:code
// 【活动邀请函页面】通过唯一码获取邀请函信息
// ============================================================
// 邀请函详情（需登录，用于用户确认页）
router.get('/invitation/:code', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const invitation = db.prepare(
    `SELECT i.*, a.title as activity_title, a.date as activity_date, a.location as activity_location,
            u.nickname, u.real_name
     FROM invitations i
     JOIN activities a ON i.activity_id = a.id
     JOIN users u ON i.user_id = u.id
     WHERE i.unique_code = ?`
  ).get(req.params.code);

  if (!invitation) {
    return res.status(404).json({ error: '邀请函不存在' });
  }

  if (invitation.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权查看此邀请函' });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(410).json({ error: '邀请函已过期' });
  }

  res.json({ invitation });
});

// 邀请函公开展示页（无需登录，用于分享链接）
router.get('/invitation/:code/public', (req, res) => {
  const db = req.app.locals.db;
  const invitation = db.prepare(
    `SELECT i.guest_name, i.title, i.subtitle, i.body, i.footer, i.template, i.status, i.expires_at,
            a.title as activity_title, a.date as activity_date, a.location as activity_location
     FROM invitations i
     JOIN activities a ON i.activity_id = a.id
     WHERE i.unique_code = ?`
  ).get(req.params.code);

  if (!invitation) {
    return res.status(404).json({ error: '邀请函不存在' });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(410).json({ error: '邀请函已过期' });
  }

  res.json({ invitation });
});

// ============================================================
// POST /api/player/invitation/:code/confirm
// 【活动邀请函页面】确认参与活动
// ============================================================
router.post('/invitation/:code/confirm', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const invitation = db.prepare('SELECT * FROM invitations WHERE unique_code = ?').get(req.params.code);

  if (!invitation) {
    return res.status(404).json({ error: '邀请函不存在' });
  }
  if (invitation.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此邀请函' });
  }
  if (invitation.status === 'confirmed') {
    return res.status(409).json({ error: '已确认过参与' });
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return res.status(410).json({ error: '邀请函已过期' });
  }

  db.prepare(
    "UPDATE invitations SET status = 'confirmed', confirmed_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(invitation.id);

  res.json({ message: '确认成功，期待你的参与！' });
});

// ============================================================
// GET /api/player/tasks/:activityId
// 【活动信息/任务页】获取某活动的任务列表（带完成状态）
// ============================================================
router.get('/tasks/:activityId', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const activityId = parseInt(req.params.activityId);

  const reg = db.prepare("SELECT id FROM registrations WHERE user_id = ? AND activity_id = ? AND status != 'cancelled'")
    .get(userId, activityId);
  if (!reg) {
    return res.status(403).json({ error: '你尚未报名该活动' });
  }

  const tasks = db.prepare(
    `SELECT t.id, t.title, t.description, t.sort_order,
            CASE WHEN tp.id IS NOT NULL THEN 1 ELSE 0 END as completed
     FROM tasks t
     LEFT JOIN task_progress tp ON tp.task_id = t.id AND tp.user_id = ?
     WHERE t.activity_id = ?
     ORDER BY t.sort_order`
  ).all(userId, activityId);

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;

  res.json({ tasks, total, completed, allDone: total > 0 && completed === total });
});

// ============================================================
// POST /api/player/tasks/:taskId/verify
// 【线上任务卡页面】验证任务密码
// ============================================================
router.post('/tasks/:taskId/verify', authenticate, (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const taskId = parseInt(req.params.taskId);
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const done = db.prepare('SELECT id FROM task_progress WHERE user_id = ? AND task_id = ?').get(userId, taskId);
  if (done) {
    return res.status(409).json({ error: '该任务已完成' });
  }

  if (!bcrypt.compareSync(password, task.password)) {
    return res.status(401).json({ error: '密码错误，请重新输入' });
  }

  db.prepare('INSERT INTO task_progress (user_id, task_id) VALUES (?, ?)').run(userId, taskId);

  // 检查是否全部完成 → 发放印章
  const activityId = task.activity_id;
  const allTasks = db.prepare('SELECT id FROM tasks WHERE activity_id = ?').all(activityId);
  const completedTasks = db.prepare(
    'SELECT task_id FROM task_progress WHERE user_id = ? AND task_id IN (SELECT id FROM tasks WHERE activity_id = ?)'
  ).all(userId, activityId);

  let stampEarned = false;
  if (allTasks.length > 0 && completedTasks.length >= allTasks.length) {
    try {
      db.prepare('INSERT INTO stamps (user_id, activity_id) VALUES (?, ?)').run(userId, activityId);
      stampEarned = true;
    } catch (e) {
      // 已发放过
    }
  }

  res.json({ message: '密码正确，任务完成！', stampEarned, activityId });
});

module.exports = router;
