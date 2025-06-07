
# 🚀 Zenvel 独立站构建进度总览（velan.zenvel.io）

本文件用于记录 Velan 的个人独立站搭建进度、当前已完成项、后续计划与时间安排，适用于长期演进与与 Cursor 协作。

---

## ✅ 已完成（阶段一：基础搭建）

### 技术与系统
- [x] 使用 Next.js 创建 velan-site 项目
- [x] 接入 Notion 作为博客 CMS
- [x] 完成 `/en/blog` 博客列表页、博客详情页动态渲染
- [x] 初步接入 `next-intl` 国际化框架
- [x] 已支持 Notion 中 Content 字段解析为 Markdown

### Notion 内容
- [x] 建立博客数据库（Title、Slug、Date、Summary、Tags、Content）
- [x] 发布首篇文章《为什么我选择从公司走向一人品牌？》
- [x] 搭建 Zenvel Notion 工作区结构：OS / Stack / Studio 等模块

### 部署与优化
- [x] 成功部署至 Vercel 并绑定自定义域名 `https://velan.zenvel.io`
- [x] 添加 favicon、robots.txt、sitemap.xml、OG 图配置
- [x] 完成首页 Hero/Features/Footer/Newsletter 初步搭建
- [x] 首页样式美化：Framer Motion 动画、渐变背景、信息分区

---

## 🛠 待办任务（阶段二：内容拓展 & 体验升级）

| 优先级 | 模块              | 待办任务说明 |
|--------|-------------------|--------------|
| ⭐️ 高  | 多语言支持（i18n） | 首页尚未接入国际化，需要延后处理；目前英文版优先 |
| ⭐️ 高  | Blog 列表优化      | Blog 首页接入 Notion 动态数据源，展示最近 3~6 篇文章 |
| ⭐️ 高  | About 页面         | 编写 `about.tsx` 页面，介绍 Velan + Zenvel 品牌理念与愿景 |
| ⭐️ 高  | Newsletter 真正接入 | 替换 Buttondown 表单链接为实际地址 |
| ⭐️ 中  | 首页体验升级        | 加入动态博客预览、滚动动画、背景视频/粒子等增强感知层次 |
| ⭐️ 中  | 样式主题可切换      | 提供 Light / Dark 切换按钮，统一 Tailwind 配色变量 |
| ⭐️ 中  | SEO 元信息补充      | 页面添加 `<Head>` 标签，填写 `title`, `description`, `og:image` 等元数据 |
| ⭐️ 低  | i18n 切换 UI       | 提供语言切换按钮（/en /zh）并激活路由匹配 |
| ⭐️ 低  | Docs 子站规划       | 预留 `docs.zenvel.io` 子域用于未来文档型内容 |

---

## 📅 推荐时间线

| 时间 | 要做的事情 |
|------|------------|
| ✅ 已完成 | 核心结构、部署上线、自定义域名绑定 |
| 第1周 | 完善 About 页面、替换订阅表单链接、接入博客动态内容 |
| 第2周 | 首页视觉细节优化（Blog preview 动态化、设计润色） |
| 第3周 | 启动 i18n 多语言支持与语言切换功能 |
| 第4周 | 开通 newsletter 落地页 + 写作流水线 |
| 第5周+ | 构建 Zenvel Docs 子站，拓展 Portfolio / Projects 模块 |

---

**建议将此文件保存于项目根目录下，并持续更新进度。**
