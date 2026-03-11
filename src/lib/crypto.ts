"use client";

/**
 * Client-side cryptographic utilities using the WebCrypto API.
 * This ensures that sensitive data is encrypted/decrypted ONLY in the browser.
 */

/**
 * Derives a cryptographic key from a master password and salt.
 * Uses PBKDF2 with SHA-256.
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM.
 * Returns the encrypted data, IV (initialization vector), and auth tag as hex strings.
 */
export async function encryptClientSide(text: string, key: CryptoKey): Promise<{ encryptedData: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // GCM standard 12-byte IV
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(text)
  );

  // Convert to hex for storage
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const encryptedHex = Array.from(encryptedArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    encryptedData: encryptedHex,
    iv: ivHex,
  };
}

/**
 * Decrypts a hex-encoded string using AES-GCM.
 */
export async function decryptClientSide(
  encryptedDataHex: string, 
  ivHex: string, 
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  
  // Convert hex strings back to byte arrays
  const encryptedData = new Uint8Array(
    encryptedDataHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );

  return decoder.decode(decryptedBuffer);
}
