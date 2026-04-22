import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [{ href: '/me', label: 'Hồ sơ của tôi', icon: '👤' }];

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['EMPLOYEE']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
