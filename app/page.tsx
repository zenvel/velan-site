import { redirect } from 'next/navigation';

export default function RootPage() {
  // 获取浏览器语言偏好，优先重定向到中文或英文
  // 这个组件不应该实际运行，因为中间件应该先处理重定向
  // 但作为备份机制保留
  const userLanguage = typeof navigator !== 'undefined' && navigator.language
    ? navigator.language.toLowerCase().startsWith('zh')
      ? 'zh'
      : 'en'
    : 'en';
  
  redirect(`/${userLanguage}`);
}