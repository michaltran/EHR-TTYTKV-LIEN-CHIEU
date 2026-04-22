import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { Specialty } from '@prisma/client';

/**
 * POST /api/doctor/records/[id]/exam-text
 * Chỉ lưu nội dung khám (findings, classification, extraData), KHÔNG ký.
 * Dùng trước khi bấm ký VNPT SmartCA để user có thể review nội dung xong mới ký.
 */
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

    await prisma.examClinical.upsert({
      where: { recordId_specialty: { recordId: params.id, specialty: data.specialty } },
      create: {
        recordId: params.id,
        specialty: data.specialty,
        findings: data.findings || null,
        classification: data.classification || null,
        extraData: data.extraData || null,
        doctorId: s.sub,
      },
      update: {
        findings: data.findings || null,
        classification: data.classification || null,
        extraData: data.extraData || null,
        doctorId: s.sub,
      },
    });

    await prisma.healthRecord.update({
      where: { id: params.id },
      data: { status: 'IN_PROGRESS' },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
