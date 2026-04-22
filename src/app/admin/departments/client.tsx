'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type D = { id: string; name: string; code: string | null; count: number };

export default function DepartmentsClient({ initial }: { initial: D[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/admin/departments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
    });
    setLoading(false);
    if (res.ok) { setName(''); setCode(''); router.refresh(); }
  }

  async function remove(id: string) {
    if (!confirm('Xóa khoa/phòng này? (chỉ xóa được khi không còn nhân viên nào)')) return;
    const res = await fetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert((await res.json()).error || 'Không xóa được');
  }

  return (
    <>
      <form onSubmit={add} className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Tên khoa/phòng</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div className="w-40">
          <label className="label">Mã</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="input" />
        </div>
        <button className="btn-primary" disabled={loading}>Thêm</button>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>#</th><th>Tên</th><th>Mã</th><th>Số NV</th><th></th></tr></thead>
          <tbody>
            {initial.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td className="font-medium">{d.name}</td>
                <td>{d.code || ''}</td>
                <td>{d.count}</td>
                <td>
                  <button onClick={() => remove(d.id)} className="text-red-600 hover:underline text-sm">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
