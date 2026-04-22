import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/conclude', label: 'Hồ sơ chờ kết luận', icon: '📝' },
  { href: '/conclude/done', label: 'Đã kết luận', icon: '✓' },
  { href: '/conclude/profile', label: 'Chữ ký', icon: '✍' },
];

export default async function ConcludeLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['CONCLUDER']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
