import { getTranslations } from 'next-intl/server';
import type { Metadata, Viewport } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'Metadata' });
  
  return {
    title: t('home.title'),
    description: t('home.description'),
    metadataBase: new URL('https://velan.zenvel.io'),
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      url: 'https://velan.zenvel.io',
      siteName: 'Velan',
      images: [
        {
          url: '/og-cover.png',
          width: 1200,
          height: 630,
          alt: 'Velan Blog'
        }
      ],
      locale: params.locale === 'zh' ? 'zh_CN' : 'en_US',
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
    authors: [{ name: 'Velan' }],
    creator: 'Velan',
    keywords: ['blog', 'notion', 'nextjs', 'react'],
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
  width: 'device-width',
  initialScale: 1,
}; 