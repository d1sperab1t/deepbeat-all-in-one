# 城市活动用户系统 - 项目结构

**技术栈：** 原生 JS + CSS + Express.js + SQLite3 (better-sqlite3) + JWT

---

## 目录结构

```
city-game/
│
├── package.json                     # 项目依赖
├── server.js                        # Express 入口
├── config.js                        # 全局配置（端口、JWT密钥等）
│
├── db/
│   ├── init.js                      # 数据库初始化 + 建表脚本
│   └── game.db                      # SQLite 数据文件（运行时自动生成）
│
├── middleware/
│   └── auth.js                      # JWT 认证中间件（用户/管理员）
│
├── routes/
│   ├── auth.js                      # /api/auth/*     注册、登录、密码重置
│   ├── player.js                    # /api/player/*   用户端：活动、邀请函、任务、印章
│   ├── user.js                      # /api/user/*     用户个人信息：资料、活动历史、印章
│   └── admin.js                     # /api/admin/*    管理端：全部管理功能
│
├── public/
│   ├── index.html                   # 用户端 SPA 主入口
│   ├── admin.html                   # 管理端 SPA 主入口
│   │
│   ├── css/
│   │   ├── common.css               # 共享样式（变量、重置、通用组件）
│   │   ├── player.css               # 用户端专属样式
│   │   └── admin.css                # 管理端专属样式
│   │
│   └── js/
│       ├── api.js                   # fetch 封装 + JWT 拦截器
│       ├── router.js                # 简易 SPA 路由（hash-based）
│       ├── player-app.js            # 用户端页面逻辑 + 渲染
│       └── admin-app.js             # 管理端页面逻辑 + 渲染
│
└── README.md                        # 项目说明 + 启动指南
```

---

## 数据库表设计

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │     │  activities  │     │   admins    │
│─────────────│     │──────────────│     │─────────────│
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ nickname    │     │ title        │     │ username    │
│ real_name   │     │ description  │     │ password    │
│ phone       │     │ date         │     │ role        │
│ email       │     │ location     │     └─────────────┘
│ password    │     │ fee          │
│ avatar      │     │ max_players  │     ┌──────────────────┐
│ created_at  │     │ status       │     │  registrations   │
└──────┬──────┘     │ poster_url   │     │──────────────────│
       │            │ created_at   │     │ id (PK)          │
       │            └──────┬───────┘     │ user_id (FK)     │
       │                   │             │ activity_id (FK) │
       │            ┌──────▼───────┐     │ status           │
       │            │ invitations  │     │ paid_at          │
       │            │──────────────│     └──────────────────┘
       ├───────────►│ id (PK)      │
       │            │ user_id (FK) │     ┌──────────────┐
       │            │ activity_id  │     │   tasks      │
       │            │ unique_code  │     │──────────────│
       │            │ status       │     │ id (PK)      │
       │            │ confirmed_at │     │ activity_id  │
       │            │ expires_at   │     │ title        │
       │            └──────────────┘     │ description  │
       │                                 │ password     │
       │            ┌──────────────┐     │ sort_order   │
       │            │ task_progress│     └──────────────┘
       │            │──────────────│
       │            │ id (PK)      │     ┌──────────────┐
       ├───────────►│ user_id (FK) │     │   stamps     │
       │            │ task_id (FK) │     │──────────────│
       │            │ completed_at │     │ id (PK)      │
       │            └──────────────┘     │ user_id (FK) │
       │                                 │ activity_id  │
       └────────────────────────────────►│ earned_at    │
                                         │ design_url   │
                                         └──────────────┘
```

---

## API 路由规划

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/reset-password` | 密码重置 |

### 用户端 `/api/player`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/player/activities` | 活动列表 |
| GET | `/api/player/activities/:id` | 活动详情 |
| POST | `/api/player/activities/:id/register` | 报名活动 |
| GET | `/api/player/invitation/:code` | 获取邀请函 |
| POST | `/api/player/invitation/:code/confirm` | 确认参与 |
| GET | `/api/player/tasks/:activityId` | 获取任务列表 |
| POST | `/api/player/tasks/:taskId/verify` | 验证任务密码 |

### 用户信息 `/api/user`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/profile` | 个人信息 |
| PUT | `/api/user/profile` | 更新资料 |
| GET | `/api/user/stamps` | 印章列表 |
| GET | `/api/user/activities` | 活动历史 |

### 管理端 `/api/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/dashboard` | 仪表盘数据 |
| CRUD | `/api/admin/activities` | 活动管理 |
| CRUD | `/api/admin/users` | 用户管理 |
| CRUD | `/api/admin/invitations` | 邀请函管理 |
| CRUD | `/api/admin/tasks` | 任务配置 |
| GET/PUT | `/api/admin/settings` | 系统设置 |

---

## 页面间路由关系

### 用户端 (index.html)

```
#/                      → 品牌官网首页
#/collab                → 联名合作官网
#/activities            → 活动列表/宣传页
#/activities/:id        → 活动详情 + 报名
#/login                 → 登录
#/register              → 注册
#/profile               → 个人中心
#/profile/edit          → 个人信息编辑
#/invitation/:code      → 邀请函页面
#/tasks/:activityId     → 活动信息 + 任务入口
#/task-play/:taskId     → 线上任务卡（密码输入）
#/stamps                → 电子印章墙
#/complete/:activityId  → 通关成功页
```

### 管理端 (admin.html)

```
#/admin/login           → 管理员登录
#/admin/dashboard       → 仪表盘
#/admin/activities      → 活动管理
#/admin/invitations     → 邀请函管理
#/admin/users           → 用户管理
#/admin/tasks           → 任务配置
#/admin/brands          → 品牌/联名管理
#/admin/settings        → 系统设置
```
