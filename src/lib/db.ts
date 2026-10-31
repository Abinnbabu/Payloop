import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let isInitialized = false;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/payloop";

    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on("error", (err) => {
      console.warn("[PostgreSQL] Unexpected pool error (database might be offline):", err.message);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params);
}

/**
 * Initializes the PostgreSQL schema and seeds initial data if missing.
 * Handles database connectivity issues gracefully.
 */
export async function initDb(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    const p = getPool();
    // Test connectivity
    await p.query("SELECT 1;");

    // Create tables
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Customer',
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        permissions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT;

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        interval VARCHAR(50) NOT NULL DEFAULT 'Monthly',
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        variants INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        company VARCHAR(200) NOT NULL,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        city VARCHAR(100),
        tax_id VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        active_contracts INTEGER NOT NULL DEFAULT 0,
        total_spend INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS discounts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL,
        redemption_limit INTEGER NOT NULL DEFAULT 100,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS taxes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rate INTEGER NOT NULL,
        scope VARCHAR(150) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        action TEXT NOT NULL,
        actor VARCHAR(150) NOT NULL,
        area VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";
    await p.query(
      `INSERT INTO users (id, name, email, password, role, status, permissions)
       VALUES ('USR-ADMIN-01', 'Priya Nair', $1, $2, 'Administrator', 'Active', 'All')
       ON CONFLICT (email) DO UPDATE SET password = $2, role = 'Administrator', permissions = 'All';`,
      [adminEmail, adminPassword]
    );

    // Seed initial staff members if not present
    const staffEmail = process.env.STAFF_EMAIL || "staff@payloop.internal";
    const staffPassword = process.env.STAFF_PASSWORD || "staff";
    await p.query(
      `INSERT INTO users (id, name, email, password, role, status, permissions)
       VALUES 
       ('USR-STAFF-01', 'Siddharth Rao', $1, $2, 'Operations Specialist', 'Active', 'Customer records, Subscriptions & Quotes, Invoices & Billing'),
       ('USR-STAFF-02', 'Maya Joseph', 'maya.joseph@payloop.internal', 'staff', 'Billing Manager', 'Active', 'Invoices & Billing, Payment recording, Dunning & Collections')
       ON CONFLICT (email) DO NOTHING;`,
      [staffEmail, staffPassword]
    );

    // Seed Products if table empty
    const prodCount = await p.query("SELECT COUNT(*) FROM products;");
    if (parseInt(prodCount.rows[0].count, 10) === 0) {
      await p.query(`
        INSERT INTO products (id, name, description, price, interval, status, variants) VALUES
        ('PROD-01', 'Studio Workspace', 'Workspace management for creative teams', 3500, 'Monthly', 'Active', 2),
        ('PROD-02', 'Flow Analytics', 'Product and engagement analytics', 1180, 'Monthly', 'Active', 1),
        ('PROD-03', 'Cloud Storage Team', 'Managed storage for growing teams', 2000, 'Monthly', 'Active', 1),
        ('PROD-04', 'Enterprise Suite', 'Custom enterprise subscription package', 160000, 'Yearly', 'Archived', 3);
      `);
    }

    // Seed Customers if table empty
    const custCount = await p.query("SELECT COUNT(*) FROM customers;");
    if (parseInt(custCount.rows[0].count, 10) === 0) {
      await p.query(`
        INSERT INTO customers (id, company, name, email, phone, city, tax_id, status, active_contracts, total_spend) VALUES
        ('CUST-001', 'TechFlow Labs Pvt Ltd', 'Priya Sharma', 'finance@techflow.io', '+91 98450 11223', 'Bangalore', '29AABCT1332L1Z1', 'Active', 1, 142500),
        ('CUST-002', 'Acme Design Studio', 'Rajesh Kumar', 'billing@acmedesign.in', '+91 98201 44556', 'Mumbai', '27AABCA4321K1ZM', 'Active', 1, 88200),
        ('CUST-003', 'Brightleaf Retail Ltd', 'Ananya Patel', 'accounts@brightleaf.store', '+91 97234 66778', 'Ahmedabad', '24AABCB9876J1ZQ', 'Past Due', 1, 52400),
        ('CUST-004', 'Nova Horizon Media', 'Vikram Malhotra', 'vikram@novahorizon.com', '+91 98111 88990', 'Delhi NCR', '07AABCN5544H1ZS', 'Active', 1, 36900),
        ('CUST-005', 'Zenith Robotics Systems', 'Neha Iyer', 'neha.iyer@zenithrobotics.in', '+91 94400 33445', 'Hyderabad', '36AABCZ1234F1ZX', 'Onboarding', 0, 24000),
        ('CUST-006', 'BluePeak Logistics LLP', 'Suresh Pillai', 'accounts@bluepeak.in', '+91 94471 22334', 'Kochi', '32AABCB7890D1ZR', 'Active', 1, 18500);
      `);
    }

    // Seed Discounts if table empty
    const discCount = await p.query("SELECT COUNT(*) FROM discounts;");
    if (parseInt(discCount.rows[0].count, 10) === 0) {
      await p.query(`
        INSERT INTO discounts (id, name, type, value, redemption_limit, active) VALUES
        ('DISC-01', 'FESTIVE10', 'Percentage', 10, 250, TRUE),
        ('DISC-02', 'BULK20', 'Fixed', 2000, 100, TRUE),
        ('DISC-03', 'WELCOME15', 'Percentage', 15, 500, FALSE);
      `);
    }

    // Seed Taxes if table empty
    const taxCount = await p.query("SELECT COUNT(*) FROM taxes;");
    if (parseInt(taxCount.rows[0].count, 10) === 0) {
      await p.query(`
        INSERT INTO taxes (id, name, rate, scope, active) VALUES
        ('TAX-01', 'India GST', 18, 'India / domestic', TRUE),
        ('TAX-02', 'Reverse charge VAT', 0, 'Verified B2B cross-border', TRUE);
      `);
    }

    // Seed Audit Logs if table empty
    const auditCount = await p.query("SELECT COUNT(*) FROM audit_logs;");
    if (parseInt(auditCount.rows[0].count, 10) === 0) {
      await p.query(`
        INSERT INTO audit_logs (id, action, actor, area) VALUES
        ('AUD-105', 'Inspected TechFlow Labs account record', 'Priya Nair', 'Customer records'),
        ('AUD-104', 'Updated GST rule to 18%', 'Priya Nair', 'Tax rules'),
        ('AUD-103', 'Confirmed invoice INV-2026-1055', 'Siddharth Rao', 'Invoicing'),
        ('AUD-102', 'Created Enterprise Suite quotation', 'Siddharth Rao', 'Subscriptions'),
        ('AUD-101', 'Enabled BULK20 discount', 'Priya Nair', 'Discounts');
      `);
    }

    isInitialized = true;
    return true;
  } catch (err: any) {
    console.warn("[PostgreSQL] Connection note: Database not reachable or tables already configured.", err.message);
    return false;
  }
}

