-- ========================================================
-- Payloop PostgreSQL Database Schema & Initial Seed Script
-- Run this in pgAdmin 4 Query Tool under the 'payloop' database
-- ========================================================

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Customer',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Administrator User
INSERT INTO users (id, name, email, password, role, status)
VALUES ('USR-ADMIN-01', 'Priya Nair', 'admin@gmail.com', 'admin', 'Administrator', 'Active')
ON CONFLICT (email) DO UPDATE SET password = 'admin', role = 'Administrator';

-- Seed Staff User
INSERT INTO users (id, name, email, password, role, status)
VALUES ('USR-STAFF-01', 'Siddharth Rao', 'staff@payloop.internal', 'staff', 'Operations Specialist', 'Active')
ON CONFLICT (email) DO UPDATE SET password = 'staff', role = 'Operations Specialist';


-- 2. Customer Records
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

INSERT INTO customers (id, company, name, email, phone, city, tax_id, status, active_contracts, total_spend) VALUES
('CUST-001', 'TechFlow Labs Pvt Ltd', 'Priya Sharma', 'finance@techflow.io', '+91 98450 11223', 'Bangalore', '29AABCT1332L1Z1', 'Active', 1, 142500),
('CUST-002', 'Acme Design Studio', 'Rajesh Kumar', 'billing@acmedesign.in', '+91 98201 44556', 'Mumbai', '27AABCA4321K1ZM', 'Active', 1, 88200),
('CUST-003', 'Brightleaf Retail Ltd', 'Ananya Patel', 'accounts@brightleaf.store', '+91 97234 66778', 'Ahmedabad', '24AABCB9876J1ZQ', 'Past Due', 1, 52400),
('CUST-004', 'Nova Horizon Media', 'Vikram Malhotra', 'vikram@novahorizon.com', '+91 98111 88990', 'Delhi NCR', '07AABCN5544H1ZS', 'Active', 1, 36900),
('CUST-005', 'Zenith Robotics Systems', 'Neha Iyer', 'neha.iyer@zenithrobotics.in', '+91 94400 33445', 'Hyderabad', '36AABCZ1234F1ZX', 'Onboarding', 0, 24000),
('CUST-006', 'BluePeak Logistics LLP', 'Suresh Pillai', 'accounts@bluepeak.in', '+91 94471 22334', 'Kochi', '32AABCB7890D1ZR', 'Active', 1, 18500)
ON CONFLICT (id) DO NOTHING;


-- 3. Product Catalog
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

INSERT INTO products (id, name, description, price, interval, status, variants) VALUES
('PROD-01', 'Studio Workspace', 'Workspace management for creative teams', 3500, 'Monthly', 'Active', 2),
('PROD-02', 'Flow Analytics', 'Product and engagement analytics', 1180, 'Monthly', 'Active', 1),
('PROD-03', 'Cloud Storage Team', 'Managed storage for growing teams', 2000, 'Monthly', 'Active', 1),
('PROD-04', 'Enterprise Suite', 'Custom enterprise subscription package', 160000, 'Yearly', 'Archived', 3)
ON CONFLICT (id) DO NOTHING;


-- 4. Taxes & Localized Rules
CREATE TABLE IF NOT EXISTS taxes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rate INTEGER NOT NULL,
    scope VARCHAR(150) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO taxes (id, name, rate, scope, active) VALUES
('TAX-01', 'India GST', 18, 'India / domestic', TRUE),
('TAX-02', 'Reverse charge VAT', 0, 'Verified B2B cross-border', TRUE)
ON CONFLICT (id) DO NOTHING;


-- 5. Promotional Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL,
    redemption_limit INTEGER NOT NULL DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO discounts (id, name, type, value, redemption_limit, active) VALUES
('DISC-01', 'FESTIVE10', 'Percentage', 10, 250, TRUE),
('DISC-02', 'BULK20', 'Fixed', 2000, 100, TRUE),
('DISC-03', 'WELCOME15', 'Percentage', 15, 500, FALSE)
ON CONFLICT (id) DO NOTHING;


-- 6. System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    action TEXT NOT NULL,
    actor VARCHAR(150) NOT NULL,
    area VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO audit_logs (id, action, actor, area) VALUES
('AUD-105', 'Inspected TechFlow Labs account record', 'Priya Nair', 'Customer records'),
('AUD-104', 'Updated GST rule to 18%', 'Priya Nair', 'Tax rules'),
('AUD-103', 'Confirmed invoice INV-2026-1055', 'Siddharth Rao', 'Invoicing'),
('AUD-102', 'Created Enterprise Suite quotation', 'Siddharth Rao', 'Subscriptions'),
('AUD-101', 'Enabled BULK20 discount', 'Priya Nair', 'Discounts')
ON CONFLICT (id) DO NOTHING;

