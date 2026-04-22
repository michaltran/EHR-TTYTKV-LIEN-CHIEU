'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = { href: string; label: string; icon?: string };

export default function AppShell({
  user,
  nav,
  children,
}: {
  user: { fullName: string; email: string; role: string };
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    DOCTOR: 'Bác sĩ khám',
    CONCLUDER: 'Bác sĩ kết luận',
    DEPT_REP: 'Đại diện khoa',
    EMPLOYEE: 'Nhân viên',
  };

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 sidebar-gradient text-slate-100 flex flex-col no-print">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <img src="/assets/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-bold text-white leading-tight">TTYT Liên Chiểu</div>
            <div className="text-[10px] text-slate-300">Hồ sơ sức khỏe định kỳ</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
                  active
                    ? 'bg-white/15 text-white font-medium shadow-sm'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {it.icon && <span className="text-base w-5 text-center">{it.icon}</span>}
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{user.fullName}</div>
              <div className="text-slate-300 text-[10px]">{roleLabel[user.role] ?? user.role}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full btn bg-white/10 text-white hover:bg-white/20 text-xs">
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">
        <div>{children}</div>
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 italic">
          Software Copyright Powered by Dat Dat
        </div>
      </main>
    </div>
  );
}
