/**
 * JWT 认证中间件
 * 
 * 提供两个中间件：
 *   authenticate  - 验证用户 token
 *   authenticateAdmin - 验证管理员 token
 * 
 * 解码后的 payload 会挂载到 req.user / req.admin
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 用户认证中间件
 * 从 Authorization: Bearer <token> 中提取并验证 JWT
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload; // { id, nickname, phone }
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

/**
 * 管理员认证中间件
 * 从 Authorization: Bearer <token> 中提取并验证管理员 JWT
 */
function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '管理员认证失败' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.adminJwtSecret);
    req.admin = payload; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: '管理员认证已过期' });
  }
}

/**
 * 游戏认证中间件
 * 先验证用户 JWT，再从 user_characters 查找当前用户的游戏绑定
 * 将 characterId / gameId / characterName 挂到 req.user
 */
function gameAuthenticate(req, res, next) {
  authenticate(req, res, () => {
    try {
      const db = req.app.locals.db;
      const char = db.prepare(`
        SELECT uc.character_id, uc.game_id, c.name
        FROM user_characters uc
        JOIN characters c ON c.id = uc.character_id
        JOIN games g ON g.id = uc.game_id
        WHERE uc.user_id = ? AND g.status = 'active' LIMIT 1
      `).get(req.user.id);
      if (!char) {
        return res.status(403).json({ error: '你尚未加入任何游戏，请先选择角色' });
      }
      req.user.characterId = char.character_id;
      req.user.gameId = char.game_id;
      req.user.characterName = char.name;
      next();
    } catch (err) {
      console.error('[gameAuthenticate error]', err);
      return res.status(500).json({ error: '服务器内部错误，请稍后重试' });
    }
  });
}

module.exports = { authenticate, authenticateAdmin, gameAuthenticate };
