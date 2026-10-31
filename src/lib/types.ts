// Single source of truth for auth types.
// auth.ts re-exports from here — do not duplicate these definitions.

export type SessionRole =
  | "Administrator"
  | "Operations Specialist"
  | "Billing Manager"
  | "Support Lead"
  | "Staff"
  | "Admin"
  | "Customer";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
  permissions: string;
};
