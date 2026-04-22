import { prisma } from '@/lib/prisma';
import { requireAuth, getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ConcluderForm from './form';

export default async function ConcluderDetail({ params }: { params: { id: string } }) {
  await requireAuth(['CONCLUDER']);
  const user = await getCurrentUser();

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { include: { doctor: { select: { fullName: true, jobTitle: true } } }, orderBy: { specialty: 'asc' } },
      paraclinicals: true,
    },
  });
  if (!record) notFound();

  return (
    <ConcluderForm
      savedSignature={user?.signatureDataUrl ?? null}
      caEnabled={user?.caEnabled ?? false}
      record={{
        id: record.id,
        employee: {
          fullName: record.employee.fullName,
          gender: record.employee.gender,
          dateOfBirth: record.employee.dateOfBirth?.toISOString() ?? null,
          department: record.employee.department.name,
          position: record.employee.position,
          photoUrl: record.employee.photoUrl,
        },
        roundName: record.examRound.name,
        height: record.height, weight: record.weight, bmi: record.bmi,
        pulse: record.pulse, bpSys: record.bloodPressureSys, bpDia: record.bloodPressureDia,
        physicalClassification: record.physicalClassification,
        clinicalExams: record.clinicalExams.map((ce) => ({
          specialty: ce.specialty,
          findings: ce.findings,
          classification: ce.classification,
          doctorName: ce.doctorNameSnapshot ?? ce.doctor?.fullName ?? null,
          doctorTitle: ce.doctorTitleSnapshot ?? ce.doctor?.jobTitle ?? null,
          signedAt: ce.signedAt?.toISOString() ?? null,
        })),
        status: record.status,
        finalClassification: record.finalClassification,
        conclusionText: record.conclusionText,
      }}
    />
  );
}
