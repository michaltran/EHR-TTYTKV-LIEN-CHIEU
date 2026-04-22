import { prisma } from '@/lib/prisma';
import EmployeeForm from '@/components/EmployeeForm';
import { notFound } from 'next/navigation';

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const [employee, departments] = await Promise.all([
    prisma.employee.findUnique({ where: { id: params.id } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!employee) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Chỉnh sửa: {employee.fullName}</h1>
      <EmployeeForm employee={employee} departments={departments} />
    </div>
  );
}
