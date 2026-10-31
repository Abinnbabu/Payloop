import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;
const PREFIX = "scrypt$";

export function hashPassword(plain: string): string {
  if (!plain) throw new Error("Cannot hash empty password");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEYLEN).toString("hex");
  return `${PREFIX}${salt}$${hash}`;
}

export function isHashed(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function verifyPassword(plain: string, stored: string | null | undefined): boolean {
  if (typeof stored !== "string" || stored.length === 0) return false;
  if (!isHashed(stored)) return plain === stored;
  const parts = stored.slice(PREFIX.length).split("$");
  const salt = parts[0];
  const expectedHex = parts[1];
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(plain, salt, KEYLEN);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
