import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { STATUS_LABELS, XETNGHIEM_CATEGORIES, CHANDOANHINHANH_CATEGORIES } from '@/lib/constants';

export default async function ParaclinicalDonePage() {
  const user = await getCurrentUser();
  const isXN = user?.role === 'KTV_XETNGHIEM';
  const myCategories = isXN ? XETNGHIEM_CATEGORIES : CHANDOANHINHANH_CATEGORIES;

  // Chỉ lấy hồ sơ có ít nhất 1 CLS thuộc chuyên môn này
  const records = await prisma.healthRecord.findMany({
    where: {
      paraclinicals: { some: { category: { in: myCategories } } },
    },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      paraclinicals: { select: { category: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  const rows = records.map((r) => ({
    ...r,
    myCount: r.paraclinicals.filter((p) => myCategories.includes(p.category)).length,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">
        ✓ Hồ sơ đã nhập {isXN ? 'Xét nghiệm' : 'CĐHA'}
      </h1>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>Khoa</th>
              <th>Đợt</th>
              <th className="text-center">Số mục {isXN ? 'XN' : 'CĐHA'}</th>
              <th>Trạng thái hồ sơ</th>
              <th className="text-right">Xem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs text-slate-500">{r.examRound.name}</td>
                <td className="text-center">
                  <span className="badge bg-green-100 text-green-700">{r.myCount}</span>
                </td>
                <td><span className="badge bg-slate-100">{STATUS_LABELS[r.status]}</span></td>
                <td className="text-right">
                  <Link href={`/paraclinical/${r.id}`} className="text-brand-600 hover:underline text-sm">
                    Xem / Bổ sung →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">Chưa có hồ sơ nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
