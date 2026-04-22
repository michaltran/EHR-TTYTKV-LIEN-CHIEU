'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import SignatureDisplay from '@/components/SignatureDisplay';
import SmartCASignButton from '@/components/SmartCASignButton';
import { SPECIALTY_LABELS, ALL_SPECIALTIES, calcBmi } from '@/lib/constants';
import type { Specialty } from '@prisma/client';

type ExamItem = {
  specialty: Specialty;
  findings: string | null;
  classification: string | null;
  extraData: string | null;
  signedAt: string | null;
  signatureDataUrl: string | null;
  doctorName: string | null;
  doctorTitle: string | null;
};

type Props = {
  record: {
    id: string;
    employee: {
      fullName: string; gender: string; dateOfBirth: string | null;
      department: string; position: string | null; photoUrl: string | null;
    };
    roundName: string;
    height: number | null; weight: number | null; bmi: number | null;
    pulse: number | null; bpSys: number | null; bpDia: number | null;
    physicalClassification: string | null;
    medicalHistoryNote: string | null;
    obstetricHistory: string | null;
    clinicalExams: ExamItem[];
  };
  mySpecialties: Specialty[];
  savedSignature: string | null;
  userTitle: string | null;
  caEnabled?: boolean;
};

// Nhóm các chuyên khoa nội để ký gộp
const NOI_SPECIALTIES: Specialty[] = [
  'NOI_TUAN_HOAN', 'NOI_HO_HAP', 'NOI_TIEU_HOA', 'NOI_THAN_TIET_NIEU',
  'NOI_TIET', 'CO_XUONG_KHOP', 'THAN_KINH', 'TAM_THAN',
];

