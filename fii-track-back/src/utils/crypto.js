import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-change-me-32-bytes!!';
const KEY = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
const ALGORITHM = 'aes-256-gcm';

export function encryptText(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptText(value) {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
