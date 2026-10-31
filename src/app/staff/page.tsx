import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth";
import { StaffClient } from "./staff-client";

export const metadata: Metadata = {
  title: "Staff Workspace — Payloop",
  description:
    "Daily operations dashboard for Payloop staff: customer management, quote generation, subscriptions lifecycle, invoicing, and payment reconciliation.",
};

export const dynamic = "force-dynamic"; // never cache an auth-gated page

export default async function StaffPage() {
  // 1. Load the session without letting an auth-layer throw bypass the guard.
  let user = null;
  try {
    user = await loadSessionUser();
  } catch (err) {
    // Log but do NOT rethrow — a failed session load is an unauthenticated user.
    console.error("[staff] loadSessionUser failed:", err);
    user = null;
  }

  // 2. Unauthenticated → login, preserving the return path.
  //    redirect() throws NEXT_REDIRECT; it must stay OUTSIDE try/catch.
  if (!user) {
    redirect("/login?next=/staff");
  }

  // 3. Customers must never reach the staff workspace.
  //    Case-insensitive so "customer" / "Customer" / "CUSTOMER" all match.
  if (user.role?.toLowerCase() === "customer") {
    redirect("/dashboard");
  }

  // 4. TS: user is narrowed to non-null because redirect() is typed `never`.
  return <StaffClient user={user} />;
}