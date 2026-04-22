import { PrismaClient, Gender, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // ====== 1. TẠO TÀI KHOẢN MẪU ======
  const adminPass = await hash('admin123');
  const doctorPass = await hash('doctor123');
  const conclusionPass = await hash('conclude123');

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@lienchieu.vn' },
    update: {},
    create: {
      email: 'admin@lienchieu.vn',
      passwordHash: adminPass,
      fullName: 'Quản trị viên hệ thống',
      role: Role.ADMIN,
    },
  });

  // Bác sĩ kết luận (thường là Giám đốc)
  await prisma.user.upsert({
    where: { email: 'giamdoc@lienchieu.vn' },
    update: {},
    create: {
      email: 'giamdoc@lienchieu.vn',
      passwordHash: conclusionPass,
      fullName: 'BS. Nguyễn Thành Tân',
      role: Role.CONCLUDER,
    },
  });

  // Bác sĩ các chuyên khoa mẫu
  const doctorSamples = [
    { email: 'bs.noikhoa@lienchieu.vn',   name: 'BS. Trần Văn Nội',   specs: ['NOI_TUAN_HOAN','NOI_HO_HAP','NOI_TIEU_HOA','NOI_THAN_TIET_NIEU','NOI_TIET','CO_XUONG_KHOP','THAN_KINH','TAM_THAN'] },
    { email: 'bs.ngoai@lienchieu.vn',     name: 'BS. Lê Văn Ngoại',   specs: ['NGOAI_KHOA','DA_LIEU'] },
    { email: 'bs.sanphu@lienchieu.vn',    name: 'BS. Phạm Thị Sản',   specs: ['SAN_PHU_KHOA'] },
    { email: 'bs.mat@lienchieu.vn',       name: 'BS. Hoàng Thị Mắt',  specs: ['MAT'] },
    { email: 'bs.tmh@lienchieu.vn',       name: 'BS. Vũ Thanh TMH',   specs: ['TAI_MUI_HONG'] },
    { email: 'bs.rhm@lienchieu.vn',       name: 'BS. Trần Viết Tiến', specs: ['RANG_HAM_MAT'] },
  ];
  for (const d of doctorSamples) {
    await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash: doctorPass,
        fullName: d.name,
        role: Role.DOCTOR,
        specialties: JSON.stringify(d.specs),
      },
    });
  }

  // ====== 2. IMPORT TỪ FILE EXCEL (nếu có) ======
  const excelPath = path.join(process.cwd(), 'data', 'nhan-su.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.log(`ℹ️  Không thấy file ${excelPath}. Bỏ qua import nhân sự.`);
    console.log('   Copy file Excel của bạn vào thư mục data/nhan-su.xlsx rồi chạy lại "npm run db:seed"');
    console.log('✅ Seed cơ bản xong.');
    return;
  }

  console.log('📖 Đang đọc Excel...');
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  // Duyệt các hàng: header ở dòng 3-5, dữ liệu bắt đầu từ dòng 7
  // Cấu trúc cột (0-indexed): 0=STT, 1=STT khoa, 2=Họ tên, 3=NS Nam, 4=NS Nữ,
  // 5=Tuổi Nam, 6=Tuổi Nữ, 7=Chức vụ, 9=Viên chức, 10=HĐ68, 11=Trong chỉ tiêu,
  // 12=HĐ thỏa thuận, 13=Trình độ (VV), 14=Chức danh (BB)
  let currentDept: string | null = null;
  const deptCache: Record<string, string> = {};
  let imported = 0, skipped = 0;

  for (let i = 6; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === undefined || c === '')) continue;

    const stt = row[0];
    const name = (row[2] ?? '').toString().trim();
    const nsNam = row[3];
    const nsNu = row[4];

    // Dòng tên khoa: STT null, có tên, không có năm sinh
    if ((stt === null || stt === undefined) && name && !nsNam && !nsNu) {
      currentDept = name;
      continue;
    }

    if (!name || !currentDept) continue;
    if (typeof stt !== 'number') continue;

    // Tạo/lấy department
    let deptId = deptCache[currentDept];
    if (!deptId) {
      const dept = await prisma.department.upsert({
        where: { name: currentDept },
        update: {},
        create: { name: currentDept },
      });
      deptId = dept.id;
      deptCache[currentDept] = deptId;
    }

    const gender: Gender = nsNam ? Gender.MALE : nsNu ? Gender.FEMALE : Gender.OTHER;
    const birthYear = (typeof nsNam === 'number' ? nsNam : typeof nsNu === 'number' ? nsNu : null);
    const dob = birthYear ? new Date(birthYear, 0, 1) : null;

    const position = (row[7] ?? '').toString().trim() || null;
    const qualification = (row[13] ?? '').toString().trim() || null;
    const jobTitle = (row[14] ?? '').toString().trim() || null;
    let employmentType = 'Khác';
    if (row[9]) employmentType = 'Viên chức';
    else if (row[10]) employmentType = 'HĐ 68';
    else if (row[11]) employmentType = 'Trong chỉ tiêu';
    else if (row[12]) employmentType = 'HĐ thỏa thuận';

    try {
      await prisma.employee.create({
        data: {
          fullName: name,
          gender,
          dateOfBirth: dob,
          departmentId: deptId,
          position,
          qualification,
          jobTitle,
          employmentType,
          workplace: 'Trung tâm Y tế khu vực Liên Chiểu',
        },
      });
      imported++;
    } catch (e) {
      skipped++;
    }
  }

  console.log(`✅ Imported ${imported} nhân viên (skipped ${skipped}), ${Object.keys(deptCache).length} khoa/phòng.`);

  // ====== 3. TẠO MỘT ĐỢT KHÁM MẪU ======
  const year = new Date().getFullYear();
  await prisma.examRound.upsert({
    where: { id: 'seed-round-' + year },
    update: {},
    create: {
      id: 'seed-round-' + year,
      name: `Khám sức khỏe định kỳ ${year}`,
      year,
      startDate: new Date(`${year}-06-01`),
      status: 'DRAFT',
    },
  });

  console.log('✅ Seed hoàn tất.');
  console.log('');
  console.log('Tài khoản mẫu:');
  console.log('  Admin:       admin@lienchieu.vn / admin123');
  console.log('  Giám đốc:    giamdoc@lienchieu.vn / conclude123');
  console.log('  Bác sĩ khám: bs.noikhoa@lienchieu.vn / doctor123  (và các BS khác cùng pass)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
