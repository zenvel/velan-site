'use client';

import dynamic from 'next/dynamic';

// 动态导入LocaleSwitcher组件
const LocaleSwitcher = dynamic(() => import('@/components/LocaleSwitcher'), {
  ssr: false,
  loading: () => <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
});

export default function BlogLocaleSwitcher() {
  return (
    <div className="flex justify-end mb-6">
      <LocaleSwitcher />
    </div>
  );
} 