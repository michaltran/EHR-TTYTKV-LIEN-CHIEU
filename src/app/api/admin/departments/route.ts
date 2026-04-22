import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const { name, code } = await req.json();
    const d = await prisma.department.create({ data: { name, code } });
    return NextResponse.json(d);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
