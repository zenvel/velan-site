# Velan 个人独立站路线图  
*更新时间：2025-06-07*

## 1. 项目概览
| 项目 | 说明 |
|------|------|
| **目标** | 打造 Velan 的双语（EN 默认／ZH）个人枢纽站：博客、Newsletter、阅读笔记、合作入口 |
| **技术栈** | Next.js 14（App Router）· Tailwind + shadcn/ui · react-notion-x · next-intl · Vercel |
| **内容源** | Notion 工作区 `Velan_Personal_Site`（含 Velan_Blog 数据库等） |
| **域名** | ⟶ `blog.zenvel.io`（生产）<br>⟶ `velan.zenvel.io`（个人落地页，可选） |

---

## 2. 里程碑与状态

| 阶段 | 交付物 | 状态 | 日期 |
|------|--------|------|------|
| **P0 环境搭建** | GitHub 仓库、Tailwind + shadcn/ui 基线 | **已完成** | 05-28 |
| **P1 CMS 建模** | Notion 结构（Velan_Blog 等） | **已完成** | 06-05 |
| **P2 页面骨架** | Home / About / Blog 列表（EN） | **进行中** | 06-08 |
| **P3 Notion 接入** | react-notion-x 渲染文章 | **待办** | 06-09 |
| **P4 国际化** | next-intl EN⇄ZH | **待办** | 06-12 |
| **P5 正式部署** | Vercel + 自定义域名 | **待办** | 06-13 |

---

## 3. 本周冲刺计划（7 天）

| Day | 重点 | 具体任务 | 验收标准 |
|-----|------|----------|----------|
| D1 | 页面框架 | Scaffold `/en` 路由；搭好布局组件 | `npm run dev` 正常 |
| D2 | 拉取文章 | `lib/notion.ts` 拉取 Velan_Blog 列表 | 页面展示首篇 |
| D3 | 文章详情 | `/en/blog/[slug]` 动态渲染 Notion blocks | 代码高亮正常 |
| D4 | 预览部署 | 推送分支 → Vercel Preview | Lighthouse ≥ 90 |
| D5 | 加入中文 | 配置 `next-intl`，添加 `zh.json` | `/zh` 路由可访问 |
| D6 | 绑定域名 | Vercel 添加 CNAME → `blog.zenvel.io` | HTTPS 生效 |
| D7 | 订阅 + 统计 | 嵌入 Buttondown 表单；接入 Plausible | 表单可订阅、统计出数据 |

---

## 4. 技术检查清单
- [x] Vercel 自动部署（push 到 `main` 即触发）
- [ ] `.env` 已配置 `NOTION_TOKEN`、`DATABASE_ID`
- [ ] `next-intl` 多语言 messages 文件
- [ ] `next-sitemap` 生成 sitemap.xml、robots.txt
- [ ] 可选：`@vercel/og` 自动生成社交封面图

---

## 5. 风险与应对
| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Notion API 限流 | 内容加载失败 | ISR＋本地缓存 |
| 构建体积过大 | 冷启动变慢 | 动态 import / bundle 分析 |
| 多语言 SEO 冲突 | 权重分散 | `hreflang` + canonical 标签 |

---

## 6. MVP 之后（30 天展望）
- **内容**：发布 3 篇支柱文章，交叉发布到 Medium / LinkedIn  
- **增长**：30 天后撰写流量与订阅增长报告  
- **设计**：用 Figma 迭代 Hero 区视觉；统一封面图风格  
- **功能**：自动 OG 图、按标签订阅、站内搜索

---

> **协作方式**  
> 1. Fork → Pull Request  
> 2. 提交说明采用 `feat:` / `fix:` / `docs:` 等前缀  
> 3. CI 需通过 `npm run lint && npm run build`

*Roadmap 结束*