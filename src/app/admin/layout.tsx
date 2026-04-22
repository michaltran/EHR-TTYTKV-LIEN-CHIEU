import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/admin', label: 'Tổng quan', icon: '📊' },
  { href: '/admin/employees', label: 'Nhân viên', icon: '👥' },
  { href: '/admin/departments', label: 'Khoa / Phòng', icon: '🏢' },
  { href: '/admin/users', label: 'Tài khoản', icon: '🔑' },
  { href: '/admin/rounds', label: 'Đợt khám', icon: '📅' },
  { href: '/admin/records', label: 'Hồ sơ khám', icon: '📋' },
  { href: '/admin/reports', label: 'Báo cáo thống kê', icon: '📈' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['ADMIN']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
