import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);
    const employees = await prisma.employee.findMany({
      select: { id: true, signatureUrl: true },
    });

    let created = 0;
    for (const e of employees) {
      try {
        await prisma.healthRecord.create({
          data: {
            employeeId: e.id,
            examRoundId: params.id,
            status: 'PENDING',
            // Yêu cầu 5: tự động điền chữ ký NLĐ nếu đã có mẫu
            employeeSignatureDataUrl: e.signatureUrl || null,
            employeeSignedAt: e.signatureUrl ? new Date() : null,
          },
        });
        created++;
      } catch { /* đã tồn tại do unique constraint - bỏ qua */ }
    }

    await prisma.auditLog.create({
      data: {
        userId: s.sub, action: 'GENERATE_RECORDS', target: params.id,
        detail: JSON.stringify({ created }),
      },
    });

    return NextResponse.json({ message: `Đã tạo ${created} hồ sơ mới.` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
