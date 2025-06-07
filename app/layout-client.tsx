'use client';

import "./globals.css";
import { StagewiseToolbar } from '@stagewise/toolbar-next';

// Stagewise配置
const stagewiseConfig = {
  plugins: []
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc">
      <body
        className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans"
      >
        <main className="min-h-screen">
          {children}
        </main>
        {process.env.NODE_ENV === 'development' && (
          <StagewiseToolbar config={stagewiseConfig} />
        )}
      </body>
    </html>
  );
} 