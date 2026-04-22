import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { STATUS_LABELS } from '@/lib/constants';

export default async function VitalDonePage() {
  const records = await prisma.healthRecord.findMany({
    where: { vitalSignedAt: { not: null } },
    include: {
      employee: { include: { department: true } },
      examRound: true,
    },
    orderBy: { vitalSignedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">✓ Hồ sơ đã đo thể lực</h1>
      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Họ tên</th><th>Khoa</th><th>Cao</th><th>Nặng</th><th>BMI</th>
              <th>HA</th><th>Đã ký lúc</th><th className="text-right">Xem</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td>{r.height}</td>
                <td>{r.weight}</td>
                <td>{r.bmi}</td>
                <td>{r.bloodPressureSys}/{r.bloodPressureDia}</td>
                <td className="text-xs text-slate-500">
                  {r.vitalSignedAt && new Date(r.vitalSignedAt).toLocaleString('vi-VN')}
                </td>
                <td className="text-right">
                  <Link href={`/vital/${r.id}`} className="text-brand-600 hover:underline text-sm">Xem</Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">Chưa có</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
