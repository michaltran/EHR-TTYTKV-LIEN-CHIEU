'use client';

import { useState } from 'react';

type Props = {
  targetType: 'CLINICAL_EXAM' | 'CONCLUSION';
  targetId: string;
  payload: string;
  description?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  label?: string;
};

/**
 * SmartCA TH button:
 * 1 request → Hệ thống tự sinh OTP từ TOTP secret đã lưu → Gọi v2/signatures/sign + confirm → Nhận chữ ký ngay.
 * Không cần mở app điện thoại.
 */
export default function SmartCASignButton({
  targetType, targetId, payload, description, disabled, onSuccess, label,
}: Props) {
  const [state, setState] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function sign() {
    setState('signing'); setMsg('Đang ký với VNPT SmartCA...');
    try {
      const res = await fetch('/api/smartca/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, payload, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      setState('success');
      setMsg('✅ Ký thành công');
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setState('error');
      setMsg('❌ ' + e.message);
    }
  }

  return (
    <div className="space-y-2">
      {state === 'idle' && (
        <button
          type="button"
          onClick={sign}
          disabled={disabled}
          className="btn-primary flex items-center gap-2"
        >
          <span>🔐</span>
          <span>{label || 'Ký số VNPT SmartCA'}</span>
        </button>
      )}

      {state === 'signing' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <div className="text-sm text-blue-900">{msg}</div>
        </div>
      )}

      {state === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-900">
          {msg}
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
          <div className="text-red-800">{msg}</div>
          <button onClick={() => { setState('idle'); setMsg(''); }} className="btn-secondary text-xs mt-2">Thử lại</button>
        </div>
      )}
    </div>
  );
}
