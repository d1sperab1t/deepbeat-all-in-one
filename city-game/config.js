/**
 * 全局配置
 * 所有可调参数集中管理，部署时只需改这一个文件
 */
module.exports = {
  // 服务器
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'city-game-secret-change-in-production',
  jwtExpiresIn: '7d',           // 用户 token 有效期
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'city-game-admin-secret-change-in-production',
  adminJwtExpiresIn: '24h',     // 管理员 token 有效期

  // 数据库
  dbPath: process.env.DB_PATH || './db/game.db',

  // 邀请函
  invitationExpiresDays: 7,     // 邀请函默认有效期（天）

  // 密码
  bcryptRounds: 10,

  // 上传
  uploadDir: './public/uploads',
  maxFileSize: 5 * 1024 * 1024, // 5MB
};
