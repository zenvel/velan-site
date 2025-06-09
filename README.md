# Velan 网站

这是基于Next.js的个人网站项目，使用next-intl实现国际化。

## 路由系统说明

网站使用动态路由系统管理多语言内容：

### 统一的动态路由

项目采用`app/[locale]`的动态路由模式，而不是静态路由（如`app/en`和`app/zh`）。

主要优点：
- 更灵活，添加新语言不需要创建新目录
- 代码复用性更高，减少重复文件
- 避免路由冲突
- 更符合Next.js的设计理念

### 关键文件

- `app/[locale]/layout.tsx` - 多语言布局文件，包含语言验证
- `app/[locale]/blog/page.tsx` - 博客列表页面，根据locale参数展示不同语言内容
- `app/[locale]/blog/[slug]/page.tsx` - 博客文章详情页面
- `app/page.tsx` - 根路径重定向到默认语言

### 技术要点

1. **国际化处理**
   - 使用next-intl获取翻译
   - 根据动态路由参数选择语言
   - 使用`suppressHydrationWarning`解决水合警告

2. **动态渲染**
   - 使用`dynamic = 'force-dynamic'`确保动态内容
   - 使用`unstable_noStore`禁用缓存

3. **日期格式化**
   - 中英文日期格式根据语言自动切换
   - 服务端预格式化避免客户端不一致

4. **元数据处理**
   - 动态生成多语言元数据
   - 支持自定义标题和描述

### 开发注意事项

- 添加新语言时，仅需更新翻译文件和`LOCALES`数组
- 所有路径构建应使用`/${locale}/`前缀
- 避免创建静态语言路由以防冲突

项目启动日期是：2025-06-07

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
