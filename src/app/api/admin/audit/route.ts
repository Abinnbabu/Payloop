import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const result = await query(
      "SELECT id, action, actor, area, TO_CHAR(created_at, 'Mon DD, HH:MI AM') AS time FROM audit_logs ORDER BY created_at DESC LIMIT 50;"
    );
    return NextResponse.json({ success: true, audit: result.rows });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, fallback: true },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, actor, area } = body;

    if (!action || !area) {
      return NextResponse.json(
        { success: false, error: "Action and area are required." },
        { status: 400 }
      );
    }

    await initDb();
    const id = `AUD-${Date.now().toString().slice(-4)}`;
    const result = await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4) RETURNING id, action, actor, area, TO_CHAR(created_at, 'Mon DD, HH:MI AM') AS time;",
      [id, action, actor || "Priya Nair", area]
    );

    return NextResponse.json({ success: true, entry: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

