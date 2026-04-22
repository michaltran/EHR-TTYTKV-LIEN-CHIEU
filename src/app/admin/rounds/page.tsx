import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import RoundsClient from './client';

export default async function RoundsPage() {
  const rounds = await prisma.examRound.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { healthRecords: true } } },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Đợt khám sức khỏe</h1>
      </div>
      <RoundsClient rounds={rounds.map((r) => ({
        id: r.id, name: r.name, year: r.year,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate?.toISOString() ?? null,
        status: r.status, count: r._count.healthRecords,
      }))} />
    </div>
  );
}
