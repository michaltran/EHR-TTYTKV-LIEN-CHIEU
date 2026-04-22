import { getCurrentUser, requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/paraclinical', label: 'Hồ sơ cần nhập', icon: '🧪' },
  { href: '/paraclinical/done', label: 'Đã nhập', icon: '✓' },
];

export default async function ParaclinicalLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(['KTV_XETNGHIEM', 'KTV_CHANDOANHINHANH']);
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }} nav={NAV}>
      {children}
    </AppShell>
  );
}
