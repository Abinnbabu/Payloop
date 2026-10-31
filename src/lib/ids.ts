import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeId(prefix: string, length = 4): string {
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  return `${prefix}-${out}`;
}

export const newAuditId = () => makeId("AUD", 6);
export const newProductId = () => makeId("PROD", 4);
export const newCustomerId = () => makeId("CUST", 4);
export const newUserId = () => makeId("USR", 4);
export const newTaxId = () => makeId("TAX", 4);
export const newDiscountId = () => makeId("DISC", 4);
export const newSubId = () => makeId("SUB", 6);
export const newInvoiceId = () => makeId("INV", 6);
export const newPaymentId = () => makeId("PAY", 4);
