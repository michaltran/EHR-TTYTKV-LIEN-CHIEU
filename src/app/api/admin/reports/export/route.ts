import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { CLASSIFICATION_LABELS, STATUS_LABELS, SPECIALTY_LABELS } from '@/lib/constants';

const genderMap: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
const fmt = (d: Date | null | undefined) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

export async function GET(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('round');
    if (!roundId) return NextResponse.json({ error: 'Thiếu round' }, { status: 400 });

    const round = await prisma.examRound.findUnique({ where: { id: roundId } });
    if (!round) return NextResponse.json({ error: 'Không tìm thấy đợt' }, { status: 404 });

    const records = await prisma.healthRecord.findMany({
      where: { examRoundId: roundId },
      include: {
        employee: { include: { department: true } },
        clinicalExams: true,
        concluder: { select: { fullName: true } },
      },
    });

    const wb = XLSX.utils.book_new();

    // ======== SHEET 1: TỔNG QUAN ========
    const total = records.length;
    const completed = records.filter((r) => r.status === 'COMPLETED').length;
    const pending = records.filter((r) => r.status === 'PENDING').length;
    const inProgress = records.filter((r) => r.status === 'IN_PROGRESS').length;
    const waitReview = records.filter((r) => r.status === 'WAITING_REVIEW').length;
    const waitConclude = records.filter((r) => r.status === 'WAITING_CONCLUSION').length;

    const overviewRows: any[][] = [
      ['BÁO CÁO TỔNG THỂ KHÁM SỨC KHỎE ĐỊNH KỲ'],
      [`Đợt khám: ${round.name}`],
      [`Ngày tạo báo cáo: ${new Date().toLocaleString('vi-VN')}`],
      [],
      ['I. THỐNG KÊ TIẾN ĐỘ'],
      ['Chỉ tiêu', 'Số lượng', 'Tỷ lệ'],
      ['Tổng hồ sơ', total, '100%'],
      ['Đã hoàn tất (ký kết luận)', completed, total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%'],
      ['Đang khám', inProgress, total > 0 ? `${((inProgress / total) * 100).toFixed(1)}%` : '0%'],
      ['Chờ Admin duyệt', waitReview, total > 0 ? `${((waitReview / total) * 100).toFixed(1)}%` : '0%'],
      ['Chờ kết luận', waitConclude, total > 0 ? `${((waitConclude / total) * 100).toFixed(1)}%` : '0%'],
      ['Chưa khám', pending, total > 0 ? `${((pending / total) * 100).toFixed(1)}%` : '0%'],
      [],
      ['II. THỐNG KÊ PHÂN LOẠI SỨC KHỎE (chỉ tính hồ sơ đã kết luận)'],
      ['Phân loại', 'Số lượng', 'Tỷ lệ'],
    ];
    const classCounts: Record<string, number> = {};
    for (const r of records) {
      if (r.finalClassification) {
        classCounts[r.finalClassification] = (classCounts[r.finalClassification] || 0) + 1;
      }
    }
    for (const [key, label] of Object.entries(CLASSIFICATION_LABELS)) {
      const c = classCounts[key] || 0;
      overviewRows.push([label, c, completed > 0 ? `${((c / completed) * 100).toFixed(1)}%` : '0%']);
    }

    overviewRows.push([]);
    overviewRows.push(['III. THỐNG KÊ BMI']);
    overviewRows.push(['Phân loại', 'Số lượng']);
    const bmi = { thieu: 0, binhThuong: 0, thuaCan: 0, beoPhi: 0, khong: 0 };
    for (const r of records) {
      if (!r.bmi) { bmi.khong++; continue; }
      if (r.bmi < 18.5) bmi.thieu++;
      else if (r.bmi < 23) bmi.binhThuong++;
      else if (r.bmi < 25) bmi.thuaCan++;
      else bmi.beoPhi++;
    }
    overviewRows.push(['Thiếu cân (<18.5)', bmi.thieu]);
    overviewRows.push(['Bình thường (18.5-22.9)', bmi.binhThuong]);
    overviewRows.push(['Thừa cân (23-24.9)', bmi.thuaCan]);
    overviewRows.push(['Béo phì (≥25)', bmi.beoPhi]);
    overviewRows.push(['Chưa đo', bmi.khong]);

    const ws1 = XLSX.utils.aoa_to_sheet(overviewRows);
    ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

    // ======== SHEET 2: THEO KHOA ========
    const byDept: Record<string, { total: number; completed: number; loaiI: number; loaiII: number; loaiIII: number; loaiIV: number; loaiV: number }> = {};
    for (const r of records) {
      const d = r.employee.department.name;
      if (!byDept[d]) byDept[d] = { total: 0, completed: 0, loaiI: 0, loaiII: 0, loaiIII: 0, loaiIV: 0, loaiV: 0 };
      byDept[d].total++;
      if (r.status === 'COMPLETED') byDept[d].completed++;
      if (r.finalClassification === 'LOAI_I') byDept[d].loaiI++;
      if (r.finalClassification === 'LOAI_II') byDept[d].loaiII++;
      if (r.finalClassification === 'LOAI_III') byDept[d].loaiIII++;
      if (r.finalClassification === 'LOAI_IV') byDept[d].loaiIV++;
      if (r.finalClassification === 'LOAI_V') byDept[d].loaiV++;
    }
    const deptHead = ['Khoa/Phòng', 'Tổng', 'Đã hoàn tất', '% hoàn tất', 'Loại I', 'Loại II', 'Loại III', 'Loại IV', 'Loại V'];
    const deptRows = Object.entries(byDept)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, s]) => [
        name, s.total, s.completed,
        s.total > 0 ? `${((s.completed / s.total) * 100).toFixed(1)}%` : '0%',
        s.loaiI, s.loaiII, s.loaiIII, s.loaiIV, s.loaiV,
      ]);
    const ws2 = XLSX.utils.aoa_to_sheet([deptHead, ...deptRows]);
    ws2['!cols'] = [{ wch: 38 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Theo khoa');

    // ======== SHEET 3: DANH SÁCH CHI TIẾT ========
    const listHead = [
      'STT', 'Họ tên', 'Giới', 'Năm sinh', 'Khoa/Phòng', 'Chức vụ',
      'Chiều cao', 'Cân nặng', 'BMI', 'Mạch', 'Huyết áp', 'Phân loại thể lực',
      'Phân loại sức khỏe', 'Kết luận', 'Ký bởi',
      'Trạng thái', 'Ngày hoàn tất',
    ];
    const listRows = records.map((r, i) => [
      i + 1,
      r.employee.fullName,
      genderMap[r.employee.gender] ?? '',
      r.employee.dateOfBirth ? new Date(r.employee.dateOfBirth).getFullYear() : '',
      r.employee.department.name,
      r.employee.position ?? '',
      r.height ?? '',
      r.weight ?? '',
      r.bmi ?? '',
      r.pulse ?? '',
      r.bloodPressureSys && r.bloodPressureDia ? `${r.bloodPressureSys}/${r.bloodPressureDia}` : '',
      r.physicalClassification ?? '',
      r.finalClassification ? CLASSIFICATION_LABELS[r.finalClassification] : '',
      r.conclusionText ?? '',
      r.concluder?.fullName ?? '',
      STATUS_LABELS[r.status] ?? r.status,
      fmt(r.finalizedAt),
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([listHead, ...listRows]);
    ws3['!cols'] = listHead.map((h, i) => ({ wch: i === 0 ? 5 : i === 1 ? 25 : i === 13 ? 40 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws3, 'Danh sách chi tiết');

    // ======== SHEET 4: BỆNH PHÁT HIỆN THEO CHUYÊN KHOA ========
    const diseaseRows: any[][] = [['Nhân viên', 'Khoa/Phòng', 'Chuyên khoa', 'Phân loại', 'Chi tiết']];
    for (const r of records) {
      for (const ex of r.clinicalExams) {
        const cls = ex.classification ?? '';
        const findings = ex.findings ?? '';
        if (!findings && !cls) continue;
        if (cls.toLowerCase().includes('i') && !findings.trim()) continue; // bỏ qua Loại I, khỏe
        diseaseRows.push([
          r.employee.fullName,
          r.employee.department.name,
          SPECIALTY_LABELS[ex.specialty] ?? ex.specialty,
          cls,
          findings,
        ]);
      }
    }
    const ws4 = XLSX.utils.aoa_to_sheet(diseaseRows);
    ws4['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 22 }, { wch: 15 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Bất thường chuyên khoa');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `bao-cao-tong-the-${round.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
