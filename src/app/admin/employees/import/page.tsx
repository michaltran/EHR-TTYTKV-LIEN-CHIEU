'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Row = {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthYear?: number | null;
  dateOfBirth?: string | null;
  department: string;
  position?: string | null;
  qualification?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  idNumber?: string | null;
  idIssuedDate?: string | null;
  idIssuedPlace?: string | null;
  currentAddress?: string | null;
  phone?: string | null;
  occupation?: string | null;
  workplace?: string | null;
  startWorkingDate?: string | null;
  familyHistory?: string | null;
  signatureUrl?: string | null;
};

function parseViDate(s: any): string | null {
  if (!s) return null;
  if (typeof s === 'number') {
    // Excel date serial
    const d = new Date((s - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  const str = String(s).trim();
  // dd/mm/yyyy
  const m = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    const d = m[1].padStart(2, '0'), mo = m[2].padStart(2, '0');
    let y = m[3]; if (y.length === 2) y = '20' + y;
    return `${y}-${mo}-${d}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return null;
}

function parseGender(s: any): 'MALE' | 'FEMALE' | 'OTHER' {
  const v = String(s ?? '').trim().toLowerCase();
  if (['nam', 'male', 'm'].includes(v)) return 'MALE';
  if (['nữ', 'nu', 'female', 'f'].includes(v)) return 'FEMALE';
  return 'OTHER';
}

export default function ImportExcelPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

      // Auto-detect format
      // Format A (mẫu mới): header hàng 0, cột Họ và tên ở index 1
      // Format B (TTYT cũ): header ở hàng 3-5, tên khoa là hàng không có STT
      const firstRow = raw[0] || [];
      const isNewFormat = firstRow.some((c) => typeof c === 'string' && c.includes('Họ và tên'));

      const parsed = isNewFormat ? parseNewFormat(raw) : parseOldFormat(raw);
      setRows(parsed);
      setMsg(`Đọc được ${parsed.length} nhân viên từ file (định dạng: ${isNewFormat ? 'Mẫu mới 18 cột' : 'TTYT gốc'}). Kiểm tra bên dưới rồi bấm "Lưu".`);
    };
    reader.readAsArrayBuffer(file);
  }

  // Format mới (18 cột): dòng 0 = header
  function parseNewFormat(raw: any[][]): Row[] {
    const out: Row[] = [];
    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      if (!r || !r[1]) continue; // cần có tên
      const name = String(r[1]).trim();
      if (!name) continue;

      out.push({
        fullName: name,
        gender: parseGender(r[2]),
        dateOfBirth: parseViDate(r[3]),
        position: r[4] ? String(r[4]).trim() : null,
        department: r[5] ? String(r[5]).trim() : '',
        employmentType: r[6] ? String(r[6]).trim() : null,
        idNumber: r[7] ? String(r[7]).trim() : null,
        idIssuedDate: parseViDate(r[8]),
        idIssuedPlace: r[9] ? String(r[9]).trim() : null,
        currentAddress: r[10] ? String(r[10]).trim() : null,
        phone: r[11] ? String(r[11]).trim() : null,
        occupation: r[12] ? String(r[12]).trim() : null,
        workplace: r[13] ? String(r[13]).trim() : 'Trung tâm Y tế khu vực Liên Chiểu',
        startWorkingDate: parseViDate(r[14]),
        familyHistory: r[16] ? String(r[16]).trim() : null,
        signatureUrl: r[18] ? String(r[18]).trim() : null,
      });
    }
    return out.filter(x => x.department);
  }

  // Format TTYT cũ: hàng không STT là tên khoa
  function parseOldFormat(raw: any[][]): Row[] {
    const out: Row[] = [];
    let currentDept: string | null = null;
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      if (!r) continue;
      const stt = r[0];
      const name = (r[2] ?? '').toString().trim();
      const nsNam = r[3], nsNu = r[4];

      if ((stt === null || stt === undefined) && name && !nsNam && !nsNu) {
        currentDept = name; continue;
      }
      if (!name || !currentDept || typeof stt !== 'number') continue;

      const birthYear = typeof nsNam === 'number' ? nsNam : typeof nsNu === 'number' ? nsNu : null;
      const gender: Row['gender'] = nsNam ? 'MALE' : nsNu ? 'FEMALE' : 'OTHER';

      let employmentType: string | null = null;
      if (r[9]) employmentType = 'Viên chức';
      else if (r[10]) employmentType = 'HĐ 68';
      else if (r[11]) employmentType = 'Trong chỉ tiêu';
      else if (r[12]) employmentType = 'HĐ thỏa thuận';

      out.push({
        fullName: name,
        gender,
        birthYear,
        dateOfBirth: birthYear ? `${birthYear}-01-01` : null,
        department: currentDept,
        position: (r[7] ?? '').toString().trim() || null,
        qualification: (r[13] ?? '').toString().trim() || null,
        jobTitle: (r[14] ?? '').toString().trim() || null,
        employmentType,
      });
    }
    return out;
  }

  async function save() {
    if (rows.length === 0) return;
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/admin/employees/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu');
      setMsg(`✅ Đã tạo ${data.created} nhân viên mới, cập nhật ${data.updated || 0} (trùng tên cùng khoa).`);
      setTimeout(() => router.push('/admin/employees'), 1500);
    } catch (e: any) {
      setMsg('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Import Excel nhân sự</h1>
        <a href="/api/admin/employees/export-template" className="btn-secondary">
          📥 Tải file mẫu trống (18 cột)
        </a>
      </div>

      <div className="card">
        <p className="text-sm text-slate-600 mb-3">
          Hệ thống tự động nhận diện 2 định dạng file:
        </p>
        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1 mb-3">
          <li><strong>Mẫu mới (khuyến nghị):</strong> 18 cột theo file template — dòng đầu là header</li>
          <li><strong>Mẫu TTYT cũ:</strong> file DANH SÁCH VIÊN CHỨC theo format TTYT Liên Chiểu ban đầu</li>
        </ul>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="block text-sm" />
        {filename && <p className="text-xs text-slate-500 mt-2">📄 {filename}</p>}
      </div>

      {msg && <div className="card bg-blue-50 border-blue-200 text-sm">{msg}</div>}

      {rows.length > 0 && (
        <>
          <div className="card p-0 overflow-auto max-h-96">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>STT</th><th>Họ tên</th><th>Giới</th><th>Ngày sinh</th>
                  <th>Khoa/Phòng</th><th>Chức vụ</th><th>CCCD</th><th>SĐT</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{r.fullName}</td>
                    <td>{r.gender === 'MALE' ? 'Nam' : r.gender === 'FEMALE' ? 'Nữ' : ''}</td>
                    <td>{r.dateOfBirth ?? (r.birthYear ?? '')}</td>
                    <td>{r.department}</td>
                    <td>{r.position ?? ''}</td>
                    <td className="text-xs">{r.idNumber ?? ''}</td>
                    <td className="text-xs">{r.phone ?? ''}</td>
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={8} className="text-center text-xs text-slate-500 py-3">
                    ... và {rows.length - 50} dòng khác
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary">
              {loading ? 'Đang lưu...' : `Lưu ${rows.length} nhân viên`}
            </button>
            <button onClick={() => setRows([])} className="btn-secondary">Hủy</button>
          </div>
        </>
      )}
    </div>
  );
}
