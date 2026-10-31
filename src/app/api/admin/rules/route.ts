import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const taxes = await query("SELECT id, name, rate, scope, active FROM taxes ORDER BY created_at ASC;");
    const discounts = await query(
      "SELECT id, name, type, value, redemption_limit AS limit, active FROM discounts ORDER BY created_at ASC;"
    );
    return NextResponse.json({
      success: true,
      taxes: taxes.rows,
      discounts: discounts.rows,
    });
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
    const { kind, name, rate, scope, type, value, limit } = body;

    if (!kind || !name) {
      return NextResponse.json(
        { success: false, error: "Rule kind and name are required." },
        { status: 400 }
      );
    }

    await initDb();

    if (kind === "tax") {
      const taxRate = Number(rate);
      if (isNaN(taxRate)) {
        return NextResponse.json({ success: false, error: "Valid tax rate required." }, { status: 400 });
      }
      const id = `TAX-${Date.now().toString().slice(-4)}`;
      const result = await query(
        `INSERT INTO taxes (id, name, rate, scope, active)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, name, rate, scope, active;`,
        [id, name.trim(), taxRate, scope || "Domestic standard"]
      );

      await query(
        "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
        [`AUD-${Date.now().toString().slice(-4)}`, `Created tax rule ${name} (${taxRate}%)`, "Priya Nair", "Tax rules"]
      );

      return NextResponse.json({ success: true, tax: result.rows[0] });
    } else if (kind === "discount") {
      const discValue = Number(value);
      const discLimit = Number(limit) || 100;
      if (isNaN(discValue)) {
        return NextResponse.json({ success: false, error: "Valid discount value required." }, { status: 400 });
      }
      const id = `DISC-${Date.now().toString().slice(-4)}`;
      const result = await query(
        `INSERT INTO discounts (id, name, type, value, redemption_limit, active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, name, type, value, redemption_limit AS limit, active;`,
        [id, name.trim().toUpperCase(), type || "Percentage", discValue, discLimit]
      );

      await query(
        "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
        [`AUD-${Date.now().toString().slice(-4)}`, `Created discount scheme ${name}`, "Priya Nair", "Discounts"]
      );

      return NextResponse.json({ success: true, discount: result.rows[0] });
    }

    return NextResponse.json({ success: false, error: "Unknown rule kind." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { kind, id, active } = body;

    if (!kind || !id || typeof active !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 }
      );
    }

    await initDb();
    const table = kind === "tax" ? "taxes" : "discounts";
    const res = await query(`UPDATE ${table} SET active = $1 WHERE id = $2 RETURNING id, name, active;`, [active, id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Rule not found." }, { status: 404 });
    }

    const item = res.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `${active ? "Enabled" : "Disabled"} ${item.name}`, "Priya Nair", kind === "tax" ? "Tax rules" : "Discounts"]
    );

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const id = searchParams.get("id");

    if (!kind || !id) {
      return NextResponse.json({ success: false, error: "Kind and rule id are required." }, { status: 400 });
    }

    await initDb();
    const table = kind === "tax" ? "taxes" : "discounts";
    const result = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id, name;`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Rule not found." }, { status: 404 });
    }

    const item = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Deleted ${kind === "tax" ? "tax rule" : "discount"} ${item.name}`, "Priya Nair", kind === "tax" ? "Tax rules" : "Discounts"]
    );

    return NextResponse.json({ success: true, deleted: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
