import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Reset password — Payloop",
  description: "Request a password reset for your Payloop account.",
};

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
