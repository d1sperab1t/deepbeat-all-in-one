/**
 * 游戏系统数据库迁移
 * 安全幂等：仅执行 CREATE TABLE IF NOT EXISTS + 索引，不删除现有数据
 *
 * 独立运行: node db/migrate-add-game.js
 * 模块调用: const { migrateAddGame } = require('./migrate-add-game'); migrateAddGame(db);
 */

const { initDatabase } = require('./init');

/**
 * 创建游戏系统所需的所有表和索引
 * @param {object} db - initDatabase() 返回的 db 封装对象
 */
function migrateAddGame(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'active'
                  CHECK(status IN ('setup','active','ended')),
      activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      code        TEXT NOT NULL,
      password    TEXT NOT NULL,
      avatar_char TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(game_id, code)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS stage_order (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      from_stage INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      to_stage   INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      UNIQUE(game_id, from_stage, to_stage)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scripts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      stage_id     INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      background   TEXT,
      task_title   TEXT,
      task_desc    TEXT,
      clue_text    TEXT,
      clue_image   TEXT,
      UNIQUE(character_id, stage_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS passcodes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      code       TEXT NOT NULL,
      from_stage INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      to_stage   INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      is_used    INTEGER NOT NULL DEFAULT 0,
      used_by    INTEGER REFERENCES characters(id) ON DELETE SET NULL,
      used_at    TEXT,
      UNIQUE(game_id, code)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_characters (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      game_id      INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      joined_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, game_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_progress (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id  INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      game_id       INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      current_stage INTEGER NOT NULL REFERENCES stages(id),
      started_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, game_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_clues (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      stage_id     INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
      clue_text    TEXT,
      clue_image   TEXT,
      obtained_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS game_notifications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      content     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'system',
      target_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_id INTEGER NOT NULL REFERENCES game_notifications(id) ON DELETE CASCADE,
      read_at         TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, notification_id)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_characters_game ON characters(game_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_stages_game     ON stages(game_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_scripts_char    ON scripts(character_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_scripts_stage   ON scripts(stage_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_passcodes_game  ON passcodes(game_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_progress_user   ON player_progress(user_id, game_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_chars_user ON user_characters(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_clues_user      ON player_clues(user_id, character_id)`);

  console.log('✅  游戏系统表迁移完成');
}

async function main() {
  console.log('🎮  正在迁移游戏系统表...');
  const { db, save, close } = await initDatabase();
  try {
    migrateAddGame(db);
    save();
    console.log('💾  已持久化数据库');
  } finally {
    close();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌  迁移失败:', err);
    process.exit(1);
  });
}

module.exports = { migrateAddGame };
