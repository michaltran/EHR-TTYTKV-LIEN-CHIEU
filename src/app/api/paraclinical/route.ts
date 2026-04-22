import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Giới hạn kích thước file (10MB)
const MAX_SIZE = 10 * 1024 * 1024;

/**
 * POST multipart/form-data với:
 *   recordId (string)
 *   category (string) - VD: "Công thức máu", "Sinh hóa"
 *   testName (string)
 *   result (string) - kết quả text
 *   evaluation (string) - đánh giá
 *   note (string)
 *   file (File, optional) - PDF/JPG/PNG kết quả scan
 */
export async function POST(req: Request) {
  try {
    const session = await requireAuth(['DOCTOR', 'ADMIN', 'KTV_XETNGHIEM', 'KTV_CHANDOANHINHANH']);

    const formData = await req.formData();
    const recordId = formData.get('recordId') as string;
    const category = formData.get('category') as string;
    const testName = formData.get('testName') as string;
    const result = formData.get('result') as string;
    const evaluation = formData.get('evaluation') as string;
    const note = formData.get('note') as string;
    const file = formData.get('file') as File | null;

    if (!recordId || !category) {
      return NextResponse.json({ error: 'Thiếu recordId hoặc category' }, { status: 400 });
    }

    // Validate: KTV chỉ được nhập hạng mục thuộc chuyên môn của mình
    const XN = ['Công thức máu', 'Sinh hoá', 'Miễn dịch'];
    const CDHA = ['Điện tim', 'X-quang', 'Siêu âm'];
    if (session.role === 'KTV_XETNGHIEM' && !XN.includes(category)) {
      return NextResponse.json({
        error: `KTV Xét nghiệm không được nhập hạng mục "${category}". Liên hệ KTV Chẩn đoán hình ảnh.`,
      }, { status: 403 });
    }
    if (session.role === 'KTV_CHANDOANHINHANH' && !CDHA.includes(category)) {
      return NextResponse.json({
        error: `KTV CĐHA không được nhập hạng mục "${category}". Liên hệ KTV Xét nghiệm.`,
      }, { status: 403 });
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    // Upload file lên Vercel Blob nếu có
    if (file && file.size > 0) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File vượt quá 10MB' }, { status: 400 });
      }

      // Nếu không có token → lưu base64 vào DB (fallback cho dev local)
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        const buf = Buffer.from(await file.arrayBuffer());
        fileUrl = `data:${file.type};base64,${buf.toString('base64')}`;
        fileName = file.name;
      } else {
        const ext = file.name.split('.').pop() || 'bin';
        const safeName = `paraclinical/${recordId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await put(safeName, file, { access: 'public' });
        fileUrl = blob.url;
        fileName = file.name;
      }
    }

    const created = await prisma.paraclinical.create({
      data: {
        recordId,
        category,
        testName: testName || category,
        result: result || null,
        evaluation: evaluation || null,
        note: note || null,
        fileUrl,
        fileName,
      },
    });

    return NextResponse.json({ ok: true, id: created.id, fileUrl, fileName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth(['DOCTOR', 'ADMIN', 'KTV_XETNGHIEM', 'KTV_CHANDOANHINHANH']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });

    // KTV chỉ được xóa mục thuộc chuyên môn của mình
    if (session.role === 'KTV_XETNGHIEM' || session.role === 'KTV_CHANDOANHINHANH') {
      const existing = await prisma.paraclinical.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

      const XN = ['Công thức máu', 'Sinh hoá', 'Miễn dịch'];
      const CDHA = ['Điện tim', 'X-quang', 'Siêu âm'];
      if (session.role === 'KTV_XETNGHIEM' && !XN.includes(existing.category)) {
        return NextResponse.json({ error: 'Không có quyền xóa hạng mục này' }, { status: 403 });
      }
      if (session.role === 'KTV_CHANDOANHINHANH' && !CDHA.includes(existing.category)) {
        return NextResponse.json({ error: 'Không có quyền xóa hạng mục này' }, { status: 403 });
      }
    }

    await prisma.paraclinical.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
