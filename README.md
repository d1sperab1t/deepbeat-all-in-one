# DEEPBEAT ALLIANCE — 城市活动用户平台

> 从城市运动到山野越野，从生活方式到商业考察，DEEPBEAT 致力于构建完整的联盟运动生态。

## 📁 项目结构

```
deepbeat-allinone/
├── city-game/              # 主项目目录（部署时只需此目录）
│   ├── server.js           # Express 入口
│   ├── config.js           # 全局配置
│   ├── package.json        # 依赖
│   ├── db/                 # 数据库（sql.js WASM）
│   ├── routes/             # API 路由
│   ├── middleware/         # 中间件
│   └── public/             # 前端静态文件
│       ├── index.html      # 用户端 SPA
│       ├── admin.html      # 管理端 SPA
│       ├── css/            # 样式
│       ├── js/             # 脚本
│       └── video/          # 视频资源
├── AGENTS.md               # AI 上下文文件
├── PRD_用户系统.md          # 产品需求文档
└── PROJECT_STRUCTURE.md    # 项目结构说明
```

## 🚀 快速开始

### 本地开发

```bash
cd city-game
npm install
node server.js
# 访问 http://localhost:3000
```

### 部署到服务器

```bash
# 上传 city-game 目录到服务器
rsync -avz --exclude 'node_modules' city-game/ user@server:~/deepbeat-allinone/city-game/

# 服务器上安装依赖并启动
cd ~/deepbeat-allinone/city-game
npm install --production
pm2 start server.js --name deepbeat-allinone
```

## 🛠 技术栈

- **前端**: 原生 JS + CSS（无框架）
- **后端**: Express.js
- **数据库**: SQLite（sql.js WASM）
- **认证**: JWT

## 📝 文档

- [AGENTS.md](AGENTS.md) — AI 上下文恢复包
- [PRD_用户系统.md](PRD_用户系统.md) — 产品需求文档
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) — 项目结构与数据库设计

## 📦 部署信息

- **服务器**: 腾讯云 Ubuntu 24.04
- **PM2 进程**: `deepbeat-allinone`（端口 3000）
- **认证服务**: `deepbeat-auth`（端口 3001）

## ⚠️ 注意事项

1. `city-game/db/game.db` 是运行时自动生成的数据库文件
2. `city-game/public/uploads/` 是用户上传文件目录
3. 部署时只需上传 `city-game/` 目录
