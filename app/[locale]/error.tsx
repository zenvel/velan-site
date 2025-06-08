'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('NotFound');
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error(error);
  }, [error]);
  
  return (
    <main className="text-center py-24">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <p className="text-xl mb-4">{t('message')}</p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('tryAgain')}
        </button>
        <Link href={`/${locale}`} className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
} 