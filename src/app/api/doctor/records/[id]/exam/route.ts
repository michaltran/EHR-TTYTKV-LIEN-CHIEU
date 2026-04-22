import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { Specialty } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['DOCTOR']);
    const data = await req.json();

    const user = await prisma.user.findUnique({ where: { id: s.sub } });
    if (!user?.specialties) {
      return NextResponse.json({ error: 'Chưa được phân công chuyên khoa' }, { status: 403 });
    }
    const allowed: Specialty[] = JSON.parse(user.specialties);
    if (!allowed.includes(data.specialty)) {
      return NextResponse.json({ error: 'Không được phép khám chuyên khoa này' }, { status: 403 });
    }
    if (!data.signatureDataUrl) {
      return NextResponse.json({ error: 'Thiếu chữ ký' }, { status: 400 });
    }

    const ce = await prisma.examClinical.upsert({
      where: { recordId_specialty: { recordId: params.id, specialty: data.specialty } },
      create: {
        recordId: params.id,
        specialty: data.specialty,
        findings: data.findings || null,
        classification: data.classification || null,
        extraData: data.extraData || null,
        doctorId: s.sub,
        signedAt: new Date(),
        signatureDataUrl: data.signatureDataUrl,
        doctorNameSnapshot: user.fullName,
        doctorTitleSnapshot: user.jobTitle,
      },
      update: {
        findings: data.findings || null,
        classification: data.classification || null,
        extraData: data.extraData || null,
        doctorId: s.sub,
        signedAt: new Date(),
        signatureDataUrl: data.signatureDataUrl,
        doctorNameSnapshot: user.fullName,
        doctorTitleSnapshot: user.jobTitle,
      },
    });

    // Tự động lưu chữ ký nếu bác sĩ chưa có signature mẫu
    if (!user.signatureDataUrl) {
      await prisma.user.update({
        where: { id: s.sub },
        data: { signatureDataUrl: data.signatureDataUrl },
      });
    }

    await prisma.healthRecord.update({
      where: { id: params.id },
      data: { status: 'IN_PROGRESS' },
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub, action: 'SIGN_EXAM', target: ce.id,
        detail: JSON.stringify({ specialty: data.specialty, recordId: params.id }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
