// Hybrid encryption helpers for chat messages
// Uses Web Crypto API for AES, JSEncrypt for RSA

// Utility: Uint8Array <-> base64 for browser
export function uint8ToBase64(uint8) {
  return btoa(String.fromCharCode(...uint8));
}
export function base64ToUint8(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// Generate a random AES-GCM key
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message with an AES-GCM key
export async function encryptWithAESKey(aesKey, message) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(message)
  );
  return {
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
    iv: uint8ToBase64(iv)
  };
}

// Export AES key as raw bytes and encode as base64
export async function exportAESKey(aesKey) {
  const raw = await window.crypto.subtle.exportKey('raw', aesKey);
  return uint8ToBase64(new Uint8Array(raw));
}

// Encrypt AES key with a public RSA key (PEM format, using JSEncrypt)
import JSEncrypt from 'jsencrypt';
export function encryptAESKeyWithRSA(publicKey, aesKeyBase64) {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  return encrypt.encrypt(aesKeyBase64);
}
