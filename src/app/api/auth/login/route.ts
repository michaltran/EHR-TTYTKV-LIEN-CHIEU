import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email/mật khẩu' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });
    }
    await createSession({
      sub: user.id, email: user.email, role: user.role, fullName: user.fullName,
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN' },
    }).catch(() => {});
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi server' }, { status: 500 });
  }
}
