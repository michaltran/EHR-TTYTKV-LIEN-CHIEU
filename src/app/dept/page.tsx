import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { RecordStatus } from '@prisma/client';
import DeptActionButtons from './buttons';

export default async function DeptPage() {
  await requireAuth(['DEPT_REP']);
  const user = await getCurrentUser();
  if (!user?.departmentId) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold mb-2">Chưa được phân công khoa</h1>
        <p className="text-sm">Liên hệ Admin để được gán vào một khoa/phòng cụ thể.</p>
      </div>
    );
  }

  const records = await prisma.healthRecord.findMany({
    where: {
      employee: { departmentId: user.departmentId },
      examRound: { status: 'OPEN' },
    },
    include: {
      employee: true,
      examRound: true,
      clinicalExams: { select: { specialty: true, signedAt: true } },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Hồ sơ khoa: {user.department?.name}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Khi bác sĩ đã khám xong các chuyên khoa cần thiết, bấm "Gửi lên Admin" để chuyển hồ sơ vào luồng duyệt.
        </p>
      </div>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr><th>Nhân viên</th><th>Trạng thái</th><th>Đã khám</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const signed = r.clinicalExams.filter((e) => e.signedAt).length;
              return (
                <tr key={r.id}>
                  <td className="font-medium">{r.employee.fullName}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[r.status as RecordStatus]}`}>
                      {STATUS_LABELS[r.status as RecordStatus]}
                    </span>
                  </td>
                  <td>{signed} chuyên khoa</td>
                  <td><DeptActionButtons recordId={r.id} status={r.status} signedCount={signed} /></td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">Không có hồ sơ nào trong đợt đang mở</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
