'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DeptActionButtons({
  recordId, status, signedCount,
}: { recordId: string; status: string; signedCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (signedCount === 0) {
      alert('Hồ sơ chưa có chuyên khoa nào được ký. Vui lòng báo nhân viên đi khám trước.');
      return;
    }
    if (!confirm('Gửi hồ sơ này lên Admin để duyệt?')) return;
    setLoading(true);
    const res = await fetch(`/api/dept/records/${recordId}/submit`, { method: 'POST' });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert('Lỗi');
  }

  return (
    <div className="flex gap-2 text-sm">
      <Link href={`/records/${recordId}/print`} target="_blank" className="text-brand-600 hover:underline">
        Xem
      </Link>
      {(status === 'PENDING' || status === 'IN_PROGRESS') && (
        <button onClick={submit} disabled={loading} className="text-amber-600 hover:underline">
          Gửi lên Admin
        </button>
      )}
    </div>
  );
}
