import type { Specialty, HealthClassification, RecordStatus, Role } from '@prisma/client';

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  NOI_TUAN_HOAN: 'Nội - Tuần hoàn',
  NOI_HO_HAP: 'Nội - Hô hấp',
  NOI_TIEU_HOA: 'Nội - Tiêu hóa',
  NOI_THAN_TIET_NIEU: 'Nội - Thận-Tiết niệu',
  NOI_TIET: 'Nội tiết',
  CO_XUONG_KHOP: 'Cơ - xương - khớp',
  THAN_KINH: 'Thần kinh',
  TAM_THAN: 'Tâm thần',
  NGOAI_KHOA: 'Ngoại khoa',
  DA_LIEU: 'Da liễu',
  SAN_PHU_KHOA: 'Sản phụ khoa',
  MAT: 'Mắt',
  TAI_MUI_HONG: 'Tai - Mũi - Họng',
  RANG_HAM_MAT: 'Răng - Hàm - Mặt',
};

export const ALL_SPECIALTIES: Specialty[] = Object.keys(SPECIALTY_LABELS) as Specialty[];

export const CLASSIFICATION_LABELS: Record<HealthClassification, string> = {
  LOAI_I: 'Loại I (rất tốt)',
  LOAI_II: 'Loại II (tốt)',
  LOAI_III: 'Loại III (trung bình)',
  LOAI_IV: 'Loại IV (kém)',
  LOAI_V: 'Loại V (rất kém)',
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  PENDING: 'Chưa khám',
  IN_PROGRESS: 'Đang khám',
  WAITING_REVIEW: 'Chờ Admin duyệt',
  WAITING_CONCLUSION: 'Chờ kết luận',
  COMPLETED: 'Hoàn tất',
};

export const STATUS_COLORS: Record<RecordStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  WAITING_REVIEW: 'bg-amber-100 text-amber-700',
  WAITING_CONCLUSION: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ khám',
  CONCLUDER: 'Bác sĩ kết luận',
  DEPT_REP: 'Đại diện khoa',
  EMPLOYEE: 'Nhân viên',
  KTV_XETNGHIEM: 'KTV Xét nghiệm',
  KTV_CHANDOANHINHANH: 'KTV Chẩn đoán hình ảnh',
  VITAL_STAFF: 'KTV/Điều dưỡng Đo thể lực',
};

// Phân công hạng mục cận lâm sàng theo role
export const XETNGHIEM_CATEGORIES = ['Công thức máu', 'Sinh hoá', 'Miễn dịch'];
export const CHANDOANHINHANH_CATEGORIES = ['Điện tim', 'X-quang', 'Siêu âm'];
export const ALL_PARACLINICAL_CATEGORIES = [
  ...XETNGHIEM_CATEGORIES,
  ...CHANDOANHINHANH_CATEGORIES,
  'Khác',
];

// Nhóm chuyên khoa để kiểm tra phân quyền bác sĩ
export const NOI_KHOA_SPECIALTIES: Specialty[] = [
  'NOI_TUAN_HOAN', 'NOI_HO_HAP', 'NOI_TIEU_HOA', 'NOI_THAN_TIET_NIEU',
  'NOI_TIET', 'CO_XUONG_KHOP', 'THAN_KINH', 'TAM_THAN',
];
export const SAN_SPECIALTIES: Specialty[] = ['SAN_PHU_KHOA'];

export function calcBmi(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function formatDate(d?: Date | string | null) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('vi-VN');
}
