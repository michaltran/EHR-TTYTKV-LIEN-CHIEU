import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    if (!data.email || !data.password) {
      return NextResponse.json({ error: 'Thiếu email/mật khẩu' }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 });

    const u = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hashPassword(data.password),
        fullName: data.fullName,
        role: data.role,
        jobTitle: data.jobTitle || null,
        departmentId: data.departmentId || null,
        specialties: data.specialties && data.specialties.length ? JSON.stringify(data.specialties) : null,
      },
    });
    return NextResponse.json({ id: u.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
