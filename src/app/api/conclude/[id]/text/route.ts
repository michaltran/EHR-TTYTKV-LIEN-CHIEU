import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['CONCLUDER']);
    const { classification, conclusionText } = await req.json();
    await prisma.healthRecord.update({
      where: { id: params.id },
      data: {
        finalClassification: classification || null,
        conclusionText: conclusionText || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
