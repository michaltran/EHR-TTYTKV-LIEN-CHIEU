'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  employee?: any;
  departments: { id: string; name: string }[];
};

type PreviousJob = { moTa: string; thoiGian: string; tuNgay: string; denNgay: string };
type PersonalIllness = { tenBenh: string; namPhatHien: string; tenBenhNgheNghiep: string; namPhatHienNN: string };

export default function EmployeeForm({ employee, departments }: Props) {
  const router = useRouter();
  const isEdit = !!employee?.id;

  const [form, setForm] = useState({
    fullName: employee?.fullName ?? '',
    gender: employee?.gender ?? 'MALE',
    dateOfBirth: employee?.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().slice(0, 10) : '',
    idNumber: employee?.idNumber ?? '',
    idIssuedDate: employee?.idIssuedDate ? new Date(employee.idIssuedDate).toISOString().slice(0, 10) : '',
    idIssuedPlace: employee?.idIssuedPlace ?? '',
    phone: employee?.phone ?? '',
    currentAddress: employee?.currentAddress ?? '',
    occupation: employee?.occupation ?? 'Viên chức y tế',
    workplace: employee?.workplace ?? 'Trung tâm Y tế khu vực Liên Chiểu',
    startWorkingDate: employee?.startWorkingDate ? new Date(employee.startWorkingDate).toISOString().slice(0, 10) : '',
    position: employee?.position ?? '',
    departmentId: employee?.departmentId ?? departments[0]?.id ?? '',
    employmentType: employee?.employmentType ?? '',
    qualification: employee?.qualification ?? '',
    jobTitle: employee?.jobTitle ?? '',
    photoUrl: employee?.photoUrl ?? '',
    signatureUrl: employee?.signatureUrl ?? '',
    familyHistory: employee?.familyHistory ?? '',
  });

  // Mảng previousJobs và personalHistory parse từ JSON
  const initialJobs: PreviousJob[] = (() => {
    try {
      const j = employee?.previousJobs ? JSON.parse(employee.previousJobs) : [];
      return Array.isArray(j) && j.length > 0 ? j : [{ moTa: '', thoiGian: '', tuNgay: '', denNgay: '' }];
    } catch { return [{ moTa: '', thoiGian: '', tuNgay: '', denNgay: '' }]; }
  })();
  const [jobs, setJobs] = useState<PreviousJob[]>(initialJobs);

  const initialIllness: PersonalIllness[] = (() => {
    try {
      const j = employee?.personalHistory ? JSON.parse(employee.personalHistory) : [];
      if (Array.isArray(j) && j.length > 0) return j;
    } catch {}
    return Array.from({ length: 4 }, () => ({ tenBenh: '', namPhatHien: '', tenBenhNgheNghiep: '', namPhatHienNN: '' }));
  })();
  const [illnesses, setIllnesses] = useState<PersonalIllness[]>(initialIllness);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErr('Ảnh quá lớn, cần dưới 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function addJob() {
    if (jobs.length >= 5) return;
    setJobs([...jobs, { moTa: '', thoiGian: '', tuNgay: '', denNgay: '' }]);
  }
  function removeJob(i: number) {
    setJobs(jobs.filter((_, idx) => idx !== i));
  }
  function updateJob(i: number, field: keyof PreviousJob, val: string) {
    setJobs(jobs.map((j, idx) => idx === i ? { ...j, [field]: val } : j));
  }

  function updateIllness(i: number, field: keyof PersonalIllness, val: string) {
    setIllnesses(illnesses.map((j, idx) => idx === i ? { ...j, [field]: val } : j));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      // Lọc bỏ hàng rỗng hoàn toàn trước khi lưu
      const cleanJobs = jobs.filter(j => j.moTa.trim() || j.thoiGian.trim() || j.tuNgay.trim() || j.denNgay.trim());
      const cleanIllness = illnesses.filter(i => i.tenBenh.trim() || i.namPhatHien.trim() || i.tenBenhNgheNghiep.trim() || i.namPhatHienNN.trim());

      const payload = {
        ...form,
        previousJobs: cleanJobs.length > 0 ? JSON.stringify(cleanJobs) : null,
        personalHistory: cleanIllness.length > 0 ? JSON.stringify(cleanIllness) : null,
      };

      const url = isEdit ? `/api/admin/employees/${employee.id}` : '/api/admin/employees';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      router.push('/admin/employees');
      router.refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  const u = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-4 gap-5">
        <div className="md:col-span-1 space-y-3">
          <div className="card text-center">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="" className="h-40 w-32 mx-auto object-cover rounded border" />
            ) : (
              <div className="h-40 w-32 mx-auto bg-slate-100 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">
                Ảnh 4x6 cm
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="mt-3 text-xs w-full" />
          </div>

          <div className="card text-center">
            <div className="text-xs font-medium text-slate-700 mb-2">Chữ ký mẫu NLĐ</div>
            {form.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.signatureUrl} alt="" className="h-16 mx-auto object-contain" />
            ) : (
              <div className="h-16 bg-slate-50 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">
                (tùy chọn)
              </div>
            )}
            <input
              type="file" accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 1 * 1024 * 1024) { setErr('Ảnh chữ ký < 1MB'); return; }
                const reader = new FileReader();
                reader.onload = () => setForm((p) => ({ ...p, signatureUrl: reader.result as string }));
                reader.readAsDataURL(f);
              }}
              className="mt-2 text-xs w-full"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Chữ ký này sẽ tự điền vào hồ sơ KSK mỗi đợt
            </p>
          </div>
        </div>

        <div className="md:col-span-3 card space-y-3">
          <h2 className="font-semibold text-slate-700 border-b pb-2">Thông tin hành chính</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">1. Họ và tên (in hoa)</label>
              <input required value={form.fullName} onChange={u('fullName')} className="input uppercase" />
            </div>
            <div>
              <label className="label">2. Giới tính</label>
              <select value={form.gender} onChange={u('gender')} className="input">
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="label">3. Ngày sinh</label>
              <input type="date" value={form.dateOfBirth} onChange={u('dateOfBirth')} className="input" />
            </div>
            <div>
              <label className="label">4. Số CCCD / Định danh</label>
              <input value={form.idNumber} onChange={u('idNumber')} className="input" />
            </div>
            <div>
              <label className="label">5. Ngày cấp</label>
              <input type="date" value={form.idIssuedDate} onChange={u('idIssuedDate')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Cấp tại</label>
              <input value={form.idIssuedPlace} onChange={u('idIssuedPlace')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">6. Chỗ ở hiện tại</label>
              <input value={form.currentAddress} onChange={u('currentAddress')} className="input" />
            </div>
            <div>
              <label className="label">SĐT liên hệ</label>
              <input value={form.phone} onChange={u('phone')} className="input" />
            </div>
            <div>
              <label className="label">7. Nghề nghiệp</label>
              <input value={form.occupation} onChange={u('occupation')} className="input" />
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-700 border-b pb-2">Thông tin công tác</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">8. Nơi công tác</label>
            <input value={form.workplace} onChange={u('workplace')} className="input" />
          </div>
          <div>
            <label className="label">Khoa / Phòng</label>
            <select value={form.departmentId} onChange={u('departmentId')} className="input" required>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Chức vụ</label>
            <input value={form.position} onChange={u('position')} className="input" />
          </div>
          <div>
            <label className="label">9. Ngày bắt đầu làm việc</label>
            <input type="date" value={form.startWorkingDate} onChange={u('startWorkingDate')} className="input" />
          </div>
          <div>
            <label className="label">Loại hợp đồng</label>
            <select value={form.employmentType} onChange={u('employmentType')} className="input">
              <option value="">-- Chọn --</option>
              <option>Viên chức</option>
              <option>HĐ 68</option>
              <option>Trong chỉ tiêu</option>
              <option>HĐ thỏa thuận</option>
              <option>Khác</option>
            </select>
          </div>
          <div>
            <label className="label">Trình độ chuyên môn</label>
            <input value={form.qualification} onChange={u('qualification')} className="input" />
          </div>
          <div>
            <label className="label">Chức danh nghề nghiệp</label>
            <input value={form.jobTitle} onChange={u('jobTitle')} className="input" />
          </div>
        </div>
      </div>

      {/* 10. Nghề, công việc trước đây */}
      <div className="card space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="font-semibold text-slate-700">10. Nghề, công việc trước đây (10 năm gần đây)</h2>
          <button type="button" onClick={addJob} disabled={jobs.length >= 5} className="btn-secondary text-xs">
            + Thêm dòng
          </button>
        </div>
        {jobs.map((j, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <label className="label text-xs">{String.fromCharCode(97 + i)}) Mô tả công việc</label>
              <input className="input" value={j.moTa} onChange={(e) => updateJob(i, 'moTa', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Thời gian</label>
              <input className="input" placeholder="VD: 3 năm" value={j.thoiGian} onChange={(e) => updateJob(i, 'thoiGian', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Từ ngày</label>
              <input className="input" placeholder="dd/mm/yyyy" value={j.tuNgay} onChange={(e) => updateJob(i, 'tuNgay', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Đến ngày</label>
              <input className="input" placeholder="dd/mm/yyyy" value={j.denNgay} onChange={(e) => updateJob(i, 'denNgay', e.target.value)} />
            </div>
            <div className="col-span-1">
              {jobs.length > 1 && (
                <button type="button" onClick={() => removeJob(i)} className="text-red-600 text-xs hover:underline">Xóa</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 11. Tiền sử gia đình */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 border-b pb-2 mb-3">11. Tiền sử bệnh, tật của gia đình</h2>
        <textarea rows={3} value={form.familyHistory} onChange={u('familyHistory')} className="input"
          placeholder="VD: Mẹ: Đái tháo đường type 2; Bố: Tăng huyết áp..." />
      </div>

      {/* 12. Tiền sử bản thân - bảng 4 dòng */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 border-b pb-2 mb-3">12. Tiền sử bệnh, tật của bản thân</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border p-1 w-8"></th>
              <th className="border p-1 text-left">Tên bệnh</th>
              <th className="border p-1 text-left w-28">Phát hiện năm</th>
              <th className="border p-1 text-left">Tên bệnh nghề nghiệp</th>
              <th className="border p-1 text-left w-28">Phát hiện năm</th>
            </tr>
          </thead>
          <tbody>
            {illnesses.map((il, i) => (
              <tr key={i}>
                <td className="border p-1 text-center text-xs text-slate-500">{String.fromCharCode(97 + i)})</td>
                <td className="border p-0"><input className="input border-0" value={il.tenBenh} onChange={(e) => updateIllness(i, 'tenBenh', e.target.value)} /></td>
                <td className="border p-0"><input className="input border-0" value={il.namPhatHien} onChange={(e) => updateIllness(i, 'namPhatHien', e.target.value)} /></td>
                <td className="border p-0"><input className="input border-0" value={il.tenBenhNgheNghiep} onChange={(e) => updateIllness(i, 'tenBenhNgheNghiep', e.target.value)} /></td>
                <td className="border p-0"><input className="input border-0" value={il.namPhatHienNN} onChange={(e) => updateIllness(i, 'namPhatHienNN', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}
