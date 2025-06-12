import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function RootNotFound() {
  // 尝试从URL路径获取语言信息，如果没有则默认为英文
  let locale = 'en';
  
  try {
    // 这是一个全局404页面，无法直接获取locale参数
    // 可以通过其他方式（如cookies、headers等）获取用户偏好语言
    // 这里先用英文作为默认值
  } catch (error) {
    // 保持默认英文
  }
  
  // 获取翻译
  const t = await getTranslations({ locale, namespace: 'notFound' });
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-4xl font-bold mb-6">404</h1>
      <p className="text-xl mb-8">{t('description')}</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        {t('backToHome')}
      </Link>
    </div>
  );
} 