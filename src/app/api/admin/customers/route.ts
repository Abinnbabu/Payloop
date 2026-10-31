import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const result = await query(
      `SELECT id, company, name, email, phone, city, tax_id AS "taxId", status, 
              active_contracts AS "activeContracts", total_spend AS "totalSpend" 
       FROM customers 
       ORDER BY created_at DESC;`
    );
    return NextResponse.json({ success: true, customers: result.rows });
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
    const { company, name, email, phone, city, taxId } = body;

    if (!company || !name || !email) {
      return NextResponse.json(
        { success: false, error: "Company, contact name, and email are required." },
        { status: 400 }
      );
    }

    await initDb();
    const id = `CUST-${Date.now().toString().slice(-4)}`;
    const result = await query(
      `INSERT INTO customers (id, company, name, email, phone, city, tax_id, status, active_contracts, total_spend)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Onboarding', 0, 0)
       RETURNING id, company, name, email, phone, city, tax_id AS "taxId", status, active_contracts AS "activeContracts", total_spend AS "totalSpend";`,
      [id, company, name, email, phone || "+91 98000 00000", city || "Bangalore", taxId || "29AABC00000A1Z0"]
    );

    // Record audit log
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Registered customer record for ${company}`, "Priya Nair", "Customer records"]
    );

    return NextResponse.json({ success: true, customer: result.rows[0] });
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Customer ID is required." }, { status: 400 });
    }

    await initDb();
    const result = await query("DELETE FROM customers WHERE id = $1 RETURNING id, company;", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    const item = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Deleted customer record for ${item.company}`, "Priya Nair", "Customer records"]
    );

    return NextResponse.json({ success: true, deleted: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
