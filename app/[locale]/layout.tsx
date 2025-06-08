import '../globals.css';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import Provider from './provider';

// 支持的语言列表
const LOCALES = ['en', 'zh'] as const;
type Locale = (typeof LOCALES)[number];

// 生成静态参数供Next.js预渲染
export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }));
}

// 元数据生成函数
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  // 等待params解析
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  // 根据语言返回不同的元数据
  if (locale === 'zh') {
    return {
      title: 'Velan - 构建系统，锻造清晰',
      description: '独立系统构建者，记录设计有意图的数字产品与工作流的旅程'
    };
  }
  
  // 默认英文元数据
  return {
    title: 'Velan - Build Systems, Craft Clarity', 
    description: 'Solo system builder documenting the journey of designing intentional digital products'
  };
}

// 简化的布局组件
export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 等待params解析
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  // 如果不支持的语言，返回404
  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }
  
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider locale={locale}>
          {children}
        </Provider>
      </body>
    </html>
  );
} 