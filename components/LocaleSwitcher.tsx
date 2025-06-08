'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { locales, Locale } from '@/i18n';
import { useState, useEffect } from 'react';

function getPathWithLocale(pathname: string, locale: Locale) {
  // 检查当前路径是否已包含语言前缀
  if (!pathname) return `/${locale}`;
  
  const segments = pathname.split('/');
  
  // 检查第一个段是否为语言代码
  if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
    segments[1] = locale; // 替换现有的语言段
  } else {
    // 如果没有语言段，则添加语言段
    segments.splice(1, 0, locale);
  }
  
  return segments.join('/') || `/${locale}`;
}

export default function LocaleSwitcher({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 获取当前语言
  let current: Locale = 'en';
  if (pathname) {
    const segments = pathname.split('/');
    if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
      current = segments[1] as Locale;
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // 只在客户端渲染后显示
  if (!mounted) {
    return null;
  }
  
  // 处理语言切换
  const handleLanguageChange = (locale: Locale) => {
    setOpen(false);
    const newPath = getPathWithLocale(pathname, locale);
    router.push(newPath);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
      >
        {current.toUpperCase()}
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 w-24 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
          {locales.map((loc) => (
            <li key={loc}>
              <button
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleLanguageChange(loc)}
              >
                {loc.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 