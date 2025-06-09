import '../globals.css';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import Provider from './provider';
import nextDynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

// 动态导入客户端布局组件
const ClientLayout = nextDynamic(() => import('../layout-client'), { ssr: true });

// 支持的语言列表
const LOCALES = ['en', 'zh'] as const;
type Locale = (typeof LOCALES)[number];

// 强制使用动态渲染 - 使用不同的变量名避免冲突
export const dynamicParams = false;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 生成静态参数供Next.js预渲染
// 注意：虽然我们使用了动态渲染，但仍保留这个函数以确保所有语言路径都有效
export function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }));
}

// 元数据生成函数
export async function generateMetadata({ 
  params
}: { 
  params: { locale: string } | Promise<{ locale: string }>;
}): Promise<Metadata> {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  
  // 构建规范化URL
  const baseUrl = 'https://velan.zenvel.io';
  
  // 为不同语言版本创建alternates对象
  const alternates = {
    canonical: `${baseUrl}/${locale}`,
    languages: {
      'en': `${baseUrl}/en`,
      'zh': `${baseUrl}/zh`,
    }
  };
  
  const t = await getTranslations({ 
    locale, 
    namespace: 'Metadata' 
  });

  const isZh = locale === 'zh';
  
  return {
    title: t('home.title'),
    description: t('home.description'),
    metadataBase: new URL(baseUrl),
    alternates,
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      url: `${baseUrl}/${locale}`,
      siteName: 'Velan',
      images: [
        {
          url: '/og-cover.png',
          width: 1200,
          height: 630,
          alt: 'Velan'
        }
      ],
      locale: isZh ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('home.title'),
      description: t('home.description'),
    },
    icons: {
      icon: '/favicon.ico'
    },
  };
}

// 布局组件
export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  // 等待参数解析
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams.locale || 'en';
  
  // 如果不支持的语言，返回404
  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }
  
  return (
    <Provider locale={locale}>
      <ClientLayout>
        {children}
      </ClientLayout>
    </Provider>
  );
} 