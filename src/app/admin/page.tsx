import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [empCount, deptCount, roundCount, pendingRecords, completedRecords, latestRound] = await Promise.all([
    prisma.employee.count(),
    prisma.department.count(),
    prisma.examRound.count(),
    prisma.healthRecord.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.healthRecord.count({ where: { status: 'COMPLETED' } }),
    prisma.examRound.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  const stats = [
    { label: 'Nhân viên', value: empCount, href: '/admin/employees', icon: '👥', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Khoa/Phòng', value: deptCount, href: '/admin/departments', icon: '🏢', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Đợt khám', value: roundCount, href: '/admin/rounds', icon: '📅', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Đang khám', value: pendingRecords, href: '/admin/records', icon: '🩺', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { label: 'Đã hoàn tất', value: completedRecords, href: '/admin/records?status=COMPLETED', icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tổng quan quản trị</h1>
          <p className="text-sm text-slate-600 mt-1">Quản lý toàn bộ quy trình khám sức khỏe định kỳ</p>
        </div>
        <Link href="/admin/employees/import" className="btn-primary">📥 Import Excel nhân sự</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`card-accent hover:shadow-md transition group`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-600 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-accent">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span>📅</span>
            Đợt khám gần nhất
          </h2>
          {latestRound ? (
            <div>
              <div className="font-medium text-lg">{latestRound.name}</div>
              <div className="text-sm text-slate-600 mt-1">
                Từ {new Date(latestRound.startDate).toLocaleDateString('vi-VN')} •{' '}
                Trạng thái: <span className="font-medium">{latestRound.status}</span>
              </div>
              <div className="mt-3">
                <Link href={`/admin/rounds/${latestRound.id}`} className="btn-secondary">
                  Quản lý đợt →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Chưa có đợt khám nào. <Link href="/admin/rounds" className="text-brand-600">Tạo đợt mới</Link>
            </div>
          )}
        </div>

        <div className="card-accent">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span>🔄</span>
            Quy trình 8 bước
          </h2>
          <ol className="space-y-1 text-sm text-slate-700 list-decimal list-inside">
            <li>Admin import danh sách, tạo đợt khám</li>
            <li>Gửi thông báo email đến đại diện khoa</li>
            <li>Nhân viên đi khám theo lịch</li>
            <li>Bác sĩ chuyên khoa khám + ký điện tử</li>
            <li>Đại diện khoa tổng hợp gửi lên Admin</li>
            <li>Admin rà soát dữ liệu</li>
            <li>Bác sĩ kết luận ký cuối cùng</li>
            <li>Admin lưu trữ và xuất báo cáo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
