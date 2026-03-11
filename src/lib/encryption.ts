import crypto from 'crypto';

// For the prototype we're using a single master key stored in an environment variable 
// to simulate the root encryption layer. In a production envelope encryption system,
// there would be multiple key encrypting keys (KEKs), a root KMS key, and data keys (DKs).
const DEMO_MASTER_KEY = process.env.NEXTAUTH_SECRET || "fL6Yd7e9jE6fR8tG0qS1zM3vA2bC5dE4h";

type EncryptedPayload = {
  encryptedData: string;
  iv: string;
  authTag: string;
};

// Ensure our master key is exactly 32 bytes for AES-256-GCM
const derivedKey = crypto.createHash('sha256').update(String(DEMO_MASTER_KEY)).digest('base64').substring(0, 32);

export function encryptString(text: string): EncryptedPayload {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptString(payload: EncryptedPayload): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm', 
    derivedKey, 
    Buffer.from(payload.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

  let decrypted = decipher.update(payload.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
