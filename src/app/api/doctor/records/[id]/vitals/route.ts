import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['DOCTOR']);
    const data = await req.json();
    await prisma.healthRecord.update({
      where: { id: params.id },
      data: {
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
        bmi: data.bmi ? Number(data.bmi) : null,
        pulse: data.pulse ? Number(data.pulse) : null,
        bloodPressureSys: data.bpSys ? Number(data.bpSys) : null,
        bloodPressureDia: data.bpDia ? Number(data.bpDia) : null,
        physicalClassification: data.physicalClassification || null,
        medicalHistoryNote: data.medicalHistoryNote || null,
        obstetricHistory: data.obstetricHistory || null,
        status: 'IN_PROGRESS',
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
