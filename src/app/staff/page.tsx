import type { Metadata } from "next";
import { StaffClient } from "./staff-client";

export const metadata: Metadata = {
  title: "Staff Workspace — Payloop",
  description:
    "Daily operations dashboard for Payloop staff: customer management, quote generation, subscriptions lifecycle, invoicing, and payment reconciliation.",
};

export default function StaffPage() {
  return <StaffClient />;
}

