'use client';

import { useState } from 'react';

export default function SetupClient({ userCount }: { userCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function runSetup() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold mb-2">Bước khởi tạo</h2>
      <p className="text-sm text-slate-600 mb-4">
        Bấm nút dưới để tạo sẵn:
      </p>
      <ul className="text-sm text-slate-700 list-disc list-inside mb-4 space-y-1">
        <li>8 tài khoản demo (admin, giám đốc, 6 bác sĩ chuyên khoa)</li>
        <li>1 đợt khám mẫu cho năm hiện tại</li>
        <li>Các khoa/phòng cơ bản (nếu chưa có)</li>
      </ul>

      {userCount > 0 && !result && (
        <div className="text-sm bg-amber-50 border border-amber-200 p-3 rounded mb-3">
          ⚠️ Database đã có {userCount} tài khoản. Bấm lại sẽ không ghi đè, chỉ bổ sung tài khoản còn thiếu.
        </div>
      )}

      <button
        onClick={runSetup}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded font-medium disabled:opacity-50"
      >
        {loading ? 'Đang khởi tạo...' : 'Chạy khởi tạo'}
      </button>

      {error && (
        <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 text-sm bg-green-50 border border-green-200 p-4 rounded space-y-2">
          <div className="font-semibold text-green-800">✅ Khởi tạo thành công!</div>
          <div>Tài khoản đã tạo: <strong>{result.created}</strong></div>
          <div className="mt-3">
            <div className="font-medium mb-1">Đăng nhập với một trong các tài khoản sau:</div>
            <div className="bg-white p-3 rounded border border-green-100 font-mono text-xs space-y-1">
              <div>admin@lienchieu.vn / admin123</div>
              <div>giamdoc@lienchieu.vn / conclude123</div>
              <div>bs.noikhoa@lienchieu.vn / doctor123</div>
              <div>bs.ngoai@lienchieu.vn / doctor123</div>
              <div>bs.sanphu@lienchieu.vn / doctor123</div>
              <div>bs.mat@lienchieu.vn / doctor123</div>
              <div>bs.tmh@lienchieu.vn / doctor123</div>
              <div>bs.rhm@lienchieu.vn / doctor123</div>
            </div>
          </div>
          <a href="/login" className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
            → Đến trang đăng nhập
          </a>
        </div>
      )}
    </div>
  );
}
