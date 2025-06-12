'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { JoinedPost } from '../lib/notion-types';

// 加载状态的骨架屏
function SkeletonCard() {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60">
      <div className="aspect-video overflow-hidden bg-gray-200 animate-pulse dark:bg-gray-700"></div>
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="inline-block rounded-full bg-gray-200 w-16 h-6 animate-pulse dark:bg-gray-700"></div>
          <div className="inline-block rounded-full bg-gray-200 w-12 h-6 animate-pulse dark:bg-gray-700"></div>
        </div>
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-2 animate-pulse dark:bg-gray-700"></div>
        <div className="h-16 bg-gray-200 rounded w-full mb-4 animate-pulse dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse dark:bg-gray-700"></div>
      </div>
    </div>
  );
}

// 博客文章预览
export default function BlogPreview() {
  // 获取翻译文本
  const t = useTranslations('Home');
  // 获取当前语言
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  // 状态管理
  const [posts, setPosts] = useState<JoinedPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 从服务器获取数据
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        // 使用当前语言参数获取文章
        const response = await fetch(`/api/posts?lang=${locale}`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        setPosts(data.slice(0, 3)); // 只显示前3篇
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
    
    // 添加语言切换时的强制刷新逻辑
    console.log("BlogPreview 组件重新渲染，当前语言:", locale);
  }, [locale]); // 添加 locale 作为依赖项，当语言变化时重新获取
  
  // 默认的无文章提示文本
  const noPostsText = '暂无博客文章';
  
  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-24" key={`blog-section-${locale}`}>
      <div className="mb-12 flex items-baseline justify-between">
        <h2 className="text-3xl font-bold">{t('latest.title')}</h2>
        <Button asChild variant="link" className="gap-1">
          <Link href={`/${locale}/blog`} className="flex items-center text-blue-600 dark:text-blue-400">
            {t('latest.viewAll')} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // 加载状态显示骨架屏
          Array(3).fill(0).map((_, index) => <SkeletonCard key={index} />)
        ) : posts.length > 0 ? (
          // 显示文章列表
          posts.map((post, index) => {
            // 直接使用 JoinedPost 类型的属性
            const { title, slug, date, tags = [], summary = '', articleID } = post;
            const coverUrl = post.coverUrl;
            
            // 如果没有slug，跳过这篇文章
            if (!slug || slug.trim() === '') {
              console.warn(`博客预览 - 文章缺少slug，跳过: "${title}"`);
              return null;
            }
            
            const postSlug = slug;
            
            // 如果没有真实文章数据，使用示例帖子
            if (!title) {
              return (
                <Link key={post.id || `sample-${index}`} href="#">
                  <article className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/60">
                    <div className="aspect-video overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)" }}>
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-5xl mb-3">📝</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold">{t('latest.samplePost.title')}</h3>
                      <p className="mb-4 text-gray-600 dark:text-gray-400 line-clamp-2">
                        {t('latest.samplePost.summary')}
                      </p>
                      <time className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date().toISOString().split('T')[0]}
                      </time>
                    </div>
                  </article>
                </Link>
              );
            }
            
            // 为每篇文章选择一个渐变色
            const gradients = [
              "linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)",
              "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
            ];
            const gradient = gradients[index % gradients.length];
            
            // 为每篇文章选择一个图标
            const icons = ["📊", "⚙️", "📈", "📝", "💡"];
            const icon = icons[index % icons.length];
            
            return (
              <Link key={post.id} href={`/${locale}/blog/${postSlug}`}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/60">
                  <div className="aspect-video overflow-hidden" style={{ background: gradient }}>
                    {coverUrl ? (
                      <Image 
                        src={coverUrl} 
                        alt={title} 
                        width={400}
                        height={225}
                        className="h-full w-full object-cover"
                        priority={index < 3}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-5xl mb-3">{icon}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.slice(0, 3).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="mb-2 text-xl font-bold">{title}</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400 line-clamp-2">
                      {summary}
                    </p>
                    <time className="text-sm text-gray-500 dark:text-gray-500">
                      {date}
                    </time>
                  </div>
                </article>
              </Link>
            );
          })
        ) : (
          // 没有文章时显示示例文章
          <div className="col-span-3 md:col-span-1">
            <article className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60">
              <div className="aspect-video overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)" }}>
                <div className="flex h-full w-full items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-5xl mb-3">📝</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mt-2 text-lg font-semibold">{t('latest.samplePost.title')}</h3>
                <p className="mt-2 line-clamp-3 text-gray-600 dark:text-gray-400">{t('latest.samplePost.summary')}</p>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}