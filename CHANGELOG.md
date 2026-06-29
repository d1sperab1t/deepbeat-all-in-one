# 修复日志 CHANGELOG

## [1.1.0] - 2026-06-29

### 🔴 安全漏洞修复

#### JWT 密钥强制验证
- **文件**: `config.js`
- **问题**: JWT 密钥有默认明文值，生产环境若不设置环境变量会使用弱密钥
- **修复**: 生产环境（`NODE_ENV=production`）启动时若未设置 `JWT_SECRET` / `ADMIN_JWT_SECRET` 则直接报错退出

#### 密码重置接口需身份验证
- **文件**: `routes/auth.js`
- **问题**: `/api/auth/reset-password` 仅凭用户名即可重置任意账号密码
- **修复**: 必须同时提供用户名 + 手机号，两者匹配才允许重置

#### 角色密码改为 bcrypt 哈希存储
- **文件**: `routes/game.js`、`routes/admin-game.js`
- **问题**: 角色密码明文写入数据库，登录时直接字符串比对
- **修复**: 创建/更新角色时用 bcrypt 哈希密码；登录时用 `bcrypt.compareSync` 验证；登录比对前统一调用 `.trim()`

#### CORS 改为白名单模式
- **文件**: `server.js`
- **问题**: `cors()` 无任何配置，允许任意来源跨域访问
- **修复**: 通过环境变量 `ALLOWED_ORIGINS`（逗号分隔）配置白名单，默认仅允许 `localhost:3000`

---

### 🟠 高危问题修复

#### 登录接口速率限制
- **文件**: `server.js`
- **依赖**: 新增 `express-rate-limit`
- **问题**: 认证接口无请求频率限制，可被暴力破解
- **修复**: 所有 `/api/auth/*` 接口限制每 IP 每 15 分钟最多 20 次请求

#### SQL 错误不再暴露给客户端
- **文件**: `routes/admin-game.js`
- **问题**: 数据库异常（如 `UNIQUE constraint failed`）详情直接返回前端，泄露数据库结构
- **修复**: 详细错误仅记录服务器日志，客户端统一返回通用错误提示

#### gameAuthenticate 中间件加异常捕获
- **文件**: `middleware/auth.js`
- **问题**: 数据库查询异常时请求直接崩溃，无响应返回
- **修复**: 包裹 `try/catch`，异常时返回 500 错误信息

---

### 🟡 中等问题修复

#### Settings 写入键名白名单校验
- **文件**: `routes/admin.js`
- **问题**: `PUT /api/admin/settings` 允许写入任意键名，可能覆盖关键配置
- **修复**: 新增 `ALLOWED_SETTINGS_KEYS` 白名单，非白名单键名直接返回 400

#### 用户搜索 LIKE 通配符转义
- **文件**: `routes/admin.js`
- **问题**: 搜索参数中 `%`、`_` 等 SQL 通配符未转义，导致非预期查询结果
- **修复**: 搜索前对特殊字符进行转义，并使用 `ESCAPE` 子句

#### 移除遗留重复路由
- **文件**: `server.js`
- **问题**: 旧版 `admin-invitations` 与新版 `invite-codes` 两套邀请码系统同时挂载，逻辑混乱
- **修复**: 从路由中移除 `admin-invitations`，统一使用 `invite-codes`

---

### 📦 依赖变更

| 包名 | 变更 | 版本 |
|------|------|------|
| `express-rate-limit` | 新增 | latest |

---

### ⚠️ 升级注意事项

1. **角色密码已改为 bcrypt 哈希**：数据库中现有明文角色密码需通过管理后台重新设置，否则玩家无法登录角色
2. **生产环境需设置环境变量**：`JWT_SECRET`、`ADMIN_JWT_SECRET`、`ALLOWED_ORIGINS`
3. **密码重置需手机号**：用户账号若未绑定手机号，将无法通过自助方式重置密码，需联系管理员处理
