// 保留客户端组件标记，但移除动态渲染标记（因为它会在服务器组件中工作）
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import BlogPreview from '@/components/BlogPreview';
import ParticleBg from '@/components/Particles';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import LocalizedHead from '@/components/LocalizedHead';
import NewsletterInline from '@/components/NewsletterInline';
import { useEffect, useState } from 'react';
import { Feature } from '@/lib/features';

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
  const newsletterT = useTranslations('newsletter');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  // 添加Features状态
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 获取Features数据
  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch(`/api/features?lang=${locale}`);
        if (!response.ok) {
          throw new Error(`获取Features失败: ${response.status}`);
        }
        const data = await response.json();
        setFeatures(data);
      } catch (error) {
        console.error('获取Features错误:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFeatures();
  }, [locale]);
  
  // 添加调试信息
  console.log("Home页面渲染，当前语言:", locale);
  
  return (
    <>
      <LocalizedHead 
        titleKey="home.title" 
        descriptionKey="home.description" 
      />
      
      <main className="relative overflow-x-clip text-gray-900 dark:text-gray-100" key={`home-${locale}`}>
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
          <div className="flex justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight whitespace-nowrap"
            >
              {t.rich('hero.title', {
                highlight: (chunks) => (
                  <span className="text-blue-600 dark:text-blue-400">{chunks}</span>
                )
              })}
            </motion.h1>
          </div>

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

        {/* Features Grid - 你将在这里看到什么 */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-8 text-center text-3xl font-bold">{t('features.title')}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // 加载状态
              Array(3).fill(0).map((_, i) => (
                <div 
                  key={`skeleton-${i}`} 
                  className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <div className="mb-4 h-8 w-8 rounded-full bg-gray-200 animate-pulse dark:bg-gray-700"></div>
                  <div className="mb-2 h-6 w-3/4 bg-gray-200 animate-pulse dark:bg-gray-700"></div>
                  <div className="h-16 w-full bg-gray-200 animate-pulse dark:bg-gray-700"></div>
                </div>
              ))
            ) : (
              // 显示Features数据
              features.map((feature) => (
                <Link 
                  key={feature.id}
                  href={`/${locale}${feature.slug}`}
                  className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur hover:shadow-lg transition-shadow dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <div className="mb-4 text-3xl">{feature.icon || "🔍"}</div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.summary}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        <BlogPreview key={`blog-preview-${locale}`} />

        {/* Newsletter Section */}
        <NewsletterInline />

        {/* Footer */}
        <Footer key={`footer-${locale}`} />
      </main>
    </>
  );
} 