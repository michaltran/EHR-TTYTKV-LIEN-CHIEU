import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const s = await requireAuth(['VITAL_STAFF', 'DOCTOR', 'ADMIN']);
    const data = await req.json();
    const user = await prisma.user.findUnique({ where: { id: s.sub } });

    const updateData: any = {
      height: data.height ? Number(data.height) : null,
      weight: data.weight ? Number(data.weight) : null,
      bmi: data.bmi ? Number(data.bmi) : null,
      pulse: data.pulse ? Number(data.pulse) : null,
      bloodPressureSys: data.bpSys ? Number(data.bpSys) : null,
      bloodPressureDia: data.bpDia ? Number(data.bpDia) : null,
      physicalClassification: data.physicalClassification || null,
      status: 'IN_PROGRESS',
    };

    if (data.signatureDataUrl) {
      updateData.vitalSignedAt = new Date();
      updateData.vitalSignatureDataUrl = data.signatureDataUrl;
      updateData.vitalStaffName = user?.fullName;
      updateData.vitalStaffTitle = user?.jobTitle;
    }

    await prisma.healthRecord.update({
      where: { id: data.recordId },
      data: updateData,
    });

    if (user && !user.signatureDataUrl && data.signatureDataUrl) {
      await prisma.user.update({ where: { id: s.sub }, data: { signatureDataUrl: data.signatureDataUrl } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
