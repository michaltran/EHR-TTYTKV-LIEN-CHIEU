import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const r = await prisma.examRound.create({
      data: {
        name: data.name,
        year: Number(data.year),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'DRAFT',
      },
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
