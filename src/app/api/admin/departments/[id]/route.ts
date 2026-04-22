import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const count = await prisma.employee.count({ where: { departmentId: params.id } });
    if (count > 0) {
      return NextResponse.json({ error: `Còn ${count} nhân viên trong khoa này` }, { status: 400 });
    }
    await prisma.department.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
