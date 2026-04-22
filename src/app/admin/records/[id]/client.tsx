'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SPECIALTY_LABELS, STATUS_LABELS } from '@/lib/constants';
import SignaturePad from '@/components/SignaturePad';

type Props = {
  record: any;
};

export default function AdminRecordClient({ record }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // State cho ký NLĐ
  const [empSig, setEmpSig] = useState<string | null>(record.employeeSignatureDataUrl ?? null);
  // State cho người lập sổ
  const [makerSig, setMakerSig] = useState<string | null>(record.bookMakerSignatureDataUrl ?? null);
  const [makerName, setMakerName] = useState(record.bookMakerName ?? '');
  const [makerTitle, setMakerTitle] = useState(record.bookMakerTitle ?? '');

  async function approve() {
    if (!confirm('Duyệt hồ sơ và chuyển cho Bác sĩ kết luận ký?')) return;
    setLoading(true); setMsg('');
    const res = await fetch(`/api/admin/records/${record.id}/approve`, { method: 'POST' });
    setLoading(false);
    if (res.ok) { setMsg('✅ Đã duyệt'); router.refresh(); }
    else setMsg('❌ ' + ((await res.json()).error || 'Lỗi'));
  }

  async function sendBack() {
    if (!confirm('Trả lại hồ sơ cho đại diện khoa để bổ sung?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/records/${record.id}/sendback`, { method: 'POST' });
    setLoading(false);
    if (res.ok) { setMsg('✅ Đã trả lại'); router.refresh(); }
    else setMsg('❌ Lỗi');
  }

  async function saveEmpSig() {
    setLoading(true); setMsg('');
    const res = await fetch(`/api/admin/records/${record.id}/employee-sign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureDataUrl: empSig }),
    });
    setLoading(false);
    if (res.ok) { setMsg('✅ Đã lưu chữ ký NLĐ'); router.refresh(); }
    else setMsg('❌ Lỗi');
  }

  async function saveMakerSig() {
    if (!makerName.trim()) { setMsg('❌ Nhập tên người lập sổ'); return; }
    setLoading(true); setMsg('');
    const res = await fetch(`/api/admin/records/${record.id}/maker-sign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureDataUrl: makerSig,
        name: makerName.trim(),
        title: makerTitle.trim() || null,
      }),
    });
    setLoading(false);
    if (res.ok) { setMsg('✅ Đã lưu chữ ký người lập sổ'); router.refresh(); }
    else setMsg('❌ Lỗi');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <Link href="/admin/records" className="text-sm text-slate-500 hover:underline">← Danh sách</Link>
        <div className="flex gap-2">
          <Link href={`/records/${record.id}/print`} target="_blank" className="btn-secondary">
            🖨 In / Xuất PDF (Mẫu số 03)
          </Link>
          {record.status === 'WAITING_REVIEW' && (
            <>
              <button onClick={sendBack} className="btn-secondary" disabled={loading}>Trả lại khoa</button>
              <button onClick={approve} className="btn-primary" disabled={loading}>
                Duyệt & chuyển BS kết luận →
              </button>
            </>
          )}
        </div>
      </div>

      {msg && <div className="card bg-blue-50 text-sm">{msg}</div>}

      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
            <p className="text-sm text-slate-600">
              {record.employee.department} • {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'} •{' '}
              {record.employee.dateOfBirth && `Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">Đợt: {record.roundName}</p>
          </div>
          <div>
            <span className="badge bg-slate-100">{STATUS_LABELS[record.status as keyof typeof STATUS_LABELS]}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">II. Thể lực</h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div>Cao: <strong>{record.height ?? '—'} cm</strong></div>
          <div>Nặng: <strong>{record.weight ?? '—'} kg</strong></div>
          <div>BMI: <strong>{record.bmi ?? '—'}</strong></div>
          <div>Mạch: <strong>{record.pulse ?? '—'} l/ph</strong></div>
          <div>HA: <strong>{record.bpSys ?? '—'}/{record.bpDia ?? '—'}</strong></div>
          <div className="col-span-3">Phân loại thể lực: {record.physicalClassification ?? '—'}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">III. Khám lâm sàng ({record.signedCount} / {record.totalExams} đã ký)</h2>
        <div className="space-y-2">
          {record.clinicalExams.map((e: any) => (
            <div key={e.specialty} className="border-b border-slate-100 pb-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {SPECIALTY_LABELS[e.specialty as keyof typeof SPECIALTY_LABELS] || e.specialty}
                  {e.classification && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">{e.classification}</span>}
                </span>
                {e.signedAt ? (
                  <span className="text-xs text-green-700">✓ {e.doctorName}</span>
                ) : (
                  <span className="text-xs text-amber-600">Chưa ký</span>
                )}
              </div>
              <div className="text-sm text-slate-600 mt-1">{e.findings || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ký NLĐ + Người lập sổ */}
      <div className="grid md:grid-cols-2 gap-4 no-print">
        <div className="card">
          <h2 className="font-semibold mb-2">Chữ ký người lao động</h2>
          <p className="text-xs text-slate-600 mb-2">
            NLĐ xác nhận thông tin trong hồ sơ là đúng (ký trực tiếp trên màn hình hoặc upload ảnh)
          </p>
          <SignaturePad value={empSig} onChange={setEmpSig} savedSignature={null} />
          <button onClick={saveEmpSig} disabled={loading || !empSig} className="btn-primary mt-3">
            Lưu chữ ký NLĐ
          </button>
          {record.employeeSignedAt && (
            <p className="text-xs text-green-700 mt-2">
              ✓ Đã ký lúc {new Date(record.employeeSignedAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">Người lập sổ KSK định kỳ</h2>
          <div className="space-y-2 mb-2">
            <div>
              <label className="label text-xs">Họ tên</label>
              <input className="input" value={makerName} onChange={(e) => setMakerName(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Chức danh</label>
              <input className="input" value={makerTitle} onChange={(e) => setMakerTitle(e.target.value)}
                placeholder="VD: Điều dưỡng trưởng, Chuyên viên hành chính..." />
            </div>
          </div>
          <SignaturePad value={makerSig} onChange={setMakerSig} savedSignature={null} />
          <button onClick={saveMakerSig} disabled={loading || !makerSig || !makerName} className="btn-primary mt-3">
            Lưu chữ ký người lập sổ
          </button>
          {record.bookMakerSignedAt && (
            <p className="text-xs text-green-700 mt-2">
              ✓ {record.bookMakerName} đã ký lúc {new Date(record.bookMakerSignedAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      {record.finalClassification && (
        <div className="card bg-green-50 border-green-200">
          <h2 className="font-semibold mb-2">V. Kết luận</h2>
          <p className="text-sm">Phân loại: <strong>{record.finalClassification}</strong></p>
          <p className="text-sm mt-1">{record.conclusionText || '—'}</p>
          <p className="text-xs text-slate-500 mt-2">
            Ký bởi {record.concluderName} lúc {record.concluderSignedAt && new Date(record.concluderSignedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      )}
    </div>
  );
}
