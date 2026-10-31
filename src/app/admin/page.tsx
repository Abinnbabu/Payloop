import type { Metadata } from "next";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Admin Console — Payloop",
  description: "Payloop system administration for catalog, rules, staff access, and audit activity.",
};

export default function AdminPage() {
  return <AdminClient />;
}
