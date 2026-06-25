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

module.exports = { authenticate, authenticateAdmin };
