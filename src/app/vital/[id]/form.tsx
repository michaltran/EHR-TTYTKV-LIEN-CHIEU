'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignaturePad from '@/components/SignaturePad';
import { calcBmi } from '@/lib/constants';

type Props = {
  recordId: string;
  initial: {
    height: number | null;
    weight: number | null;
    bmi: number | null;
    pulse: number | null;
    bpSys: number | null;
    bpDia: number | null;
    physicalClassification: string | null;
    signed: boolean;
    vitalStaffName: string | null;
    vitalSignedAt: string | null;
  };
  userName: string;
  userTitle: string;
  savedSignature: string | null;
};

export default function VitalForm({ recordId, initial, userName, userTitle, savedSignature }: Props) {
  const router = useRouter();
  const [v, setV] = useState({
    height: initial.height ?? '',
    weight: initial.weight ?? '',
    pulse: initial.pulse ?? '',
    bpSys: initial.bpSys ?? '',
    bpDia: initial.bpDia ?? '',
    physicalClassification: initial.physicalClassification ?? '',
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const bmi = calcBmi(Number(v.height) || null, Number(v.weight) || null);

  async function save(withSignature: boolean) {
    if (withSignature && !signature) {
      setMsg('❌ Ký trước khi xác nhận hoàn tất');
      return;
    }
    setLoading(true); setMsg('');
    const res = await fetch('/api/vital', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId,
        ...v,
        bmi,
        signatureDataUrl: withSignature ? signature : null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg(withSignature ? '✅ Đã ký và chuyển sang bác sĩ khám' : '💾 Đã lưu tạm');
      if (withSignature) setTimeout(() => router.push('/vital'), 1200);
      else router.refresh();
    } else {
      const data = await res.json();
      setMsg('❌ ' + (data.error || 'Lỗi'));
    }
  }

  if (initial.signed) {
    return (
      <div className="card bg-green-50 border-green-200">
        <h2 className="font-semibold text-green-800">✓ Đã hoàn tất đo thể lực</h2>
        <div className="grid grid-cols-3 gap-3 text-sm mt-2">
          <div>Cao: <strong>{initial.height} cm</strong></div>
          <div>Nặng: <strong>{initial.weight} kg</strong></div>
          <div>BMI: <strong>{initial.bmi}</strong></div>
          <div>Mạch: <strong>{initial.pulse} l/ph</strong></div>
          <div>HA: <strong>{initial.bpSys}/{initial.bpDia}</strong></div>
          <div className="col-span-3 mt-2">Phân loại: {initial.physicalClassification}</div>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Ký bởi {initial.vitalStaffName} lúc {initial.vitalSignedAt && new Date(initial.vitalSignedAt).toLocaleString('vi-VN')}
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">II. Đo thể lực</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div><label className="label">Cao (cm)</label>
          <input type="number" className="input" value={v.height}
            onChange={(e) => setV({ ...v, height: e.target.value })} /></div>
        <div><label className="label">Nặng (kg)</label>
          <input type="number" step="0.1" className="input" value={v.weight}
            onChange={(e) => setV({ ...v, weight: e.target.value })} /></div>
        <div><label className="label">BMI (tự tính)</label>
          <input className="input bg-slate-50" value={bmi ?? ''} readOnly /></div>
        <div><label className="label">Mạch (l/ph)</label>
          <input type="number" className="input" value={v.pulse}
            onChange={(e) => setV({ ...v, pulse: e.target.value })} /></div>
        <div><label className="label">HA tâm thu</label>
          <input type="number" className="input" value={v.bpSys}
            onChange={(e) => setV({ ...v, bpSys: e.target.value })} /></div>
        <div><label className="label">HA tâm trương</label>
          <input type="number" className="input" value={v.bpDia}
            onChange={(e) => setV({ ...v, bpDia: e.target.value })} /></div>
        <div className="col-span-3 md:col-span-6">
          <label className="label">Phân loại thể lực</label>
          <input className="input" placeholder="VD: Loại I, Bình thường..."
            value={v.physicalClassification}
            onChange={(e) => setV({ ...v, physicalClassification: e.target.value })} />
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="label">Chữ ký người đo</label>
        <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
        <p className="text-xs text-slate-500 mt-1">
          Ký tên: <strong>{userName}</strong>{userTitle && ` — ${userTitle}`}
        </p>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="flex gap-2">
        <button onClick={() => save(false)} disabled={loading} className="btn-secondary">
          💾 Lưu tạm (không ký)
        </button>
        <button onClick={() => save(true)} disabled={loading || !signature} className="btn-primary">
          {loading ? 'Đang lưu...' : '✓ Ký & hoàn tất'}
        </button>
      </div>
    </div>
  );
}
