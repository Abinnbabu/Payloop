import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { newAuditId } from "@/lib/ids";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole([
      "Administrator",
      "Operations Specialist",
      "Billing Manager",
    ]);
    await initDb();
    const result = await query(
      `SELECT id, action, actor, area,
              TO_CHAR(created_at, 'Mon DD, HH:MI AM') AS time
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 100;`
    );
    return NextResponse.json({ success: true, audit: result.rows });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("any-staff");
    const body = await request.json();
    const { action, area } = body;
    if (!action || !area) {
      return NextResponse.json(
        { success: false, error: "action and area required." },
        { status: 400 }
      );
    }
    await initDb();
    const id = newAuditId();
    const result = await query(
      `INSERT INTO audit_logs (id, action, actor, area)
       VALUES ($1, $2, $3, $4)
       RETURNING id, action, actor, area,
                 TO_CHAR(created_at, 'Mon DD, HH:MI AM') AS time;`,
      [id, String(action), user.name, String(area)]
    );
    return NextResponse.json({ success: true, entry: result.rows[0] });
  } catch (err) {
    return authErrorResponse(err);
  }
}
