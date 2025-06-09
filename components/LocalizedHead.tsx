'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

interface LocalizedHeadProps {
  titleKey: string;
  descriptionKey: string;
  namespace?: string;
}

/**
 * 本地化的Head组件，用于在客户端设置标题和描述
 * 使用useEffect在客户端动态更新文档头部
 */
export default function LocalizedHead({ 
  titleKey, 
  descriptionKey, 
  namespace = 'Metadata' 
}: LocalizedHeadProps) {
  const t = useTranslations(namespace);
  const params = useParams();
  const locale = params.locale as string || 'en';
  
  useEffect(() => {
    // 更新文档标题
    document.title = t(titleKey);
    
    // 更新或创建描述元标签
    let metaDescription = document.querySelector('meta[name="description"]');
    
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    metaDescription.setAttribute('content', t(descriptionKey));
    
    // 添加语言meta标签
    let metaLang = document.querySelector('meta[name="language"]');
    if (!metaLang) {
      metaLang = document.createElement('meta');
      metaLang.setAttribute('name', 'language');
      document.head.appendChild(metaLang);
    }
    metaLang.setAttribute('content', locale);
    
    // 设置html标签的lang属性
    document.documentElement.lang = locale;
    
    // 强制清除页面缓存
    const noCache = document.createElement('meta');
    noCache.setAttribute('http-equiv', 'Cache-Control');
    noCache.setAttribute('content', 'no-cache, no-store, must-revalidate');
    document.head.appendChild(noCache);
    
    const noCache2 = document.createElement('meta');
    noCache2.setAttribute('http-equiv', 'Pragma');
    noCache2.setAttribute('content', 'no-cache');
    document.head.appendChild(noCache2);
    
    const noCache3 = document.createElement('meta');
    noCache3.setAttribute('http-equiv', 'Expires');
    noCache3.setAttribute('content', '0');
    document.head.appendChild(noCache3);
    
    console.log(`LocalizedHead: 设置语言为 ${locale}, 标题: ${t(titleKey)}`);
  }, [t, titleKey, descriptionKey, locale]);
  
  // 这个组件不渲染任何内容
  return null;
} 