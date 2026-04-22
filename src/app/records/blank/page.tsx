import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PrintButton from '@/app/records/[id]/print/print-button';

// Sổ KSK trắng đúng Mẫu số 03 - dùng để in phát cho NV điền tay
export default async function BlankBookPage() {
  const s = await getSession();
  if (!s) redirect('/login');

  const blank = '...........................................................';
  const dot = '.....';

  return (
    <div className="bg-white">
      <div className="no-print bg-slate-100 p-3 flex justify-between items-center sticky top-0 z-10 border-b">
        <a href="javascript:history.back()" className="text-sm text-slate-600 hover:underline">← Quay lại</a>
        <PrintButton />
      </div>

      <div className="print-page mx-auto" style={{
        maxWidth: '210mm', padding: '15mm',
        fontFamily: 'Times New Roman, serif', fontSize: '13pt', lineHeight: 1.6,
      }}>
        <div className="text-center">
          <div className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-bold">Độc lập - Tự do - Hạnh phúc</div>
          <div>---------------</div>
        </div>
        <div className="text-right italic text-sm mt-2">Mẫu số 03</div>
        <h1 className="text-center font-bold text-xl mt-4 mb-6">SỔ KHÁM SỨC KHỎE ĐỊNH KỲ</h1>

        <table className="w-full border border-black text-sm" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top text-center" style={{ width: '28%' }}>
                <div style={{ width: '4cm', height: '6cm', border: '1px dashed #888', margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888' }}>
                  Ảnh 4 x 6 cm<br/>(đóng dấu ráp lai<br/>hoặc Scan ảnh)
                </div>
              </td>
              <td className="border border-black p-3 align-top">
                <p>1. Họ và tên <em>(viết chữ in hoa)</em>: {blank}</p>
                <p>2. Giới tính: Nam ☐ &nbsp;&nbsp; Nữ ☐</p>
                <p>3. Sinh ngày: ...../...../........ &nbsp; (Tuổi: {dot})</p>
                <p>4. Số CMND/CCCD/Định danh: {blank}</p>
                <p>5. Cấp ngày: ...../...../........ Tại: {blank}</p>
                <p>6. Chỗ ở hiện tại: {blank}</p>
                <p>Số điện thoại liên hệ: {blank}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 space-y-2">
          <p><strong>7. Nghề nghiệp:</strong> {blank}</p>
          <p><strong>8. Nơi công tác, học tập:</strong> {blank}</p>
          <p><strong>9. Ngày bắt đầu vào làm việc tại đơn vị hiện nay:</strong> ...../...../..........</p>
          <p><strong>10. Nghề, công việc trước đây</strong> (liệt kê công việc đã làm trong 10 năm gần đây, tính từ thời điểm gần nhất):</p>
          <p className="pl-4">a) {blank} thời gian: ..... năm ..... tháng từ ...../...../.... đến ...../...../....</p>
          <p className="pl-4">b) {blank} thời gian: ..... năm ..... tháng từ ...../...../.... đến ...../...../....</p>
          <p><strong>11. Tiền sử bệnh, tật của gia đình:</strong></p>
          <div className="border-b border-dashed border-slate-400 min-h-[1.5em] px-2"></div>
          <div className="border-b border-dashed border-slate-400 min-h-[1.5em] px-2"></div>
          <div className="border-b border-dashed border-slate-400 min-h-[1.5em] px-2"></div>
        </div>

        <p className="mt-4"><strong>12. Tiền sử bệnh, tật của bản thân:</strong></p>
        <table className="w-full border border-black text-sm mt-1" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="border border-black p-1" style={{ width: '35%' }}>Tên bệnh</th>
              <th className="border border-black p-1" style={{ width: '15%' }}>Phát hiện năm</th>
              <th className="border border-black p-1" style={{ width: '35%' }}>Tên bệnh nghề nghiệp</th>
              <th className="border border-black p-1" style={{ width: '15%' }}>Phát hiện năm</th>
            </tr>
          </thead>
          <tbody>
            {['a', 'b', 'c', 'd'].map(l => (
              <tr key={l}>
                <td className="border border-black p-2">{l})</td>
                <td className="border border-black p-2"></td>
                <td className="border border-black p-2">{l})</td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="w-full border border-black text-sm mt-4" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="border border-black p-3 align-top text-center" style={{ width: '50%' }}>
                <div className="font-bold">Người lao động xác nhận</div>
                <div className="italic text-xs">(Ký và ghi rõ họ, tên)</div>
                <div style={{ height: 80 }}></div>
              </td>
              <td className="border border-black p-3 align-top text-center">
                <div className="italic text-xs">......, ngày..... tháng..... năm...........</div>
                <div className="font-bold mt-1">Người lập sổ KSK định kỳ</div>
                <div className="italic text-xs">(Ký và ghi rõ họ, tên)</div>
                <div style={{ height: 70 }}></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TRANG 2 */}
        <div className="mt-6" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-center font-bold text-lg mb-4">KHÁM SỨC KHỎE ĐỊNH KỲ</h2>

          <h3 className="font-bold">I. TIỀN SỬ BỆNH, TẬT</h3>
          <p className="italic text-sm">(Bác sỹ khám sức khỏe hỏi và ghi chép)</p>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border-b border-dashed border-slate-400 min-h-[1.5em] mt-1"></div>
          ))}

          <div className="mt-4">
            <div className="font-semibold italic">Tiền sử sản phụ khoa (đối với nữ):</div>
            <div className="pl-2 text-sm space-y-1 mt-1">
              <p>- Bắt đầu thấy kinh nguyệt năm bao nhiêu tuổi: {dot}</p>
              <p>- Tính chất kinh nguyệt: Đều ☐ Không đều ☐</p>
              <p>- Chu kỳ kinh: {dot} ngày; Lượng kinh: {dot} ngày</p>
              <p>- Đau bụng kinh: Có ☐ Không ☐</p>
              <p>- Đã lập gia đình: Có ☐ Chưa ☐</p>
              <p>- PARA: {dot}</p>
              <p>- Số lần mổ sản, phụ khoa: Có ☐ Ghi rõ: {blank} Chưa ☐</p>
              <p>- Có đang áp dụng BPTT không? Có ☐ Ghi rõ: {blank} Không ☐</p>
            </div>
          </div>

          <h3 className="font-bold mt-4">II. KHÁM THỂ LỰC</h3>
          <p>Chiều cao: ........... cm; Cân nặng: ........... kg; Chỉ số BMI: ...........</p>
          <p>Mạch: ........... lần/phút; Huyết áp: ......../........ mmHg</p>
          <p>Phân loại thể lực: {blank}</p>

          <h3 className="font-bold mt-4">III. KHÁM LÂM SÀNG</h3>
          <table className="w-full border border-black text-sm mt-2" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="border border-black p-1 text-left" style={{ width: '60%' }}>Nội dung khám</th>
                <th className="border border-black p-1 text-left">Họ tên và chữ ký BS chuyên khoa</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={2} className="border border-black p-1 font-bold bg-slate-50">1. Nội khoa</td></tr>
              {[
                ['a', 'Tuần hoàn'], ['b', 'Hô hấp'], ['c', 'Tiêu hóa'], ['d', 'Thận-Tiết niệu'],
                ['đ', 'Nội tiết'], ['e', 'Cơ - xương - khớp'], ['g', 'Thần kinh'], ['h', 'Tâm thần'],
              ].map(([l, n]) => (
                <tr key={l}>
                  <td className="border border-black p-2">
                    <span className="italic">{l}) {n}</span>
                    <div style={{ minHeight: '2em' }}></div>
                    <div className="text-xs">Phân loại: .....</div>
                  </td>
                  <td className="border border-black p-2" style={{ minHeight: '3em' }}></td>
                </tr>
              ))}

              <tr>
                <td className="border border-black p-2">
                  <strong>2. Ngoại khoa, Da liễu:</strong>
                  <div className="pl-3 text-sm">- Ngoại khoa: {blank}</div>
                  <div className="pl-3 text-xs">Phân loại: .....</div>
                  <div className="pl-3 text-sm">- Da liễu: {blank}</div>
                  <div className="pl-3 text-xs">Phân loại: .....</div>
                </td>
                <td className="border border-black p-2"></td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <strong>3. Sản phụ khoa:</strong>
                  <div style={{ minHeight: '3em' }}></div>
                  <div className="text-xs">Phân loại: .....</div>
                </td>
                <td className="border border-black p-2"></td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <strong>4. Mắt:</strong>
                  <div className="pl-3 mt-1 text-sm">
                    <div className="italic text-xs">Kết quả khám thị lực:</div>
                    <div>Không kính: Mắt phải {dot} Mắt trái {dot}</div>
                    <div>Có kính: Mắt phải {dot} Mắt trái {dot}</div>
                    <div className="italic text-xs mt-1">Các bệnh về mắt (nếu có):</div>
                    <div style={{ minHeight: '1.5em' }}></div>
                    <div className="text-xs">Phân loại: .....</div>
                  </div>
                </td>
                <td className="border border-black p-2"></td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <strong>5. Tai - Mũi - Họng:</strong>
                  <div className="pl-3 mt-1 text-sm">
                    <div className="italic text-xs">Kết quả khám thính lực:</div>
                    <div>Tai trái: Nói thường ....... m; Nói thầm ....... m</div>
                    <div>Tai phải: Nói thường ....... m; Nói thầm ....... m</div>
                    <div className="italic text-xs mt-1">Các bệnh về tai mũi họng (nếu có):</div>
                    <div style={{ minHeight: '1.5em' }}></div>
                    <div className="text-xs">Phân loại: .....</div>
                  </div>
                </td>
                <td className="border border-black p-2"></td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <strong>6. Răng - Hàm - Mặt:</strong>
                  <div className="pl-3 mt-1 text-sm">
                    <div>Hàm trên: {blank}</div>
                    <div>Hàm dưới: {blank}</div>
                    <div className="italic text-xs mt-1">Các bệnh về răng hàm mặt (nếu có):</div>
                    <div style={{ minHeight: '1.5em' }}></div>
                    <div className="text-xs">Phân loại: .....</div>
                  </div>
                </td>
                <td className="border border-black p-2"></td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-bold mt-4">IV. KHÁM CẬN LÂM SÀNG</h3>
          <div className="border border-black p-2 text-sm">
            <p className="italic text-xs">Xét nghiệm huyết học/sinh hóa/X-quang và các xét nghiệm khác khi có chỉ định:</p>
            <p className="mt-2"><strong>a) Kết quả:</strong></p>
            <p>- Công thức máu: {blank}</p>
            <p>- Sinh hoá: {blank}</p>
            <p>- Miễn dịch: {blank}</p>
            <p>- Điện tim: {blank}</p>
            <p>- X-quang: {blank}</p>
            <p>- Siêu âm: {blank}</p>
            <p className="mt-2"><strong>b) Đánh giá:</strong></p>
            <div className="border-b border-dashed border-slate-400 min-h-[1.5em]"></div>
            <div className="border-b border-dashed border-slate-400 min-h-[1.5em]"></div>
          </div>

          <h3 className="font-bold mt-4">V. KẾT LUẬN</h3>
          <p><strong>1. Phân loại sức khỏe:</strong> {blank}</p>
          <p><strong>2. Các bệnh, tật (nếu có):</strong></p>
          {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-dashed border-slate-400 min-h-[1.5em] mt-1"></div>
          ))}

          <div className="flex justify-end mt-10">
            <div className="text-center">
              <div className="italic text-sm">......, ngày..... tháng..... năm...........</div>
              <div className="font-bold mt-1">NGƯỜI KẾT LUẬN</div>
              <div className="italic text-sm">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div style={{ height: 90 }}></div>
            </div>
          </div>

          <hr className="mt-6 border-slate-300" />
          <p className="text-xs text-slate-500 italic mt-1">
            <sup>1</sup> Phân loại sức khỏe theo quy định của Bộ Y tế.{' '}
            <sup>2</sup> Ghi rõ các bệnh, tật, phương án điều trị, phục hồi chức năng (nếu có).
          </p>
          <p className="text-center text-xs text-slate-400 mt-4 italic">
            Software Copyright Powered by Dat Dat
          </p>
        </div>
      </div>
    </div>
  );
}
