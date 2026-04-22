import { prisma } from '@/lib/prisma';
import EmployeeForm from '@/components/EmployeeForm';

export default async function NewEmployeePage() {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Thêm nhân viên mới</h1>
      <EmployeeForm departments={departments} />
    </div>
  );
}
