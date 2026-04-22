import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Webhook VNPT SmartCA gọi khi user xác nhận ký trên app
 * Theo tài liệu mục 3.5:
 * {
 *   sp_id, status_code, message, transaction_id,
 *   signed_files: [{ doc_id, signature_value, timestamp_signature }]
 * }
 *
 * URL webhook: https://<your-domain>/api/smartca/webhook
 * Cung cấp URL này cho VNPT khi đăng ký SP.
 *
 * Chú ý: middleware.ts đã cho phép /api/smartca/webhook (không yêu cầu auth).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transaction_id, signed_files, status_code, message } = body;

    if (!transaction_id || !signed_files) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Tìm giao dịch theo vnptTranId
    const tx = await prisma.caSignTransaction.findFirst({
      where: { vnptTranId: transaction_id },
    });
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Nếu đã xử lý
    if (tx.status === 'COMPLETED') return NextResponse.json({ ok: true });

    const sig = signed_files?.[0];
    const signatureValue = sig?.signature_value;

    if (!signatureValue || status_code !== 200) {
      await prisma.caSignTransaction.update({
        where: { id: tx.id },
        data: { status: 'FAILED', errorMessage: message || 'Unknown' },
      });
      return NextResponse.json({ ok: true });
    }

    await prisma.caSignTransaction.update({
      where: { id: tx.id },
      data: { status: 'COMPLETED', signatureValue, completedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: tx.userId } });
    if (tx.targetType === 'CLINICAL_EXAM') {
      let recordId = tx.targetId;
      let specialty: any = null;
      if (tx.targetId.includes('::')) {
        [recordId, specialty] = tx.targetId.split('::');
      }

      if (specialty) {
        await prisma.examClinical.upsert({
          where: { recordId_specialty: { recordId, specialty } },
          create: {
            recordId, specialty,
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: tx.userId,
            doctorNameSnapshot: user?.fullName,
            doctorTitleSnapshot: user?.jobTitle,
          },
          update: {
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: tx.userId,
            doctorNameSnapshot: user?.fullName,
            doctorTitleSnapshot: user?.jobTitle,
          },
        });
      } else {
        await prisma.examClinical.update({
          where: { id: tx.targetId },
          data: {
            signedAt: new Date(),
            signatureDataUrl: `CA:${signatureValue}`,
            doctorId: tx.userId,
            doctorNameSnapshot: user?.fullName,
            doctorTitleSnapshot: user?.jobTitle,
          },
        });
      }
    } else if (tx.targetType === 'CONCLUSION') {
      await prisma.healthRecord.update({
        where: { id: tx.targetId },
        data: {
          concluderSignedAt: new Date(),
          concluderSignatureDataUrl: `CA:${signatureValue}`,
          concluderId: tx.userId,
          concluderNameSnapshot: user?.fullName,
          concluderTitleSnapshot: user?.jobTitle,
          status: 'COMPLETED',
          finalizedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('SmartCA webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
