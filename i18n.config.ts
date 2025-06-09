import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './i18n';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ locale }) => {
  // 确保语言代码有效
  if (!locales.includes(locale as any)) {
    console.error(`无效的语言代码: ${locale}`);
    return notFound();
  }
  
  try {
    const messages = (await import(`./messages/${locale || defaultLocale}.json`)).default;
    console.log(`成功加载语言文件: ${locale}`, Object.keys(messages).length);
    
    return {
      locale: locale || defaultLocale,
      messages,
      timeZone: 'Asia/Shanghai'
    };
  } catch (error) {
    console.error(`加载语言文件失败: ${locale}`, error);
    // 如果特定语言加载失败，尝试使用默认语言
    if (locale !== defaultLocale) {
      const defaultMessages = (await import(`./messages/${defaultLocale}.json`)).default;
      return {
        locale: defaultLocale,
        messages: defaultMessages,
        timeZone: 'Asia/Shanghai'
      };
    }
    throw error;
  }
}); 