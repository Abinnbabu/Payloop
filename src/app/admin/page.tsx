import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = {
  title: "Admin Console — Payloop",
  description:
    "Payloop system administration for catalog, rules, staff access, and audit activity.",
};

export default async function AdminPage() {
  const user = await loadSessionUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if ((user.role as string) !== "Administrator") {
    redirect((user.role as string) === "Customer" ? "/dashboard" : "/staff");
  }
  return <AdminClient user={user} />;
}
