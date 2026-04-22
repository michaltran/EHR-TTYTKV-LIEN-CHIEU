import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    await prisma.examRound.update({ where: { id: params.id }, data: { status: 'CLOSED' } });
    return NextResponse.json({ message: '✅ Đã đóng đợt' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
