import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = String(body.email ?? "").trim();
    const rawPassword = String(body.password ?? "");

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { success: false, error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    // 1. Direct Admin Credentials Validation (.env)
    if (email === adminEmail) {
      if (rawPassword === adminPassword) {
        const adminUser = {
          id: "USR-ADMIN-01",
          email: rawEmail,
          role: "Administrator",
          name: "Priya Nair",
          permissions: "All powers",
        };
        const response = NextResponse.json({
          success: true,
          redirect: "/admin",
          user: adminUser,
        });

        // Set session cookies
        response.cookies.set("payloop_role", "Administrator", {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });
        response.cookies.set("payloop_user", JSON.stringify(adminUser), {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });

        return response;
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid password for administrator account." },
          { status: 401 }
        );
      }
    }

    // 2. PostgreSQL Database User Verification (Dynamic Staff and Custom Accounts)
    try {
      await initDb();
      const res = await query(
        "SELECT id, name, email, password, role, status, permissions FROM users WHERE LOWER(email) = $1 LIMIT 1;",
        [email]
      );
      if (res.rows.length > 0) {
        const user = res.rows[0];
        if (user.password === rawPassword) {
          const isStaffRole =
            user.role !== "Administrator" && user.role !== "Customer";

          const redirect =
            user.role === "Administrator"
              ? "/admin"
              : isStaffRole
              ? "/staff"
              : "/dashboard";

          const userInfo = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            status: user.status,
            permissions: user.permissions || "Standard operations",
          };

          const response = NextResponse.json({
            success: true,
            redirect,
            user: userInfo,
          });

          response.cookies.set("payloop_role", user.role, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
          });
          response.cookies.set("payloop_user", JSON.stringify(userInfo), {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
          });

          return response;
        } else {
          return NextResponse.json(
            { success: false, error: "Incorrect password for this user account." },
            { status: 401 }
          );
        }
      }
    } catch {
      // Continue to static fallback if database query fails
    }

    // 3. Fallback Staff Credentials Validation
    const staffEmail = (process.env.STAFF_EMAIL || "staff@payloop.internal").toLowerCase();
    const staffPassword = process.env.STAFF_PASSWORD || "staff";
    if (email === staffEmail || email === "siddharth.rao@payloop.internal") {
      if (rawPassword === staffPassword || rawPassword === "staff" || rawPassword === "admin") {
        const staffUser = {
          id: "USR-STAFF-01",
          email: rawEmail,
          role: "Operations Specialist",
          name: "Siddharth Rao",
          permissions: "Customer records, Subscriptions & Quotes, Invoices & Billing",
        };
        const response = NextResponse.json({
          success: true,
          redirect: "/staff",
          user: staffUser,
        });
        response.cookies.set("payloop_role", "Operations Specialist", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });
        response.cookies.set("payloop_user", JSON.stringify(staffUser), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });
        return response;
      }
    }

    // 4. Default Customer Fallback for Demo
    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
      user: {
        email: rawEmail,
        role: "Customer",
        name: "Aanya Mehta",
      },
    });
    response.cookies.set("payloop_role", "Customer", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}

