# 📚 张家每日读书打卡 — 部署指南

## 一键部署到 Render.com（免费，永久链接）

### 第一步：注册 Render.com
1. 打开 https://render.com
2. 点右上角 **「Sign Up」**
3. 用你的**邮箱**注册（QQ/163/ Gmail 都行）
4. 收邮件点确认链接，完成注册

### 第二步：上传代码
1. 登录后点 **「New +」** → 选 **「Web Service」**
2. 选择 **「Deploy a code with a public Git repository」**
3. 如果你没有 GitHub，选 **「Upload Files」** 直接上传文件

### 第三步：上传以下 3 个文件
- `server.js` — 后端服务
- `reading-checkin.html` — 前端页面
- `package.json` — 配置文件

### 第四步：填写部署信息
| 项目 | 填写内容 |
|---|---|
| **Name** | `zhang-reading` （随便取） |
| **Environment** | `Node` |
| **Build Command** | 留空（不需要构建） |
| **Start Command** | `node server.js` |

### 第五步：点「Create Web Service」
等待 2-3 分钟，Render 会给你一个**永久链接**，类似：
```
https://zhang-reading.onrender.com
```

把这个链接发到家庭群，永久有效！✅

---

## 数据存储说明
- 数据存在服务器上的 `data.json` 文件里
- Render 免费版**每次重启会清空文件**
- **解决方案**：用 Render 的 **Disk** 功能，或者定期点小程序底部的「导出数据」备份

---

## 备选方案：Vercel（更稳定）

如果 Render 不满意，用 Vercel：
1. 打开 https://vercel.com
2. 用 GitHub 登录（没有就注册一个）
3. 上传代码，自动部署
4. 获得 `https://xxx.vercel.app` 永久链接
