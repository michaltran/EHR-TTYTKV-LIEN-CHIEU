import { prisma } from '@/lib/prisma';
import ReportsChart from './chart';
import { CLASSIFICATION_LABELS, STATUS_LABELS } from '@/lib/constants';

export default async function ReportsPage({ searchParams }: { searchParams: { round?: string } }) {
  const rounds = await prisma.examRound.findMany({ orderBy: { createdAt: 'desc' } });
  const roundId = searchParams.round ?? rounds[0]?.id;

  if (!roundId) {
    return <div className="card">Chưa có đợt khám nào để thống kê.</div>;
  }

  const records = await prisma.healthRecord.findMany({
    where: { examRoundId: roundId },
    include: { employee: { include: { department: true } } },
  });

  // Phân loại theo status
  const byStatus = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  // Phân loại sức khỏe
  const byClass = records.filter((r) => r.finalClassification).reduce((acc, r) => {
    const k = r.finalClassification!;
    acc[k] = (acc[k] || 0) + 1; return acc;
  }, {} as Record<string, number>);

  // Theo khoa
  const byDept = records.reduce((acc, r) => {
    const k = r.employee.department.name;
    if (!acc[k]) acc[k] = { total: 0, completed: 0 };
    acc[k].total++;
    if (r.status === 'COMPLETED') acc[k].completed++;
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // BMI buckets
  const bmiBuckets = { thieu: 0, binhThuong: 0, thuaCan: 0, beoPhi: 0 };
  records.forEach((r) => {
    if (!r.bmi) return;
    if (r.bmi < 18.5) bmiBuckets.thieu++;
    else if (r.bmi < 23) bmiBuckets.binhThuong++;
    else if (r.bmi < 25) bmiBuckets.thuaCan++;
    else bmiBuckets.beoPhi++;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo thống kê</h1>
        <a
          href={`/api/admin/reports/export?round=${roundId}`}
          className="btn-primary"
          title="Xuất báo cáo tổng thể Excel 4 sheet (Tổng quan, Theo khoa, Chi tiết, Bất thường)"
        >
          📊 Export báo cáo tổng thể (Excel)
        </a>
      </div>

      <form className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Đợt khám</label>
          <select name="round" defaultValue={roundId} className="input">
            {rounds.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <button className="btn-primary">Xem</button>
      </form>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card"><div className="text-sm text-slate-500">Tổng hồ sơ</div>
          <div className="text-3xl font-bold text-brand-600 mt-1">{records.length}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Đã hoàn tất</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{byStatus.COMPLETED || 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Đang xử lý</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">
            {(byStatus.IN_PROGRESS || 0) + (byStatus.WAITING_REVIEW || 0) + (byStatus.WAITING_CONCLUSION || 0)}
          </div></div>
        <div className="card"><div className="text-sm text-slate-500">Chưa khám</div>
          <div className="text-3xl font-bold text-slate-600 mt-1">{byStatus.PENDING || 0}</div></div>
      </div>

      <ReportsChart
        classData={Object.entries(byClass).map(([k, v]) => ({ name: CLASSIFICATION_LABELS[k as keyof typeof CLASSIFICATION_LABELS], value: v }))}
        statusData={Object.entries(byStatus).map(([k, v]) => ({ name: STATUS_LABELS[k as keyof typeof STATUS_LABELS] || k, value: v }))}
        bmiData={[
          { name: 'Thiếu cân (<18.5)', value: bmiBuckets.thieu },
          { name: 'Bình thường (18.5-22.9)', value: bmiBuckets.binhThuong },
          { name: 'Thừa cân (23-24.9)', value: bmiBuckets.thuaCan },
          { name: 'Béo phì (≥25)', value: bmiBuckets.beoPhi },
        ]}
        deptData={Object.entries(byDept).map(([k, v]) => ({ dept: k, total: v.total, completed: v.completed }))}
      />
    </div>
  );
}
