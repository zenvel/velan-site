'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useState, useEffect } from 'react';

// 简单的导航标签
const NAV_ITEMS = {
  en: {
    home: 'Home',
    blog: 'Blog',
    about: 'About'
  },
  zh: {
    home: '首页',
    blog: '博客',
    about: '关于'
  }
};

export default function Nav() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 只在客户端渲染后显示导航
  if (!mounted) {
    return null;
  }

  // 根据当前语言选择导航文本
  const navText = locale === 'zh' ? NAV_ITEMS.zh : NAV_ITEMS.en;

  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between">
      <Link href={`/${locale}`} className="font-bold text-xl">Velan</Link>
      
      <div className="flex items-center gap-6">
        <Link href={`/${locale}`} className="hover:text-blue-500 transition-colors">
          {navText.home}
        </Link>
        <Link href={`/${locale}/blog`} className="hover:text-blue-500 transition-colors">
          {navText.blog}
        </Link>
        <Link href={`/${locale}/about`} className="hover:text-blue-500 transition-colors">
          {navText.about}
        </Link>
        <LocaleSwitcher className="ml-4" />
      </div>
    </nav>
  );
} 