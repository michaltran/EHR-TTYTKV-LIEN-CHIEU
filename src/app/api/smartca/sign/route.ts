import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { requestSignTh, confirmSignTh } from '@/lib/vnpt-smartca';
import { decrypt, generateTotp } from '@/lib/crypto-utils';

/**
 * POST /api/smartca/sign
 *
 * SmartCA TH flow (1 request → chữ ký ngay, không cần app điện thoại):
 * 1. Hash SHA256 payload
 * 2. Sinh OTP từ TOTP secret
 * 3. Gọi v2/signatures/sign với password + OTP → nhận SAD
 * 4. Gọi v2/signatures/confirm → nhận signature_value
 * 5. Cập nhật ExamClinical/HealthRecord với chữ ký
 *
 * Body: { targetType: 'CLINICAL_EXAM' | 'CONCLUSION', targetId: string, payload: string, description?: string }
 */
export async function POST(req: Request) {
  try {
    const s = await requireAuth(['DOCTOR', 'CONCLUDER']);
    const user = await prisma.user.findUnique({ where: { id: s.sub } });

    if (!user?.caEnabled || !user.caUserId || !user.caSerialNumber || !user.caPasswordEnc || !user.caTotpSecretEnc) {
      return NextResponse.json({
        error: 'Chưa kích hoạt ký số VNPT SmartCA. Vào Hồ sơ → Kích hoạt SmartCA.',
      }, { status: 400 });
    }

    const { targetType, targetId, payload, description } = await req.json();
    if (!targetType || !targetId || !payload) {
      return NextResponse.json({ error: 'Thiếu tham số' }, { status: 400 });
    }

    // Decrypt password và TOTP secret
    let password: string, totpSecret: string;
    try {
      password = decrypt(user.caPasswordEnc);
      totpSecret = decrypt(user.caTotpSecretEnc);
    } catch (e) {
      return NextResponse.json({ error: 'Lỗi giải mã credentials, vui lòng kích hoạt lại SmartCA' }, { status: 500 });
    }

    // Sinh OTP từ TOTP secret
    const otp = generateTotp(totpSecret);

    // Hash payload
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const docId = `${targetType}_${targetId.slice(0, 12).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const txId = `KSK_${s.sub.slice(0, 8)}_${Date.now()}`;

    // Bước 1: sign → nhận SAD
    let signResp;
    try {
      signResp = await requestSignTh({
        userCccd: user.caUserId,
        userPassword: password,
        otp,
        transactionId: txId,
        transactionDesc: description || `Ký sổ KSK - ${user.fullName}`,
        serialNumber: user.caSerialNumber,
        files: [{ doc_id: docId, data_to_be_signed: hash, file_type: 'pdf', sign_type: 'hash' }],
      });
    } catch (e: any) {
      await prisma.auditLog.create({
        data: { userId: s.sub, action: 'SMARTCA_TH_SIGN_FAILED', detail: e.message },
      }).catch(() => {});
      return NextResponse.json({ error: `Lỗi VNPT: ${e.message}` }, { status: 500 });
    }

    // Lưu transaction
    const transaction = await prisma.caSignTransaction.create({
      data: {
        userId: s.sub,
        targetType, targetId,
        docId,
        tranCode: signResp.tran_code,
        vnptTranId: signResp.transaction_id,
        status: 'PENDING',
        dataHash: hash,
      },
    });

    // Bước 2: confirm → nhận chữ ký
    let confirmResp;
    try {
      confirmResp = await confirmSignTh({
        userCccd: user.caUserId,
        userPassword: password,
        sad: signResp.sad,
        transactionId: signResp.transaction_id,
      });
    } catch (e: any) {
      await prisma.caSignTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED', errorMessage: e.message },
      });
      return NextResponse.json({ error: `Lỗi xác nhận: ${e.message}` }, { status: 500 });
    }

    const signatureValue = confirmResp.signatures?.[0]?.signature_value;
    if (!signatureValue) {
      await prisma.caSignTransaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED', errorMessage: 'VNPT không trả về chữ ký' },
      });
      return NextResponse.json({ error: 'Không nhận được chữ ký từ VNPT' }, { status: 500 });
    }

    await prisma.caSignTransaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', signatureValue, completedAt: new Date() },
    });

    // Áp dụng chữ ký vào target
    if (targetType === 'CLINICAL_EXAM') {
      let recordId = targetId;
      let specialty: any = null;
      if (targetId.includes('::')) {
        [recordId, specialty] = targetId.split('::');
      }

      if (specialty) {
        await prisma.examClinical.upsert({
          where: { recordId_specialty: { recordId, specialty } },
          create: {
            recordId, specialty,
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: s.sub,
            doctorNameSnapshot: user.fullName,
            doctorTitleSnapshot: user.jobTitle,
          },
          update: {
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: s.sub,
            doctorNameSnapshot: user.fullName,
            doctorTitleSnapshot: user.jobTitle,
          },
        });
      } else {
        await prisma.examClinical.update({
          where: { id: targetId },
          data: {
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: s.sub,
            doctorNameSnapshot: user.fullName,
            doctorTitleSnapshot: user.jobTitle,
          },
        });
      }
    } else if (targetType === 'CONCLUSION') {
      await prisma.healthRecord.update({
        where: { id: targetId },
        data: {
          concluderSignedAt: new Date(),
          concluderSignatureDataUrl: `CA:${signatureValue}`,
          concluderId: s.sub,
          concluderNameSnapshot: user.fullName,
          concluderTitleSnapshot: user.jobTitle,
          status: 'COMPLETED',
          finalizedAt: new Date(),
        },
      });
    }

    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'SMARTCA_TH_SIGNED', target: transaction.id },
    });

    return NextResponse.json({
      ok: true,
      status: 'COMPLETED',
      message: 'Ký thành công',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi' }, { status: 500 });
  }
}
