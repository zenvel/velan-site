'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function NotFound() {
  const t = useTranslations('NotFound');
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold mb-6">{t('message')}</h1>
      <div className="flex gap-4">
        <Link 
          href={`/${locale}`}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {t('backHome')}
        </Link>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
} 