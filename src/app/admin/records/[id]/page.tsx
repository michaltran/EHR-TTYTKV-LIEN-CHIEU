import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import AdminRecordClient from './client';

export default async function AdminRecordDetail({ params }: { params: { id: string } }) {
  await requireAuth(['ADMIN']);
  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { include: { doctor: { select: { fullName: true } } }, orderBy: { specialty: 'asc' } },
      paraclinicals: true,
      concluder: { select: { fullName: true } },
    },
  });
  if (!record) notFound();

  return (
    <AdminRecordClient
      record={{
        id: record.id,
        status: record.status,
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
          doctorName: ce.doctor?.fullName ?? null,
          signedAt: ce.signedAt?.toISOString() ?? null,
        })),
        signedCount: record.clinicalExams.filter((e) => e.signedAt).length,
        totalExams: record.clinicalExams.length,
        finalClassification: record.finalClassification,
        conclusionText: record.conclusionText,
        concluderName: record.concluder?.fullName ?? null,
        concluderSignedAt: record.concluderSignedAt?.toISOString() ?? null,
        employeeSignatureDataUrl: record.employeeSignatureDataUrl,
        employeeSignedAt: record.employeeSignedAt?.toISOString() ?? null,
        bookMakerSignatureDataUrl: record.bookMakerSignatureDataUrl,
        bookMakerSignedAt: record.bookMakerSignedAt?.toISOString() ?? null,
        bookMakerName: record.bookMakerName,
        bookMakerTitle: record.bookMakerTitle,
      }}
    />
  );
}
