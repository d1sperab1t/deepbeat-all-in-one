# AGENTS.md — 每次AI对话的"上下文恢复包"

> ⚠️ 每次新对话时，**第一个动作**就是上传这个文件！

---

## 项目概况

- **项目名称：** DEEPBEAT ALLIANCE — 城市活动用户平台
- **品牌：** DEEPBEAT（主营城市剧本杀线下活动）
- **技术栈：** 原生 JS + CSS + Express.js + SQLite (sql.js WASM) + JWT
- **部署环境：** 腾讯云 Ubuntu 24.04 (111.229.189.181)，用户: ubuntu
- **本地开发路径：** ~/deepbeat-allinone/city-game/
- **服务器路径：** 待部署（之前在 ~/48h 有旧版服务，使用 PM2 管理）

---

## 目录结构（只列出你需要关注的文件）

```
city-game/
├── server.js              # Express 入口
├── config.js              # 全局配置（端口、JWT密钥等）
├── package.json           # 依赖：express, sql.js, bcryptjs, jsonwebtoken, multer, cors
├── db/
│   ├── init.js            # 数据库初始化（sql.js WASM，提供 better-sqlite3 兼容 API）
│   ├── setup.js           # 建表脚本
│   └── game.db            # SQLite 数据文件（运行时自动生成）
├── middleware/
│   └── auth.js            # JWT 认证中间件
├── routes/
│   ├── auth.js            # /api/auth/* — 注册、登录、密码重置 ✅ 已完成
│   ├── player.js          # /api/player/* — 活动、邀请函、任务、印章 ✅ 已完成
│   ├── user.js            # /api/user/* — 个人信息、活动历史、印章 ✅ 已完成
│   └── admin.js           # /api/admin/* — 全部管理功能 ✅ 已完成
├── public/
│   ├── index.html         # 用户端 SPA 入口
│   ├── admin.html         # 管理端 SPA 入口
│   ├── invitation.html    # 邀请函独立展示页
│   ├── css/
│   │   ├── common.css     # 共享样式（CSS变量、重置、通用组件）
│   │   ├── player.css     # 用户端专属样式
│   │   └── admin.css      # 管理端专属样式
│   └── js/
│       ├── api.js         # fetch 封装 + JWT 自动注入 + 401处理 ✅ 已完成
│       ├── router.js      # hash-based SPA 路由器（支持 :param）✅ 已完成
│       ├── player-app.js  # 用户端所有页面（798行）✅ 已完成
│       └── admin-app.js   # 管理端所有页面（1375行）✅ 已完成
```

---

## 数据库表（7张）

| 表名 | 用途 |
|------|------|
| users | 注册用户（phone, password, nickname, real_name, email, avatar） |
| admins | 管理员账号（username, password, role） |
| activities | 活动（title, description, date, location, fee, max_players, status, poster_url） |
| registrations | 报名记录（user_id, activity_id, status, paid_at） |
| invitations | 邀请函（user_id, activity_id, unique_code, status, expires_at, 模板字段） |
| tasks | 线上任务（activity_id, title, description, password, sort_order） |
| task_progress | 任务完成记录（user_id, task_id, completed_at） |
| stamps | 电子印章（user_id, activity_id, earned_at, design_url） |
| brands | 品牌/联名信息（name, type, description, logo_url, content） |
| settings | 系统设置键值对（key, value） |

---

## API 路由总览

### 认证 /api/auth
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /register | 手机号注册 |
| POST | /login | 手机号登录 |
| POST | /reset-password | 密码重置 |

### 用户端 /api/player
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /activities | 已发布活动列表 |
| GET | /activities/:id | 活动详情 |
| POST | /activities/:id/register | 报名（需登录）|
| GET | /invitation/:code | 邀请函详情（需登录）|
| GET | /invitation/:code/public | 邀请函公开页（不需登录）|
| POST | /invitation/:code/confirm | 确认参与 |
| GET | /tasks/:activityId | 任务列表+完成状态 |
| POST | /tasks/:taskId/verify | 验证任务密码 → 全部完成自动发印章 |

### 用户信息 /api/user（全部需登录）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /profile | 个人信息+统计 |
| PUT | /profile | 更新资料 |
| PUT | /password | 修改密码 |
| GET | /activities | 活动历史 |
| GET | /stamps | 印章列表 |

### 管理端 /api/admin（除login外全部需管理员认证）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 管理员登录 |
| GET | /dashboard | 仪表盘数据 |
| GET/POST/PUT/DELETE | /activities | 活动 CRUD |
| GET | /users + 搜索分页 | 用户列表 |
| GET | /users/:id | 用户详情（含活动+印章）|
| GET | /users/export/csv | 导出用户CSV |
| GET/POST | /invitations | 邀请函列表 |
| POST | /invitations/generate | 批量生成邀请函 |
| PUT | /invitations/:id/revoke | 作废邀请函 |
| PUT | /invitations/:id/content | 更新邀请函内容 |
| GET/POST/PUT/DELETE | /tasks | 任务 CRUD |
| GET/POST/PUT/DELETE | /brands | 品牌 CRUD |
| GET/PUT | /settings | 系统设置 |

---

## 前端路由（SPA hash-based）

### 用户端 (index.html)
```
#/                      → 品牌官网首页
#/activities            → 活动列表/宣传页
#/activities/:id        → 活动详情+报名
#/login                 → 登录
#/register              → 注册
#/profile               → 个人中心
#/profile/edit          → 个人信息编辑+改密码
#/invitation/:code      → 邀请函页面
#/tasks/:activityId     → 活动信息+任务入口
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

---

## 关键技术细节

1. **数据库：** 使用 sql.js（WASM纯JS实现），通过自定义 `prepare()` 封装提供 better-sqlite3 兼容 API（.run/.get/.all）
2. **定时保存：** 每30秒自动 save() 数据库到文件
3. **JWT：** 用户 token 7天有效，管理员 24小时有效
4. **密码：** bcryptjs 加密，10轮
5. **邀请函：** unique_code 用 crypto.randomBytes(16).toString('hex')，默认7天有效期
6. **任务通关：** 验证最后一个密码时自动检查是否全部完成 → 自动发放印章
7. **SPA路由：** 自定义 hash-based Router，支持 `:param` 参数和 `beforeEach` 守卫
8. **API封装：** 统一通过 `API.get/post/put/delete()` 调用，自动处理 JWT 注入和 401 跳转

---

## 约束

- **前端：** 纯原生 JS + CSS，不用任何框架（React/Vue等）
- **数据库：** SQLite，不用 MySQL/PostgreSQL
- **语言：** 所有 UI 文字使用中文
- **品牌色：** 主色 #FF3D14，金色 #FFD24A，背景 #0B0A09 / #100E0C
- **字体：** Anton（标题）/ Space Grotesk（正文）/ Space Mono（数据）
- **部署：** 腾讯云 Docker，域名 deepbeat.tech

---

## 参考文档（同目录）

- `PRD_用户系统.md` — 完整产品需求文档（462行）
- `PROJECT_STRUCTURE.md` — 项目结构与数据库设计（172行）
- `CURRENT_STATE.md` — 当前进度（每天结束时让AI更新这个文件）
