'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  return (
    <main className="text-center py-24">
      <h1 className="text-5xl font-bold mb-6">404</h1>
      <p className="text-xl mb-4">{t('message')}</p>
      <Link href={`/${locale}`} className="text-blue-600 hover:underline dark:text-blue-400">
        {t('backHome')}
      </Link>
    </main>
  );
} 