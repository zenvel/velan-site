'use client';

import React, { useState, useEffect } from 'react';
import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import type { NotionPage } from '@/lib/notion-types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BlogLocaleSwitcher from '@/components/BlogLocaleSwitcher';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

// 默认封面图片配置
const DEFAULT_COVER_GRADIENT = 'linear-gradient(135deg, #4f46e5 0%, #60a5fa 100%)';
const DEFAULT_EMOJI = '📝';

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

// 页面组件
export default function Page({ params }: { params: { slug: string } }) {
  const t = useTranslations('Blog');
  const routeParams = useParams();
  const locale = (routeParams.locale as string) || 'en';
  
  // 客户端状态管理
  const [page, setPage] = useState<NotionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const post = await getPost(params.slug);
        if (!post) {
          setError(true);
          return;
        }
        setPage(post);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPost();
  }, [params.slug]);
  
  // 处理文章不存在的情况
  if (error || (page === null && !loading)) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">{t('notFound.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('notFound.description')}</p>
        <a href={`/${locale}/blog`} className="text-blue-600 hover:underline dark:text-blue-400">
          &larr; {t('backToBlog')}
        </a>
      </div>
    );
  }
  
  // 加载状态
  if (loading || !page) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  // 获取Summary内容，用于显示在文章开头
  const summaryText = page.properties.Summary?.rich_text?.map((text) => text.plain_text).join('') || '';
  // 获取封面图片URL
  const coverUrl = page.cover?.file?.url || page.cover?.external?.url;
  // 获取标题
  const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
  // 格式化日期
  const date = page.properties.Date?.date?.start;
  const formattedDate = formatDate(date, locale);

  return (
    <article className="max-w-3xl mx-auto rounded-2xl bg-white dark:bg-gray-900 px-6 py-10 shadow-sm">
      <BlogLocaleSwitcher />
      <header>
        {/* 封面区域 */}
        <div className="mb-8 overflow-hidden rounded-xl">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-[300px] object-cover" />
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-400 text-white">
              <div className="text-center">
                <div className="text-6xl mb-2">{DEFAULT_EMOJI}</div>
                <div className="text-xl font-semibold">{title}</div>
              </div>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-6 text-center">{title}</h1>

        {/* 时间和标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm text-gray-500">
          {date && <time dateTime={date}>{formattedDate}</time>}
          {page.properties.Tags?.multi_select?.map(tag => (
            <span key={tag.id} className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
              {tag.name}
            </span>
          ))}
        </div>

        {/* 引言 */}
        {summaryText && (
          <div className="mt-4 text-xl text-gray-600 italic border-l-4 border-gray-300 pl-4 py-2 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 rounded">
            {summaryText || t('post.summaryNote')}
          </div>
        )}
      </header>

      {/* 正文 */}
      <div className="markdown-content prose prose-lg dark:prose-invert">
        {page.blocks && page.blocks.length > 0 ? (
          <NotionRenderer blocks={page.blocks} />
        ) : (
          <div>{summaryText || t('post.emptyContent')}</div>
        )}
      </div>
    </article>
  );
} 