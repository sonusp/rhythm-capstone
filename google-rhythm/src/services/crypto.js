// src/services/crypto.js

// Derives a 256-bit AES-GCM key from a user password using PBKDF2
const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Derives the vault key once and returns the key and salt to be held in memory.
 */
export const deriveVaultKey = async (password) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  return { key, salt };
};

/**
 * Encrypts a JSON object using a pre-derived in-memory key (saves CPU).
 */
export const encryptVaultWithKey = async (dataObj, vaultKeyObj) => {
  try {
    const { key, salt } = vaultKeyObj;
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(dataObj));

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    const encryptedBuffer = new Uint8Array(encryptedContent);
    const finalPayload = new Uint8Array(salt.length + iv.length + encryptedBuffer.length);
    
    finalPayload.set(salt, 0);
    finalPayload.set(iv, salt.length);
    finalPayload.set(encryptedBuffer, salt.length + iv.length);

    let binary = '';
    for (let i = 0; i < finalPayload.byteLength; i++) {
      binary += String.fromCharCode(finalPayload[i]);
    }
    const base64Str = btoa(binary);
    return base64Str;
  } catch (error) {
    console.error("Encryption with key failed:", error);
    throw new Error("Failed to encrypt data.");
  }
};

/**
 * Encrypts a JSON object into a safe Base64 string for file export.
 * This does the full derivation + encryption in one shot.
 */
export const encryptVault = async (dataObj, password) => {
  const vaultKeyObj = await deriveVaultKey(password);
  return await encryptVaultWithKey(dataObj, vaultKeyObj);
};

/**
 * Decrypts a Base64 string back into the original JSON object.
 */
export const decryptVault = async (base64Str, password) => {
  try {
    const cleanBase64 = base64Str.replace(/\s+/g, '');
    const binaryStr = atob(cleanBase64);
    const finalPayload = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      finalPayload[i] = binaryStr.charCodeAt(i);
    }

    const salt = finalPayload.slice(0, 16);
    const iv = finalPayload.slice(16, 28);
    const encryptedData = finalPayload.slice(28);

    const key = await deriveKey(password, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    const decryptedString = dec.decode(decryptedContent);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Incorrect password or corrupted file.");
  }
};

/**
 * Hashes a simple string (like a PIN) using SHA-256 for secure local verification
 */
export const hashString = async (str) => {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
