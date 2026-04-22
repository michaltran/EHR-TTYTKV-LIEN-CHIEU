import { XETNGHIEM_CATEGORIES, CHANDOANHINHANH_CATEGORIES } from '@/lib/constants';

type Paraclinical = {
  id: string;
  category: string;
  testName: string;
  result: string | null;
  evaluation: string | null;
  fileUrl: string | null;
  fileName: string | null;
};

type Props = {
  existing: Paraclinical[];
};

/**
 * Hiển thị kết quả CLS đã nhập cho bác sĩ xem (read-only).
 * Không cho nhập mới — KTV riêng lo phần đó.
 * Luôn hiển thị đủ 6 hạng mục, nếu chưa có thì để trống với vị trí ký tay.
 */
export default function ParaclinicalViewOnly({ existing }: Props) {
  const allCategories = [...XETNGHIEM_CATEGORIES, ...CHANDOANHINHANH_CATEGORIES];
  const byCategory: Record<string, Paraclinical[]> = {};
  for (const cat of allCategories) byCategory[cat] = [];
  for (const p of existing) {
    if (byCategory[p.category]) byCategory[p.category].push(p);
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">IV. Kết quả cận lâm sàng <span className="text-xs text-slate-500 font-normal">(KTV nhập, bác sĩ xem)</span></h2>

      <div className="space-y-2">
        {allCategories.map((cat) => {
          const items = byCategory[cat];
          const isXN = XETNGHIEM_CATEGORIES.includes(cat);
          return (
            <div key={cat} className={`border rounded p-3 ${items.length > 0 ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm">
                  {cat}
                  <span className="ml-2 text-[10px] text-slate-500">
                    ({isXN ? 'KTV Xét nghiệm' : 'KTV CĐHA'})
                  </span>
                </div>
                {items.length === 0 && (
                  <span className="text-xs text-amber-700">Chưa có kết quả</span>
                )}
              </div>
              {items.length === 0 ? (
                <div className="text-xs text-slate-600 italic">
                  Vị trí cho KTV điền kết quả: <span className="inline-block border-b border-dashed border-slate-400 min-w-[200px] h-4"></span>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((p) => (
                    <div key={p.id} className="text-sm">
                      {p.testName && p.testName !== cat && <span className="text-slate-500">{p.testName}: </span>}
                      <span>{p.result ?? '—'}</span>
                      {p.evaluation && <span className="text-slate-600 italic ml-2">({p.evaluation})</span>}
                      {p.fileUrl && (
                        <a href={p.fileUrl} target="_blank" rel="noopener" className="ml-2 text-brand-600 hover:underline text-xs">
                          📎 {p.fileName || 'File'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 italic">
        💡 Nếu hạng mục còn trống, bác sĩ có thể ghi tay trên bản in Mẫu số 03 hoặc yêu cầu KTV bổ sung trước khi kết luận.
      </p>
    </div>
  );
}
