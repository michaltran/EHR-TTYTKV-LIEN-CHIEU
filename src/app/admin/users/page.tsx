import { prisma } from '@/lib/prisma';
import UsersClient from './client';

export default async function UsersPage() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      include: { department: true },
    }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Tài khoản hệ thống</h1>
      <UsersClient
        users={users.map((u) => ({
          id: u.id, email: u.email, fullName: u.fullName, role: u.role,
          specialties: u.specialties, department: u.department?.name ?? null,
          isActive: u.isActive,
        }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
