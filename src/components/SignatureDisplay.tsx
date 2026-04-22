type Props = {
  signatureDataUrl?: string | null;
  name?: string | null;
  title?: string | null;
  signedAt?: string | Date | null;
  compact?: boolean;
};

/**
 * Hiển thị chữ ký đã ký kèm metadata: ảnh + họ tên + chức danh + thời gian.
 * Dùng ở cả trang khám (preview) và trang in (Mẫu số 03).
 */
export default function SignatureDisplay({ signatureDataUrl, name, title, signedAt, compact }: Props) {
  if (!signatureDataUrl && !name) {
    return <div className="text-xs text-slate-400 italic">Chưa ký</div>;
  }

  const time = signedAt ? new Date(signedAt) : null;
  const timeStr = time
    ? `${time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${time.toLocaleDateString('vi-VN')}`
    : '';

  if (compact) {
    return (
      <div className="text-xs text-slate-600">
        {signatureDataUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={signatureDataUrl} alt="" className="inline-block align-middle" style={{ maxHeight: 28 }} />
        )}
        <span className="ml-2">{name}{title && ` (${title})`}{timeStr && ` — ${timeStr}`}</span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="italic text-xs text-slate-600 mb-1">
        {time && `Ký lúc ${timeStr}`}
      </div>
      <div style={{ minHeight: 60 }} className="flex items-center justify-center">
        {signatureDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={signatureDataUrl} alt="" style={{ maxHeight: 60, maxWidth: 200 }} />
        ) : (
          <div className="text-xs text-slate-400">(chưa có chữ ký)</div>
        )}
      </div>
      <div className="font-semibold text-sm">{name}</div>
      {title && <div className="text-xs text-slate-600 italic">{title}</div>}
    </div>
  );
}
