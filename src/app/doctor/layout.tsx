import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/doctor', label: 'Hàng đợi khám', icon: '🩺' },
  { href: '/doctor/profile', label: 'Chữ ký & thông tin', icon: '✍' },
];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['DOCTOR']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
