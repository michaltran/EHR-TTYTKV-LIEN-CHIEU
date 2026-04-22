import { getCurrentUser, requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/vital', label: 'Hồ sơ cần đo thể lực', icon: '📏' },
  { href: '/vital/done', label: 'Đã đo', icon: '✓' },
];

export default async function VitalLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(['VITAL_STAFF']);
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }} nav={NAV}>
      {children}
    </AppShell>
  );
}
