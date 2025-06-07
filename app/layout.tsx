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
  title: {
    template: '%s | Velan',
    default: 'Velan - 个人博客',
  },
  description: "A blog powered by Next.js and Notion API",
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
