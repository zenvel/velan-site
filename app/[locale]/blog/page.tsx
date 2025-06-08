'use client';

import { getPosts } from '@/lib/notion';
import Link from 'next/link';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_COVER_PATTERNS = [
  { emoji: '📝', title: '文章' },
  { emoji: '💡', title: '笔记' },
  { emoji: '🧠', title: '思考' },
  { emoji: '🚀', title: '项目' }
];

// 格式化日期的辅助函数，确保服务端和客户端渲染一致
function formatDate(dateString: string | undefined, locale: string) {
  if (!dateString) return '';
  try {
    // 使用固定的时间字符串格式而不是依赖 locale
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return locale === 'zh' ? `${year}年${month}月${day}日` : `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}

export default function BlogList() {
  const t = useTranslations('Blog');
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  
  // 客户端状态管理
  const [posts, setPosts] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 获取文章数据
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const allPosts = await getPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error('获取文章列表失败:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, []);
  
  // 加载状态
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900">
        <section className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">📝 {t('pageTitle')}</h1>
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-800 h-64 w-full"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">📝 {t('pageTitle')}</h1>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('empty.title')}</p>
            <p className="text-sm mt-2 text-gray-400">{t('empty.description')}</p>
          </div>
        ) : (
          <ul className="grid gap-8">
            {posts.map((p: NotionPage, index: number) => {
              try {
                // 添加安全检查
                const slug = p.properties?.Slug?.rich_text?.[0]?.plain_text;
                const title = p.properties?.Title?.title?.[0]?.plain_text;
                const date = p.properties?.Date?.date?.start;
                const tags = p.properties?.Tags?.multi_select || [];
                const summary = p.properties?.Summary?.rich_text || [];
                const coverUrl = p.cover?.file?.url || p.cover?.external?.url;
                
                // 为标题选择默认emoji
                const defaultPattern = DEFAULT_COVER_PATTERNS[index % DEFAULT_COVER_PATTERNS.length];
                
                if (!slug || !title) return null;
                
                // 格式化日期
                const formattedDate = formatDate(date, locale);
                
                return (
                  <li key={p.id} className="group transition-all">
                    <Link href={`/${locale}/blog/${slug}`}>
                      <article className="rounded-2xl bg-white dark:bg-gray-800/50 border dark:border-gray-700 shadow-sm hover:shadow-md transition overflow-hidden">
                        {/* 封面图 */}
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={title}
                            className="w-full h-48 object-cover rounded-t-2xl transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-400 text-white text-3xl">
                            {defaultPattern.emoji}
                          </div>
                        )}

                        <div className="p-6 space-y-3">
                          {/* 时间 + 标签 */}
                          <div className="flex flex-wrap justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <time>{formattedDate}</time>
                            <div className="flex gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 标题 */}
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

                          {/* 摘要 */}
                          {summary.length > 0 && (
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                              {summary.map((text) => text.plain_text).join('')}
                            </p>
                          )}
                          
                          {/* 阅读更多 */}
                          <Link
                            href={`/${locale}/blog/${slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            {t('readMore')}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </Link>
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              } catch (error) {
                console.error('渲染文章列表项出错:', error);
                return null;
              }
            })}
          </ul>
        )}
      </section>
    </div>
  );
} 