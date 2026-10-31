import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create an account — Payloop",
  description: "Create your Payloop account.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
