import { redirect } from 'next/navigation';

export default function RootPage() {
  // 简单地重定向到默认语言 
  // 注意：实际的语言检测由中间件处理
  redirect('/en');
}