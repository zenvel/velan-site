import ClientLayout from './layout-client';
import { metadata, viewport } from './metadata';

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
