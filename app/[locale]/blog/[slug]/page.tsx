import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import LocalizedHead from '@/components/LocalizedHead';
import { getPost } from '@/lib/notion';
import NotionRenderer from '@/components/notion/NotionRenderer';
import { getTranslations } from 'next-intl/server';

export default async function BlogPost({ params }: { params: { locale: string, slug: string } }) {
  const { locale, slug } = params;
  console.log(`获取文章详情，语言: ${locale}, slug: ${slug}`);
  const t = await getTranslations('BlogPost');
  
  // 确保传递正确的语言参数
  const post = await getPost(slug, locale);
  console.log(`获取到文章详情:`, post ? "成功" : "未找到");
  
  if (!post) notFound();
  
  return (
    <>
      <LocalizedHead 
        titleKey="blog.post.title" 
        descriptionKey="blog.post.description"
      />
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* 返回按钮 */}
        <div className="max-w-4xl mx-auto pt-8 px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/blog`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('backToBlog')}
            </Link>
          </Button>
        </div>
        
        {/* 博客文章头部 */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4 text-sm">
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <time className="text-gray-500 dark:text-gray-400">
                {post.date}
              </time>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
            
            {post.coverUrl && (
              <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
                <Image
                  src={post.coverUrl}
                  alt={post.title}
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            )}
          </header>
          
          {/* 博客内容 */}
          <div className="prose dark:prose-invert prose-lg max-w-none">
            <NotionRenderer blocks={post.blocks} />
          </div>
        </article>
        
        {/* Footer */}
        <Footer />
      </main>
    </>
  );
} 