import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);

    const round = await prisma.examRound.findUnique({ where: { id: params.id } });
    if (!round) return NextResponse.json({ error: 'Không tìm thấy đợt khám' }, { status: 404 });

    const reps = await prisma.user.findMany({
      where: { role: 'DEPT_REP', isActive: true },
      include: { department: true },
    });

    // TODO: Tích hợp SMTP thực tế qua nodemailer. Hiện tại chỉ log + audit.
    for (const r of reps) {
      await prisma.auditLog.create({
        data: {
          userId: s.sub,
          action: 'NOTIFY_DEPT_REP',
          target: r.id,
          detail: JSON.stringify({
            email: r.email,
            department: r.department?.name,
            round: round.name,
          }),
        },
      });
      // console.log(`📧 [MOCK] Gửi email đến ${r.email}: đợt "${round.name}"`);
    }

    return NextResponse.json({
      message: `Đã ghi nhận thông báo cho ${reps.length} đại diện khoa. ${reps.length === 0 ? '(Chưa có đại diện khoa nào được tạo — vào Tài khoản để tạo role DEPT_REP)' : '(Cấu hình SMTP trong .env để thật sự gửi email)'}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
