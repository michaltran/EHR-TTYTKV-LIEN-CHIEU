import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN', 'DEPT_REP']);
    const { signatureDataUrl } = await req.json();
    if (!signatureDataUrl) {
      return NextResponse.json({ error: 'Thiếu chữ ký' }, { status: 400 });
    }
    await prisma.healthRecord.update({
      where: { id: params.id },
      data: {
        employeeSignatureDataUrl: signatureDataUrl,
        employeeSignedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'EMPLOYEE_SIGN', target: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
