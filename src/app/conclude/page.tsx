import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';

export default async function ConcluderQueue() {
  await requireAuth(['CONCLUDER']);
  const records = await prisma.healthRecord.findMany({
    where: { status: 'WAITING_CONCLUSION' },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { select: { specialty: true, signedAt: true } },
    },
    orderBy: [{ updatedAt: 'asc' }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hồ sơ chờ kết luận</h1>
        <p className="text-sm text-slate-600 mt-1">
          Các hồ sơ đã được Admin duyệt và sẵn sàng để bạn ký kết luận cuối cùng.
        </p>
      </div>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr><th>Nhân viên</th><th>Khoa</th><th>Đợt</th><th>Số CK đã khám</th><th>Admin duyệt lúc</th><th></th></tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs">{r.examRound.name}</td>
                <td>{r.clinicalExams.filter((e) => e.signedAt).length} / {r.clinicalExams.length}</td>
                <td className="text-xs text-slate-500">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('vi-VN') : '—'}</td>
                <td>
                  <Link href={`/conclude/${r.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                    Xem & ký kết luận →
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Không có hồ sơ nào chờ kết luận</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
