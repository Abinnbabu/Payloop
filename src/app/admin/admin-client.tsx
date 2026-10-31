"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import "./admin.css";

type View = "Overview" | "Catalog" | "Rules" | "Staff access" | "Reports" | "Audit log";
type Product = { id: string; name: string; description: string; price: number; interval: string; status: "Active" | "Archived"; variants: number };
type Discount = { id: string; name: string; type: "Percentage" | "Fixed"; value: number; limit: number; active: boolean };
type Tax = { id: string; name: string; rate: number; scope: string; active: boolean };
type StaffMember = { id: string; name: string; email: string; role: "Administrator" | "Operations Specialist" | "Billing Manager"; status: "Active" | "Invited" };
type AuditEntry = { id: string; action: string; actor: string; area: string; time: string };

const initialProducts: Product[] = [
  { id: "PROD-01", name: "Studio Workspace", description: "Workspace management for creative teams", price: 3500, interval: "Monthly", status: "Active", variants: 2 },
  { id: "PROD-02", name: "Flow Analytics", description: "Product and engagement analytics", price: 1180, interval: "Monthly", status: "Active", variants: 1 },
  { id: "PROD-03", name: "Cloud Storage Team", description: "Managed storage for growing teams", price: 2000, interval: "Monthly", status: "Active", variants: 1 },
  { id: "PROD-04", name: "Enterprise Suite", description: "Custom enterprise subscription package", price: 160000, interval: "Yearly", status: "Archived", variants: 3 },
];

const initialDiscounts: Discount[] = [
  { id: "DISC-01", name: "FESTIVE10", type: "Percentage", value: 10, limit: 250, active: true },
  { id: "DISC-02", name: "BULK20", type: "Fixed", value: 2000, limit: 100, active: true },
  { id: "DISC-03", name: "WELCOME15", type: "Percentage", value: 15, limit: 500, active: false },
];

const initialTaxes: Tax[] = [
  { id: "TAX-01", name: "India GST", rate: 18, scope: "India / domestic", active: true },
  { id: "TAX-02", name: "Reverse charge VAT", rate: 0, scope: "Verified B2B cross-border", active: true },
];

const initialStaff: StaffMember[] = [
  { id: "USR-01", name: "Priya Nair", email: "priya.nair@payloop.internal", role: "Administrator", status: "Active" },
  { id: "USR-02", name: "Siddharth Rao", email: "siddharth.rao@payloop.internal", role: "Operations Specialist", status: "Active" },
  { id: "USR-03", name: "Maya Joseph", email: "maya.joseph@payloop.internal", role: "Billing Manager", status: "Active" },
];

const initialAudit: AuditEntry[] = [
  { id: "AUD-104", action: "Updated GST rule to 18%", actor: "Priya Nair", area: "Tax rules", time: "Today, 10:12 AM" },
  { id: "AUD-103", action: "Confirmed invoice INV-2026-1055", actor: "Siddharth Rao", area: "Invoicing", time: "Today, 09:44 AM" },
  { id: "AUD-102", action: "Created Enterprise Suite quotation", actor: "Siddharth Rao", area: "Subscriptions", time: "Yesterday, 04:18 PM" },
  { id: "AUD-101", action: "Enabled BULK20 discount", actor: "Priya Nair", area: "Discounts", time: "Yesterday, 11:06 AM" },
];

