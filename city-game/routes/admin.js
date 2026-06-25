/**
 * 管理端路由 - /api/admin
 * 
 * 页面归属：
 *   - 管理员登录页 (admin/login)
 *   - 仪表盘首页 (admin/dashboard)
 *   - 活动管理页 (admin/activities)
 *   - 邀请函管理页 (admin/invitations)
 *   - 用户管理页 (admin/users)
 *   - 任务配置页 (admin/tasks)
 *   - 品牌/联名管理页 (admin/brands)
 *   - 系统设置页 (admin/settings)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticateAdmin } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// ============================================================
// POST /api/admin/login
// 【管理员登录页】管理员登录
// ============================================================
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    config.adminJwtSecret,
    { expiresIn: config.adminJwtExpiresIn }
  );

  res.json({ message: '登录成功', token, admin: { id: admin.id, username: admin.username, role: admin.role } });
});

// 以下路由都需要管理员认证
router.use(authenticateAdmin);

// ============================================================
// GET /api/admin/dashboard
// 【仪表盘首页】获取系统概览数据
// ============================================================
router.get('/dashboard', (req, res) => {
  const db = req.app.locals.db;

  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const newUsersWeek = db.prepare('SELECT COUNT(*) as c FROM users WHERE date(created_at) >= ?').get(weekAgo).c;

  const currentActivity = db.prepare(
    "SELECT * FROM activities WHERE status = 'published' ORDER BY date DESC LIMIT 1"
  ).get();

  let currentStats = null;
  if (currentActivity) {
    const registrations = db.prepare(
      "SELECT COUNT(*) as c FROM registrations WHERE activity_id = ? AND status != 'cancelled'"
    ).get(currentActivity.id).c;
    const invitations = db.prepare(
      'SELECT COUNT(*) as c FROM invitations WHERE activity_id = ?'
    ).get(currentActivity.id).c;
    currentStats = { registrations, invitations };
  }

  const recentEvents = db.prepare(
    `(SELECT '注册' as type, nickname as detail, created_at FROM users ORDER BY created_at DESC LIMIT 10)
     UNION ALL
     (SELECT '报名' as type, u.nickname || ' → ' || a.title as detail, r.created_at
      FROM registrations r JOIN users u ON r.user_id = u.id JOIN activities a ON r.activity_id = a.id
      ORDER BY r.created_at DESC LIMIT 10)
     ORDER BY created_at DESC LIMIT 20`
  ).all();

  res.json({ totalUsers, newUsersWeek, currentActivity, currentStats, recentEvents });
});

// ============================================================
// GET /api/admin/users/export/csv
// 【用户管理】导出用户CSV（放在 /users/:id 之前避免路由冲突）
// ============================================================
router.get('/users/export/csv', (req, res) => {
  const db = req.app.locals.db;
  const users = db.prepare('SELECT id, nickname, real_name, phone, email, created_at FROM users ORDER BY id').all();

  let csv = 'ID,昵称,姓名,手机,邮箱,注册时间\n';
  users.forEach(u => {
    csv += `${u.id},"${u.nickname}","${u.real_name}","${u.phone}","${u.email}","${u.created_at}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
  res.send('\uFEFF' + csv);
});

// ============================================================
// CRUD /api/admin/activities
// 【活动管理页】活动的增删改查
// ============================================================

router.get('/activities', (req, res) => {
  const db = req.app.locals.db;
  const { status } = req.query;
  let sql = `SELECT *, (SELECT COUNT(*) FROM registrations WHERE activity_id = activities.id AND status != 'cancelled') as registered_count FROM activities`;
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY date DESC';
  res.json({ activities: db.prepare(sql).all(...params) });
});

router.get('/activities/:id', (req, res) => {
  const db = req.app.locals.db;
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(parseInt(req.params.id));
  if (!activity) return res.status(404).json({ error: '活动不存在' });
  res.json({ activity });
});

router.post('/activities', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, date, location, fee, max_players, poster_url, status } = req.body;
  if (!title || !date) return res.status(400).json({ error: '活动名称和日期不能为空' });

  const result = db.prepare(
    'INSERT INTO activities (title, description, date, location, fee, max_players, poster_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', date, location || '', fee || 0, max_players || 0, poster_url || '', status || 'draft');

  res.status(201).json({ message: '活动创建成功', id: result.lastInsertRowid });
});

router.put('/activities/:id', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, date, location, fee, max_players, poster_url, status } = req.body;
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT id FROM activities WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '活动不存在' });

  db.prepare(
    `UPDATE activities SET
     title = COALESCE(?, title), description = COALESCE(?, description),
     date = COALESCE(?, date), location = COALESCE(?, location),
     fee = COALESCE(?, fee), max_players = COALESCE(?, max_players),
     poster_url = COALESCE(?, poster_url), status = COALESCE(?, status)
     WHERE id = ?`
  ).run(
    title || null, description || null, date || null, location || null,
    fee !== undefined && fee !== null ? fee : null,
    max_players !== undefined && max_players !== null ? max_players : null,
    poster_url || null, status || null, id
  );

  res.json({ message: '活动更新成功' });
});

router.delete('/activities/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM activities WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: '活动已删除' });
});

// ============================================================
// CRUD /api/admin/users
// 【用户管理页】用户的查看和管理
// ============================================================

router.get('/users', (req, res) => {
  const db = req.app.locals.db;
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let countSql = 'SELECT COUNT(*) as total FROM users';
  let sql = 'SELECT id, nickname, real_name, phone, email, avatar, created_at FROM users';
  const params = [];

  if (search) {
    const where = ' WHERE nickname LIKE ? OR phone LIKE ? OR email LIKE ? OR real_name LIKE ?';
    countSql += where;
    sql += where;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const total = db.prepare(countSql).get(...params).total;
  const users = db.prepare(sql).all(...params, parseInt(limit), offset);

  res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/users/:id', (req, res) => {
  const db = req.app.locals.db;
  const user = db.prepare('SELECT id, nickname, real_name, phone, email, avatar, created_at FROM users WHERE id = ?').get(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const activities = db.prepare(
    `SELECT a.title, a.date, r.status, r.paid_at FROM registrations r
     JOIN activities a ON r.activity_id = a.id WHERE r.user_id = ? ORDER BY a.date DESC`
  ).all(user.id);

  const stamps = db.prepare(
    `SELECT s.earned_at, a.title as activity_title FROM stamps s
     JOIN activities a ON s.activity_id = a.id WHERE s.user_id = ? ORDER BY s.earned_at DESC`
  ).all(user.id);

  res.json({ user, activities, stamps });
});

router.put('/users/:id/status', (req, res) => {
  res.json({ message: '用户状态更新成功' });
});

// ============================================================
// CRUD /api/admin/invitations
// 【邀请函管理页】邀请函的生成和管理
// ============================================================

router.get('/invitations', (req, res) => {
  const db = req.app.locals.db;
  const { activity_id } = req.query;

  let sql = `SELECT i.*, u.nickname, u.phone, a.title as activity_title
             FROM invitations i
             JOIN users u ON i.user_id = u.id
             JOIN activities a ON i.activity_id = a.id`;
  const params = [];

  if (activity_id) {
    sql += ' WHERE i.activity_id = ?';
    params.push(parseInt(activity_id));
  }
  sql += ' ORDER BY i.created_at DESC';

  res.json({ invitations: db.prepare(sql).all(...params) });
});

router.post('/invitations/generate', (req, res) => {
  const db = req.app.locals.db;
  const { activity_id, user_ids, title, subtitle, body, footer, guest_name, template } = req.body;

  if (!activity_id || !user_ids || !user_ids.length) {
    return res.status(400).json({ error: '请选择活动和用户' });
  }

  const activity = db.prepare('SELECT id, title as act_title, date as act_date, location as act_location FROM activities WHERE id = ?').get(activity_id);
  if (!activity) return res.status(404).json({ error: '活动不存在' });

  const expiresAt = new Date(Date.now() + config.invitationExpiresDays * 86400000)
    .toISOString().slice(0, 19).replace('T', ' ');

  // 默认内容
  const invTitle = title || '诚挚邀请';
  const invSubtitle = subtitle || activity.act_title;
  const invBody = body || `我们诚邀您参加「${activity.act_title}」，期待与您共度一段难忘的时光。`;
  const invFooter = footer || '请凭此邀请函准时出席';
  const invTemplate = template || 'classic';

  const generated = [];
  for (const userId of user_ids) {
    const code = crypto.randomBytes(16).toString('hex');
    const user = db.prepare('SELECT nickname, real_name FROM users WHERE id = ?').get(userId);
    const invGuestName = guest_name || (user ? (user.nickname || user.real_name || '') : '');

    try {
      const result = db.prepare(
        'INSERT OR IGNORE INTO invitations (user_id, activity_id, unique_code, expires_at, guest_name, title, subtitle, body, footer, template) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(userId, activity_id, code, expiresAt, invGuestName, invTitle, invSubtitle, invBody, invFooter, invTemplate);
      if (result.changes > 0) {
        generated.push({ userId, code, guestName: invGuestName });
      }
    } catch (e) {
      // 跳过重复
    }
  }

  res.json({ message: `成功生成 ${generated.length} 份邀请函`, invitations: generated });
});

router.put('/invitations/:id/revoke', (req, res) => {
  const db = req.app.locals.db;
  db.prepare("UPDATE invitations SET status = 'expired' WHERE id = ?").run(parseInt(req.params.id));
  res.json({ message: '邀请函已作废' });
});

// 更新邀请函内容
router.put('/invitations/:id/content', (req, res) => {
  const db = req.app.locals.db;
  const { title, subtitle, body, footer, guest_name, template } = req.body;
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT id FROM invitations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: '邀请函不存在' });

  db.prepare(
    `UPDATE invitations SET
     title = COALESCE(?, title), subtitle = COALESCE(?, subtitle),
     body = COALESCE(?, body), footer = COALESCE(?, footer),
     guest_name = COALESCE(?, guest_name), template = COALESCE(?, template)
     WHERE id = ?`
  ).run(title || null, subtitle || null, body || null, footer || null, guest_name || null, template || null, id);

  res.json({ message: '邀请函内容已更新' });
});

// ============================================================
// CRUD /api/admin/tasks
// 【任务配置页】任务的增删改查
// ============================================================

router.get('/tasks', (req, res) => {
  const db = req.app.locals.db;
  const { activity_id } = req.query;
  let sql = 'SELECT * FROM tasks';
  const params = [];
  if (activity_id) {
    sql += ' WHERE activity_id = ?';
    params.push(parseInt(activity_id));
  }
  sql += ' ORDER BY activity_id, sort_order';
  res.json({ tasks: db.prepare(sql).all(...params) });
});

router.post('/tasks', (req, res) => {
  const db = req.app.locals.db;
  const { activity_id, title, description, password, sort_order } = req.body;

  if (!activity_id || !title || !password) {
    return res.status(400).json({ error: '活动ID、任务名称和密码不能为空' });
  }

  const hashed = bcrypt.hashSync(password, config.bcryptRounds);
  const result = db.prepare(
    'INSERT INTO tasks (activity_id, title, description, password, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(activity_id, title, description || '', hashed, sort_order || 0);

  res.status(201).json({ message: '任务创建成功', id: result.lastInsertRowid });
});

router.put('/tasks/:id', (req, res) => {
  const db = req.app.locals.db;
  const { title, description, password, sort_order } = req.body;
  const id = parseInt(req.params.id);

  let hashed = null;
  if (password) {
    hashed = bcrypt.hashSync(password, config.bcryptRounds);
  }

  db.prepare(
    `UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description),
     password = COALESCE(?, password), sort_order = COALESCE(?, sort_order) WHERE id = ?`
  ).run(title || null, description || null, hashed, sort_order != null ? sort_order : null, id);

  res.json({ message: '任务更新成功' });
});

router.delete('/tasks/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: '任务已删除' });
});

// ============================================================
// CRUD /api/admin/brands
// 【品牌/联名管理页】品牌内容管理
// ============================================================

router.get('/brands', (req, res) => {
  const db = req.app.locals.db;
  res.json({ brands: db.prepare('SELECT * FROM brands ORDER BY id').all() });
});

router.post('/brands', (req, res) => {
  const db = req.app.locals.db;
  const { name, type, description, logo_url, content } = req.body;
  if (!name) return res.status(400).json({ error: '品牌名称不能为空' });

  const result = db.prepare(
    'INSERT INTO brands (name, type, description, logo_url, content) VALUES (?, ?, ?, ?, ?)'
  ).run(name, type || 'self', description || '', logo_url || '', content || '');

  res.status(201).json({ message: '品牌创建成功', id: result.lastInsertRowid });
});

router.put('/brands/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, type, description, logo_url, content } = req.body;
  const id = parseInt(req.params.id);

  db.prepare(
    `UPDATE brands SET name = COALESCE(?, name), type = COALESCE(?, type),
     description = COALESCE(?, description), logo_url = COALESCE(?, logo_url),
     content = COALESCE(?, content) WHERE id = ?`
  ).run(name || null, type || null, description || null, logo_url || null, content || null, id);

  res.json({ message: '品牌更新成功' });
});

router.delete('/brands/:id', (req, res) => {
  const db = req.app.locals.db;
  db.prepare('DELETE FROM brands WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: '品牌已删除' });
});

// ============================================================
// GET/PUT /api/admin/settings
// 【系统设置页】系统配置的读取和修改
// ============================================================

router.get('/settings', (req, res) => {
  const db = req.app.locals.db;
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json({ settings });
});

router.put('/settings', (req, res) => {
  const db = req.app.locals.db;
  const updates = req.body;

  for (const [k, v] of Object.entries(updates)) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, v);
  }

  res.json({ message: '设置已保存' });
});

module.exports = router;
