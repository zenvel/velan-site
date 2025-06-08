'use client';

import "./globals.css";
import { useState, useEffect, Suspense, memo, lazy } from 'react';
import dynamic from 'next/dynamic';

// 动态导入Nav组件以避免SSR问题
const Nav = dynamic(() => import('@/components/Nav'), { 
  ssr: false,
  loading: () => <div className="w-full py-4 px-6" /> // 提供一个占位符保持布局稳定
});

// 懒加载StagewiseProvider，确保只实例化一次
const StagewiseProvider = lazy(() => import('@/components/StagewiseProvider'));

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [shouldRenderStagewise, setShouldRenderStagewise] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // 在客户端检查是否为开发环境
    const isDevEnv = process.env.NODE_ENV === 'development';
    setIsDev(isDevEnv);
    
    // 确保全局只有一个实例
    if (isDevEnv && !window.__HAS_STAGEWISE_PROVIDER__) {
      window.__HAS_STAGEWISE_PROVIDER__ = true;
      setShouldRenderStagewise(true);
    }
    
    return () => {
      // 不要在此清除标志，以确保整个应用生命周期内只实例化一次
    };
  }, []);

  return (
    <div className="antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans min-h-screen" suppressHydrationWarning>
      <div suppressHydrationWarning>
        {/* 使用Suspense包装Nav组件，确保加载时有占位内容 */}
        <Suspense fallback={<div className="w-full py-4 px-6" />}>
          <Nav />
        </Suspense>
      </div>
      <main className="min-h-screen">
        {children}
      </main>
      
      {/* 只在开发环境且需要渲染时加载StagewiseProvider */}
      {shouldRenderStagewise && (
        <Suspense fallback={null}>
          <StagewiseProvider />
        </Suspense>
      )}
    </div>
  );
}

// 为Window对象添加全局属性类型定义
declare global {
  interface Window {
    __HAS_STAGEWISE_PROVIDER__?: boolean;
  }
} 