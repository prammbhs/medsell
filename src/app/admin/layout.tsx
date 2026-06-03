import { LayoutShell } from '@/components/layout-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutShell>{children}</LayoutShell>;
}
