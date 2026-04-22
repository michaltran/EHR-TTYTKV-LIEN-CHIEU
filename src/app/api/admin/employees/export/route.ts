import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const genderMap: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '';

export async function GET(req: Request) {
  try {
    await requireAuth(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get('dept');

    const where: any = {};
    if (deptId) where.departmentId = deptId;

    const employees = await prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: [{ department: { name: 'asc' } }, { fullName: 'asc' }],
    });

    const headers = [
      'STT',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Chức vụ',
      'Khoa/Phòng',
      'Loại hợp đồng',
      'Số CCCD',
      'Ngày cấp',
      'Tại',
      'Chỗ ở hiện tại',
      'Số điện thoại',
      'Nghề nghiệp',
      'Nơi công tác',
      'Ngày bắt đầu làm việc',
      'Trình độ chuyên môn',
      'Chức danh nghề nghiệp',
      'Tiền sử gia đình',
    ];

    const rows = employees.map((e, i) => [
      i + 1,
      e.fullName,
      genderMap[e.gender] ?? '',
      fmtDate(e.dateOfBirth),
      e.position ?? '',
      e.department.name,
      e.employmentType ?? '',
      e.idNumber ?? '',
      fmtDate(e.idIssuedDate),
      e.idIssuedPlace ?? '',
      e.currentAddress ?? '',
      e.phone ?? '',
      e.occupation ?? '',
      e.workplace ?? '',
      fmtDate(e.startWorkingDate),
      e.qualification ?? '',
      e.jobTitle ?? '',
      e.familyHistory ?? '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((h, i) => ({ wch: i === 0 ? 5 : i === 1 ? 25 : 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân viên');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `danh-sach-nhan-vien-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
