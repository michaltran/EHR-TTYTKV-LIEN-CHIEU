/**
 * VNPT SmartCA API client
 * Tham khảo: Kich_ban_tich_hop_smartca_v4_1.pdf
 *
 * Môi trường:
 *  - UAT:        https://rmgateway.vnptit.vn/sca/sp769
 *  - Production: https://gwsca.vnpt.vn/sca/sp769
 *
 * ENV cần set trên Vercel:
 *  VNPT_SCA_URL          (bắt buộc — URL base, không slash cuối)
 *  VNPT_SCA_SP_ID        (bắt buộc — do VNPT cấp)
 *  VNPT_SCA_SP_PASSWORD  (bắt buộc — do VNPT cấp)
 */

const DEFAULT_URL = 'https://rmgateway.vnptit.vn/sca/sp769';

function cfg() {
  const baseUrl = (process.env.VNPT_SCA_URL || DEFAULT_URL).replace(/\/+$/, '');
  const spId = process.env.VNPT_SCA_SP_ID;
  const spPassword = process.env.VNPT_SCA_SP_PASSWORD;
  if (!spId || !spPassword) {
    throw new Error('Chưa cấu hình VNPT_SCA_SP_ID / VNPT_SCA_SP_PASSWORD');
  }
  return { baseUrl, spId, spPassword };
}

async function call(path: string, body: any) {
  const { baseUrl, spId, spPassword } = cfg();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sp_id: spId, sp_password: spPassword, ...body }),
  });
  const data = await res.json();
  if (!res.ok || data?.status_code >= 400) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(`SmartCA: ${msg}`);
  }
  return data;
}

export type Certificate = {
  cert_id: string;
  service_type?: string;
  service_name?: string;
  cert_status?: string;
  serial_number: string;
  cert_subject?: string;
  cert_valid_from?: string;
  cert_valid_to?: string;
  cert_data?: string;
};

/** 3.2 Lấy thông tin chứng thư số thuê bao */
export async function getCertificate(userCccd: string, transactionId: string): Promise<Certificate[]> {
  const res = await call('/v1/credentials/get_certificate', {
    user_id: userCccd,
    serial_number: '',
    transaction_id: transactionId,
  });
  const certs: Certificate[] = res?.data?.user_certificates ?? [];
  // Giữ lại chứng thư chưa hết hạn; không filter theo cert_status text vì VNPT
  // trả về code số (1/0) hoặc tiếng Anh (ACTIVE/REVOKED), không phải tiếng Việt.
  return certs.filter((c) => {
    if (c.cert_status !== undefined && c.cert_status !== null) {
      const s = String(c.cert_status).toLowerCase();
      // Chỉ loại bỏ nếu chắc chắn bị thu hồi / không hoạt động
      if (s === '0' || s === 'revoked' || s === 'inactive' || s === 'suspended' ||
          s.includes('thu hồi') || s.includes('tạm khóa')) return false;
    }
    if (c.cert_valid_to) {
      const validTo = new Date(c.cert_valid_to);
      if (!isNaN(validTo.getTime()) && validTo.getTime() < Date.now()) return false;
    }
    return true;
  });
}

export type SignRequest = {
  userCccd: string;
  transactionId: string;           // mã giao dịch do chúng ta tạo (unique)
  transactionDesc?: string;
  serialNumber: string;
  files: Array<{
    doc_id: string;
    data_to_be_signed: string;     // SHA256 hex của document
    file_type?: string;            // 'pdf' | 'xml' | 'json' | ...
    sign_type?: 'hash' | 'file';
  }>;
};

export type SignResponse = {
  transaction_id: string;  // Mã GD VNPT trả về
  tran_code: string;
};

