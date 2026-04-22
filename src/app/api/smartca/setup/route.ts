import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCertificate, isConfigured } from '@/lib/vnpt-smartca';
import { encrypt, generateTotp } from '@/lib/crypto-utils';

/**
 * POST /api/smartca/setup
 * Body: { cccd, password, totpSecret, enable }
 *
 * Dùng cho SmartCA TH (tài khoản tích hợp):
 * - cccd: Số CCCD của NVYT
 * - password: Mật khẩu SmartCA
 * - totpSecret: Khóa TOTP base32 (VNPT/VNPT SmartCA app cung cấp khi đăng ký TH)
 *               Nếu user cấu hình qua Google Authenticator QR code, đây là phần bí mật trong QR
 *
 * Hệ thống sẽ:
 * 1. Gọi get_certificate để xác thực CCCD + lấy serial
 * 2. Test sinh OTP từ secret để validate format
 * 3. Mã hoá AES password + totpSecret trước khi lưu vào DB
 */
export async function POST(req: Request) {
  try {
    const s = await requireAuth(['DOCTOR', 'CONCLUDER', 'ADMIN']);
    const { cccd, password, totpSecret, enable } = await req.json();

    if (!enable) {
      await prisma.user.update({
        where: { id: s.sub },
        data: { caEnabled: false },
      });
      return NextResponse.json({ ok: true, message: 'Đã tắt ký số VNPT SmartCA' });
    }

    if (!cccd || !/^\d{9,13}$/.test(cccd.toString().trim())) {
      return NextResponse.json({ error: 'CCCD không hợp lệ (9-13 chữ số)' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'Mật khẩu SmartCA bắt buộc' }, { status: 400 });
    }
    if (!totpSecret || totpSecret.length < 8) {
      return NextResponse.json({ error: 'Khóa TOTP (TOTP secret) bắt buộc. Xem trong app SmartCA của bạn hoặc tại VNPT.' }, { status: 400 });
    }

    if (!isConfigured()) {
      return NextResponse.json({
        error: 'Hệ thống chưa cấu hình VNPT SmartCA. Liên hệ admin để set VNPT_SCA_SP_ID và VNPT_SCA_SP_PASSWORD.',
      }, { status: 500 });
    }

    // Test sinh OTP từ secret (nếu secret sai format sẽ throw)
    let testOtp: string;
    try {
      testOtp = generateTotp(totpSecret.trim());
    } catch (e: any) {
      return NextResponse.json({ error: 'Khóa TOTP không đúng định dạng base32' }, { status: 400 });
    }

    // Gọi VNPT xác thực CCCD + lấy serial
    const txId = `SETUP_${s.sub}_${Date.now()}`;
    const certs = await getCertificate(cccd.trim(), txId);

    if (certs.length === 0) {
      return NextResponse.json({
        error: 'Không tìm thấy chứng thư số SmartCA đang hoạt động cho CCCD này. Kiểm tra lại CCCD hoặc đăng ký SmartCA với VNPT.',
      }, { status: 404 });
    }

    const cert = certs.find((c) => c.service_type === 'SMARTCA') || certs[0];

    // Mã hoá password và totpSecret trước khi lưu
    const passwordEnc = encrypt(password);
    const totpSecretEnc = encrypt(totpSecret.trim());

    await prisma.user.update({
      where: { id: s.sub },
      data: {
        caUserId: cccd.trim(),
        caSerialNumber: cert.serial_number,
        caEnabled: true,
        caPasswordEnc: passwordEnc,
        caTotpSecretEnc: totpSecretEnc,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'SMARTCA_TH_SETUP',
        detail: JSON.stringify({ cert_subject: cert.cert_subject, valid_to: cert.cert_valid_to }),
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Đã kích hoạt ký số VNPT SmartCA TH. Test OTP hiện tại: ${testOtp} (đổi mỗi 30s)`,
      cert: {
        subject: cert.cert_subject,
        validFrom: cert.cert_valid_from,
        validTo: cert.cert_valid_to,
        serial: cert.serial_number,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi' }, { status: 500 });
  }
}
