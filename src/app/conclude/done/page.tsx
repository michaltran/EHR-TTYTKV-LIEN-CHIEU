import { prisma } from '@/lib/prisma';
import { requireAuth, getSession } from '@/lib/auth';
import Link from 'next/link';

export default async function ConcluderDone() {
  const s = await requireAuth(['CONCLUDER']);
  const records = await prisma.healthRecord.findMany({
    where: { concluderId: s.sub },
    include: { employee: { include: { department: true } }, examRound: true },
    orderBy: [{ finalizedAt: 'desc' }], take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Các hồ sơ đã ký kết luận</h1>
      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>Nhân viên</th><th>Khoa</th><th>Đợt</th><th>Phân loại</th><th>Ngày ký</th><th></th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs">{r.examRound.name}</td>
                <td>{r.finalClassification?.replace('LOAI_', 'Loại ') ?? '—'}</td>
                <td className="text-xs">{r.finalizedAt && new Date(r.finalizedAt).toLocaleString('vi-VN')}</td>
                <td>
                  <Link href={`/conclude/${r.id}`} className="text-brand-600 hover:underline text-sm">Xem →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
