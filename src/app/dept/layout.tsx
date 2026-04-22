import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/dept', label: 'Hồ sơ khoa/phòng', icon: '📋' },
];

export default async function DeptLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['DEPT_REP']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
