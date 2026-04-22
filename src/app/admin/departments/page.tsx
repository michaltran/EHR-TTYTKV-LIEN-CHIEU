import { prisma } from '@/lib/prisma';
import DepartmentsClient from './client';

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Khoa / Phòng</h1>
      <DepartmentsClient initial={departments.map((d) => ({
        id: d.id, name: d.name, code: d.code, count: d._count.employees,
      }))} />
    </div>
  );
}
