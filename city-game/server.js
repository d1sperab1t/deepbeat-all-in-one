/**
 * Express 服务器入口
 * 
 * 职责：
 *   1. 初始化数据库连接
 *   2. 配置中间件（CORS、JSON解析、静态文件）
 *   3. 挂载路由
 *   4. 全局错误处理
 *   5. 启动监听
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { initDatabase } = require('./db/init');

async function startServer() {
  // ============================================================
  // 数据库初始化
  // ============================================================
  const { db, save, close } = await initDatabase();

  // 确保上传目录存在
  const uploadDir = path.resolve(__dirname, config.uploadDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // ============================================================
  // Express 应用
  // ============================================================
  const app = express();

  // 把 db 挂到 app.locals，路由里用 req.app.locals.db 获取
  app.locals.db = db;
  app.locals.dbSave = save;

  // 中间件
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];
  app.use(cors({ origin: allowedOrigins, credentials: true }));

  // 认证接口速率限制：每 IP 每 15 分钟最多 20 次
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '请求过于频繁，请 15 分钟后再试' },
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 静态文件（带缓存）
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // 静态资源缓存1天
    etag: true,
    lastModified: true
  }));
  app.use('/uploads', express.static(uploadDir));

  // ============================================================
  // 路由挂载
  // ============================================================
  const authRoutes = require('./routes/auth');
  const playerRoutes = require('./routes/player');
  const userRoutes = require('./routes/user');
  const adminRoutes = require('./routes/admin');
  const inviteCodeRoutes = require('./routes/invite-codes');
  const redeemCodeRoutes = require('./routes/redeem-code');

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/auth', authLimiter, redeemCodeRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/invite-codes', inviteCodeRoutes);

  // 游戏系统路由
  const gameRoutes = require('./routes/game');
  const adminGameRoutes = require('./routes/admin-game');
  app.use('/api/game', gameRoutes);
  app.use('/api/admin/game', adminGameRoutes);

  // 注意：旧版 admin-invitations 路由已弃用，统一使用 /api/admin/invite-codes

  // ============================================================
  // SPA 兜底
  // ============================================================
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  // 邀请函展示页（独立页面，无需登录）
  app.get('/invitation/view/:code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'invitation.html'));
  });
  // 游戏页 SPA 兜底
  app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
  });
  app.get('/game/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
  });


  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: '接口不存在' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // ============================================================
  // 全局错误处理
  // ============================================================
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack || err.message);
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  });

  // ============================================================
  // 定时保存数据库（每30秒）
  // ============================================================
  setInterval(() => {
    try { save(); } catch (e) { /* ignore */ }
  }, 30000);

  // ============================================================
  // 启动
  // ============================================================
  app.listen(config.port, config.host, () => {
    console.log(`🚀  城市活动平台已启动`);
    console.log(`📡  http://${config.host}:${config.port}`);
    console.log(`👤  用户端: http://localhost:${config.port}`);
    console.log(`🔧  管理端: http://localhost:${config.port}/admin`);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑  正在关闭...');
    close();
    process.exit(0);
  });
}

startServer().catch(err => {
  console.error('❌  服务器启动失败:', err);
  process.exit(1);
});
