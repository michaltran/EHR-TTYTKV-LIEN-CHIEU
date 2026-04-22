import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý hồ sơ sức khỏe định kỳ - TTYT Liên Chiểu',
  description: 'Hệ thống khám sức khỏe định kỳ cho viên chức và người lao động TTYT khu vực Liên Chiểu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
