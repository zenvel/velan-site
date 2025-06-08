'use client';

import "./globals.css";
import { useState, useEffect } from 'react';
import StagewiseProvider from '@/components/StagewiseProvider';

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // 在客户端检查是否为开发环境
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  return (
    <body className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <main className="min-h-screen">
        {children}
      </main>
      {isMounted && isDev && <StagewiseProvider />}
    </body>
  );
} 