export function AdminClient() {
  const [view, setView] = useState<View>("Overview");
  const [products, setProducts] = useState(initialProducts);
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [taxes, setTaxes] = useState(initialTaxes);
  const [staff, setStaff] = useState(initialStaff);
  const [audit, setAudit] = useState(initialAudit);
  const [notice, setNotice] = useState("");
  const [productDialog, setProductDialog] = useState(false);
  const [staffDialog, setStaffDialog] = useState(false);
  const [auditFilter, setAuditFilter] = useState("All");

  const activeProducts = products.filter((product) => product.status === "Active").length;
  const filteredAudit = auditFilter === "All" ? audit : audit.filter((entry) => entry.area === auditFilter);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function addAudit(action: string, area: string) {
    setAudit((current) => [{ id: `AUD-${105 + current.length}`, action, actor: "Priya Nair", area, time: "Just now" }, ...current]);
  }

  function toggleProduct(id: string) {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, status: product.status === "Active" ? "Archived" : "Active" } : product));
    const product = products.find((item) => item.id === id);
    if (product) {
      const next = product.status === "Active" ? "archived" : "activated";
      addAudit(`${next[0].toUpperCase()}${next.slice(1)} ${product.name}`, "Catalog");
      showNotice(`${product.name} ${next}.`);
    }
  }

  function toggleDiscount(id: string) {
    setDiscounts((current) => current.map((discount) => discount.id === id ? { ...discount, active: !discount.active } : discount));
    const discount = discounts.find((item) => item.id === id);
    if (discount) {
      addAudit(`${discount.active ? "Disabled" : "Enabled"} ${discount.name} discount`, "Discounts");
      showNotice(`${discount.name} ${discount.active ? "disabled" : "enabled"}.`);
    }
  }

  function toggleTax(id: string) {
    setTaxes((current) => current.map((tax) => tax.id === id ? { ...tax, active: !tax.active } : tax));
    const tax = taxes.find((item) => item.id === id);
    if (tax) {
      addAudit(`${tax.active ? "Disabled" : "Enabled"} ${tax.name}`, "Tax rules");
      showNotice(`${tax.name} ${tax.active ? "disabled" : "enabled"}.`);
    }
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const price = Number(data.get("price"));
    if (!name || !Number.isFinite(price) || price < 0) return showNotice("Enter a product name and valid price.");
    const product: Product = { id: `PROD-${String(products.length + 1).padStart(2, "0")}`, name, description: String(data.get("description") ?? ""), price, interval: String(data.get("interval") ?? "Monthly"), status: "Active", variants: 1 };
    setProducts((current) => [...current, product]);
    addAudit(`Created product ${name}`, "Catalog");
    setProductDialog(false);
    showNotice(`${name} added to the catalog.`);
  }

  function submitStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!name || !email) return showNotice("Enter a name and work email.");
    const member: StaffMember = { id: `USR-${String(staff.length + 1).padStart(2, "0")}`, name, email, role: data.get("role") as StaffMember["role"], status: "Invited" };
    setStaff((current) => [...current, member]);
    addAudit(`Invited ${name} to the staff workspace`, "Staff access");
    setStaffDialog(false);
    showNotice(`Invitation prepared for ${email}.`);
  }

  const monthlyRevenue = useMemo(() => products.filter((product) => product.status === "Active" && product.interval === "Monthly").reduce((total, product) => total + product.price, 0), [products]);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand"><span><i /><i /></span>payloop</Link>
        <div className="admin-badge">ADMIN CONSOLE</div>
        <p className="admin-nav-label">SYSTEM CONTROL</p>
        <nav>{(["Overview", "Catalog", "Rules", "Staff access", "Reports", "Audit log"] as View[]).map((item) => (
          <button key={item} type="button" className={view === item ? "admin-nav-active" : ""} onClick={() => setView(item)}>
            <Icon name={item === "Catalog" ? "layers" : item === "Audit log" ? "receipt" : item === "Reports" ? "grid" : "sparkle"} size={16} />{item}
          </button>
        ))}</nav>
        <div className="admin-side-note"><span /> Global controls apply to all staff and customer workspaces.</div>
        <div className="admin-account"><b>PN</b><span><strong>Priya Nair</strong><small>System administrator</small></span></div>
      </aside>

      <section className="admin-content">
        <header className="admin-header"><span>Admin console <Icon name="chevronRight" size={13} /> <strong>{view}</strong></span><div><Link href="/staff" className="admin-text-link">Open staff workspace <Icon name="arrowUpRight" size={13} /></Link><button type="button" className="admin-avatar" onClick={() => showNotice("Administrator profile is managed by the identity service.")}>PN</button></div></header>
        <div className="admin-page">
          {view === "Overview" && <>
            <div className="admin-title"><div><p>SYSTEM ADMINISTRATION</p><h1>Keep every loop <em>in sync.</em></h1><span>Configure the rules, people, and catalog behind Payloop.</span></div><button className="admin-button" type="button" onClick={() => setProductDialog(true)}><Icon name="plus" size={15} /> New product</button></div>
            <div className="admin-kpis"><Metric label="ACTIVE CATALOG PRODUCTS" value={String(activeProducts)} caption={`${products.length - activeProducts} archived`} /><Metric label="CONFIGURED MONTHLY PRICING" value={`₹${monthlyRevenue.toLocaleString("en-IN")}`} caption="Base catalog value" /><Metric label="ACTIVE STAFF ACCESS" value={String(staff.filter((member) => member.status === "Active").length)} caption={`${staff.filter((member) => member.status === "Invited").length} pending invitation`} /><Metric label="AUDIT EVENTS TODAY" value="24" caption="All actions traceable" /></div>
            <div className="admin-grid"><section className="admin-panel"><PanelTitle eyebrow="ATTENTION" title="Configuration checks" /><ul className="admin-checks"><li><span className="check-good">✓</span><div><strong>Tax rules are current</strong><small>India GST and B2B reverse-charge rules are enabled.</small></div></li><li><span className="check-warn">!</span><div><strong>One archived catalog item</strong><small>Enterprise Suite is hidden from new quotes.</small></div></li><li><span className="check-good">✓</span><div><strong>Staff access reviewed</strong><small>Three active internal accounts with no pending escalations.</small></div></li></ul></section><section className="admin-panel"><PanelTitle eyebrow="LATEST ACTIVITY" title="Audit trail" action={() => setView("Audit log")} /><ActivityList entries={audit.slice(0, 4)} /></section></div>
          </>}

          {view === "Catalog" && <section className="admin-panel"><PanelTitle eyebrow="PRODUCT CATALOG" title="Plans, variants & pricing" button="Add product" onButton={() => setProductDialog(true)} /><div className="admin-table-wrap"><table><thead><tr><th>PRODUCT</th><th>BASE PRICE</th><th>INTERVAL</th><th>VARIANTS</th><th>STATUS</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.description}</small></td><td>₹{product.price.toLocaleString("en-IN")}</td><td>{product.interval}</td><td>{product.variants}</td><td><span className={product.status === "Active" ? "admin-status green" : "admin-status gray"}>{product.status}</span></td><td><button className="admin-row-button" type="button" onClick={() => toggleProduct(product.id)}>{product.status === "Active" ? "Archive" : "Activate"}</button></td></tr>)}</tbody></table></div></section>}

          {view === "Rules" && <div className="admin-grid rules-grid"><section className="admin-panel"><PanelTitle eyebrow="TAX CONFIGURATION" title="Localized tax rules" />{taxes.map((tax) => <div className="rule-row" key={tax.id}><div><strong>{tax.name} <span>{tax.rate}%</span></strong><small>{tax.scope}</small></div><button className={tax.active ? "toggle on" : "toggle"} type="button" aria-label={`Toggle ${tax.name}`} onClick={() => toggleTax(tax.id)}><i /></button></div>)}</section><section className="admin-panel"><PanelTitle eyebrow="PROMOTIONS" title="Discount schemes" />{discounts.map((discount) => <div className="rule-row" key={discount.id}><div><strong>{discount.name} <span>{discount.type === "Percentage" ? `${discount.value}%` : `₹${discount.value.toLocaleString("en-IN")}`}</span></strong><small>{discount.limit} redemption limit</small></div><button className={discount.active ? "toggle on" : "toggle"} type="button" aria-label={`Toggle ${discount.name}`} onClick={() => toggleDiscount(discount.id)}><i /></button></div>)}</section><section className="admin-panel admin-wide"><PanelTitle eyebrow="RULE ENGINE" title="Safeguards enabled" /><div className="safeguard-grid"><InfoCard title="Tax order" text="Tax is applied after qualified discounts." /><InfoCard title="Redemption caps" text="Global limits prevent discount overuse." /><InfoCard title="Quote locking" text="Pricing is protected through the quote validity period." /></div></section></div>}

          {view === "Staff access" && <section className="admin-panel"><PanelTitle eyebrow="INTERNAL ACCESS" title="Staff accounts & permissions" button="Invite staff" onButton={() => setStaffDialog(true)} /><div className="admin-table-wrap"><table><thead><tr><th>TEAM MEMBER</th><th>ROLE</th><th>STATUS</th><th>ACCESS</th><th /></tr></thead><tbody>{staff.map((member) => <tr key={member.id}><td><strong>{member.name}</strong><small>{member.email}</small></td><td>{member.role}</td><td><span className={member.status === "Active" ? "admin-status green" : "admin-status amber"}>{member.status}</span></td><td>{member.role === "Administrator" ? "Full system control" : "Staff workspace"}</td><td><button className="admin-row-button" type="button" onClick={() => showNotice(`${member.name}'s access is ready to edit when identity management is connected.`)}>Manage</button></td></tr>)}</tbody></table></div></section>}

          {view === "Reports" && <><div className="admin-kpis"><Metric label="ESTIMATED MRR" value="₹22,231" caption="Normalized 30-day revenue" /><Metric label="OVERDUE RECEIVABLES" value="₹4,708" caption="One invoice needs attention" /><Metric label="ACTIVE SUBSCRIPTIONS" value="2" caption="Across six customer accounts" /><Metric label="GROSS CHURN" value="2.1%" caption="Current reporting period" /></div><section className="admin-panel"><PanelTitle eyebrow="REPORTING READINESS" title="Financial analytics" /><div className="report-bars">{[72, 88, 65, 94, 79, 86].map((height, index) => <div key={height}><i style={{ height: `${height}%` }} /><span>{["May", "Jun", "Jul", "Aug", "Sep", "Oct"][index]}</span></div>)}</div><p className="report-note">Metrics shown from the demo operational dataset. Production reporting requires materialized database views and scheduled refreshes.</p></section></>}

          {view === "Audit log" && <section className="admin-panel"><div className="admin-panel-top"><div><p className="panel-eyebrow">SYSTEM HISTORY</p><h2>Audit log</h2></div><select value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)}><option>All</option><option>Catalog</option><option>Tax rules</option><option>Discounts</option><option>Staff access</option><option>Invoicing</option><option>Subscriptions</option></select></div><ActivityList entries={filteredAudit} detailed /></section>}
        </div>
      </section>

      {productDialog && <Dialog title="Add catalog product" onClose={() => setProductDialog(false)}><form onSubmit={submitProduct}><label>Product name<input name="name" required placeholder="e.g. Support Plus" /></label><label>Description<input name="description" required placeholder="A short internal description" /></label><div className="dialog-grid"><label>Base price (₹)<input name="price" type="number" min="0" required /></label><label>Billing interval<select name="interval"><option>Monthly</option><option>Yearly</option></select></label></div><DialogActions onClose={() => setProductDialog(false)} label="Add product" /></form></Dialog>}
      {staffDialog && <Dialog title="Invite staff member" onClose={() => setStaffDialog(false)}><form onSubmit={submitStaff}><label>Full name<input name="name" required placeholder="Name" /></label><label>Work email<input name="email" type="email" required placeholder="name@payloop.internal" /></label><label>Role<select name="role"><option>Operations Specialist</option><option>Billing Manager</option><option>Administrator</option></select></label><DialogActions onClose={() => setStaffDialog(false)} label="Prepare invitation" /></form></Dialog>}
      {notice && <div className="admin-toast">{notice}</div>}
    </main>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) { return <article className="admin-metric"><span>{label}</span><strong>{value}</strong><small>{caption}</small></article>; }
