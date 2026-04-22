'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@lienchieu.vn');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient-light p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
            style={{ background: 'linear-gradient(135deg, #1E73BE 0%, #134B82 100%)' }}>
            <img 
               src="/assets/images/logo.png" 
               alt="TTYT Liên Chiểu Logo" 
               className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">TTYT khu vực Liên Chiểu</h1>
          <p className="text-slate-600 mt-1">Hệ thống quản lý hồ sơ sức khỏe định kỳ</p>
        </div>

        <form onSubmit={submit} className="card-accent space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div>
            <label className="label">Mật khẩu</label>
            <input
              type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-500 bg-white/60 p-4 rounded-lg border border-slate-200">
          <p className="font-medium mb-1">Tài khoản demo:</p>
          <p>• Admin: admin@lienchieu.vn / admin123</p>
          <p>• Bác sĩ: bs.noikhoa@lienchieu.vn / doctor123</p>
          <p>• Kết luận (Giám đốc): giamdoc@lienchieu.vn / conclude123</p>
        </div>

        <p className="text-center text-xs text-slate-400 italic mt-6">
          Software Copyright Powered by Dat Dat
        </p>
      </div>
    </div>
  );
}
