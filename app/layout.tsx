import ClientLayout from './layout-client';
import { metadata, viewport } from './metadata';
import "./globals.css";

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
