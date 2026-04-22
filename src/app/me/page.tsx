import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { RecordStatus } from '@prisma/client';

export default async function MePage() {
  await requireAuth(['EMPLOYEE']);
  const user = await getCurrentUser();
  if (!user?.employeeId) {
    return (
      <div className="card">
        <h1 className="text-xl font-bold mb-2">Chưa liên kết với hồ sơ nhân viên</h1>
        <p className="text-sm">Liên hệ Admin để được liên kết tài khoản với hồ sơ nhân viên.</p>
      </div>
    );
  }

  const records = await prisma.healthRecord.findMany({
    where: { employeeId: user.employeeId },
    include: { examRound: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Hồ sơ sức khỏe của tôi</h1>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>Đợt khám</th><th>Trạng thái</th><th>Phân loại</th><th></th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.examRound.name}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[r.status as RecordStatus]}`}>
                    {STATUS_LABELS[r.status as RecordStatus]}
                  </span>
                </td>
                <td>{r.finalClassification?.replace('LOAI_','Loại ') ?? '—'}</td>
                <td>
                  <Link href={`/records/${r.id}/print`} target="_blank" className="text-brand-600 hover:underline text-sm">
                    Xem chi tiết →
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-500">Chưa có hồ sơ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
