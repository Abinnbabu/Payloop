import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth";
import { DashboardClient } from "@/app/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Your account — Payloop",
};

export default async function DashboardPage() {
  const user = await loadSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  return <DashboardClient user={user} />;
}
