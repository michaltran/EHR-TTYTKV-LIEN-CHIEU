'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import SmartCASignButton from '@/components/SmartCASignButton';
import { SPECIALTY_LABELS, CLASSIFICATION_LABELS } from '@/lib/constants';

type Props = {
  record: {
    id: string;
    employee: { fullName: string; gender: string; dateOfBirth: string | null; department: string; position: string | null; photoUrl: string | null };
    roundName: string; status: string;
    height: number | null; weight: number | null; bmi: number | null;
    pulse: number | null; bpSys: number | null; bpDia: number | null;
    physicalClassification: string | null;
    clinicalExams: { specialty: string; findings: string | null; classification: string | null; doctorName: string | null; doctorTitle: string | null; signedAt: string | null }[];
    finalClassification: string | null;
    conclusionText: string | null;
  };
  savedSignature: string | null;
  caEnabled?: boolean;
};

export default function ConcluderForm({ record, savedSignature, caEnabled }: Props) {
  const router = useRouter();
  const [classification, setClassification] = useState(record.finalClassification ?? '');
  const [text, setText] = useState(record.conclusionText ?? '');
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function sign() {
    if (!classification) { setMsg('❌ Chọn phân loại sức khỏe'); return; }
    if (!signature) { setMsg('❌ Vui lòng ký'); return; }
    setLoading(true); setMsg('');
    const res = await fetch(`/api/conclude/${record.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classification, conclusionText: text, signatureDataUrl: signature }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg('✅ Đã ký kết luận');
      setTimeout(() => router.push('/conclude'), 1000);
    } else setMsg('❌ ' + (data.error || 'Lỗi'));
  }

  const done = record.status === 'COMPLETED';

  return (
    <div className="space-y-4">
      <Link href="/conclude" className="text-sm text-slate-500 hover:underline">← Hàng đợi</Link>

      <div className="card flex gap-4">
        {record.employee.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={record.employee.photoUrl} alt="" className="w-24 h-28 object-cover rounded border" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
          <p className="text-sm text-slate-600">
            {record.employee.department} •{' '}
            {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'} •{' '}
            {record.employee.dateOfBirth && `Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">{record.roundName}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">II. Thể lực</h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div><span className="text-slate-500">Chiều cao:</span> {record.height ?? '—'} cm</div>
          <div><span className="text-slate-500">Cân nặng:</span> {record.weight ?? '—'} kg</div>
          <div><span className="text-slate-500">BMI:</span> {record.bmi ?? '—'}</div>
          <div><span className="text-slate-500">Mạch:</span> {record.pulse ?? '—'} l/ph</div>
          <div><span className="text-slate-500">HA:</span> {record.bpSys ?? '—'}/{record.bpDia ?? '—'} mmHg</div>
          <div className="col-span-3"><span className="text-slate-500">Phân loại:</span> {record.physicalClassification ?? '—'}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">III. Khám lâm sàng</h2>
        <div className="space-y-2">
          {record.clinicalExams.length === 0 && <p className="text-sm text-slate-500">Chưa có khám chuyên khoa</p>}
          {record.clinicalExams.map((e) => (
            <div key={e.specialty} className="border-b border-slate-100 pb-2">
              <div className="font-medium text-sm">
                {SPECIALTY_LABELS[e.specialty as keyof typeof SPECIALTY_LABELS] || e.specialty}
                {e.classification && <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">{e.classification}</span>}
              </div>
              <div className="text-sm text-slate-700 mt-1">{e.findings || '—'}</div>
              {e.signedAt && (
                <div className="text-xs text-slate-500 mt-1">
                  Ký: {e.doctorName}{e.doctorTitle && ` (${e.doctorTitle})`} • {new Date(e.signedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {done ? (
        <div className="card bg-green-50 border-green-200">
          <h2 className="font-semibold text-green-800">Hồ sơ đã được ký kết luận</h2>
          <p className="text-sm mt-1">Phân loại: <strong>{record.finalClassification}</strong></p>
          <p className="text-sm">Kết luận: {record.conclusionText || '—'}</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-semibold mb-3">V. Kết luận</h2>
          <div className="space-y-3">
            <div>
              <label className="label">1. Phân loại sức khỏe</label>
              <select className="input" value={classification} onChange={(e) => setClassification(e.target.value)}>
                <option value="">-- Chọn phân loại --</option>
                {Object.entries(CLASSIFICATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">2. Các bệnh, tật (nếu có) & hướng điều trị</label>
              <textarea rows={4} className="input" value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Ghi rõ các bệnh, tật, phương án điều trị, phục hồi chức năng..." />
            </div>
            <div>
              <label className="label">Chữ ký bác sĩ kết luận</label>

              {caEnabled ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      🔐 Ký số VNPT SmartCA (có giá trị pháp lý)
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!classification) { setMsg('❌ Chọn phân loại trước'); return; }
                        const res = await fetch(`/api/conclude/${record.id}/text`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ classification, conclusionText: text }),
                        });
                        if (res.ok) setMsg('✅ Đã lưu phân loại & nội dung kết luận — giờ bấm nút ký');
                        else setMsg('❌ Lỗi lưu');
                      }}
                      className="btn-secondary text-xs mb-2"
                    >
                      💾 Lưu nội dung kết luận (trước khi ký)
                    </button>
                    <SmartCASignButton
                      targetType="CONCLUSION"
                      targetId={record.id}
                      payload={`${record.id}|${classification}|${text}|${new Date().toISOString()}`}
                      description={`Ký kết luận KSK - ${record.employee.fullName}`}
                      disabled={!classification}
                      onSuccess={() => {
                        setMsg('✅ Đã ký kết luận');
                        setTimeout(() => router.push('/conclude'), 1500);
                      }}
                      label="Ký kết luận bằng VNPT SmartCA"
                    />
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-500">Hoặc ký offline</summary>
                    <div className="mt-2 pl-3 border-l-2 border-slate-200">
                      <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
                      <button onClick={sign} disabled={loading || !signature} className="btn-primary mt-2">
                        {loading ? 'Đang ký...' : 'Ký offline & hoàn tất'}
                      </button>
                    </div>
                  </details>
                </div>
              ) : (
                <>
                  <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
                  <p className="text-xs text-amber-700 mt-1">
                    💡 Kích hoạt <a href="/conclude/profile" className="underline">ký số VNPT SmartCA</a> để ký có giá trị pháp lý
                  </p>
                </>
              )}
            </div>
            {msg && <div className="text-sm">{msg}</div>}
            {!caEnabled && (
              <button onClick={sign} disabled={loading} className="btn-primary">
                {loading ? 'Đang ký...' : 'Ký kết luận & hoàn tất hồ sơ'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
