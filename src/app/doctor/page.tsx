import { prisma } from '@/lib/prisma';
import { requireAuth, getCurrentUser } from '@/lib/auth';
import { SPECIALTY_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import Link from 'next/link';
import type { Specialty, RecordStatus } from '@prisma/client';

export default async function DoctorQueuePage() {
  await requireAuth(['DOCTOR']);
  const doctor = await getCurrentUser();
  if (!doctor) return null;

  const specialties: Specialty[] = doctor.specialties ? JSON.parse(doctor.specialties) : [];

  // Lấy hồ sơ các nhân viên đang thuộc đợt OPEN (trạng thái PENDING hoặc IN_PROGRESS)
  const records = await prisma.healthRecord.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      examRound: { status: 'OPEN' },
    },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { select: { specialty: true, doctorId: true, signedAt: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hàng đợi khám</h1>
        <p className="text-sm text-slate-600 mt-1">
          Chuyên khoa bạn phụ trách:{' '}
          {specialties.length === 0 ? (
            <span className="text-red-600">Chưa được phân công chuyên khoa — liên hệ Admin</span>
          ) : (
            <span className="font-medium">{specialties.map((s) => SPECIALTY_LABELS[s]).join(', ')}</span>
          )}
        </p>
      </div>

      {specialties.length > 0 && (
        <div className="card p-0 overflow-auto">
          <table className="table-simple">
            <thead>
              <tr>
                <th>Nhân viên</th><th>Khoa</th><th>Đợt</th><th>Trạng thái</th>
                <th>Chuyên khoa đã khám / cần khám</th><th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const examinedByMe = r.clinicalExams.filter(
                  (e) => specialties.includes(e.specialty) && e.signedAt
                ).map((e) => e.specialty);
                const toExam = specialties.filter((s) => !examinedByMe.includes(s));
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.employee.fullName}</td>
                    <td>{r.employee.department.name}</td>
                    <td className="text-xs">{r.examRound.name}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[r.status as RecordStatus]}`}>
                        {STATUS_LABELS[r.status as RecordStatus]}
                      </span>
                    </td>
                    <td className="text-xs">
                      {examinedByMe.length > 0 && (
                        <div className="text-green-700">
                          ✓ Đã khám: {examinedByMe.map((s) => SPECIALTY_LABELS[s]).join(', ')}
                        </div>
                      )}
                      {toExam.length > 0 && (
                        <div className="text-slate-700">
                          ⏳ Cần khám: {toExam.map((s) => SPECIALTY_LABELS[s]).join(', ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/doctor/exam/${r.id}`}
                        className="text-brand-600 hover:underline text-sm font-medium"
                      >
                        Vào khám →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">
                  Không có hồ sơ nào cần khám. Chờ Admin mở đợt khám hoặc phân công chuyên khoa.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
