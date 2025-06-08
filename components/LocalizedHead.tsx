'use client';

import { useTranslations } from 'next-intl';
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
  }, [t, titleKey, descriptionKey]);
  
  // 这个组件不渲染任何内容
  return null;
} 