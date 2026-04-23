import crypto from 'crypto';

/**
 * Mã hoá AES-256-GCM cho dữ liệu nhạy cảm (mật khẩu SmartCA, TOTP secret).
 * Dùng AUTH_SECRET làm key, thêm IV ngẫu nhiên mỗi lần encrypt.
 */

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me-in-production-please-min32';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv).base64(tag).base64(encrypted)
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Sinh TOTP 6 số từ secret theo RFC 6238.
 * Time step = 30s, SHA-1, 6 digits.
 * Tự động nhận dạng format: base32 / base64 / hex.
 */
export function generateTotp(secretInput: string, timestamp?: number): string {
  const now = timestamp ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);

  const secret = decodeSecretToBytes(secretInput);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(counterBuf);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, '0');
}

/**
 * Nhận dạng format TOTP secret và trả về Buffer bytes thực:
 *  - base64 (chứa chữ thường / + / / hoặc kết thúc =) → decode base64,
 *    nếu kết quả là chuỗi hex thì decode tiếp hex (VNPT cung cấp dạng này)
 *  - hex thuần (chỉ 0-9A-Fa-f, độ dài chẵn) → decode hex
 *  - mặc định → base32 (chuẩn Google Authenticator)
 */
function decodeSecretToBytes(secret: string): Buffer {
  const trimmed = secret.replace(/\s+/g, '');

  // base64: chứa chữ thường, +, / hoặc kết thúc = với ký tự ngoài base32
  const hasBase64Chars = /[a-z+/]/.test(trimmed);
  const hasPaddingWithNonBase32 = trimmed.endsWith('=') && /[018-9]/.test(trimmed);
  if (hasBase64Chars || hasPaddingWithNonBase32) {
    try {
      const decoded = Buffer.from(trimmed, 'base64');
      // VNPT hay cung cấp base64(hex_string) — kiểm tra nếu kết quả là hex ASCII
      const asAscii = decoded.toString('ascii');
      if (/^[0-9A-Fa-f]+$/.test(asAscii) && asAscii.length % 2 === 0) {
        return Buffer.from(asAscii, 'hex');
      }
      return decoded;
    } catch {
      // fall through to base32
    }
  }

  // hex thuần
  if (/^[0-9A-Fa-f]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    return Buffer.from(trimmed, 'hex');
  }

  // base32 (Google Authenticator chuẩn)
  return base32Decode(trimmed.toUpperCase());
}

function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const c of str.replace(/=+$/, '')) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}
