import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import { useTranslations } from 'next-intl';
import LocalizedHead from '@/components/LocalizedHead';
import { getPosts } from '@/lib/notion';
import { getTranslations } from 'next-intl/server';

/**
 * Blog posts page - displays a grid of blog posts
 */
export default async function BlogList({ params:{ locale } }:{
  params:{ locale:string }
}){
  console.log("开始获取博客文章，语言:", locale);
  const t = await getTranslations('Blog');
  const posts = await getPosts(locale);
  console.log("获取到博客文章数量:", posts.length);
  
  return (
    <>
      <LocalizedHead 
        titleKey="blog.title" 
        descriptionKey="blog.description" 
      />
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-20 text-center px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('title')}
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            {t('subtitle')}
          </p>
        </section>
        
        {/* 调试信息 */}
        {posts.length === 0 && (
          <div className="max-w-4xl mx-auto p-4 mb-8 bg-yellow-100 border border-yellow-400 rounded">
            <p className="font-bold">无博客文章可显示</p>
            <p>当前语言: {locale}</p>
          </div>
        )}
        
        {/* Blog Posts Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link 
                href={`/${locale}/blog/${post.slug}`} 
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 w-full">
                  {post.coverUrl && (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                    />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    {post.tags.length > 0 && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                        {post.tags[0]}
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {post.summary}
                  </p>
                  <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
                    {t('readMore')} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Footer */}
        <Footer />
      </main>
    </>
  );
} 