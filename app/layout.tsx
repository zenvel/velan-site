import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 使用本地Inter字体替代Geist字体，避免网络问题
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: 'Velan Blog',
  description: '写作、思考、实践 | Velan 的一人系统实验日志',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc">
      <body
        className={`${inter.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
