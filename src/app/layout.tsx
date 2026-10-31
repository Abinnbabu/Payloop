import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payloop — subscriptions, in sync",
  description:
    "A calmer way to manage your subscriptions. Keep plans, payments, and invoices all in one place with Payloop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
