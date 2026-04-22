import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth(['ADMIN']);

    // 19 cột — cột thứ 19 là URL chữ ký NLĐ (tùy chọn)
    const headers = [
      'Ảnh 4x6 (file jpg hoặc png)',
      'Họ và tên',
      'Giới tính',
      'Ngày tháng năm sinh',
      'Chức vụ',
      'Khoa/phòng',
      'Loại hợp đồng',
      'Số CCCD',
      'Ngày cấp',
      'Tại',
      'Chỗ ở hiện tại',
      'Số điện thoại liên hệ',
      'Nghề nghiệp',
      'Nơi công tác',
      'Ngày bắt đầu làm việc tại đơn vị hiện tại',
      'Nghề, công việc trước đây (liệt kê công việc đã làm trong 10 năm gần đây, tính từ thời điểm gần nhất):',
      'Tiền sử bệnh, tật của gia đình',
      'Tiền sử bệnh, tật của bản thân',
      'URL ảnh chữ ký NLĐ (png/jpg - tùy chọn)',
    ];

    const example = [
      '',
      'Nguyễn Văn A',
      'Nam',
      '15/01/1985',
      'Bác sĩ',
      'Khoa Nội',
      'Viên chức',
      '048085000123',
      '15/10/2021',
      'Công an TP. Đà Nẵng',
      '123 Nguyễn Sinh Sắc, Liên Chiểu, Đà Nẵng',
      '0905xxxxxx',
      'Viên chức y tế',
      'Trung tâm Y tế khu vực Liên Chiểu',
      '01/06/2010',
      'a) BS. Bệnh viện X - 2005-2010',
      'Mẹ: Tiểu đường type 2',
      'Viêm gan B - 2015',
      'https://example.com/chu-ky-nguyen-van-a.png',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = headers.map(() => ({ wch: 25 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhân viên');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-nhan-vien.xlsx"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
