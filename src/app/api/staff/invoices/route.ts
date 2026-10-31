import { NextResponse } from "next/server";
import { query, initDb } from "@/lib/db";
import { requireRole, authErrorResponse } from "@/lib/auth";
import { newAuditId, newInvoiceId } from "@/lib/ids";

export const dynamic = "force-dynamic";
const ALLOWED = ["Administrator", "Operations Specialist", "Billing Manager"] as const;
const ALLOWED_STATUSES = ["Draft", "Confirmed", "Paid", "Overdue", "Void"];

export async function GET() {
  try {
    await requireRole([...ALLOWED]);
    await initDb();
    const result = await query(`
      SELECT id, subscription_id AS "subscriptionId",
             customer_name AS "customerName", customer_email AS "customerEmail",
             customer_tax_id AS "customerTaxId", description,
             subtotal, tax, discount, total, status,
             TO_CHAR(issued_date, 'DD Mon YYYY') AS "issuedDate",
             TO_CHAR(due_date, 'DD Mon YYYY') AS "dueDate",
             idempotency_key AS "idempotencyKey",
             days_overdue AS "daysOverdue", sent_at AS "sentAt"
      FROM invoices
      ORDER BY created_at DESC;
    `);
    return NextResponse.json({ success: true, invoices: result.rows });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole([...ALLOWED]);
    const body = await request.json();
    const {
      subscriptionId, customerName, customerEmail, customerTaxId, description,
      subtotal, tax, discount, total, issuedDate, dueDate, idempotencyKey,
    } = body;
    if (!customerName || !customerEmail || !total) {
      return NextResponse.json(
        { success: false, error: "customerName, customerEmail, total required." },
        { status: 400 }
      );
    }
    const id = newInvoiceId();
    const key = idempotencyKey ?? `staff-${id}-${Date.now()}`;
    await initDb();
    const result = await query(
      `INSERT INTO invoices
         (id, subscription_id, customer_name, customer_email, customer_tax_id,
          description, subtotal, tax, discount, total, status,
          issued_date, due_date, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Draft', $11, $12, $13)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id, status;`,
      [
        id, subscriptionId ?? null, String(customerName), String(customerEmail),
        String(customerTaxId ?? ""), String(description ?? ""),
        Number(subtotal) || 0, Number(tax) || 0, Number(discount) || 0,
        Number(total), issuedDate ?? new Date().toISOString().slice(0, 10),
        dueDate ?? new Date().toISOString().slice(0, 10), key,
      ]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, deduplicated: true });
    }
    await query(
      `INSERT INTO audit_logs (id, action, actor, area)
       VALUES ($1, $2, $3, 'Invoicing');`,
      [newAuditId(), `Created invoice ${id}`, user.name]
    );
    return NextResponse.json({ success: true, invoice: result.rows[0] });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole([...ALLOWED]);
    const { id, status } = await request.json();
    if (!id || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "id and valid status required." },
        { status: 400 }
      );
    }
    await initDb();
    const result = await query(
      `UPDATE invoices
       SET status = $1,
           days_overdue = CASE WHEN $1 = 'Paid' THEN NULL ELSE days_overdue END
       WHERE id = $2
       RETURNING id, status;`,
      [status, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invoice not found." },
        { status: 404 }
      );
    }
    await query(
      `INSERT INTO audit_logs (id, action, actor, area)
       VALUES ($1, $2, $3, 'Invoicing');`,
      [newAuditId(), `Invoice ${id} -> ${status}`, user.name]
    );
    return NextResponse.json({ success: true, invoice: result.rows[0] });
  } catch (err) {
    return authErrorResponse(err);
  }
}
