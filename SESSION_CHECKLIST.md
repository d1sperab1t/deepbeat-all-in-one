# SESSION_CHECKLIST.md — 每日操作清单

---

## 🟢 开始对话时（按顺序上传）

| 步骤 | 文件 | 目的 |
|------|------|------|
| 1 | `AGENTS.md` | AI 恢复项目全貌（架构、API、路由、技术栈） |
| 2 | `CURRENT_STATE.md` | AI 知道当前进度和今天要做什么 |
| 3 | 本次要改的 1-2 个代码文件 | 让 AI 直接操作 |
| 4 | 相关的参考文件（如需要） | CSS/路由/数据库等上下文 |

### 开场白模板

```
你好，我正在开发 DEEPBEAT ALLIANCE 城市活动平台。

请先阅读我上传的 AGENTS.md 和 CURRENT_STATE.md 了解项目全貌。
今天的任务是：[具体描述]

请开始吧。
```

---

## 🔴 结束对话前（约还剩30分钟时）

### 必做：让 AI 输出以下文件的完整更新内容

```
请输出以下文件的完整更新内容，我会手动保存：

1. AGENTS.md — 如果有架构变更，更新技术细节
2. CURRENT_STATE.md — 把今天完成的、遇到的问题、明天计划都写进去
3. 如果做了较大的技术决策，建议也更新 DECISIONS_LOG.md

每个文件输出完整的文件内容（不要省略）。
```

### 必做：Git 保存

```bash
cd ~/deepbeat-allinone
git add -A
git commit -m "Day N: [一句话描述今天做了什么]"
```

### 可选：备份关键文件到安全位置

如果担心文件丢失，可以额外备份：
```bash
cp ~/deepbeat-allinone/AGENTS.md ~/Desktop/AGENTS_BACKUP.md
cp ~/deepbeat-allinone/CURRENT_STATE.md ~/Desktop/CURRENT_BACKUP.md
```

---

## 📎 文件上传优先级（如果只能传几个文件）

| 优先级 | 文件 | 原因 |
|--------|------|------|
| ⭐⭐⭐ | AGENTS.md | 恢复全部上下文 |
| ⭐⭐⭐ | CURRENT_STATE.md | 知道进度 |
| ⭐⭐ | 本次要改的代码 | 直接工作 |
| ⭐⭐ | PRD_用户系统.md | PRD 参考 |
| ⭐ | CONFIG.js / DB schema | 架构理解 |
| ⭐ | PROJECT_STRUCTURE.md | 文件结构参考 |

---

## 💡 小贴士

1. **每次只做一件事**：不要一天同时改5个文件，专注一个模块
2. **小步提交**：做完一个功能就 git commit，方便回滚
3. **测试再走**：如果改了后端 API，改完后 `curl` 测一下再结束
4. **错误信息要记**：如果遇到报错，把完整错误信息粘到 CURRENT_STATE.md 的"已知问题"里
5. **代码骨架法**：如果4小时不够，先让 AI 输出完整代码，你本地验证，有问题明天带着错误信息继续
