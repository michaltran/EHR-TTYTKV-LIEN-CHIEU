import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);
    await prisma.healthRecord.update({
      where: { id: params.id },
      data: { status: 'WAITING_CONCLUSION', reviewedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'ADMIN_APPROVE', target: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
