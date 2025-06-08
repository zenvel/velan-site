'use client';

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

export default function Newsletter() {
  const t = useTranslations('newsletter');
  
  return (
    <section className="relative mx-auto max-w-4xl rounded-3xl px-8 py-20 text-center text-white overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 shadow-xl">
      {/* 背景发光层 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-20" width="800" height="800">
          <circle cx="400" cy="400" r="300" fill="#ffffff" fillOpacity="0.1" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold">{t('title')}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl text-white/90">
        {t('description')}
      </p>

      <form
        action="https://buttondown.email/api/subscribers"
        method="post"
        target="_blank"
        className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4"
      >
        <input
          type="email"
          name="email"
          required
          placeholder={t('placeholder')}
          className="w-full rounded-md px-4 py-3 text-black placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-white/60"
        />
        <Button type="submit" size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100">
          {t('button')}
        </Button>
      </form>
    </section>
  );
} 