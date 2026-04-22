import { prisma } from '@/lib/prisma';
import SetupClient from './client';

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  const empCount = await prisma.employee.count();
  const deptCount = await prisma.department.count();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Khởi tạo hệ thống</h1>
        <p className="text-sm text-slate-600 mb-6">
          Trang này chỉ dùng 1 lần duy nhất để tạo tài khoản admin và các tài khoản bác sĩ mẫu.
          Sau khi khởi tạo xong, bạn nên xóa file <code>src/app/setup/page.tsx</code> hoặc chặn truy cập.
        </p>

        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
          <h2 className="font-semibold mb-3">Trạng thái hiện tại</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-slate-500">Tài khoản</div>
              <div className="text-2xl font-bold">{userCount}</div>
            </div>
            <div>
              <div className="text-slate-500">Khoa/Phòng</div>
              <div className="text-2xl font-bold">{deptCount}</div>
            </div>
            <div>
              <div className="text-slate-500">Nhân viên</div>
              <div className="text-2xl font-bold">{empCount}</div>
            </div>
          </div>
        </div>

        <SetupClient userCount={userCount} />
      </div>
    </div>
  );
}