function PanelTitle({ eyebrow, title, button, onButton, action }: { eyebrow: string; title: string; button?: string; onButton?: () => void; action?: () => void }) { return <div className="admin-panel-title"><div><p>{eyebrow}</p><h2>{title}</h2></div>{button && <button type="button" className="admin-button small" onClick={onButton}><Icon name="plus" size={13} />{button}</button>}{action && <button type="button" className="admin-row-button" onClick={action}>View all <Icon name="arrowRight" size={13} /></button>}</div>; }
function ActivityList({ entries, detailed = false }: { entries: AuditEntry[]; detailed?: boolean }) { return <div className={detailed ? "activity-list detailed" : "activity-list"}>{entries.map((entry) => <div key={entry.id}><span className="activity-mark"><Icon name="check" size={12} /></span><p><strong>{entry.action}</strong><small>{entry.actor} · {entry.area} · {entry.time}</small></p>{detailed && <code>{entry.id}</code>}</div>)}</div>; }
function InfoCard({ title, text }: { title: string; text: string }) { return <div className="info-card"><Icon name="check" size={15} /><strong>{title}</strong><span>{text}</span></div>; }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="admin-modal" role="dialog" aria-modal="true"><button type="button" className="admin-close" onClick={onClose}><Icon name="x" size={17} /></button><p>ADMIN CONSOLE</p><h2>{title}</h2>{children}</section></div>; }
function DialogActions({ onClose, label }: { onClose: () => void; label: string }) { return <div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">{label}</button></div>; }
