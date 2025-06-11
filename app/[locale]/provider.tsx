'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

// 静态导入所有翻译文件
import enMessages from '../../messages/en.json';
import zhMessages from '../../messages/zh.json';
import esMessages from '../../messages/es.json';

// 支持的语言和翻译消息
const MESSAGES = {
  en: enMessages,
  zh: zhMessages,
  es: esMessages
};

interface ProviderProps {
  children: ReactNode;
  locale: string;
}

export default function Provider({ children, locale }: ProviderProps) {
  // 确保使用有效的locale
  let validLocale = 'zh';
  if (locale === 'en' || locale === 'es') {
    validLocale = locale;
  }
  
  return (
    <NextIntlClientProvider 
      locale={validLocale} 
      messages={MESSAGES[validLocale]}
      timeZone="Asia/Shanghai"
      // 使用固定日期避免服务器和客户端差异
      now={new Date('2023-12-01')}
      // 提供错误处理
      onError={(error) => {
        console.error('NextIntl错误:', error);
      }}
    >
      {/* 始终渲染children，因为它包含了<html>标签 */}
      {children}
    </NextIntlClientProvider>
  );
} 