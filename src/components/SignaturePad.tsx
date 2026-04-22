'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

type Props = {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  savedSignature?: string | null;
  label?: string;
};

/**
 * SignaturePad V2:
 * - 3 chế độ: vẽ tay, upload PNG có sẵn, dùng chữ ký đã lưu trong profile
 */
export default function SignaturePad({ value, onChange, savedSignature, label }: Props) {
  const ref = useRef<SignatureCanvas>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'draw' | 'view'>(value ? 'view' : 'draw');

  useEffect(() => {
    if (mode === 'draw' && ref.current) ref.current.clear();
  }, [mode]);

  function clear() {
    ref.current?.clear();
    onChange(null);
    setMode('draw');
  }

  function saveDrawing() {
    if (ref.current?.isEmpty()) return;
    const dataUrl = ref.current?.toDataURL('image/png');
    if (dataUrl) {
      onChange(dataUrl);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      alert('File quá lớn, cần dưới 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setMode('view');
    };
    reader.readAsDataURL(file);
  }

  function useSaved() {
    if (savedSignature) {
      onChange(savedSignature);
      setMode('view');
    }
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium text-slate-700">{label}</div>}

      {mode === 'view' && value ? (
        <div className="bg-white border border-slate-300 rounded p-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Chữ ký" style={{ maxHeight: 100, maxWidth: 360 }} />
        </div>
      ) : (
        <SignatureCanvas
          ref={ref}
          canvasProps={{ className: 'sig-canvas', width: 500, height: 140 }}
          onEnd={saveDrawing}
        />
      )}

      <div className="flex gap-2 text-xs flex-wrap">
        {mode === 'view' ? (
          <button type="button" onClick={clear} className="btn-secondary py-1">
            ✏️ Ký lại / đổi ảnh
          </button>
        ) : (
          <>
            <button type="button" onClick={clear} className="btn-secondary py-1">Xóa</button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary py-1">
              📎 Upload ảnh chữ ký (PNG)
            </button>
            {savedSignature && (
              <button type="button" onClick={useSaved} className="btn-secondary py-1">
                Dùng chữ ký đã lưu
              </button>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleUpload} />
      </div>
    </div>
  );
}
