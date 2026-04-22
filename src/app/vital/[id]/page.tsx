import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import VitalForm from './form';

export default async function VitalEntryPage({ params }: { params: { id: string } }) {
  await requireAuth(['VITAL_STAFF']);
  const user = await getCurrentUser();

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
    },
  });
  if (!record) notFound();

  return (
    <div className="space-y-4">
      <Link href="/vital" className="text-sm text-slate-500 hover:underline">← Hàng đợi</Link>

      <div className="card flex gap-4 items-start">
        {record.employee.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={record.employee.photoUrl} alt="" className="w-20 h-24 object-cover rounded border" />
        ) : (
          <div className="w-20 h-24 bg-slate-100 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">
            Ảnh
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
          <p className="text-sm text-slate-600">
            {record.employee.department.name} •{' '}
            {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'}
            {record.employee.dateOfBirth && ` • Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`}
          </p>
        </div>
      </div>

      <VitalForm
        recordId={record.id}
        initial={{
          height: record.height,
          weight: record.weight,
          bmi: record.bmi,
          pulse: record.pulse,
          bpSys: record.bloodPressureSys,
          bpDia: record.bloodPressureDia,
          physicalClassification: record.physicalClassification,
          signed: !!record.vitalSignedAt,
          vitalStaffName: record.vitalStaffName,
          vitalSignedAt: record.vitalSignedAt?.toISOString() ?? null,
        }}
        userName={user?.fullName ?? ''}
        userTitle={user?.jobTitle ?? ''}
        savedSignature={user?.signatureDataUrl ?? null}
      />
    </div>
  );
}
