'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type E = {
  id: string; fullName: string; gender: string;
  birthYear: number | null; position: string | null;
  department: string; employmentType: string | null;
  photoUrl: string | null;
};

export default function EmployeesClient({
  employees, departments, currentQ, currentDept,
}: {
  employees: E[];
  departments: { id: string; name: string }[];
  currentQ: string;
  currentDept: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function removeEmployee(id: string, name: string) {
    if (!confirm(`Xóa nhân viên "${name}"? Hành động này không thể khôi phục.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert('Không xóa được: ' + (data.error || 'lỗi') + '\n(Có thể nhân viên này đã có hồ sơ khám — cần xóa hồ sơ trước)');
    }
  }

  // Build query string cho export (giữ filter hiện tại)
  const exportQuery = new URLSearchParams();
  if (currentDept) exportQuery.set('dept', currentDept);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Danh sách nhân viên</h1>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/admin/employees/export-template"
            className="btn-secondary"
            title="Tải file Excel trống để phát cho các khoa điền"
          >
            📥 Template Excel trống
          </a>
          <a
            href={`/api/admin/employees/export?${exportQuery.toString()}`}
            className="btn-secondary"
            title="Xuất danh sách nhân viên hiện có ra Excel"
          >
            📤 Export Excel
          </a>
          <Link href="/records/blank" target="_blank" className="btn-secondary">
            📄 In sổ trắng (Mẫu 03)
          </Link>
          <Link href="/admin/employees/import" className="btn-secondary">
            Import Excel
          </Link>
          <Link href="/admin/employees/new" className="btn-primary">
            + Thêm nhân viên
          </Link>
        </div>
      </div>

      <form className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Tìm theo tên</label>
          <input name="q" defaultValue={currentQ} className="input" placeholder="Ví dụ: Nguyễn Thành Tân" />
        </div>
        <div className="w-64">
          <label className="label">Khoa / Phòng</label>
          <select name="dept" defaultValue={currentDept} className="input">
            <option value="">-- Tất cả --</option>
            {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Lọc</button>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Họ tên</th>
              <th>Giới tính</th>
              <th>Năm sinh</th>
              <th>Chức vụ</th>
              <th>Khoa/Phòng</th>
              <th>Loại HĐ</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td>
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      {e.fullName.split(' ').pop()?.[0] ?? '?'}
                    </div>
                  )}
                </td>
                <td className="font-medium">{e.fullName}</td>
                <td>{e.gender === 'MALE' ? 'Nam' : e.gender === 'FEMALE' ? 'Nữ' : ''}</td>
                <td>{e.birthYear ?? ''}</td>
                <td>{e.position ?? ''}</td>
                <td>{e.department}</td>
                <td><span className="badge bg-slate-100 text-slate-700">{e.employmentType ?? ''}</span></td>
                <td className="text-right space-x-3">
                  <Link href={`/admin/employees/${e.id}`} className="text-brand-600 hover:underline text-sm">
                    Sửa
                  </Link>
                  <button
                    onClick={() => removeEmployee(e.id, e.fullName)}
                    disabled={deleting === e.id}
                    className="text-red-600 hover:underline text-sm disabled:opacity-50"
                  >
                    {deleting === e.id ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">Chưa có nhân viên nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {employees.length >= 300 && (
        <p className="text-xs text-slate-500">Hiển thị 300 kết quả đầu. Dùng bộ lọc để thu hẹp.</p>
      )}
    </div>
  );
}
