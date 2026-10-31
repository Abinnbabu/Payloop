import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in — Payloop",
  description: "Log in to your Payloop customer account.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
