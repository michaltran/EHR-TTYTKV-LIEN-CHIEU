import { prisma } from '@/lib/prisma';
import { requireAuth, getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import DoctorExamForm from './form';
import ParaclinicalViewOnly from '@/components/ParaclinicalViewOnly';
import type { Specialty } from '@prisma/client';

export default async function DoctorExamPage({ params }: { params: { id: string } }) {
  await requireAuth(['DOCTOR']);
  const doctor = await getCurrentUser();
  if (!doctor) notFound();

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { include: { doctor: { select: { fullName: true, jobTitle: true } } } },
      paraclinicals: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!record) notFound();

  const mySpecialties: Specialty[] = doctor.specialties ? JSON.parse(doctor.specialties) : [];

  return (
    <>
      <DoctorExamForm
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
          height: record.height,
          weight: record.weight,
          bmi: record.bmi,
          pulse: record.pulse,
          bpSys: record.bloodPressureSys,
          bpDia: record.bloodPressureDia,
          physicalClassification: record.physicalClassification,
          medicalHistoryNote: record.medicalHistoryNote,
          obstetricHistory: record.obstetricHistory,
          clinicalExams: record.clinicalExams.map((ce) => ({
            specialty: ce.specialty,
            findings: ce.findings,
            classification: ce.classification,
            extraData: ce.extraData,
            signedAt: ce.signedAt?.toISOString() ?? null,
            signatureDataUrl: ce.signatureDataUrl,
            doctorName: ce.doctorNameSnapshot ?? ce.doctor?.fullName ?? null,
            doctorTitle: ce.doctorTitleSnapshot ?? ce.doctor?.jobTitle ?? null,
          })),
        }}
        mySpecialties={mySpecialties}
        savedSignature={doctor.signatureDataUrl}
        userTitle={doctor.jobTitle}
        caEnabled={doctor.caEnabled}
      />
      <div className="mt-4">
        <ParaclinicalViewOnly
          existing={record.paraclinicals.map((p) => ({
            id: p.id,
            category: p.category,
            testName: p.testName,
            result: p.result,
            evaluation: p.evaluation,
            fileUrl: p.fileUrl,
            fileName: p.fileName,
          }))}
        />
      </div>
    </>
  );
}
