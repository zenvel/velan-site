'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Nav() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [mounted, setMounted] = useState(false);
  
  // 使用useTranslations获取导航文本
  const t = useTranslations('nav');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 只在客户端渲染后显示导航
  if (!mounted) {
    return null;
  }

  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between">
      <Link href={`/${locale}`} className="font-bold text-xl">Velan</Link>
      
      <div className="flex items-center gap-6">
        <Link href={`/${locale}`} className="hover:text-blue-500 transition-colors">
          {t('home')}
        </Link>
        <Link href={`/${locale}/blog`} className="hover:text-blue-500 transition-colors">
          {t('blog')}
        </Link>
        <Link href={`/${locale}/about`} className="hover:text-blue-500 transition-colors">
          {t('about')}
        </Link>
        <LocaleSwitcher className="ml-4" />
      </div>
    </nav>
  );
} 