'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_SPECIALTIES, SPECIALTY_LABELS, ROLE_LABELS } from '@/lib/constants';

type U = { id: string; email: string; fullName: string; role: string; specialties: string | null; department: string | null; isActive: boolean };

export default function UsersClient({ users, departments }: { users: U[]; departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', role: 'DOCTOR',
    departmentId: '', specialties: [] as string[], jobTitle: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ email: '', password: '', fullName: '', role: 'DOCTOR', departmentId: '', specialties: [], jobTitle: '' });
      router.refresh();
    } else setErr((await res.json()).error || 'Lỗi');
  }

  async function resetPass(id: string) {
    const p = prompt('Mật khẩu mới:');
    if (!p) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: p }),
    });
    if (res.ok) alert('Đã đổi mật khẩu'); else alert('Lỗi');
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Đóng' : 'Thêm tài khoản'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label>
              <input required type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })} />
            </div>
            <div><label className="label">Mật khẩu</label>
              <input required type="text" className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div><label className="label">Họ tên</label>
              <input required className="input" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div><label className="label">Vai trò</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Quản trị viên</option>
                <option value="DOCTOR">Bác sĩ khám</option>
                <option value="CONCLUDER">Bác sĩ kết luận</option>
                <option value="VITAL_STAFF">KTV/Điều dưỡng Đo thể lực</option>
                <option value="KTV_XETNGHIEM">KTV Xét nghiệm (Công thức máu, Sinh hoá, Miễn dịch)</option>
                <option value="KTV_CHANDOANHINHANH">KTV Chẩn đoán hình ảnh (Điện tim, X-quang, Siêu âm)</option>
                <option value="DEPT_REP">Đại diện khoa</option>
                <option value="EMPLOYEE">Nhân viên</option>
              </select>
            </div>
            {(form.role === 'DOCTOR' || form.role === 'CONCLUDER') && (
              <div className="col-span-2"><label className="label">Chức danh (hiển thị khi ký)</label>
                <input className="input" value={form.jobTitle}
                  placeholder="VD: BS CKI Nội khoa, Giám đốc TTYT..."
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
            )}
            {(form.role === 'DEPT_REP' || form.role === 'EMPLOYEE') && (
              <div className="col-span-2"><label className="label">Khoa / Phòng</label>
                <select className="input" value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">--</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {form.role === 'DOCTOR' && (
              <div className="col-span-2">
                <label className="label">Chuyên khoa khám được (chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded max-h-48 overflow-auto">
                  {ALL_SPECIALTIES.map((s) => (
                    <label key={s} className="text-sm flex items-center gap-2">
                      <input type="checkbox" checked={form.specialties.includes(s)}
                        onChange={(e) => setForm({
                          ...form,
                          specialties: e.target.checked
                            ? [...form.specialties, s]
                            : form.specialties.filter((x) => x !== s),
                        })} />
                      {SPECIALTY_LABELS[s]}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Tạo tài khoản'}</button>
        </form>
      )}

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Khoa / Chuyên khoa</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-mono text-xs">{u.email}</td>
                <td className="font-medium">{u.fullName}</td>
                <td><span className="badge bg-slate-100 text-slate-700">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}</span></td>
                <td className="text-xs">
                  {u.department && <div>{u.department}</div>}
                  {u.specialties && (
                    <div className="text-slate-500">
                      {JSON.parse(u.specialties).map((s: string) => SPECIALTY_LABELS[s as keyof typeof SPECIALTY_LABELS] || s).join(', ')}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Hoạt động' : 'Khóa'}
                  </span>
                </td>
                <td className="space-x-2 text-sm">
                  <button onClick={() => resetPass(u.id)} className="text-brand-600 hover:underline">Đổi MK</button>
                  <button onClick={() => toggle(u.id, u.isActive)} className="text-slate-600 hover:underline">
                    {u.isActive ? 'Khóa' : 'Mở'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