export default function DoctorExamForm({ record, mySpecialties, savedSignature, userTitle, caEnabled }: Props) {
  const router = useRouter();
  const isFemale = record.employee.gender === 'FEMALE';

  // Lọc các chuyên khoa mà bác sĩ này được phép khám + ẩn Sản phụ khoa nếu nam
  // Yêu cầu 1, 2: Chỉ hiển thị chuyên khoa thuộc mySpecialties (bác sĩ nào phân quyền nấy)
  const allowedSpecialties = mySpecialties.filter((s) => {
    if (s === 'SAN_PHU_KHOA' && !isFemale) return false;
    return true;
  });

  const isSanBacsi = mySpecialties.includes('SAN_PHU_KHOA');

  const [activeSpec, setActiveSpec] = useState<Specialty | null>(
    mySpecialties.find((s) => allowedSpecialties.includes(s)) ?? null
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // ==== Thể lực ====
  const [vitals, setVitals] = useState({
    height: record.height ?? '',
    weight: record.weight ?? '',
    pulse: record.pulse ?? '',
    bpSys: record.bpSys ?? '',
    bpDia: record.bpDia ?? '',
    physicalClassification: record.physicalClassification ?? '',
  });
  const bmi = calcBmi(Number(vitals.height) || null, Number(vitals.weight) || null);

  // ==== Tiền sử + Sản phụ khoa ====
  const [medHistory, setMedHistory] = useState(record.medicalHistoryNote ?? '');
  const [obst, setObst] = useState<any>(() => {
    try { return record.obstetricHistory ? JSON.parse(record.obstetricHistory) : {}; }
    catch { return {}; }
  });

  // ==== Khám chuyên khoa đang active ====
  const existing = record.clinicalExams.find((e) => e.specialty === activeSpec);
  const [exam, setExam] = useState({
    findings: existing?.findings ?? '',
    classification: existing?.classification ?? '',
    extraData: existing?.extraData ? JSON.parse(existing.extraData) : {},
  });
  const [signature, setSignature] = useState<string | null>(existing?.signatureDataUrl ?? null);

  function switchSpec(s: Specialty) {
    const ex = record.clinicalExams.find((e) => e.specialty === s);
    setActiveSpec(s);
    setExam({
      findings: ex?.findings ?? '',
      classification: ex?.classification ?? '',
      extraData: ex?.extraData ? JSON.parse(ex.extraData) : {},
    });
    setSignature(ex?.signatureDataUrl ?? null);
    setMsg('');
  }

  async function saveVitals() {
    setLoading(true); setMsg('');
    const res = await fetch(`/api/doctor/records/${record.id}/vitals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...vitals, bmi, medicalHistoryNote: medHistory, obstetricHistory: JSON.stringify(obst) }),
    });
    setLoading(false);
    setMsg(res.ok ? '✅ Đã lưu thể lực & tiền sử' : '❌ Lỗi');
    if (res.ok) router.refresh();
  }

  async function saveExam() {
    if (!activeSpec) return;
    if (!signature) { setMsg('❌ Vui lòng ký trước khi lưu'); return; }
    setLoading(true); setMsg('');
    const res = await fetch(`/api/doctor/records/${record.id}/exam`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialty: activeSpec,
        findings: exam.findings,
        classification: exam.classification,
        extraData: JSON.stringify(exam.extraData),
        signatureDataUrl: signature,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg('✅ Đã ký ' + SPECIALTY_LABELS[activeSpec]);
      router.refresh();
    } else setMsg('❌ ' + (data.error || 'Lỗi'));
  }

  // Nội khoa: đánh dấu "Bình thường" cho 1 loạt chuyên khoa Nội + ký 1 lần
  async function bulkSignNoiNormal(selected: Specialty[]) {
    if (!signature) { setMsg('❌ Ký vào ô chữ ký ở dưới trước'); return; }
    if (selected.length === 0) { setMsg('❌ Chưa chọn mục nào'); return; }
    setLoading(true); setMsg('');
    let ok = 0, err = 0;
    for (const sp of selected) {
      const res = await fetch(`/api/doctor/records/${record.id}/exam`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty: sp,
          findings: 'Bình thường',
          classification: 'Loại I',
          signatureDataUrl: signature,
        }),
      });
      if (res.ok) ok++; else err++;
    }
    setLoading(false);
    setMsg(`✅ Đã ký ${ok} mục Nội khoa${err ? `, lỗi ${err}` : ''}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Link href="/doctor" className="text-sm text-slate-500 hover:underline">← Hàng đợi</Link>

      <div className="card flex gap-4 items-start">
        {record.employee.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={record.employee.photoUrl} alt="" className="w-24 h-28 object-cover rounded border" />
        ) : (
          <div className="w-24 h-28 bg-slate-100 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">Ảnh 4x6</div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
          <p className="text-sm text-slate-600">
            {record.employee.department} • {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'}
            {record.employee.dateOfBirth && ` • Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`}
            {record.employee.position && ` • ${record.employee.position}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">{record.roundName}</p>
        </div>
      </div>

      {msg && <div className="card bg-blue-50 border-blue-200 text-sm">{msg}</div>}

      {/* I. Tiền sử + II. Thể lực */}
      <div className="card space-y-3">
        <h2 className="font-semibold">I. Tiền sử bệnh, tật</h2>
        <textarea rows={3} className="input" placeholder="(Bác sĩ khám sức khỏe hỏi và ghi chép)"
          value={medHistory} onChange={(e) => setMedHistory(e.target.value)} />

        {/* Yêu cầu 2: Tiền sử sản phụ khoa chỉ BS Sản được nhập */}
        {isFemale && isSanBacsi && (
          <details className="bg-pink-50 rounded p-3">
            <summary className="cursor-pointer text-sm font-medium text-pink-800">Tiền sử sản phụ khoa (đối với nữ - chỉ BS Sản)</summary>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div><label className="label">Bắt đầu kinh nguyệt (tuổi)</label>
                <input type="number" className="input" value={obst.kinhNguyet ?? ''}
                  onChange={(e) => setObst({ ...obst, kinhNguyet: e.target.value })} /></div>
              <div><label className="label">Tính chất kinh nguyệt</label>
                <select className="input" value={obst.tinhChat ?? ''}
                  onChange={(e) => setObst({ ...obst, tinhChat: e.target.value })}>
                  <option value="">-- Chọn --</option><option value="Đều">Đều</option><option value="Không đều">Không đều</option>
                </select></div>
              <div><label className="label">Chu kỳ kinh (ngày)</label>
                <input type="number" className="input" value={obst.chuKy ?? ''}
                  onChange={(e) => setObst({ ...obst, chuKy: e.target.value })} /></div>
              <div><label className="label">Lượng kinh (ngày)</label>
                <input type="number" className="input" value={obst.luongKinh ?? ''}
                  onChange={(e) => setObst({ ...obst, luongKinh: e.target.value })} /></div>
              <div><label className="label">Đau bụng kinh</label>
                <select className="input" value={obst.dauBung ?? ''}
                  onChange={(e) => setObst({ ...obst, dauBung: e.target.value })}>
                  <option value="">-- Chọn --</option><option value="Có">Có</option><option value="Không">Không</option>
                </select></div>
              <div><label className="label">Đã lập gia đình</label>
                <select className="input" value={obst.lapGiaDinh ?? ''}
                  onChange={(e) => setObst({ ...obst, lapGiaDinh: e.target.value })}>
                  <option value="">-- Chọn --</option><option value="Có">Có</option><option value="Chưa">Chưa</option>
                </select></div>
              <div><label className="label">PARA</label>
                <input className="input" placeholder="VD: 2002" value={obst.para ?? ''}
                  onChange={(e) => setObst({ ...obst, para: e.target.value })} /></div>
              <div><label className="label">Số lần mổ sản, phụ khoa</label>
                <input className="input" value={obst.moSan ?? ''}
                  onChange={(e) => setObst({ ...obst, moSan: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">BPTT đang áp dụng</label>
                <input className="input" placeholder="Ghi rõ hoặc 'Không'" value={obst.bptt ?? ''}
                  onChange={(e) => setObst({ ...obst, bptt: e.target.value })} /></div>
            </div>
          </details>
        )}

        {/* Yêu cầu 3: Thể lực do KTV/Điều dưỡng đo riêng - BS chỉ xem */}
        <h2 className="font-semibold mt-4">II. Khám thể lực <span className="text-xs text-slate-500 font-normal">(do KTV/Điều dưỡng đo)</span></h2>
        {record.height || record.weight ? (
          <div className="bg-slate-50 rounded p-3 text-sm">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <div>Cao: <strong>{record.height ?? '—'} cm</strong></div>
              <div>Nặng: <strong>{record.weight ?? '—'} kg</strong></div>
              <div>BMI: <strong>{record.bmi ?? '—'}</strong></div>
              <div>Mạch: <strong>{record.pulse ?? '—'} l/ph</strong></div>
              <div>HA: <strong>{record.bpSys ?? '—'}/{record.bpDia ?? '—'}</strong></div>
              <div className="col-span-3 md:col-span-6">Phân loại: <em>{record.physicalClassification ?? '—'}</em></div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            ⚠️ Chưa có dữ liệu thể lực. KTV/Điều dưỡng cần đo thể lực trước khi bác sĩ khám.
          </div>
        )}
        <button onClick={saveVitals} disabled={loading} className="btn-secondary mt-2">Lưu tiền sử bệnh{isSanBacsi && isFemale && ' + sản phụ khoa'}</button>
      </div>

      {/* III. Khám lâm sàng */}
      <div className="card">
        <h2 className="font-semibold mb-3">III. Khám lâm sàng</h2>

        {/* Nếu bác sĩ phụ trách Nội khoa -> hiển thị quick-action */}
        {mySpecialties.some((s) => NOI_SPECIALTIES.includes(s)) && (
          <NoiKhoaQuickAction
            mySpecialties={mySpecialties}
            signedSpecs={record.clinicalExams.filter(e => e.signedAt).map(e => e.specialty)}
            onBulkSign={bulkSignNoiNormal}
            signature={signature}
            setSignature={setSignature}
            savedSignature={savedSignature}
            loading={loading}
          />
        )}

        <div className="flex gap-2 flex-wrap mb-4 border-b border-slate-200 pb-3">
          {allowedSpecialties.map((s) => {
            const signed = record.clinicalExams.find((e) => e.specialty === s && e.signedAt);
            const canExam = mySpecialties.includes(s);
            return (
              <button
                key={s}
                onClick={() => canExam && switchSpec(s)}
                disabled={!canExam}
                className={`text-xs px-3 py-1.5 rounded transition ${
                  activeSpec === s ? 'bg-brand-600 text-white' :
                  signed ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                  canExam ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' :
                  'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                {SPECIALTY_LABELS[s]} {signed && '✓'}
              </button>
            );
          })}
        </div>

        {activeSpec && (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-700">{SPECIALTY_LABELS[activeSpec]}</h3>

            {/* Form chuyên biệt theo chuyên khoa */}
            {activeSpec === 'MAT' && (
              <MatExtraFields extraData={exam.extraData} setExtra={(d) => setExam({ ...exam, extraData: d })} />
            )}
            {activeSpec === 'TAI_MUI_HONG' && (
              <TMHExtraFields extraData={exam.extraData} setExtra={(d) => setExam({ ...exam, extraData: d })} />
            )}
            {activeSpec === 'RANG_HAM_MAT' && (
              <RHMExtraFields extraData={exam.extraData} setExtra={(d) => setExam({ ...exam, extraData: d })} />
            )}

            <div>
              <label className="label">
                {activeSpec === 'MAT' ? 'Các bệnh về mắt (nếu có)' :
                 activeSpec === 'TAI_MUI_HONG' ? 'Các bệnh về tai mũi họng (nếu có)' :
                 activeSpec === 'RANG_HAM_MAT' ? 'Các bệnh về răng hàm mặt (nếu có)' :
                 'Nội dung khám'}
              </label>
              <textarea rows={3} className="input" value={exam.findings}
                onChange={(e) => setExam({ ...exam, findings: e.target.value })} />
            </div>
            <div>
              <label className="label">Phân loại</label>
              <input className="input" value={exam.classification} placeholder="VD: Loại I, Bình thường..."
                onChange={(e) => setExam({ ...exam, classification: e.target.value })} />
            </div>

            <div>
              <label className="label">Chữ ký bác sĩ</label>

              {caEnabled ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      🔐 Ký số VNPT SmartCA (có giá trị pháp lý)
                    </div>
                    <p className="text-xs text-blue-800 mb-3">
                      Trước khi ký, điền nội dung khám và phân loại ở trên. Hệ thống tự lưu nội dung khi bạn bấm ký.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/doctor/records/${record.id}/exam-text`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            specialty: activeSpec,
                            findings: exam.findings,
                            classification: exam.classification,
                            extraData: JSON.stringify(exam.extraData),
                          }),
                        });
                        setMsg('✅ Đã lưu nội dung — giờ có thể bấm nút ký dưới');
                      }}
                      className="btn-secondary text-xs mb-2"
                    >
                      💾 Lưu nội dung khám (trước khi ký)
                    </button>
                    <SmartCASignButton
                      targetType="CLINICAL_EXAM"
                      targetId={`${record.id}::${activeSpec}`}
                      payload={`${record.id}|${activeSpec}|${exam.findings}|${exam.classification}|${new Date().toISOString()}`}
                      description={`KSK - ${SPECIALTY_LABELS[activeSpec]}`}
                      disabled={!exam.findings && !exam.classification}
                      onSuccess={async () => {
                        router.refresh();
                      }}
                      label={`Ký VNPT SmartCA cho ${SPECIALTY_LABELS[activeSpec]}`}
                    />
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                      Hoặc ký offline (canvas / upload PNG)
                    </summary>
                    <div className="mt-2 pl-3 border-l-2 border-slate-200">
                      <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
                      <button onClick={saveExam} disabled={loading || !signature} className="btn-primary mt-2">
                        {loading ? 'Đang lưu...' : 'Lưu với chữ ký offline'}
                      </button>
                    </div>
                  </details>
                </div>
              ) : (
                <>
                  <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
                  <p className="text-xs text-amber-700 mt-1">
                    💡 Kích hoạt <a href="/doctor/profile" className="underline">ký số VNPT SmartCA</a> để ký có giá trị pháp lý
                  </p>
                  <button onClick={saveExam} disabled={loading || !signature} className="btn-primary mt-3">
                    {loading ? 'Đang lưu...' : 'Lưu & ký khám ' + SPECIALTY_LABELS[activeSpec]}
                  </button>
                </>
              )}

              {userTitle && (
                <p className="text-xs text-slate-500 mt-2">
                  Chức danh hiển thị khi ký: <strong>{userTitle}</strong>
                </p>
              )}
            </div>

            {existing?.signedAt && (
              <div className="text-xs">
                <SignatureDisplay
                  signatureDataUrl={existing.signatureDataUrl}
                  name={existing.doctorName}
                  title={existing.doctorTitle}
                  signedAt={existing.signedAt}
                  compact
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-medium mb-2">Tiến độ khám hồ sơ này</h3>
        {record.clinicalExams.filter((e) => e.signedAt).length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có chuyên khoa nào được ký</p>
        ) : (
          <div className="space-y-1 text-sm">
            {record.clinicalExams.filter((e) => e.signedAt).map((e) => (
              <div key={e.specialty} className="flex justify-between">
                <span>✓ {SPECIALTY_LABELS[e.specialty]}</span>
                <span className="text-xs text-slate-500">
                  {e.doctorName}{e.doctorTitle && ` (${e.doctorTitle})`} •{' '}
                  {e.signedAt && new Date(e.signedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== CHUYÊN BIỆT NỘI KHOA ==========
function NoiKhoaQuickAction({
  mySpecialties, signedSpecs, onBulkSign, signature, setSignature, savedSignature, loading,
}: {
  mySpecialties: Specialty[];
  signedSpecs: Specialty[];
  onBulkSign: (selected: Specialty[]) => void;
  signature: string | null;
  setSignature: (s: string | null) => void;
  savedSignature: string | null;
  loading: boolean;
}) {
  const myNoi = NOI_SPECIALTIES.filter((s) => mySpecialties.includes(s) && !signedSpecs.includes(s));
  const [selected, setSelected] = useState<Specialty[]>(myNoi);

  if (myNoi.length === 0) return null;

  return (
    <details className="bg-blue-50 rounded p-3 mb-4" open>
      <summary className="cursor-pointer text-sm font-medium text-blue-800">
        ⚡ Ký nhanh các mục Nội khoa (đánh dấu "Bình thường" + ký 1 lần cho nhiều mục)
      </summary>
      <div className="mt-3 space-y-2">
        <div className="text-xs text-slate-600">Chọn các mục kết luận "Bình thường":</div>
        <div className="grid grid-cols-2 gap-1">
          {myNoi.map((s) => (
            <label key={s} className="text-sm flex items-center gap-2 bg-white p-2 rounded">
              <input type="checkbox"
                checked={selected.includes(s)}
                onChange={(e) => setSelected(e.target.checked
                  ? [...selected, s]
                  : selected.filter((x) => x !== s))}
              />
              {SPECIALTY_LABELS[s]}
            </label>
          ))}
        </div>
        <div>
          <div className="text-xs font-medium text-slate-700 mb-1">Chữ ký</div>
          <SignaturePad value={signature} onChange={setSignature} savedSignature={savedSignature} />
        </div>
        <button onClick={() => onBulkSign(selected)} disabled={loading || selected.length === 0 || !signature}
          className="btn-primary">
          Ký "Bình thường" cho {selected.length} mục đã chọn
        </button>
      </div>
    </details>
  );
}

// ========== CHUYÊN BIỆT MẮT ==========
function MatExtraFields({ extraData, setExtra }: { extraData: any; setExtra: (d: any) => void }) {
  return (
    <div className="bg-slate-50 p-3 rounded space-y-2">
      <div className="text-sm font-medium">Kết quả khám thị lực</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-600 mb-1">Không kính</div>
          <div className="flex gap-2 items-center">
            <label className="text-xs">Mắt phải:</label>
            <input className="input py-1" placeholder="VD: 10/10"
              value={extraData.khongKinhPhai ?? ''}
              onChange={(e) => setExtra({ ...extraData, khongKinhPhai: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center mt-1">
            <label className="text-xs">Mắt trái:</label>
            <input className="input py-1" placeholder="VD: 10/10"
              value={extraData.khongKinhTrai ?? ''}
              onChange={(e) => setExtra({ ...extraData, khongKinhTrai: e.target.value })} />
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Có kính</div>
          <div className="flex gap-2 items-center">
            <label className="text-xs">Mắt phải:</label>
            <input className="input py-1"
              value={extraData.coKinhPhai ?? ''}
              onChange={(e) => setExtra({ ...extraData, coKinhPhai: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center mt-1">
            <label className="text-xs">Mắt trái:</label>
            <input className="input py-1"
              value={extraData.coKinhTrai ?? ''}
              onChange={(e) => setExtra({ ...extraData, coKinhTrai: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== CHUYÊN BIỆT TMH ==========
function TMHExtraFields({ extraData, setExtra }: { extraData: any; setExtra: (d: any) => void }) {
  return (
    <div className="bg-slate-50 p-3 rounded space-y-2">
      <div className="text-sm font-medium">Kết quả khám thính lực (mét)</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-600 mb-1">Tai trái</div>
          <div className="flex gap-2 items-center">
            <label className="text-xs w-20">Nói thường:</label>
            <input className="input py-1" placeholder="m"
              value={extraData.tranTraiNoiThuong ?? ''}
              onChange={(e) => setExtra({ ...extraData, tranTraiNoiThuong: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center mt-1">
            <label className="text-xs w-20">Nói thầm:</label>
            <input className="input py-1" placeholder="m"
              value={extraData.tranTraiNoiTham ?? ''}
              onChange={(e) => setExtra({ ...extraData, tranTraiNoiTham: e.target.value })} />
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Tai phải</div>
          <div className="flex gap-2 items-center">
            <label className="text-xs w-20">Nói thường:</label>
            <input className="input py-1" placeholder="m"
              value={extraData.tranPhaiNoiThuong ?? ''}
              onChange={(e) => setExtra({ ...extraData, tranPhaiNoiThuong: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center mt-1">
            <label className="text-xs w-20">Nói thầm:</label>
            <input className="input py-1" placeholder="m"
              value={extraData.tranPhaiNoiTham ?? ''}
              onChange={(e) => setExtra({ ...extraData, tranPhaiNoiTham: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== CHUYÊN BIỆT RHM ==========
function RHMExtraFields({ extraData, setExtra }: { extraData: any; setExtra: (d: any) => void }) {
  return (
    <div className="bg-slate-50 p-3 rounded space-y-2">
      <div className="text-sm font-medium">Kết quả khám răng hàm mặt</div>
      <div>
        <label className="label">Hàm trên</label>
        <input className="input"
          value={extraData.hamTren ?? ''}
          onChange={(e) => setExtra({ ...extraData, hamTren: e.target.value })} />
      </div>
      <div>
        <label className="label">Hàm dưới</label>
        <input className="input"
          value={extraData.hamDuoi ?? ''}
          onChange={(e) => setExtra({ ...extraData, hamDuoi: e.target.value })} />
      </div>
    </div>
  );
}
