/**
 * 数据库初始化脚本
 * 运行: npm run init-db
 * 
 * 建表逻辑：先删后建，确保干净环境
 */

const bcrypt = require('bcryptjs');
const { initDatabase } = require('./init');
const config = require('../config');

async function main() {
  console.log('🗄️  正在初始化数据库...');

  const { db, save, close } = await initDatabase();

  // 启用外键
  db.run('PRAGMA foreign_keys = ON');

  // ============================================================
  // 建表
  // ============================================================
  db.exec(`
    DROP TABLE IF EXISTS stamps;
    DROP TABLE IF EXISTS task_progress;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS invitations;
    DROP TABLE IF EXISTS registrations;
    DROP TABLE IF EXISTS activities;
    DROP TABLE IF EXISTS brands;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS admins;
    DROP TABLE IF EXISTS users;
  `);

  db.exec(`
    -- 用户表
    CREATE TABLE users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname    TEXT    NOT NULL DEFAULT '',
      real_name   TEXT    NOT NULL DEFAULT '',
      phone       TEXT    NOT NULL DEFAULT '',
      email       TEXT    NOT NULL DEFAULT '',
      password    TEXT    NOT NULL,
      avatar      TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(phone),
      UNIQUE(email)
    );

    -- 管理员表
    CREATE TABLE admins (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'admin',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- 活动表
    CREATE TABLE activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      date        TEXT    NOT NULL,
      location    TEXT    NOT NULL DEFAULT '',
      fee         REAL    NOT NULL DEFAULT 0,
      max_players INTEGER NOT NULL DEFAULT 0,
      status      TEXT    NOT NULL DEFAULT 'draft',
      poster_url  TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- 报名表
    CREATE TABLE registrations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      status      TEXT    NOT NULL DEFAULT 'pending',
      paid_at     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, activity_id)
    );

    -- 邀请函表
    CREATE TABLE invitations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id  INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      unique_code  TEXT    NOT NULL UNIQUE,
      status       TEXT    NOT NULL DEFAULT 'pending',
      confirmed_at TEXT,
      expires_at   TEXT    NOT NULL,
      -- 邀请函内容
      guest_name   TEXT    NOT NULL DEFAULT '',
      title        TEXT    NOT NULL DEFAULT '',
      subtitle     TEXT    NOT NULL DEFAULT '',
      body         TEXT    NOT NULL DEFAULT '',
      footer       TEXT    NOT NULL DEFAULT '',
      template     TEXT    NOT NULL DEFAULT 'classic',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- 任务表
    CREATE TABLE tasks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id  INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      title        TEXT    NOT NULL,
      description  TEXT    NOT NULL DEFAULT '',
      password     TEXT    NOT NULL,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- 任务进度表
    CREATE TABLE task_progress (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      completed_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, task_id)
    );

    -- 电子印章表
    CREATE TABLE stamps (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id  INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      design_url   TEXT    NOT NULL DEFAULT '',
      earned_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, activity_id)
    );

    -- 品牌内容表
    CREATE TABLE brands (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      type         TEXT    NOT NULL DEFAULT 'self',
      description  TEXT    NOT NULL DEFAULT '',
      logo_url     TEXT    NOT NULL DEFAULT '',
      content      TEXT    NOT NULL DEFAULT '',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- 系统设置表 (KV)
    CREATE TABLE settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  console.log('✅  表结构创建完成');

  // ============================================================
  // 插入默认数据
  // ============================================================

  // 默认管理员
  const adminPwd = bcrypt.hashSync('admin123', config.bcryptRounds);
  db.prepare('INSERT OR IGNORE INTO admins (username, password, role) VALUES (?, ?, ?)').run('admin', adminPwd, 'superadmin');

  // 默认品牌
  db.prepare('INSERT OR IGNORE INTO brands (id, name, type, description) VALUES (?, ?, ?, ?)').run(1, '城市活动', 'self', '用脚步丈量城市，用故事连接你我');

  // 默认设置
  const defaultSettings = { site_name: '城市活动', site_logo: '', site_footer: '© 2026 城市活动 版权所有', icp_number: '' };
  for (const [k, v] of Object.entries(defaultSettings)) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, v);
  }

  save();
  close();

  console.log('✅  默认数据插入完成');
  console.log('📌  默认管理员: admin / admin123');
  console.log('🎉  数据库初始化完毕');
}

main().catch(err => {
  console.error('❌  初始化失败:', err);
  process.exit(1);
});