/** 3.3 Gửi yêu cầu ký số - user sẽ nhận thông báo trên app VNPT SmartCA */
export async function requestSign(req: SignRequest): Promise<SignResponse> {
  const sign_files = req.files.map((f) => ({
    file_type: f.file_type || 'pdf',
    data_to_be_signed: f.data_to_be_signed,
    doc_id: f.doc_id,
    sign_type: f.sign_type || 'hash',
  }));
  const res = await call('/v1/signatures/sign', {
    user_id: req.userCccd,
    transaction_id: req.transactionId,
    transaction_desc: req.transactionDesc || 'Ký sổ KSK định kỳ',
    serial_number: req.serialNumber,
    sign_files,
    time_stamp: formatTimestamp(new Date()),
  });
  return res.data;
}

export type SignStatusResponse = {
  transaction_id: string;
  signatures: Array<{
    doc_id: string;
    signature_value: string | null;
    timestamp_signature: string | null;
  }>;
};

/** 3.4 Kiểm tra trạng thái giao dịch ký (polling) */
export async function getSignStatus(tranCode: string): Promise<SignStatusResponse | null> {
  const { baseUrl, spId, spPassword } = cfg();
  // Theo tài liệu: POST /v1/signatures/sign/{tranId}/status
  const res = await fetch(`${baseUrl}/v1/signatures/sign/${encodeURIComponent(tranCode)}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sp_id: spId, sp_password: spPassword }),
  });
  const data = await res.json();
  if (data?.status_code === 200 && data?.data?.signatures?.length > 0) {
    // Kiểm tra có signature_value thực sự hay chưa
    const hasSig = data.data.signatures.some((s: any) => s.signature_value);
    if (hasSig) return data.data as SignStatusResponse;
  }
  return null; // chưa xong
}

function formatTimestamp(d: Date): string {
  // YYYYMMddHHmmSS
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export function isConfigured(): boolean {
  return !!(process.env.VNPT_SCA_SP_ID && process.env.VNPT_SCA_SP_PASSWORD);
}

// ============ SMARTCA TH (TÍCH HỢP) - Mục 4 trong tài liệu ============
// Khác biệt với v1: không cần app điện thoại xác nhận, dùng password + OTP

export type SignThRequest = {
  userCccd: string;
  userPassword: string;        // Mật khẩu SmartCA
  otp: string;                 // OTP 6 số (sinh từ TOTP secret)
  transactionId: string;
  transactionDesc?: string;
  serialNumber: string;
  files: Array<{ doc_id: string; data_to_be_signed: string; file_type?: string; sign_type?: 'hash' | 'file' }>;
};

export type SignThResponse = {
  transaction_id: string;
  tran_code: string;
  sad: string;                 // Activation data (dùng cho confirm)
  expired_in: number;
};

/** 4.3 Gửi yêu cầu ký với SmartCA TH (không cần app xác nhận) */
export async function requestSignTh(req: SignThRequest): Promise<SignThResponse> {
  const sign_files = req.files.map((f) => ({
    file_type: f.file_type || 'pdf',
    data_to_be_signed: f.data_to_be_signed,
    doc_id: f.doc_id,
    sign_type: f.sign_type || 'hash',
  }));
  const res = await call('/v2/signatures/sign', {
    user_id: req.userCccd,
    password: req.userPassword,
    otp: req.otp,
    transaction_id: req.transactionId,
    transaction_desc: req.transactionDesc || 'Ký sổ KSK định kỳ',
    serial_number: req.serialNumber,
    sign_files,
    time_stamp: formatTimestamp(new Date()),
  });
  return res.data;
}

export type ConfirmThResponse = {
  transaction_id: string;
  expired_in: number;
  signatures: Array<{ doc_id: string; signature_value: string; timestamp_signature: string | null }>;
};

/** 4.4 Xác nhận và nhận chữ ký (ngay lập tức, không cần chờ) */
export async function confirmSignTh(params: {
  userCccd: string;
  userPassword: string;
  sad: string;
  transactionId: string;
}): Promise<ConfirmThResponse> {
  const res = await call('/v2/signatures/confirm', {
    user_id: params.userCccd,
    password: params.userPassword,
    sad: params.sad,
    transaction_id: params.transactionId,
  });
  return res.data;
}
