import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: 'Velan Blog',
  description: '写作、思考、实践 | Velan 的一人系统实验日志',
  metadataBase: new URL('https://velan.zenvel.io'),
  openGraph: {
    title: 'Velan Blog',
    description: '来自一人系统构建者的长期写作实验',
    url: 'https://velan.zenvel.io',
    siteName: 'Velan Blog',
    images: [
      {
        url: '/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'Velan Blog'
      }
    ],
    locale: 'zh_CN',
    type: 'website'
  },
  icons: {
    icon: '/favicon.ico'
  },
  authors: [{ name: 'Velan' }],
  creator: 'Velan',
  keywords: ['blog', 'notion', 'nextjs', 'react'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
  width: 'device-width',
  initialScale: 1,
}; 