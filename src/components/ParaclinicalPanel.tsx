'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Paraclinical = {
  id: string;
  category: string;
  testName: string;
  result: string | null;
  evaluation: string | null;
  note: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

type Props = {
  recordId: string;
  existing: Paraclinical[];
  allowedCategories?: string[];
};

const DEFAULT_CATEGORIES = [
  'Công thức máu',
  'Sinh hoá',
  'Miễn dịch',
  'Điện tim',
  'X-quang',
  'Siêu âm',
  'Khác',
];

export default function ParaclinicalPanel({ recordId, existing, allowedCategories }: Props) {
  const router = useRouter();
  const CATEGORIES = allowedCategories && allowedCategories.length > 0 ? allowedCategories : DEFAULT_CATEGORIES;
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function add() {
    setLoading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('recordId', recordId);
      fd.append('category', category);
      fd.append('testName', testName || category);
      fd.append('result', result);
      fd.append('evaluation', evaluation);
      if (file) fd.append('file', file);

      const res = await fetch('/api/paraclinical', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');

      setMsg('✅ Đã lưu');
      setTestName(''); setResult(''); setEvaluation(''); setFile(null);
      // Reset file input
      const input = document.getElementById('para-file') as HTMLInputElement;
      if (input) input.value = '';
      router.refresh();
    } catch (e: any) {
      setMsg('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa mục này?')) return;
    const res = await fetch(`/api/paraclinical?id=${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">IV. Khám cận lâm sàng</h2>
      <p className="text-xs text-slate-600">
        Thêm từng hạng mục xét nghiệm (có thể đính kèm PDF hoặc ảnh kết quả). File lưu trên Vercel Blob (hoặc base64 nếu chưa cấu hình Blob).
      </p>

      {/* Danh sách đã thêm */}
      {existing.length > 0 && (
        <div className="space-y-2">
          {existing.map((p) => {
            const isMine = !allowedCategories || allowedCategories.includes(p.category);
            return (
              <div
                key={p.id}
                className={`border rounded p-3 ${
                  isMine ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-75'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {p.category}
                      {p.testName && p.testName !== p.category && <span className="text-slate-500"> — {p.testName}</span>}
                      {!isMine && <span className="ml-2 badge bg-slate-200 text-slate-600 text-[10px]">KTV khác</span>}
                    </div>
                    {p.result && <div className="text-sm mt-1">Kết quả: <span className="text-slate-700">{p.result}</span></div>}
                    {p.evaluation && <div className="text-sm"><span className="text-slate-500">Đánh giá:</span> <em>{p.evaluation}</em></div>}
                    {p.fileUrl && (
                      <div className="mt-1">
                        <a href={p.fileUrl} target="_blank" rel="noopener" className="text-brand-600 hover:underline text-xs">
                          📎 {p.fileName || 'Xem file đính kèm'}
                        </a>
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <button onClick={() => remove(p.id)} className="text-red-600 hover:underline text-xs">Xóa</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form thêm mới */}
      <div className="grid grid-cols-6 gap-3 border-t pt-4">
        <div className="col-span-2">
          <label className="label">Loại xét nghiệm</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-4">
          <label className="label">Tên xét nghiệm chi tiết (tùy chọn)</label>
          <input className="input" value={testName} onChange={(e) => setTestName(e.target.value)}
            placeholder="VD: Hemoglobin, Glucose, X-quang ngực thẳng..." />
        </div>
        <div className="col-span-3">
          <label className="label">Kết quả</label>
          <textarea rows={2} className="input" value={result} onChange={(e) => setResult(e.target.value)} />
        </div>
        <div className="col-span-3">
          <label className="label">Đánh giá</label>
          <textarea rows={2} className="input" value={evaluation} onChange={(e) => setEvaluation(e.target.value)}
            placeholder="Bình thường / Bất thường / ..." />
        </div>
        <div className="col-span-6">
          <label className="label">File đính kèm (PDF/JPG/PNG, tối đa 10MB)</label>
          <input id="para-file" type="file" accept=".pdf,image/*" className="block text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file && <p className="text-xs text-slate-500 mt-1">📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <button onClick={add} disabled={loading} className="btn-primary">
        {loading ? 'Đang lưu...' : '+ Thêm mục xét nghiệm'}
      </button>
    </div>
  );
}
