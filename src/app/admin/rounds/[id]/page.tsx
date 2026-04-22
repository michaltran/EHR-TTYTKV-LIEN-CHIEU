import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RoundDetailClient from './client';

export default async function RoundDetail({ params }: { params: { id: string } }) {
  const round = await prisma.examRound.findUnique({
    where: { id: params.id },
    include: {
      healthRecords: {
        include: { employee: { include: { department: true } } },
      },
    },
  });
  if (!round) notFound();

  const totalEmployees = await prisma.employee.count();
  const byStatus = round.healthRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <RoundDetailClient
      round={{
        id: round.id, name: round.name, status: round.status,
        startDate: round.startDate.toISOString(),
        endDate: round.endDate?.toISOString() ?? null,
        recordCount: round.healthRecords.length,
        totalEmployees, byStatus,
      }}
    />
  );
}
