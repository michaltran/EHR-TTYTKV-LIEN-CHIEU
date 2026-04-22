'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type R = { id: string; name: string; year: number; startDate: string; endDate: string | null; status: string; count: number };

export default function RoundsClient({ rounds }: { rounds: R[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const y = new Date().getFullYear();
  const [form, setForm] = useState({
    name: `Khám sức khỏe định kỳ ${y}`,
    year: y,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/rounds', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { setShow(false); router.refresh(); }
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShow(!show)} className="btn-primary">{show ? 'Đóng' : 'Tạo đợt mới'}</button>
      </div>

      {show && (
        <form onSubmit={submit} className="card grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Tên đợt</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div><label className="label">Năm</label>
            <input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} />
          </div>
          <div></div>
          <div><label className="label">Ngày bắt đầu</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </div>
          <div><label className="label">Ngày kết thúc (tùy chọn)</label>
            <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <button className="btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo'}</button>
          </div>
        </form>
      )}

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>Tên đợt</th><th>Năm</th><th>Từ</th><th>Đến</th><th>Trạng thái</th><th>Hồ sơ</th><th></th></tr></thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td>{r.year}</td>
                <td>{new Date(r.startDate).toLocaleDateString('vi-VN')}</td>
                <td>{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : ''}</td>
                <td><span className="badge bg-slate-100">{r.status}</span></td>
                <td>{r.count}</td>
                <td><Link href={`/admin/rounds/${r.id}`} className="text-brand-600 hover:underline text-sm">Quản lý →</Link></td>
              </tr>
            ))}
            {rounds.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-500">Chưa có đợt nào</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
