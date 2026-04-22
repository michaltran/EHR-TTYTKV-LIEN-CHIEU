import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const s = await requireAuth(['DOCTOR', 'CONCLUDER']);
    const { signatureDataUrl } = await req.json();
    await prisma.user.update({
      where: { id: s.sub },
      data: { signatureDataUrl: signatureDataUrl || null },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
