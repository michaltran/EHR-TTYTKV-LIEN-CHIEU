import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { STATUS_LABELS } from '@/lib/constants';

export default async function VitalQueuePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim();

  const records = await prisma.healthRecord.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      vitalSignedAt: null,
      ...(q ? { employee: { fullName: { contains: q, mode: 'insensitive' } } } : {}),
    },
    include: {
      employee: { include: { department: true } },
      examRound: true,
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">📏 Đo thể lực</h1>
        <p className="text-sm text-slate-600 mt-1">
          Đo chiều cao, cân nặng, mạch, huyết áp cho nhân viên trước khi vào khám lâm sàng.
          BMI được tính tự động.
        </p>
      </div>

      <form className="card">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên nhân viên..."
          className="input max-w-md"
        />
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Khoa/Phòng</th>
              <th>Đợt</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td>{i + 1}</td>
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs text-slate-500">{r.examRound.name}</td>
                <td>
                  <span className="badge bg-slate-100">{STATUS_LABELS[r.status]}</span>
                </td>
                <td className="text-right">
                  <Link href={`/vital/${r.id}`} className="text-brand-600 hover:underline text-sm">
                    Đo →
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-500 py-8">
                  Không có hồ sơ nào cần đo thể lực
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
