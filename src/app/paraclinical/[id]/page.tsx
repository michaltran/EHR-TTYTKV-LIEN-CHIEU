import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ParaclinicalPanel from '@/components/ParaclinicalPanel';
import { XETNGHIEM_CATEGORIES, CHANDOANHINHANH_CATEGORIES } from '@/lib/constants';

export default async function ParaclinicalEntryPage({ params }: { params: { id: string } }) {
  await requireAuth(['KTV_XETNGHIEM', 'KTV_CHANDOANHINHANH']);
  const user = await getCurrentUser();

  const isXN = user?.role === 'KTV_XETNGHIEM';
  const allowedCategories = isXN ? XETNGHIEM_CATEGORIES : CHANDOANHINHANH_CATEGORIES;

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      paraclinicals: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!record) notFound();

  return (
    <div className="space-y-4">
      <Link href="/paraclinical" className="text-sm text-slate-500 hover:underline">← Hàng đợi</Link>

      <div className="card flex gap-4 items-start">
        {record.employee.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={record.employee.photoUrl} alt="" className="w-20 h-24 object-cover rounded border" />
        ) : (
          <div className="w-20 h-24 bg-slate-100 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">
            Ảnh
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
          <p className="text-sm text-slate-600">
            {record.employee.department.name} •{' '}
            {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'}
            {record.employee.dateOfBirth && ` • Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Đợt: {record.examRound.name}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <strong>Chuyên môn của bạn:</strong>{' '}
        {isXN ? 'Xét nghiệm' : 'Chẩn đoán hình ảnh'} — chỉ nhập được các hạng mục:{' '}
        <strong>{allowedCategories.join(', ')}</strong>
      </div>

      <ParaclinicalPanel
        recordId={record.id}
        allowedCategories={allowedCategories}
        existing={record.paraclinicals.map((p) => ({
          id: p.id,
          category: p.category,
          testName: p.testName,
          result: p.result,
          evaluation: p.evaluation,
          note: p.note,
          fileUrl: p.fileUrl,
          fileName: p.fileName,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
