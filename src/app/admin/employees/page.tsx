import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import EmployeesClient from './client';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; dept?: string };
}) {
  const q = searchParams.q?.trim();
  const dept = searchParams.dept;

  const where: any = {};
  if (q) where.fullName = { contains: q, mode: 'insensitive' };
  if (dept) where.departmentId = dept;

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: [{ department: { name: 'asc' } }, { fullName: 'asc' }],
      take: 300,
    }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <EmployeesClient
      employees={employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        gender: e.gender,
        birthYear: e.dateOfBirth ? new Date(e.dateOfBirth).getFullYear() : null,
        position: e.position,
        department: e.department.name,
        employmentType: e.employmentType,
        photoUrl: e.photoUrl,
      }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      currentQ={q ?? ''}
      currentDept={dept ?? ''}
    />
  );
}
