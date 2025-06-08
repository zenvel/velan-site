'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import BlogPreview from '@/components/BlogPreview';
import ParticleBg from '@/components/Particles';
import Newsletter from '@/components/Newsletter';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

/**
 * Velan Home – high-standard landing page
 * – Hero with background glow & CTA
 * – Features grid
 * – Latest blog posts (placeholder – replace with dynamic)
 * – Newsletter section
 */
export default function Home() {
  // 获取翻译文本
  const t = useTranslations('Home');
  const footerT = useTranslations();
  const navT = useTranslations();
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  return (
    <main className="relative overflow-x-clip text-gray-900 dark:text-gray-100">
      {/* extra blur background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg className="absolute left-1/2 top-1/3 -translate-x-1/2 blur-3xl opacity-20"
            width="800" height="800">
          <defs>
            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#60a5fa" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="350" fill="url(#grad)" />
        </svg>
        
        {/* 额外的蓝色光圈 */}
        <svg className="absolute left-[30%] top-[60%] -translate-x-1/2 blur-3xl opacity-10"
            width="400" height="400">
          <circle cx="200" cy="200" r="200" fill="#60a5fa" />
        </svg>
      </div>
      {/* background radial gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-blue-500/30 blur-3xl dark:bg-blue-400/20" />
      </div>
      <ParticleBg />
      
      {/* 中心定位的渐变背景 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"
          width="800"
          height="800"
        >
          <defs>
            <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#60a5fa" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="350" fill="url(#grad2)" />
        </svg>
      </div>
      
      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-36 pb-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight"
        >
          {t('hero.title1')}<span className="text-blue-600 dark:text-blue-400">{t('hero.title2')}</span><br />
          {t('hero.title3')}<span className="text-blue-600 dark:text-blue-400">{t('hero.title4')}</span>
        </motion.h1>
        <p className="mx-auto mt-10 max-w-[60ch] text-2xl leading-relaxed text-gray-500 dark:text-gray-400">
          {t('hero.description')}
        </p>
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2">
              {t('hero.readBlog')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/about`}>{t('hero.aboutMe')}</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-32">
        <h2 className="mb-8 text-center text-3xl font-bold">{t('features.title')}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: t('features.cards.essays.title'),
              desc: t('features.cards.essays.desc'),
              icon: "📝",
            },
            {
              title: t('features.cards.templates.title'),
              desc: t('features.cards.templates.desc'),
              icon: "📂",
            },
            {
              title: t('features.cards.logs.title'),
              desc: t('features.cards.logs.desc'),
              icon: "📈",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur hover:shadow-lg transition-shadow dark:border-gray-700 dark:bg-gray-800/60"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <BlogPreview />

      {/* Newsletter Section */}
      <Newsletter />

      {/* Footer */}
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
        
        <p className="mb-2">{footerT('footer.slogan')}</p>
        <p>
          © {new Date().getFullYear()} <span className="text-white font-medium">Velan</span> — Powered by Next.js & Notion —
          <Link href={`/${locale}/about`} className="ml-1 underline hover:text-white transition-colors">
            {navT('nav.about')}
          </Link>
        </p>
      </footer>
    </main>
  );
} 