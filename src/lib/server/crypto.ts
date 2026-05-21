import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "$env/dynamic/private";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  if (!env.TOKEN_ENCRYPTION_KEY) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  }
  const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

export function encryptJson<T>(value: T): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(value);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToJson(payload: string): unknown {
  const key = getEncryptionKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  try {
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    throw new Error("Invalid encrypted JSON payload");
  }
}
