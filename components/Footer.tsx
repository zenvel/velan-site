'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function Footer() {
  const t = useTranslations('Footer');
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-gray-950 py-10 px-6 text-center text-sm text-gray-400 overflow-hidden">
      {/* 背景渐变效果 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-10"
            width="800" height="400">
          <defs>
            <radialGradient id="footer-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a855f7" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="200" r="180" fill="url(#footer-grad)" />
        </svg>
      </div>
      
      <p className="mb-2">{t('slogan')}</p>
      <p>
        © {new Date().getFullYear()} <span className="text-white font-medium">Velan</span> • {t('builtWith')} •
        <Link href={`/${locale}/about`} className="ml-1 underline hover:text-white transition-colors">
          {t('about')}
        </Link>
      </p>
    </footer>
  );
} 