import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDb();
    const result = await query(
      "SELECT id, name, description, price, interval, status, variants FROM products ORDER BY created_at DESC;"
    );
    return NextResponse.json({ success: true, products: result.rows });
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
    const { name, description, price, interval } = body;

    if (!name || typeof price !== "number") {
      return NextResponse.json(
        { success: false, error: "Product name and price are required." },
        { status: 400 }
      );
    }

    await initDb();
    const id = `PROD-${Date.now().toString().slice(-4)}`;
    const result = await query(
      `INSERT INTO products (id, name, description, price, interval, status, variants)
       VALUES ($1, $2, $3, $4, $5, 'Active', 1)
       RETURNING id, name, description, price, interval, status, variants;`,
      [id, name, description || "", price, interval || "Monthly"]
    );

    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Created product ${name}`, "Priya Nair", "Catalog"]
    );

    return NextResponse.json({ success: true, product: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "ID and new status are required." },
        { status: 400 }
      );
    }

    await initDb();
    const result = await query(
      "UPDATE products SET status = $1 WHERE id = $2 RETURNING id, name, status;",
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const prod = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `${status === "Active" ? "Activated" : "Archived"} ${prod.name}`, "Priya Nair", "Catalog"]
    );

    return NextResponse.json({ success: true, product: prod });
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
      return NextResponse.json(
        { success: false, error: "Product id is required." },
        { status: 400 }
      );
    }

    await initDb();
    const result = await query("DELETE FROM products WHERE id = $1 RETURNING id, name;", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const prod = result.rows[0];
    await query(
      "INSERT INTO audit_logs (id, action, actor, area) VALUES ($1, $2, $3, $4);",
      [`AUD-${Date.now().toString().slice(-4)}`, `Deleted product ${prod.name}`, "Priya Nair", "Catalog"]
    );

    return NextResponse.json({ success: true, deleted: prod });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}


