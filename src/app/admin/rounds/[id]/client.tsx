'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  round: {
    id: string; name: string; status: string;
    startDate: string; endDate: string | null;
    recordCount: number; totalEmployees: number;
    byStatus: Record<string, number>;
  };
};

export default function RoundDetailClient({ round }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function action(path: string, body?: any) {
    setLoading(path); setMsg('');
    const res = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setLoading(null);
    if (res.ok) {
      setMsg(data.message || '✅ Thành công');
      router.refresh();
    } else setMsg('❌ ' + (data.error || 'Lỗi'));
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/rounds" className="text-sm text-slate-500 hover:underline">← Danh sách đợt</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">{round.name}</h1>
        <p className="text-sm text-slate-600">
          Từ {new Date(round.startDate).toLocaleDateString('vi-VN')}
          {round.endDate && ` → ${new Date(round.endDate).toLocaleDateString('vi-VN')}`}
          {' '}• Trạng thái: <span className="font-medium">{round.status}</span>
        </p>
      </div>

      {msg && <div className="card bg-blue-50 border-blue-200 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-600">Nhân viên đã tạo hồ sơ</div>
          <div className="text-3xl font-bold text-brand-600 mt-1">{round.recordCount} / {round.totalEmployees}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Đã hoàn tất</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{round.byStatus.COMPLETED || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Đang xử lý</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">
            {(round.byStatus.IN_PROGRESS || 0) + (round.byStatus.WAITING_REVIEW || 0) + (round.byStatus.WAITING_CONCLUSION || 0)}
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Thao tác quy trình</h2>

        <div>
          <button
            onClick={() => action(`/api/admin/rounds/${round.id}/generate`)}
            className="btn-primary"
            disabled={!!loading}
          >
            {loading ? '...' : '1. Tạo hồ sơ cho tất cả nhân viên'}
          </button>
          <p className="text-xs text-slate-500 mt-1">
            Tạo 1 hồ sơ trắng cho mỗi nhân viên trong tất cả khoa/phòng (status = PENDING).
          </p>
        </div>

        <div>
          <button
            onClick={() => action(`/api/admin/rounds/${round.id}/open`)}
            className="btn-secondary"
            disabled={!!loading || round.status !== 'DRAFT'}
          >
            2. Mở đợt khám
          </button>
          <p className="text-xs text-slate-500 mt-1">
            Chuyển trạng thái sang OPEN. Bác sĩ và đại diện khoa bắt đầu thấy được hồ sơ.
          </p>
        </div>

        <div>
          <button
            onClick={() => action(`/api/admin/rounds/${round.id}/notify`)}
            className="btn-secondary"
            disabled={!!loading}
          >
            3. Gửi thông báo đến đại diện khoa
          </button>
          <p className="text-xs text-slate-500 mt-1">
            Ghi audit log + (khi có SMTP) gửi email đến đại diện mỗi khoa.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              if (confirm('Đóng đợt khám? Sau khi đóng sẽ không thay đổi được hồ sơ.')) {
                action(`/api/admin/rounds/${round.id}/close`);
              }
            }}
            className="btn-danger"
            disabled={!!loading || round.status !== 'OPEN'}
          >
            4. Đóng đợt
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Quản lý hồ sơ</h2>
        <Link href={`/admin/records?round=${round.id}`} className="btn-secondary">Xem danh sách hồ sơ →</Link>
      </div>
    </div>
  );
}
