# 上传指南 — 该改什么就传什么

> 每次上传文件时，按照下面的表格，找到你要做的事情，直接照抄文件名即可。

---

## 🔑 第一步：永远先传这两个

不管改什么，都先上传：
1. **AGENTS.md** — AI 恢复项目全貌
2. **CURRENT_STATE.md** — AI 知道当前进度

---

## 按你要做的事情，选传下面的文件

### 📌 做用户端页面相关的事

| 你想做的事 | 额外上传的文件 |
|-----------|--------------|
| 改首页/活动列表/活动详情/登录/注册/个人中心/印章墙 的**页面逻辑** | `city-game/public/js/player-app.js` |
| 改**样式**（用户端） | `city-game/public/css/player.css` |
| 改**共享样式**（按钮、表单、通用组件） | `city-game/public/css/common.css` |
| 改**页面结构**（HTML入口） | `city-game/public/index.html` |
| 改**API请求方式**（JWT、fetch封装） | `city-game/public/js/api.js` |
| 改**路由跳转逻辑** | `city-game/public/js/router.js` |

### 📌 做管理端页面相关的事

| 你想做的事 | 额外上传的文件 |
|-----------|--------------|
| 改仪表盘/活动管理/用户管理/邀请函管理/任务配置/品牌管理/设置 的**页面逻辑** | `city-game/public/js/admin-app.js` |
| 改**样式**（管理端） | `city-game/public/css/admin.css` |
| 改**共享样式**（按钮、表单、通用组件） | `city-game/public/css/common.css` |
| 改**页面结构**（HTML入口） | `city-game/public/admin.html` |
| 改**API请求方式**（JWT、fetch封装） | `city-game/public/js/api.js` |

### 📌 做后端 API 相关的事

| 你想做的事 | 额外上传的文件 |
|-----------|--------------|
| 改**用户注册/登录/密码**相关接口 | `city-game/routes/auth.js` |
| 改**活动列表/报名/邀请函/任务验证/印章**相关接口 | `city-game/routes/player.js` |
| 改**个人资料/活动历史/印章墙**相关接口 | `city-game/routes/user.js` |
| 改**管理端所有接口**（活动CRUD/用户管理/邀请函生成/任务/品牌/设置） | `city-game/routes/admin.js` |
| 改**JWT认证逻辑** | `city-game/middleware/auth.js` |

### 📌 做数据库相关的事

| 你想做的事 | 额外上传的文件 |
|-----------|--------------|
| 改**表结构**（加表、加字段） | `city-game/db/setup.js` |
| 改**数据库连接/初始化逻辑** | `city-game/db/init.js` |
| 改**全局配置**（端口、密钥、路径等） | `city-game/config.js` |

### 📌 做整体架构/部署相关的事

| 你想做的事 | 额外上传的文件 |
|-----------|--------------|
| 改**服务器启动/路由挂载/中间件** | `city-game/server.js` |
| 改**依赖包** | `city-game/package.json` |

---

## 🎯 常见场景速查

```
场景：我要给邀请函加一个新功能
→ 传: AGENTS.md + CURRENT_STATE.md + routes/player.js + public/js/player-app.js

场景：我要改活动管理页的表格样式
→ 传: AGENTS.md + CURRENT_STATE.md + public/js/admin-app.js + public/css/admin.css

场景：我要给用户表加一个字段
→ 传: AGENTS.md + CURRENT_STATE.md + db/setup.js + routes/user.js

场景：我要加一个新的API接口
→ 传: AGENTS.md + CURRENT_STATE.md + 对应的 routes/xxx.js

场景：我要调整整体UI风格
→ 传: AGENTS.md + CURRENT_STATE.md + public/css/common.css

场景：我只想让AI帮我看看哪里有bug
→ 传: AGENTS.md + CURRENT_STATE.md + 出问题的文件
```

---

## 📎 如果不确定传什么？

传这3个基本够用：
1. AGENTS.md
2. CURRENT_STATE.md
3. **city-game/server.js**（AI可以通过它了解项目全貌）
