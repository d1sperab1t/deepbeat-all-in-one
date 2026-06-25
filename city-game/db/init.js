/**
 * 数据库模块 - 基于 sql.js (纯 JS SQLite)
 * 
 * 提供与 better-sqlite3 兼容的同步 API 封装
 * sql.js 是纯 WASM 实现，无需原生编译
 * 
 * 导出：
 *   initDatabase() → 返回 { db, save, close }
 *   db.prepare(sql).run/get/all(params) 同步查询
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * 初始化数据库
 * @returns {Promise<{db, save, close}>}
 */
async function initDatabase() {
  const SQL = await initSqlJs();
  const dbPath = path.resolve(__dirname, '..', config.dbPath);

  // 确保目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 加载已有数据库或创建新库
  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  /**
   * 保存数据库到文件
   */
  function save() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  /**
   * 关闭数据库
   */
  function close() {
    save();
    db.close();
  }

  /**
   * 封装 prepare 方法，提供 better-sqlite3 兼容 API
   * 
   * 返回对象：
   *   .run(params)  → { changes, lastInsertRowid }
   *   .get(params)  → 单行对象 或 undefined
   *   .all(params)  → 行数组
   */
  function prepare(sql) {
    return {
      run(...params) {
        db.run(sql, params);
        const changes = db.getRowsModified();
        // 获取最后插入的行 ID（exec 返回数组，无结果集时为空数组）
        let lastInsertRowid = 0;
        try {
          const result = db.exec('SELECT last_insert_rowid() as id');
          if (result.length > 0 && result[0].values.length > 0) {
            lastInsertRowid = result[0].values[0][0];
          }
        } catch (e) {
          // 某些 SQL 执行后无法查询 last_insert_rowid
        }
        return { changes, lastInsertRowid };
      },

      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },

      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  }

  /**
   * 执行多条 SQL（建表用）
   */
  function exec(sql) {
    db.run(sql);
  }

  return { db: { prepare, run: (sql, params) => db.run(sql, params), exec }, save, close };
}

module.exports = { initDatabase };
