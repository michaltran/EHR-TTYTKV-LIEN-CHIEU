import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const updateData: any = {};
    if (typeof data.password === 'string') updateData.passwordHash = await hashPassword(data.password);
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
    if (typeof data.fullName === 'string') updateData.fullName = data.fullName;
    if (typeof data.signatureDataUrl === 'string') updateData.signatureDataUrl = data.signatureDataUrl;
    if (Array.isArray(data.specialties)) updateData.specialties = JSON.stringify(data.specialties);
    await prisma.user.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
