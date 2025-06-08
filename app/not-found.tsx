import { redirect } from 'next/navigation';

export default function RootNotFound() {
  // 重定向到默认语言的404页面
  redirect('/en/not-found');
} 