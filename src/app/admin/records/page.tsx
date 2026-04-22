import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { RecordStatus } from '@prisma/client';

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: { round?: string; status?: string; dept?: string; q?: string };
}) {
  const where: any = {};
  if (searchParams.round) where.examRoundId = searchParams.round;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.dept) where.employee = { departmentId: searchParams.dept };
  if (searchParams.q) where.employee = { ...(where.employee || {}), fullName: { contains: searchParams.q } };

  const [records, rounds, departments] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      include: { employee: { include: { department: true } }, examRound: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    }),
    prisma.examRound.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Hồ sơ khám sức khỏe</h1>

      <form className="card grid grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Đợt khám</label>
          <select name="round" defaultValue={searchParams.round ?? ''} className="input">
            <option value="">-- Tất cả --</option>
            {rounds.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Trạng thái</label>
          <select name="status" defaultValue={searchParams.status ?? ''} className="input">
            <option value="">-- Tất cả --</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Khoa / Phòng</label>
          <select name="dept" defaultValue={searchParams.dept ?? ''} className="input">
            <option value="">-- Tất cả --</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tìm tên NV</label>
          <input name="q" defaultValue={searchParams.q ?? ''} className="input" />
        </div>
        <div className="col-span-4">
          <button className="btn-primary">Lọc</button>
        </div>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Nhân viên</th><th>Khoa</th><th>Đợt</th><th>Trạng thái</th>
              <th>Phân loại</th><th>Cập nhật</th><th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.employee.fullName}</td>
                <td>{r.employee.department.name}</td>
                <td className="text-xs">{r.examRound.name}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[r.status as RecordStatus]}`}>
                    {STATUS_LABELS[r.status as RecordStatus]}
                  </span>
                </td>
                <td>{r.finalClassification?.replace('LOAI_', 'Loại ') ?? '—'}</td>
                <td className="text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString('vi-VN')}</td>
                <td>
                  <Link href={`/admin/records/${r.id}`} className="text-brand-600 hover:underline text-sm">
                    Chi tiết →
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-500">Không có hồ sơ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
