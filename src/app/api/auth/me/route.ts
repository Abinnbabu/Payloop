import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("payloop_user");

    if (userCookie?.value) {
      try {
        const parsed = JSON.parse(userCookie.value);
        return NextResponse.json({ success: true, user: parsed });
      } catch {
        // Continue to fallback
      }
    }

    const roleCookie = cookieStore.get("payloop_role");
    if (roleCookie?.value === "Administrator") {
      return NextResponse.json({
        success: true,
        user: {
          id: "USR-ADMIN-01",
          name: "Priya Nair",
          email: process.env.ADMIN_EMAIL || "admin@gmail.com",
          role: "Administrator",
          permissions: "All powers",
        },
      });
    }

    if (roleCookie?.value && roleCookie.value !== "Customer") {
      return NextResponse.json({
        success: true,
        user: {
          id: "USR-STAFF-01",
          name: "Siddharth Rao",
          email: process.env.STAFF_EMAIL || "staff@payloop.internal",
          role: roleCookie.value,
          permissions: "Customer records, Subscriptions & Quotes, Invoices & Billing",
        },
      });
    }

    // Default staff / admin fallback
    return NextResponse.json({
      success: true,
      user: {
        id: "USR-ADMIN-01",
        name: "Priya Nair",
        email: "admin@gmail.com",
        role: "Administrator",
        permissions: "All powers",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

