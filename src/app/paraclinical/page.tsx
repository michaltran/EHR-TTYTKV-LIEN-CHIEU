import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { STATUS_LABELS, XETNGHIEM_CATEGORIES, CHANDOANHINHANH_CATEGORIES } from '@/lib/constants';

export default async function ParaclinicalQueuePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await getCurrentUser();
  const isXN = user?.role === 'KTV_XETNGHIEM';
  const myCategories = isXN ? XETNGHIEM_CATEGORIES : CHANDOANHINHANH_CATEGORIES;
  const roleLabel = isXN ? 'Xét nghiệm (Công thức máu, Sinh hoá, Miễn dịch)' : 'Chẩn đoán hình ảnh (Điện tim, X-quang, Siêu âm)';

  const q = searchParams.q?.trim();

  const records = await prisma.healthRecord.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_REVIEW', 'WAITING_CONCLUSION'] },
      ...(q ? { employee: { fullName: { contains: q, mode: 'insensitive' } } } : {}),
    },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      paraclinicals: { select: { category: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  // Đếm số mục thuộc chuyên môn của KTV này đã nhập
  const rows = records.map((r) => ({
    ...r,
    myCount: r.paraclinicals.filter((p) => myCategories.includes(p.category)).length,
    myTotal: myCategories.length,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          🧪 Hàng đợi {isXN ? 'Xét nghiệm' : 'Chẩn đoán hình ảnh'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Chuyên môn của bạn: <strong>{roleLabel}</strong>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Bạn chỉ có thể nhập kết quả thuộc các hạng mục này. KTV khác phụ trách các hạng mục còn lại.
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
              <th>Đợt khám</th>
              <th>Trạng thái</th>
              <th className="text-center">Tiến độ {isXN ? 'XN' : 'CĐHA'}</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td>{i + 1}</td>
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs text-slate-500">{r.examRound.name}</td>
                <td>
                  <span className="badge bg-slate-100">{STATUS_LABELS[r.status]}</span>
                </td>
                <td className="text-center">
                  {r.myCount === 0 ? (
                    <span className="text-xs text-slate-400">0 / {r.myTotal}</span>
                  ) : r.myCount >= r.myTotal ? (
                    <span className="badge bg-green-100 text-green-700">
                      ✓ {r.myCount} / {r.myTotal}
                    </span>
                  ) : (
                    <span className="badge bg-amber-100 text-amber-700">
                      {r.myCount} / {r.myTotal}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  <Link href={`/paraclinical/${r.id}`} className="text-brand-600 hover:underline text-sm">
                    Nhập →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-8">
                  Không có hồ sơ nào cần nhập
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
