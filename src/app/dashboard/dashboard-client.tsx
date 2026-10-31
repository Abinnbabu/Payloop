"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";

type NavItem = {
  label: string;
  icon: IconName;
  target: string;
  count?: string;
};

const navigation: NavItem[] = [
  { label: "Overview", icon: "grid", target: "#overview" },
  { label: "Subscriptions", icon: "layers", target: "#subscriptions", count: "3" },
  { label: "Invoices", icon: "receipt", target: "#invoices" },
];

const invoices = [
  { id: "INV-2026-1048", date: "12 Oct 2026", description: "Studio workspace · Pro", amount: "₹3,500", status: "Paid" },
  { id: "INV-2026-1031", date: "18 Sep 2026", description: "Flow analytics · Starter", amount: "₹1,180", status: "Paid" },
  { id: "INV-2026-1016", date: "12 Sep 2026", description: "Studio workspace · Pro", amount: "₹3,500", status: "Paid" },
];

export function DashboardClient() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [manageOpen, setManageOpen] = useState(false);
  const [addonEnabled, setAddonEnabled] = useState(false);
  const [addonDraftEnabled, setAddonDraftEnabled] = useState(false);
  const [changesSaved, setChangesSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  function openManageModal() {
    setAddonDraftEnabled(addonEnabled);
    setChangesSaved(false);
    setManageOpen(true);
  }

  function downloadInvoice(invoiceId: string) {
    const invoice = invoices.find(({ id }) => id === invoiceId);
    if (!invoice) return;
    const content = [
      "Payloop invoice",
      `Invoice number,${invoice.id}`,
      `Date,${invoice.date}`,
      `Description,${invoice.description}`,
      `Amount,${invoice.amount}`,
      `Status,${invoice.status}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showNotice(`${invoice.id} downloaded`);
  }

  return (
    <main className="dashboard-shell">
      <aside className={`dashboard-sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <Link className="brand dashboard-brand" href="/" aria-label="Payloop home">
          <span className="brand-mark"><span /><span /></span>payloop
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-avatar">AM</span>
          <span className="workspace-name"><strong>Aanya Mehta</strong><small>Personal account</small></span>
          <Icon name="chevronDown" size={15} />
        </div>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="dashboard-nav" aria-label="Customer navigation">
          {navigation.map((item) => (
            <a
              className={`dashboard-nav-link${activeSection === item.label ? " nav-active" : ""}`}
              href={item.target}
              key={item.label}
              onClick={() => {
                setActiveSection(item.label);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.count && <span className="nav-count">{item.count}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="circleHelp" size={17} /></span>
            <strong>Need a hand?</strong>
            <p>We’re always happy to help with your account.</p>
            <a href="mailto:hello@payloop.example">Get in touch <Icon name="arrowUpRight" size={13} /></a>
          </div>
          <div className="sidebar-account">
            <span className="avatar avatar-peach">AM</span>
            <span><strong>Aanya Mehta</strong><small>aanya@studio.in</small></span>
            <button type="button" className="account-menu" aria-label="Open account menu" onClick={() => showNotice("Account settings are coming soon.")}>···</button>
          </div>
        </div>
      </aside>

      <section className="dashboard-content" id="overview">
        <header className="dashboard-header">
          <button type="button" className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name="menu" size={20} />
          </button>
          <div className="breadcrumbs"><span>My account</span><Icon name="chevronRight" size={14} /><strong>{activeSection}</strong></div>
          <div className="header-user-actions">
            <span className="secure-label"><span /> Your account is secure</span>
            <button type="button" className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice("You’re all caught up.")}>
              <Icon name="bell" size={18} /><i />
            </button>
            <span className="avatar avatar-peach header-avatar">AM</span>
          </div>
        </header>

        <div className="dashboard-inner">
          <div className="welcome-row">
            <div>
              <p className="welcome-date">SATURDAY, OCTOBER 31, 2026</p>
              <h1>Good morning, Aanya <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">Here’s the latest on your subscriptions.</p>
            </div>
            <button type="button" className="button button-dark manage-main-button" onClick={openManageModal}>
              <Icon name="plus" size={17} /> Manage subscription
            </button>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-label">ACTIVE SUBSCRIPTIONS <span className="summary-icon lavender"><Icon name="layers" size={16} /></span></div>
              <div className="summary-value">03 <span className="summary-caption">plans in your account</span></div>
              <div className="summary-foot"><span className="status-dot" /> Everything is up to date</div>
            </article>
            <article className="summary-card summary-card-highlight">
              <div className="summary-label">NEXT PAYMENT <span className="summary-icon peach"><Icon name="creditCard" size={16} /></span></div>
              <div className="summary-value">₹{(4680 + (addonEnabled ? 490 : 0)).toLocaleString("en-IN")}</div>
              <div className="summary-foot">Due <strong>12 November 2026</strong><span className="payment-chip">In 12 days</span></div>
            </article>
            <article className="summary-card">
              <div className="summary-label">PAYMENT METHOD <span className="summary-icon mint"><Icon name="creditCard" size={16} /></span></div>
              <div className="payment-method"><span className="mastercard-mark"><i /><i /></span><strong>••••  4242</strong></div>
              <button type="button" className="text-button summary-action" onClick={() => showNotice("Payment method updates are coming soon.")}>Update payment method <Icon name="arrowUpRight" size={13} /></button>
            </article>
          </div>

          <section className="panel subscriptions-panel" id="subscriptions">
            <div className="panel-heading">
              <div><p className="panel-eyebrow">THE GOOD STUFF</p><h2>Your subscriptions <span className="count-bubble">3</span></h2></div>
              <button type="button" className="text-button" onClick={openManageModal}>Manage plans <Icon name="arrowRight" size={15} /></button>
            </div>
            <div className="subscription-list">
              <article className="subscription-row">
                <span className="product-icon product-purple">S</span>
                <div className="subscription-info"><strong>Studio workspace</strong><span>Pro plan{addonEnabled && " · Priority support"} <i /> Renews 12 Nov 2026</span></div>
                <div className="subscription-price"><strong>₹{(3500 + (addonEnabled ? 490 : 0)).toLocaleString("en-IN")}</strong><span>per month</span></div>
                <span className="active-pill">Active</span>
                <button type="button" className="row-action" aria-label="Manage Studio workspace" onClick={openManageModal}><Icon name="chevronRight" size={18} /></button>
              </article>
              <article className="subscription-row">
                <span className="product-icon product-sage">F</span>
                <div className="subscription-info"><strong>Flow analytics</strong><span>Starter plan <i /> Renews 18 Nov 2026</span></div>
                <div className="subscription-price"><strong>₹1,180</strong><span>per month</span></div>
                <span className="active-pill">Active</span>
                <button type="button" className="row-action" aria-label="Manage Flow analytics" onClick={openManageModal}><Icon name="chevronRight" size={18} /></button>
              </article>
              <article className="subscription-row">
                <span className="product-icon product-blue">C</span>
                <div className="subscription-info"><strong>Cloud storage</strong><span>Team plan <i /> Renews 04 Dec 2026</span></div>
                <div className="subscription-price"><strong>₹2,000</strong><span>per month</span></div>
                <span className="active-pill">Active</span>
                <button type="button" className="row-action" aria-label="Manage Cloud storage" onClick={openManageModal}><Icon name="chevronRight" size={18} /></button>
              </article>
            </div>
            <button type="button" className="add-subscription" onClick={() => showNotice("New plans will be available here soon.")}><span><Icon name="plus" size={16} /></span> Add a subscription</button>
          </section>

          <section className="panel invoices-panel" id="invoices">
            <div className="panel-heading invoice-heading">
              <div><p className="panel-eyebrow">YOUR PAPER TRAIL</p><h2>Recent invoices</h2></div>
              <a className="text-button" href="#invoices">All invoices <Icon name="arrowRight" size={15} /></a>
            </div>
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead><tr><th>INVOICE</th><th>DATE</th><th>DESCRIPTION</th><th>AMOUNT</th><th>STATUS</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.id}</strong></td>
                      <td>{invoice.date}</td>
                      <td>{invoice.description}</td>
                      <td className="invoice-amount">{invoice.amount}</td>
                      <td><span className="paid-pill"><Icon name="check" size={12} /> Paid</span></td>
                      <td><button type="button" className="download-button" aria-label={`Download ${invoice.id}`} onClick={() => downloadInvoice(invoice.id)}><Icon name="download" size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="dashboard-footer"><span>Made for peace of mind <span className="footer-heart">♥</span></span><a href="mailto:hello@payloop.example">Questions? We’re here for you <Icon name="arrowUpRight" size={13} /></a></footer>
        </div>
      </section>

      {manageOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setManageOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true" aria-labelledby="manage-title">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="layers" size={19} /></span>
              <button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={() => setManageOpen(false)}><Icon name="x" size={18} /></button>
            </div>
            <p className="panel-eyebrow">YOUR STUDIO WORKSPACE</p>
            <h2 id="manage-title">A plan that fits just right.</h2>
            <p className="modal-description">Manage your Pro plan and the extras that make it yours.</p>
            <div className="modal-plan">
              <span className="product-icon product-purple">S</span>
              <span><strong>Studio workspace</strong><small>Pro plan · Renews 12 Nov 2026</small></span>
              <strong>₹3,500<small> / mo</small></strong>
            </div>
            <button type="button" className={`addon-row${addonDraftEnabled ? " addon-selected" : ""}`} onClick={() => {
              setAddonDraftEnabled(!addonDraftEnabled);
              setChangesSaved(false);
            }}>
              <span className="addon-checkbox">{addonDraftEnabled && <Icon name="check" size={13} />}</span>
              <span className="addon-copy"><strong>Priority support</strong><small>Get a quicker reply from our team</small></span>
              <span className="addon-price">₹490 <small>/ mo</small></span>
            </button>
            {changesSaved && <p className="saved-message"><Icon name="check" size={14} /> Your subscription preferences are saved.</p>}
            <div className="modal-actions">
              <button type="button" className="button button-light" onClick={() => setManageOpen(false)}>Cancel</button>
              <button type="button" className="button button-dark" onClick={() => {
                setAddonEnabled(addonDraftEnabled);
                setChangesSaved(true);
              }}>Save changes <Icon name="arrowRight" size={15} /></button>
            </div>
            <button type="button" className="cancel-plan-link" onClick={() => {
              setManageOpen(false);
              showNotice("Your plan is still active. Contact us if you need help cancelling.");
            }}>Need to cancel? Get in touch</button>
          </section>
        </div>
      )}
      {notice && <div className="toast-message" role="status">{notice}</div>}
    </main>
  );
}
