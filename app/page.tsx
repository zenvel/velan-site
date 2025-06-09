import { redirect } from 'next/navigation';

// 这个组件是根路径 `/` 的页面组件
// 我们需要重定向到默认语言路径
export default function Home() {
  // 默认重定向到英文版首页
  // 将此组件强制为客户端组件，以确保正确重定向
  redirect('/en');
  
  // 这个返回永远不会被执行，因为上面的重定向会阻止渲染
  return null;
}