import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const result = await query(
      `SELECT id, name, email, role, status, 
              COALESCE(permissions, 'Customer records, Subscriptions & Quotes, Invoices & Billing') AS permissions, 
              TO_CHAR(created_at, 'Mon DD, YYYY') AS "createdAt" 
       FROM users 
       WHERE role != 'Customer' 
       ORDER BY created_at ASC;`
    );
    return NextResponse.json({ success: true, staff: result.rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, permissions } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and initial password are required." },
        { status: 400 }
      );
    }

    await initDb();
    const id = `USR-${Date.now().toString().slice(-4)}`;
    const assignedRole = role || "Operations Specialist";
    const assignedPowers = Array.isArray(permissions)
      ? permissions.join(", ")
      : String(permissions || "Customer records, Subscriptions & Quotes");

    const result = await query(
      `INSERT INTO users (id, name, email, password, role, status, permissions)
       VALUES ($1, $2, $3, $4, $5, 'Active', $6)
       ON CONFLICT (email) DO UPDATE SET 
         name = $2, 
         password = $4, 
         role = $5, 
         permissions = $6, 
         status = 'Active'
       RETURNING id, name, email, role, status, permissions;`,
      [id, name.trim(), email.trim().toLowerCase(), password, assignedRole, assignedPowers]
    );

    // Record audit log
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [
        `AUD-${Date.now().toString().slice(-4)}`,
        `Added staff profile for ${name} (${assignedRole}) with permissions [${assignedPowers}]`,
        "Priya Nair",
        "Staff access",
      ]
    );

    return NextResponse.json({ success: true, staff: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff member ID is required." }, { status: 400 });
    }

    if (id === "USR-ADMIN-01") {
      return NextResponse.json({ success: false, error: "Cannot delete master administrator account." }, { status: 403 });
    }

    await initDb();
    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id, name, email;", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    const deleted = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Revoked staff access for ${deleted.name} (${deleted.email})`, "Priya Nair", "Staff access"]
    );

    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, role, permissions, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    await initDb();
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (role) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (permissions) {
      updates.push(`permissions = $${idx++}`);
      values.push(Array.isArray(permissions) ? permissions.join(", ") : permissions);
    }
    if (status) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update." }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, name, email, role, status, permissions;`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    const member = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Updated staff permissions for ${member.name}`, "Priya Nair", "Staff access"]
    );

    return NextResponse.json({ success: true, staff: member });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

