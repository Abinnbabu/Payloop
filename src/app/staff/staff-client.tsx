"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import { Icon } from "@/components/icon";
// @ts-ignore Next.js resolves global CSS imports, while the project TypeScript config may not declare them.
import "./staff.css";

// --- Types ---

export type LifecycleStatus =
  | "Draft"
  | "Quotation"
  | "Confirmed"
  | "Active"
  | "Paused"
  | "Past Due"
  | "Closed";

export type InvoiceStatus = "Draft" | "Confirmed" | "Paid" | "Overdue" | "Void";

export interface CustomerRecord {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  currency: string;
  activeContracts: number;
  totalSpend: number;
  status: "Active" | "Past Due" | "Onboarding";
  taxId: string;
}

export interface QuoteTemplate {
  id: string;
  title: string;
  description: string;
  planName: string;
  billingInterval: "Monthly" | "Yearly" | "Weekly";
  basePrice: number;
  variant: string;
  variantCost: number;
  addons: string[];
  addonCost: number;
  validDays: number;
  discountName: string;
  discountAmount: number;
}

export interface SubscriptionItem {
  id: string;
  customerId: string;
  customerName: string;
  customerContact: string;
  planName: string;
  billingInterval: "Daily" | "Weekly" | "Monthly" | "Yearly";
  variantName: string;
  variantPrice: number;
  addons: string[];
  basePrice: number;
  taxRate: number;
  discountAmount: number;
  totalCents: number;
  status: LifecycleStatus;
  startDate: string;
  expiryDate: string;
  paymentTerms: string;
  iconLetter: string;
  iconTheme: "purple" | "sage" | "blue" | "emerald" | "amber" | "coral";
  dunningAttempts?: number;
}

export interface InvoiceItem {
  id: string;
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  customerTaxId: string;
  description: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  idempotencyKey: string;
  daysOverdue?: number;
  sentAt?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  customerName: string;
  method: "Bank Transfer (NEFT)" | "Credit Card" | "UPI / Razorpay" | "Stripe" | "Cheque";
  amount: number;
  date: string;
  transactionRef: string;
  notes: string;
}

// --- Initial Data matching User's Exact Numbers & State ---

const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: "CUST-102",
    name: "Devon Vance",
    company: "TechFlow Labs",
    email: "devon@techflow.io",
    phone: "+91 98110 56789",
    city: "Bengaluru",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 222000,
    status: "Active",
    taxId: "29BBDFE4321A1Z9",
  },
  {
    id: "CUST-101",
    name: "Aanya Mehta",
    company: "Acme Design Studio",
    email: "aanya@studio.in",
    phone: "+91 98201 44512",
    city: "Mumbai",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 47880,
    status: "Active",
    taxId: "27AABCA1234F1Z5",
  },
  {
    id: "CUST-103",
    name: "Pooja Sharma",
    company: "Brightleaf Retail",
    email: "pooja@brightleaf.store",
    phone: "+91 98400 98765",
    city: "Delhi",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 32400,
    status: "Past Due",
    taxId: "07AAACB9876P1Z3",
  },
  {
    id: "CUST-104",
    name: "Karan Patel",
    company: "Apex Media House",
    email: "karan@apexmedia.co",
    phone: "+91 99220 12345",
    city: "Pune",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 192000,
    status: "Active",
    taxId: "27AADCA5678B1Z2",
  },
  {
    id: "CUST-105",
    name: "Dr. R. Sen",
    company: "Lumina Health Systems",
    email: "procure@luminahealth.org",
    phone: "+91 98490 33441",
    city: "Hyderabad",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 170400,
    status: "Onboarding",
    taxId: "36AACCL7890C1Z4",
  },
  {
    id: "CUST-106",
    name: "Siddharth Roy",
    company: "CloudNine Networks",
    email: "siddharth@cloudnine.net",
    phone: "+91 94440 88990",
    city: "Chennai",
    currency: "INR (₹)",
    activeContracts: 1,
    totalSpend: 53400,
    status: "Active",
    taxId: "33AABCC3456D1Z8",
  },
];

const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: "SUB-2026-0814",
    customerId: "CUST-102",
    customerName: "TechFlow Labs",
    customerContact: "Devon Vance",
    planName: "Enterprise Scale Pack",
    billingInterval: "Monthly",
    variantName: "Odoo Brand (+₹560)",
    variantPrice: 560,
    addons: ["Priority Support", "Extra Storage"],
    basePrice: 15000,
    taxRate: 0.18,
    discountAmount: 2000,
    totalCents: 17523,
    status: "Active",
    startDate: "15 Aug 2026",
    expiryDate: "15 Aug 2027",
    paymentTerms: "Net 30",
    iconLetter: "T",
    iconTheme: "purple",
  },
  {
    id: "SUB-2026-0792",
    customerId: "CUST-101",
    customerName: "Acme Design Studio",
    customerContact: "Aanya Mehta",
    planName: "Studio Workspace Pro",
    billingInterval: "Monthly",
    variantName: "Standard",
    variantPrice: 0,
    addons: ["Priority Support (+₹490)"],
    basePrice: 3500,
    taxRate: 0.18,
    discountAmount: 0,
    totalCents: 4708,
    status: "Active",
    startDate: "12 Oct 2026",
    expiryDate: "12 Oct 2027",
    paymentTerms: "Due on Receipt",
    iconLetter: "A",
    iconTheme: "sage",
  },
  {
    id: "SUB-2026-0640",
    customerId: "CUST-103",
    customerName: "Brightleaf Retail",
    customerContact: "Pooja Sharma",
    planName: "Growth Studio Bundle",
    billingInterval: "Monthly",
    variantName: "Standard",
    variantPrice: 0,
    addons: ["Priority Support (+₹490)"],
    basePrice: 3500,
    taxRate: 0.18,
    discountAmount: 0,
    totalCents: 4708,
    status: "Past Due",
    startDate: "18 Jun 2026",
    expiryDate: "18 Jun 2027",
    paymentTerms: "Net 15",
    iconLetter: "B",
    iconTheme: "coral",
    dunningAttempts: 2,
  },
  {
    id: "SUB-2026-0912",
    customerId: "CUST-105",
    customerName: "Lumina Health Systems",
    customerContact: "Dr. R. Sen",
    planName: "Enterprise Suite",
    billingInterval: "Yearly",
    variantName: "Odoo Healthcare Custom (+₹560)",
    variantPrice: 560,
    addons: ["Priority Support", "Dedicated Storage"],
    basePrice: 160000,
    taxRate: 0.18,
    discountAmount: 15000,
    totalCents: 171753,
    status: "Quotation",
    startDate: "01 Nov 2026",
    expiryDate: "01 Nov 2027",
    paymentTerms: "Net 30",
    iconLetter: "L",
    iconTheme: "blue",
  },
  {
    id: "SUB-2026-0521",
    customerId: "CUST-106",
    customerName: "CloudNine Networks",
    customerContact: "Siddharth Roy",
    planName: "Cloud Storage Team",
    billingInterval: "Monthly",
    variantName: "Standard",
    variantPrice: 0,
    addons: [],
    basePrice: 2000,
    taxRate: 0.18,
    discountAmount: 0,
    totalCents: 2360,
    status: "Paused",
    startDate: "04 May 2026",
    expiryDate: "04 May 2027",
    paymentTerms: "Net 15",
    iconLetter: "C",
    iconTheme: "amber",
  },
  {
    id: "SUB-2026-0935",
    customerId: "CUST-104",
    customerName: "Apex Media House",
    customerContact: "Karan Patel",
    planName: "Studio Workspace Pro",
    billingInterval: "Monthly",
    variantName: "Odoo Brand (+₹560)",
    variantPrice: 560,
    addons: ["Extra 500GB Storage"],
    basePrice: 3500,
    taxRate: 0.18,
    discountAmount: 400,
    totalCents: 5263,
    status: "Draft",
    startDate: "01 Nov 2026",
    expiryDate: "01 Nov 2027",
    paymentTerms: "Net 30",
    iconLetter: "M",
    iconTheme: "emerald",
  },
];

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: "INV-2026-1048",
    subscriptionId: "SUB-2026-0792",
    customerName: "Acme Design Studio",
    customerEmail: "aanya@studio.in",
    customerTaxId: "27AABCA1234F1Z5",
    description: "Studio workspace · Pro + Priority support",
    subtotal: 3990,
    tax: 718,
    discount: 0,
    total: 4708,
    status: "Paid",
    issuedDate: "12 Oct 2026",
    dueDate: "12 Oct 2026",
    idempotencyKey: "idem_9f2a41e8-782b-4221-8ecb",
    sentAt: "12 Oct 2026, 09:15 AM",
  },
  {
    id: "INV-2026-1049",
    subscriptionId: "SUB-2026-0814",
    customerName: "TechFlow Labs",
    customerEmail: "devon@techflow.io",
    customerTaxId: "29BBDFE4321A1Z9",
    description: "Enterprise Scale Pack (Monthly Cycle)",
    subtotal: 16850,
    tax: 2673,
    discount: 2000,
    total: 17523,
    status: "Paid",
    issuedDate: "15 Oct 2026",
    dueDate: "15 Nov 2026",
    idempotencyKey: "idem_6b3c101a-1122-3344-99aa",
    sentAt: "15 Oct 2026, 10:02 AM",
  },
  {
    id: "INV-2026-1052",
    subscriptionId: "SUB-2026-0640",
    customerName: "Brightleaf Retail",
    customerEmail: "pooja@brightleaf.store",
    customerTaxId: "07AAACB9876P1Z3",
    description: "Growth Studio Bundle · Pro",
    subtotal: 3990,
    tax: 718,
    discount: 0,
    total: 4708,
    status: "Overdue",
    issuedDate: "03 Oct 2026",
    dueDate: "18 Oct 2026",
    daysOverdue: 13,
    idempotencyKey: "idem_4e7f89b1-00aa-bbcc-dd11",
    sentAt: "03 Oct 2026, 08:30 AM",
  },
  {
    id: "INV-2026-1055",
    subscriptionId: "SUB-2026-0935",
    customerName: "Apex Media House",
    customerEmail: "karan@apexmedia.co",
    customerTaxId: "27AADCA5678B1Z2",
    description: "Apex Custom Media Suite",
    subtotal: 28000,
    tax: 5040,
    discount: 1040,
    total: 32000,
    status: "Confirmed",
    issuedDate: "25 Oct 2026",
    dueDate: "10 Nov 2026",
    idempotencyKey: "idem_1a2b3c4d-5e6f-7a8b-9c0d",
    sentAt: "25 Oct 2026, 11:45 AM",
  },
  {
    id: "INV-2026-1058",
    subscriptionId: "SUB-2026-0814",
    customerName: "TechFlow Labs",
    customerEmail: "devon@techflow.io",
    customerTaxId: "29BBDFE4321A1Z9",
    description: "Enterprise Scale Pack · Scheduled Renewal",
    subtotal: 16850,
    tax: 2673,
    discount: 2000,
    total: 17523,
    status: "Draft",
    issuedDate: "31 Oct 2026",
    dueDate: "15 Nov 2026",
    idempotencyKey: "idem_77aa88bb-ccdd-eeff-0011",
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: "PAY-9921",
    invoiceId: "INV-2026-1048",
    customerName: "Acme Design Studio",
    method: "UPI / Razorpay",
    amount: 4708,
    date: "12 Oct 2026",
    transactionRef: "pay_Rzp90283419",
    notes: "Auto-debit mandate settled successfully.",
  },
  {
    id: "PAY-9922",
    invoiceId: "INV-2026-1049",
    customerName: "TechFlow Labs",
    method: "Bank Transfer (NEFT)",
    amount: 17523,
    date: "16 Oct 2026",
    transactionRef: "HDFC0001298402",
    notes: "Direct corporate bank transfer reconciled against bank statement.",
  },
];

const INITIAL_TEMPLATES: QuoteTemplate[] = [
  {
    id: "TPL-01",
    title: "Enterprise Scale Pack",
    description: "Designed for high-growth teams requiring Odoo integration, multi-brand support and priority SLAs.",
    planName: "Studio Workspace Pro",
    billingInterval: "Monthly",
    basePrice: 15000,
    variant: "Odoo Brand Variant (+₹560)",
    variantCost: 560,
    addons: ["Priority Support (+₹490)", "Extra 500GB Storage (+₹800)"],
    addonCost: 1290,
    validDays: 30,
    discountName: "BULK20 (₹2,000 off)",
    discountAmount: 2000,
  },
  {
    id: "TPL-02",
    title: "Growth Studio Bundle",
    description: "Standard creative bundle with integrated analytics and cloud backup.",
    planName: "Studio Workspace",
    billingInterval: "Monthly",
    basePrice: 3500,
    variant: "Standard",
    variantCost: 0,
    addons: ["Priority Support (+₹490)"],
    addonCost: 490,
    validDays: 14,
    discountName: "FESTIVE10 (10% off)",
    discountAmount: 399,
  },
  {
    id: "TPL-03",
    title: "SaaS Analytics Starter",
    description: "Real-time user engagement and cohort metrics for early stage SaaS.",
    planName: "Flow Analytics",
    billingInterval: "Monthly",
    basePrice: 1180,
    variant: "Standard",
    variantCost: 0,
    addons: [],
    addonCost: 0,
    validDays: 7,
    discountName: "None",
    discountAmount: 0,
  },
];

type TabId =
  | "Overview"
  | "Customers"
  | "Subscriptions"
  | "Invoices"
  | "Payments"
  | "Overdue"
  | "Templates";

export function StaffClient() {
  const [activeTab, setActiveTab] = useState<TabId>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Dynamic Staff User Info from PostgreSQL session
  const [currentStaff, setCurrentStaff] = useState({
    name: "Siddharth Rao",
    email: "siddharth.rao@payloop.internal",
    role: "Operations Specialist",
    permissions: "Customer records, Subscriptions & Quotes, Invoices & Billing",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setCurrentStaff({
            name: data.user.name || "Siddharth Rao",
            email: data.user.email || "siddharth.rao@payloop.internal",
            role: data.user.role || "Operations Specialist",
            permissions: data.user.permissions || "Customer records, Subscriptions & Quotes",
          });
        }
      })
      .catch(() => {});

    // Sync customers dynamically from database
    fetch("/api/admin/customers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.customers) && data.customers.length > 0) {
          setCustomers(
            data.customers.map((c: any) => ({
              id: c.id,
              name: c.name,
              company: c.company,
              email: c.email,
              phone: c.phone || "+91 98000 00000",
              city: c.city || "Bengaluru",
              currency: "INR (₹)",
              activeContracts: c.activeContracts || 0,
              totalSpend: c.totalSpend || 0,
              status: c.status || "Active",
              taxId: c.taxId || "29AABC00000A1Z0",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const staffInitials = useMemo(() => {
    const parts = (currentStaff.name || "SR").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (currentStaff.name || "SR").slice(0, 2).toUpperCase();
  }, [currentStaff.name]);

  // View Mode: Cards View (Default Dashboard Style) vs Table View
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filter Category for subscriptions
  const [filterCategory, setFilterCategory] = useState<"All" | "Active" | "Pipeline" | "Attention" | "Paused">("All");

  // Core Data States
  const [customers, setCustomers] = useState<CustomerRecord[]>(INITIAL_CUSTOMERS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(INITIAL_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [templates] = useState<QuoteTemplate[]>(INITIAL_TEMPLATES);

  // Modals
  const [createSubModalOpen, setCreateSubModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [printInvoiceModalOpen, setPrintInvoiceModalOpen] = useState(false);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<InvoiceItem | null>(null);
  const [customerDetailModalOpen, setCustomerDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Subscription Form State
  const [formCustomer, setFormCustomer] = useState(INITIAL_CUSTOMERS[0].id);
  const [formPlan, setFormPlan] = useState("Studio Workspace");
  const [formInterval, setFormInterval] = useState<"Monthly" | "Yearly" | "Weekly" | "Daily">("Monthly");
  const [formVariant, setFormVariant] = useState<"Standard" | "Odoo Brand (+₹560)">("Standard");
  const [formPrioritySupport, setFormPrioritySupport] = useState(false);
  const [formExtraStorage, setFormExtraStorage] = useState(false);
  const [formDiscount, setFormDiscount] = useState<"None" | "FESTIVE10" | "BULK20">("None");
  const [formPaymentTerms, setFormPaymentTerms] = useState("Net 30");

  // Payment Form State
  const [payMethod, setPayMethod] = useState<PaymentRecord["method"]>("Bank Transfer (NEFT)");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  function showToast(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function navigateTo(tab: TabId) {
    setActiveTab(tab);
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById(tab.toLowerCase())?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openCustomerDetail(customer: CustomerRecord) {
    setSelectedCustomer(customer);
    setCustomerDetailModalOpen(true);
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get("currentPassword") ?? "");
    const next = String(data.get("newPassword") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");

    if (!current) {
      setPasswordMessage("Enter your current password.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/.test(next)) {
      setPasswordMessage("Use at least 9 characters with uppercase, lowercase, and a special character.");
      return;
    }
    if (next !== confirm) {
      setPasswordMessage("Your new passwords do not match.");
      return;
    }
    setPasswordMessage("Password changes need an account service. No changes were made.");
  }

  // Exact KPIs from screenshot: Active = 2, MRR = 22,231, Overdue = 4,708
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === "Active"), [subscriptions]);
  const activeSubsCount = activeSubs.length; // 2
  const pendingQuotesCount = subscriptions.filter((s) => s.status === "Quotation").length; // 1

  const estimatedMRR = useMemo(() => {
    return activeSubs.reduce((acc, sub) => acc + sub.totalCents, 0); // 17523 + 4708 = 22,231
  }, [activeSubs]);

  const overdueInvoices = useMemo(() => invoices.filter((inv) => inv.status === "Overdue"), [invoices]);
  const totalOverdueAmount = useMemo(() => overdueInvoices.reduce((sum, inv) => sum + inv.total, 0), [overdueInvoices]); // 4,708

  // Filtered Subscriptions list
  const filteredSubscriptions = useMemo(() => {
    if (filterCategory === "Active") return subscriptions.filter((s) => s.status === "Active");
    if (filterCategory === "Pipeline") return subscriptions.filter((s) => s.status === "Quotation" || s.status === "Draft" || s.status === "Confirmed");
    if (filterCategory === "Attention") return subscriptions.filter((s) => s.status === "Past Due");
    if (filterCategory === "Paused") return subscriptions.filter((s) => s.status === "Paused");
    return subscriptions;
  }, [subscriptions, filterCategory]);

  // Lifecycle Transitions
  function transitionSubscription(id: string, nextStatus: LifecycleStatus, reason?: string) {
    const subscription = subscriptions.find((item) => item.id === id);
    if (!subscription) return;
    const allowedTransitions: Record<LifecycleStatus, LifecycleStatus[]> = {
      Draft: ["Quotation", "Closed"],
      Quotation: ["Confirmed", "Closed"],
      Confirmed: ["Active", "Closed"],
      Active: ["Paused", "Past Due", "Closed"],
      Paused: ["Active", "Closed"],
      "Past Due": ["Active", "Closed"],
      Closed: [],
    };
    if (!allowedTransitions[subscription.status].includes(nextStatus)) {
      showToast(`Cannot move ${id} from ${subscription.status} to ${nextStatus}.`);
      return;
    }
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id !== id) return sub;
        return {
          ...sub,
          status: nextStatus,
          dunningAttempts: nextStatus === "Active" ? 0 : sub.dunningAttempts,
        };
      })
    );
    showToast(`Subscription ${id} transitioned to ${nextStatus}${reason ? `: ${reason}` : ""}`);
  }

  // Invoice Actions
  function confirmInvoice(invoiceId: string) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Confirmed" } : inv))
    );
    showToast(`Invoice ${invoiceId} confirmed and queued for dispatch.`);
  }

  function sendInvoice(invoice: InvoiceItem) {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoice.id ? { ...inv, sentAt: `Today, ${timeStr}` } : inv))
    );
    showToast(`Invoice ${invoice.id} sent to ${invoice.customerEmail} via SMTP.`);
  }

  function downloadInvoiceCSV(invoiceId: string) {
    const invoice = invoices.find(({ id }) => id === invoiceId);
    if (!invoice) return;
    const content = [
      "Payloop Tax Invoice",
      `Invoice number,${invoice.id}`,
      `Customer,${invoice.customerName}`,
      `Description,${invoice.description}`,
      `Subtotal,₹${invoice.subtotal}`,
      `Tax (18%),₹${invoice.tax}`,
      `Total,₹${invoice.total}`,
      `Status,${invoice.status}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(`${invoice.id} downloaded`);
  }

  function openPrintModal(invoice: InvoiceItem) {
    setActiveInvoiceForPrint(invoice);
    setPrintInvoiceModalOpen(true);
  }

  function openPaymentModalForInvoice(invoice: InvoiceItem) {
    setSelectedInvoiceForPayment(invoice);
    setPayAmount(invoice.total);
    setPayRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayNotes(`Settled by staff for ${invoice.id}`);
    setRecordPaymentModalOpen(true);
  }

  function handleRecordPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid payment amount.");
      return;
    }
    if (amount !== selectedInvoiceForPayment.total) {
      showToast(`Record the full outstanding balance of ₹${selectedInvoiceForPayment.total.toLocaleString("en-IN")}.`);
      return;
    }
    if (!payRef.trim()) {
      showToast("Enter a transaction reference before recording payment.");
      return;
    }

    const newPayment: PaymentRecord = {
      id: `PAY-${Math.floor(9000 + Math.random() * 1000)}`,
      invoiceId: selectedInvoiceForPayment.id,
      customerName: selectedInvoiceForPayment.customerName,
      method: payMethod,
      amount,
      date: "31 Oct 2026",
      transactionRef: payRef,
      notes: payNotes,
    };

    setPayments((prev) => [newPayment, ...prev]);

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === selectedInvoiceForPayment.id ? { ...inv, status: "Paid", daysOverdue: undefined } : inv
      )
    );

    // Auto-reactivate subscription if past due
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === selectedInvoiceForPayment.subscriptionId && sub.status === "Past Due") {
          return { ...sub, status: "Active", dunningAttempts: 0 };
        }
        return sub;
      })
    );

    setRecordPaymentModalOpen(false);
    showToast(`Payment of ₹${Number(payAmount).toLocaleString("en-IN")} recorded! Invoice marked as Paid.`);
  }

  // Batch Billing Day Run (Simulation)
  function triggerBillingDay() {
    const billable = activeSubs.filter((sub) => !invoices.some(
      (invoice) => invoice.subscriptionId === sub.id && (invoice.status === "Draft" || invoice.status === "Confirmed")
    ));
    if (billable.length === 0) {
      showToast("Billing run complete: no new invoices were needed. Duplicate drafts were skipped.");
      return;
    }
    const issuedDate = "31 Oct 2026";
    const newInvoices = billable.map((sub, index): InvoiceItem => {
      const taxableSubtotal = Math.round(sub.totalCents / (1 + sub.taxRate));
      const subtotal = taxableSubtotal + sub.discountAmount;
      const tax = sub.totalCents - taxableSubtotal;
      return {
        id: `INV-2026-${1060 + invoices.length + index}`,
        subscriptionId: sub.id,
        customerName: sub.customerName,
        customerEmail: customers.find((customer) => customer.id === sub.customerId)?.email ?? "",
        customerTaxId: customers.find((customer) => customer.id === sub.customerId)?.taxId ?? "",
        description: `${sub.planName} · Scheduled renewal`,
        subtotal,
        tax,
        discount: sub.discountAmount,
        total: sub.totalCents,
        status: "Draft",
        issuedDate,
        dueDate: sub.expiryDate,
        idempotencyKey: `demo-billing-${sub.id}-2026-10-31`,
      };
    });
    setInvoices((previous) => [...newInvoices, ...previous]);
    showToast(`Billing run complete: ${newInvoices.length} draft invoice${newInvoices.length === 1 ? "" : "s"} created; duplicates skipped.`);
  }

  function useTemplate(template: QuoteTemplate) {
    setFormPlan(template.planName.includes("Flow") ? "Flow Analytics" : template.planName.includes("Enterprise") ? "Enterprise Suite" : "Studio Workspace");
    setFormInterval(template.billingInterval);
    setFormVariant(template.variant.includes("Odoo") ? "Odoo Brand (+₹560)" : "Standard");
    setFormPrioritySupport(template.addons.some((addon) => addon.includes("Priority")));
    setFormExtraStorage(template.addons.some((addon) => addon.includes("Storage")));
    setFormDiscount(template.discountName.startsWith("BULK20") ? "BULK20" : template.discountName.startsWith("FESTIVE10") ? "FESTIVE10" : "None");
    setCreateSubModalOpen(true);
    showToast(`${template.title} applied to the quote builder.`);
  }

  // Create Subscription Calculation
  const calculatedSubtotal = useMemo(() => {
    let base = 3500;
    if (formPlan === "Flow Analytics") base = 1180;
    if (formPlan === "Cloud Storage") base = 2000;
    if (formPlan === "Enterprise Suite") base = 15000;
    let variant = formVariant.includes("Odoo") ? 560 : 0;
    let addons = (formPrioritySupport ? 490 : 0) + (formExtraStorage ? 800 : 0);
    return base + variant + addons;
  }, [formPlan, formVariant, formPrioritySupport, formExtraStorage]);

  const calculatedDiscount = useMemo(() => {
    if (formDiscount === "FESTIVE10") return Math.round(calculatedSubtotal * 0.1);
    if (formDiscount === "BULK20") return 2000;
    return 0;
  }, [formDiscount, calculatedSubtotal]);

  const calculatedTax = useMemo(() => {
    const taxable = Math.max(0, calculatedSubtotal - calculatedDiscount);
    return Math.round(taxable * 0.18);
  }, [calculatedSubtotal, calculatedDiscount]);

  const calculatedTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - calculatedDiscount) + calculatedTax;
  }, [calculatedSubtotal, calculatedDiscount, calculatedTax]);

  function handleCreateSubscription(statusToCreate: LifecycleStatus) {
    const cust = customers.find((c) => c.id === formCustomer) || customers[0];
    const newSub: SubscriptionItem = {
      id: `SUB-2026-0${940 + Math.floor(Math.random() * 50)}`,
      customerId: cust.id,
      customerName: cust.company,
      customerContact: cust.name,
      planName: formPlan,
      billingInterval: formInterval,
      variantName: formVariant,
      variantPrice: formVariant.includes("Odoo") ? 560 : 0,
      addons: [
        ...(formPrioritySupport ? ["Priority Support (+₹490)"] : []),
        ...(formExtraStorage ? ["Extra Storage (+₹800)"] : []),
      ],
      basePrice: calculatedSubtotal,
      taxRate: 0.18,
      discountAmount: calculatedDiscount,
      totalCents: calculatedTotal,
      status: statusToCreate,
      startDate: "01 Nov 2026",
      expiryDate: formInterval === "Yearly" ? "01 Nov 2027" : "01 Dec 2026",
      paymentTerms: formPaymentTerms,
      iconLetter: cust.company[0],
      iconTheme: "purple",
    };

    setSubscriptions((prev) => [newSub, ...prev]);
    setCreateSubModalOpen(false);
    showToast(`Created new ${statusToCreate.toLowerCase()} ${newSub.id} for ${cust.company}`);
  }

  return (
    <main className="staff-shell">
      {/* Sidebar */}
      <aside className={`staff-sidebar${menuOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-brand-row">
          <Link className="staff-brand-logo" href="/" aria-label="Payloop home">
            <span className="staff-brand-mark"><span /><span /></span>payloop
          </Link>
          <span className="staff-portal-badge">STAFF</span>
        </div>

        {/* Role Switcher Box */}
        <div className="staff-role-box">
          <div
            className="staff-switcher-card"
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            role="button"
            tabIndex={0}
          >
            <span className="staff-avatar-badge">OP</span>
            <div className="staff-switcher-name">
              <strong>Staff Workspace</strong>
              <small>Daily operations · Active</small>
            </div>
            <Icon name="chevronDown" size={15} />
          </div>

          {workspaceDropdownOpen && (
            <div className="workspace-popover">
              <div className="popover-heading">PERSPECTIVE</div>
              <div className="popover-item active-role" onClick={() => setWorkspaceDropdownOpen(false)}>
                <span className="popover-dot green-dot" />
                <div>
                  <strong>Staff workspace</strong>
                  <small>Daily operations & billing</small>
                </div>
              </div>
              <Link href="/dashboard" className="popover-item" onClick={() => setWorkspaceDropdownOpen(false)}>
                <span className="popover-dot neutral-dot" />
                <div>
                  <strong>Customer portal</strong>
                  <small>Aanya Mehta (Self-service)</small>
                </div>
              </Link>
              <Link href="/admin" className="popover-item" onClick={() => setWorkspaceDropdownOpen(false)}>
                <span className="popover-dot purple-dot" />
                <div>
                  <strong>Admin console</strong>
                  <small>System configuration &amp; governance</small>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="sidebar-label">OPERATIONS CONSOLE</div>
        <nav className="staff-nav" aria-label="Staff navigation">
          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Overview" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Overview")}
          >
            <Icon name="grid" size={17} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Customers" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Customers")}
          >
            <Icon name="users" size={17} />
            <span>Customer records</span>
            <span className="nav-count">{customers.length}</span>
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Subscriptions" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Subscriptions")}
          >
            <Icon name="layers" size={17} />
            <span>Subscriptions & Quotes</span>
            <span className="nav-count">{subscriptions.length}</span>
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Invoices" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Invoices")}
          >
            <Icon name="receipt" size={17} />
            <span>Invoices (Confirm/Send)</span>
            <span className="nav-count">{invoices.length}</span>
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Payments" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Payments")}
          >
            <Icon name="wallet" size={17} />
            <span>Record payments</span>
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Overdue" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Overdue")}
          >
            <Icon name="alertCircle" size={17} />
            <span>Track overdue</span>
            {overdueInvoices.length > 0 && (
              <span className="nav-count overdue-count">{overdueInvoices.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`staff-nav-btn${activeTab === "Templates" ? " nav-active" : ""}`}
            onClick={() => navigateTo("Templates")}
          >
            <Icon name="fileText" size={17} />
            <span>Quote templates</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-bottom">
          <div className="staff-engine-card">
            <div className="engine-status-row">
              <span className="status-live-dot" />
              <strong>Billing Engine v2.4</strong>
            </div>
            <p>Three-layer idempotency guard active. Postgres concurrency locked.</p>
            <button type="button" onClick={triggerBillingDay}>
              <Icon name="refresh" size={11} /> Trigger batch billing
            </button>
          </div>

          <div className="sidebar-account">
            <span className="sidebar-account-avatar">SR</span>
            <div className="sidebar-account-copy">
              <strong>Siddharth Rao</strong>
              <small>Operations Specialist</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="staff-content" id="overview">
        {/* Sticky Header */}
        <header className="staff-header">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name="menu" size={18} />
          </button>

          <div className="breadcrumbs">
            <span>Staff workspace</span>
            <Icon name="chevronRight" size={13} />
            <strong>{activeTab}</strong>
          </div>

          <div className="header-user-actions">
            <div className="idempotency-badge" title="Redis SETNX and Postgres SELECT FOR UPDATE NOWAIT active">
              <span className="idempotency-dot" />
              <span>Idempotency Guard Active</span>
            </div>

            <button
              type="button"
              className="button button-staff button-small"
              onClick={() => setCreateSubModalOpen(true)}
            >
              <Icon name="plus" size={14} /> Create Quote / Sub
            </button>

            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => showToast(`${overdueInvoices.length} overdue invoice requires immediate chasing.`)}
            >
              <Icon name="bell" size={17} />
              {overdueInvoices.length > 0 && <i className="alert-dot" />}
            </button>
            <div className="staff-profile-menu-wrap">
              <button
                type="button"
                className="header-avatar"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                {staffInitials}
              </button>
              {profileMenuOpen && (
                <div className="staff-profile-menu">
                  <div className="staff-profile-header">
                    <strong>{currentStaff.name}</strong>
                    <small>{currentStaff.email}</small>
                    <span className="profile-role-tag">{currentStaff.role}</span>
                  </div>
                  <div className="profile-menu-divider" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setAccountSettingsOpen(true);
                    }}
                  >
                    <Icon name="grid" size={15} />
                    Account settings
                  </button>
                  <Link href="/login" onClick={() => setProfileMenuOpen(false)}>
                    <Icon name="arrowRight" size={15} />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="staff-inner">
          {/* Top Welcome Title Row */}
          <div className="welcome-row">
            <div>
              <p className="welcome-date">STAFF OPERATIONS CONSOLE · SATURDAY, OCTOBER 31, 2026</p>
              <h1>Good morning, Siddharth <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">
                Here is the live operational health across accounts, lifecycle states, and collections.
              </p>
            </div>
            <div className="welcome-actions">
              <button
                type="button"
                className="button button-light"
                onClick={triggerBillingDay}
              >
                <Icon name="refresh" size={14} /> Run Billing Day
              </button>
              <button
                type="button"
                className="button button-staff"
                onClick={() => setCreateSubModalOpen(true)}
              >
                <Icon name="plus" size={15} /> New Subscription
              </button>
            </div>
          </div>

          {/* 3 Summary KPI Cards (Exact match to screenshot) */}
          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-label">
                ACTIVE SUBSCRIPTIONS
                <span className="summary-icon staff-icon-mint">
                  <Icon name="layers" size={16} />
                </span>
              </div>
              <div className="summary-value">
                {activeSubsCount}
                <span className="summary-caption">live recurring contracts</span>
              </div>
              <div className="summary-foot">
                <span className="status-dot" /> {pendingQuotesCount} quotes pending confirmation
              </div>
            </article>

            <article className="summary-card summary-card-highlight">
              <div className="summary-label">
                ESTIMATED MRR
                <span className="summary-icon staff-icon-mint">
                  <Icon name="barChart" size={16} />
                </span>
              </div>
              <div className="summary-value">₹{estimatedMRR.toLocaleString("en-IN")}</div>
              <div className="summary-foot">
                <strong>+14.2%</strong> vs last month · normalized 30-day interval
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-label">
                OVERDUE RECEIVABLES
                <span className="summary-icon staff-icon-alert">
                  <Icon name="alertCircle" size={16} />
                </span>
              </div>
              <div className="summary-value overdue-text">₹{totalOverdueAmount.toLocaleString("en-IN")}</div>
              <div className="summary-foot">
                <button
                  type="button"
                  className="text-alert"
                  onClick={() => navigateTo("Overdue")}
                >
                  {overdueInvoices.length} invoice(s) need chasing →
                </button>
              </div>
            </article>
          </div>

          {/* Action Required Overdue Banner */}
          {overdueInvoices.length > 0 && (
            <div className="overdue-callout-bar">
              <div className="callout-left">
                <span className="callout-icon"><Icon name="alertCircle" size={17} /></span>
                <div>
                  <strong>Action required: {overdueInvoices.length} invoice overdue</strong>
                  <p>Brightleaf Retail (INV-2026-1052) is 13 days past due. Dunning retry window 2 active.</p>
                </div>
              </div>
              <button
                type="button"
                className="button button-alert button-small"
                onClick={() => navigateTo("Overdue")}
              >
                Inspect Overdue Queue
              </button>
            </div>
          )}

          {/* MAIN CONTRACTS & SUBSCRIPTIONS PANEL */}
          <section className="panel" id="subscriptions">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">CONTRACT LIFECYCLE</p>
                <h2>
                  Active & Pipeline Subscriptions
                  <span className="count-bubble">{subscriptions.length}</span>
                </h2>
              </div>

              <div className="panel-controls-right">
                {/* View Mode Toggle: Cards View (Default Dashboard Style) vs Table View */}
                <div className="view-mode-toggle" title="Switch between default card layout and operations table">
                  <button
                    type="button"
                    className={`view-mode-btn${viewMode === "cards" ? " active-view" : ""}`}
                    onClick={() => setViewMode("cards")}
                  >
                    <Icon name="grid" size={13} /> Cards
                  </button>
                  <button
                    type="button"
                    className={`view-mode-btn${viewMode === "table" ? " active-view" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    <Icon name="layers" size={13} /> Table
                  </button>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => navigateTo("Subscriptions")}
                >
                  Manage all subscriptions <Icon name="arrowRight" size={13} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills (Staff extra feature) */}
            <div className="filter-pills-strip">
              <button
                type="button"
                className={`filter-pill${filterCategory === "All" ? " pill-active" : ""}`}
                onClick={() => setFilterCategory("All")}
              >
                All Contracts ({subscriptions.length})
              </button>
              <button
                type="button"
                className={`filter-pill${filterCategory === "Active" ? " pill-active" : ""}`}
                onClick={() => setFilterCategory("Active")}
              >
                Active ({subscriptions.filter((s) => s.status === "Active").length})
              </button>
              <button
                type="button"
                className={`filter-pill${filterCategory === "Pipeline" ? " pill-active" : ""}`}
                onClick={() => setFilterCategory("Pipeline")}
              >
                Pipeline Quotes ({subscriptions.filter((s) => s.status === "Quotation" || s.status === "Draft" || s.status === "Confirmed").length})
              </button>
              <button
                type="button"
                className={`filter-pill${filterCategory === "Attention" ? " pill-active" : ""}`}
                onClick={() => setFilterCategory("Attention")}
              >
                Attention Needed ({subscriptions.filter((s) => s.status === "Past Due").length})
              </button>
              <button
                type="button"
                className={`filter-pill${filterCategory === "Paused" ? " pill-active" : ""}`}
                onClick={() => setFilterCategory("Paused")}
              >
                Paused ({subscriptions.filter((s) => s.status === "Paused").length})
              </button>
            </div>

            {/* --- CARDS VIEW (MATCHING DEFAULT CUSTOMER DASHBOARD) --- */}
            {viewMode === "cards" ? (
              <div className="subscription-list">
                {filteredSubscriptions.map((sub) => (
                  <article className="subscription-card-row" key={sub.id}>
                    <span className={`product-icon product-${sub.iconTheme}`}>{sub.iconLetter}</span>
                    <div className="subscription-info">
                      <strong>{sub.planName}</strong>
                      <span>
                        {sub.id} · {sub.billingInterval}
                        {sub.variantName !== "Standard" && ` · ${sub.variantName}`}
                        <i /> Renews {sub.expiryDate}
                      </span>
                    </div>

                    <div className="subscription-customer-col">
                      <strong>{sub.customerName}</strong>
                      <small>Contact: {sub.customerContact} · {sub.paymentTerms}</small>
                    </div>

                    <div className="subscription-price">
                      <strong>₹{sub.totalCents.toLocaleString("en-IN")}</strong>
                      <span>per {sub.billingInterval.toLowerCase()}</span>
                    </div>

                    <div>
                      <span className={`status-pill status-${sub.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {sub.status}
                      </span>
                    </div>

                    <div className="row-actions-group">
                      {sub.status === "Draft" && (
                        <button
                          type="button"
                          className="action-btn action-amber"
                          onClick={() => transitionSubscription(sub.id, "Quotation", "Issued to customer")}
                        >
                          Issue Quote
                        </button>
                      )}
                      {sub.status === "Quotation" && (
                        <button
                          type="button"
                          className="action-btn action-blue"
                          onClick={() => transitionSubscription(sub.id, "Confirmed", "Customer signed")}
                        >
                          Confirm
                        </button>
                      )}
                      {sub.status === "Confirmed" && (
                        <button
                          type="button"
                          className="action-btn action-green"
                          onClick={() => transitionSubscription(sub.id, "Active", "Activated")}
                        >
                          Activate
                        </button>
                      )}
                      {sub.status === "Active" && (
                        <button
                          type="button"
                          className="action-btn action-muted"
                          onClick={() => transitionSubscription(sub.id, "Paused", "Customer pause request")}
                        >
                          <Icon name="pause" size={11} /> Pause
                        </button>
                      )}
                      {sub.status === "Paused" && (
                        <button
                          type="button"
                          className="action-btn action-green"
                          onClick={() => transitionSubscription(sub.id, "Active", "Resumed")}
                        >
                          <Icon name="play" size={11} /> Resume
                        </button>
                      )}
                      {sub.status === "Past Due" && (
                        <button
                          type="button"
                          className="action-btn action-alert"
                          onClick={() => navigateTo("Overdue")}
                        >
                          Chase
                        </button>
                      )}
                      <button
                        type="button"
                        className="row-action-arrow"
                        title="Manage subscription"
                        onClick={() => {
                          const cust = customers.find((c) => c.company === sub.customerName);
                          if (cust) {
                            setSelectedCustomer(cust);
                            setCustomerDetailModalOpen(true);
                          }
                        }}
                      >
                        <Icon name="chevronRight" size={16} />
                      </button>
                    </div>
                  </article>
                ))}

                <button
                  type="button"
                  className="add-subscription-btn"
                  onClick={() => setCreateSubModalOpen(true)}
                >
                  <span><Icon name="plus" size={14} /></span> Add a subscription or quote
                </button>
              </div>
            ) : (
              /* --- TABLE VIEW (MATCHING USER SCREENSHOT EXACTLY) --- */
              <div className="table-responsive">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>CONTRACT ID</th>
                      <th>CUSTOMER</th>
                      <th>PLAN & VARIANT</th>
                      <th>FREQUENCY</th>
                      <th>AMOUNT / INTERVAL</th>
                      <th>STATUS</th>
                      <th>NEXT LIFECYCLE ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td><strong>{sub.id}</strong></td>
                        <td>
                          <strong>{sub.customerName}</strong>
                          <div style={{ color: "#8c9690", fontSize: "9.5px", marginTop: "2px" }}>
                            {sub.paymentTerms}
                          </div>
                        </td>
                        <td>
                          <span>{sub.planName}</span>
                          {sub.variantName !== "Standard" && (
                            <span className="variant-tag">{sub.variantName}</span>
                          )}
                        </td>
                        <td>{sub.billingInterval}</td>
                        <td className="amount-col">₹{sub.totalCents.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`status-pill status-${sub.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions-group">
                            {sub.status === "Draft" && (
                              <button
                                type="button"
                                className="action-btn action-amber"
                                onClick={() => transitionSubscription(sub.id, "Quotation", "Issued to customer")}
                              >
                                Issue Quote →
                              </button>
                            )}
                            {sub.status === "Quotation" && (
                              <button
                                type="button"
                                className="action-btn action-blue"
                                onClick={() => transitionSubscription(sub.id, "Confirmed", "Customer signed")}
                              >
                                Confirm Quote →
                              </button>
                            )}
                            {sub.status === "Confirmed" && (
                              <button
                                type="button"
                                className="action-btn action-green"
                                onClick={() => transitionSubscription(sub.id, "Active", "Activated")}
                              >
                                Activate Sub →
                              </button>
                            )}
                            {sub.status === "Active" && (
                              <button
                                type="button"
                                className="action-btn action-muted"
                                onClick={() => transitionSubscription(sub.id, "Paused", "Customer pause")}
                              >
                                <Icon name="pause" size={11} /> Pause
                              </button>
                            )}
                            {sub.status === "Paused" && (
                              <button
                                type="button"
                                className="action-btn action-green"
                                onClick={() => transitionSubscription(sub.id, "Active", "Resumed")}
                              >
                                <Icon name="play" size={11} /> Resume
                              </button>
                            )}
                            {sub.status === "Past Due" && (
                              <button
                                type="button"
                                className="action-btn action-alert"
                                onClick={() => navigateTo("Overdue")}
                              >
                                Chase Dunning
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* INVOICES SECTION (MATCHING DEFAULT DASHBOARD PAPER TRAIL) */}
          <section className="panel" id="invoices">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">YOUR PAPER TRAIL & SETTLEMENTS</p>
                <h2>Recent Invoices</h2>
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => navigateTo("Invoices")}
              >
                All invoices <Icon name="arrowRight" size={13} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>INVOICE</th>
                    <th>DATE</th>
                    <th>CUSTOMER & DESCRIPTION</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{inv.issuedDate}</td>
                      <td>
                        <strong>{inv.customerName}</strong>
                        <div style={{ color: "#8c9690", fontSize: "9.5px", marginTop: "2px" }}>
                          {inv.description}
                        </div>
                      </td>
                      <td className="amount-col">₹{inv.total.toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`invoice-status-pill inv-${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions-group">
                          {inv.status === "Draft" && (
                            <button
                              type="button"
                              className="action-btn action-green"
                              onClick={() => confirmInvoice(inv.id)}
                            >
                              Confirm
                            </button>
                          )}
                          {inv.status === "Confirmed" && (
                            <>
                              <button
                                type="button"
                                className="action-btn action-muted"
                                onClick={() => sendInvoice(inv)}
                              >
                                <Icon name="send" size={11} /> Send
                              </button>
                              <button
                                type="button"
                                className="action-btn action-green"
                                onClick={() => openPaymentModalForInvoice(inv)}
                              >
                                Record Pay
                              </button>
                            </>
                          )}
                          {inv.status === "Overdue" && (
                            <button
                              type="button"
                              className="action-btn action-alert"
                              onClick={() => openPaymentModalForInvoice(inv)}
                            >
                              Record Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="download-button"
                            title="Print / Save PDF"
                            onClick={() => openPrintModal(inv)}
                          >
                            <Icon name="printer" size={14} />
                          </button>
                          <button
                            type="button"
                            className="download-button"
                            title={`Download ${inv.id} CSV`}
                            onClick={() => downloadInvoiceCSV(inv.id)}
                          >
                            <Icon name="download" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" id="customers">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">CUSTOMER DIRECTORY</p>
                <h2>Customer records <span className="count-bubble">{customers.length}</span></h2>
              </div>
              <button type="button" className="text-button" onClick={() => setCreateSubModalOpen(true)}>
                <Icon name="plus" size={13} /> Create quote
              </button>
            </div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>TAX ID</th><th>CONTRACTS</th><th>LIFETIME SPEND</th><th>STATUS</th><th /></tr></thead>
                <tbody>{customers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{customer.company}</strong><div className="table-caption">{customer.city}</div></td>
                    <td>{customer.name}<div className="table-caption">{customer.email}</div></td>
                    <td>{customer.taxId}</td>
                    <td>{customer.activeContracts}</td>
                    <td className="amount-col">₹{customer.totalSpend.toLocaleString("en-IN")}</td>
                    <td><span className={`status-pill status-${customer.status.toLowerCase().replace(/\s+/g, "-")}`}>{customer.status}</span></td>
                    <td><button type="button" className="text-button" onClick={() => openCustomerDetail(customer)}>View</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="panel" id="payments">
            <div className="panel-heading">
              <div><p className="panel-eyebrow">RECONCILIATION LEDGER</p><h2>Recorded payments <span className="count-bubble">{payments.length}</span></h2></div>
            </div>
            <div className="table-responsive">
              <table className="staff-table">
                <thead><tr><th>PAYMENT</th><th>INVOICE</th><th>CUSTOMER</th><th>METHOD</th><th>REFERENCE</th><th>DATE</th><th>AMOUNT</th></tr></thead>
                <tbody>{payments.map((payment) => (
                  <tr key={payment.id}><td><strong>{payment.id}</strong></td><td>{payment.invoiceId}</td><td>{payment.customerName}</td><td>{payment.method}</td><td>{payment.transactionRef}</td><td>{payment.date}</td><td className="amount-col">₹{payment.amount.toLocaleString("en-IN")}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="panel" id="overdue">
            <div className="panel-heading">
              <div><p className="panel-eyebrow">COLLECTIONS QUEUE</p><h2>Overdue invoices <span className="count-bubble">{overdueInvoices.length}</span></h2></div>
            </div>
            {overdueInvoices.length === 0 ? <p className="empty-panel">No overdue invoices. Collections are up to date.</p> : (
              <div className="table-responsive">
                <table className="staff-table">
                  <thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DUE DATE</th><th>OVERDUE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead>
                  <tbody>{overdueInvoices.map((invoice) => (
                    <tr key={invoice.id}><td><strong>{invoice.id}</strong></td><td>{invoice.customerName}</td><td>{invoice.dueDate}</td><td>{invoice.daysOverdue ?? 0} days</td><td className="amount-col">₹{invoice.total.toLocaleString("en-IN")}</td><td><div className="row-actions-group"><button type="button" className="action-btn action-muted" onClick={() => showToast(`Payment reminder queued for ${invoice.customerEmail}.`)}>Send reminder</button><button type="button" className="action-btn action-alert" onClick={() => openPaymentModalForInvoice(invoice)}>Record pay</button></div></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel" id="templates">
            <div className="panel-heading"><div><p className="panel-eyebrow">STANDARDISED OFFERS</p><h2>Quote templates <span className="count-bubble">{templates.length}</span></h2></div></div>
            <div className="template-grid">{templates.map((template) => (
              <article className="template-card" key={template.id}>
                <span className="template-id">{template.id}</span><h3>{template.title}</h3><p>{template.description}</p>
                <div className="template-meta"><span>{template.billingInterval}</span><span>Valid {template.validDays} days</span><strong>₹{template.basePrice.toLocaleString("en-IN")}</strong></div>
                <button type="button" className="button button-staff button-small" onClick={() => useTemplate(template)}>Use template <Icon name="arrowRight" size={13} /></button>
              </article>
            ))}</div>
          </section>
        </div>
      </section>

      {/* --- MODAL 1: CREATE SUBSCRIPTION / QUOTE --- */}
      {createSubModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setCreateSubModalOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="layers" size={19} /></span>
              <button
                type="button"
                className="icon-button modal-close"
                onClick={() => setCreateSubModalOpen(false)}
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <p className="panel-eyebrow">NEW CONTRACT BUILDER</p>
            <h2>Create Subscription or Quote</h2>
            <p className="modal-description">
              Select customer, configure plans, variants, add-ons and calculate localized 18% GST.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateSubscription("Quotation"); }}>
              <div className="form-group">
                <label>Customer Account</label>
                <select
                  className="form-control"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} — {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Base Plan</label>
                  <select
                    className="form-control"
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                  >
                    <option value="Studio Workspace">Studio Workspace (₹3,500/mo)</option>
                    <option value="Flow Analytics">Flow Analytics (₹1,180/mo)</option>
                    <option value="Cloud Storage">Cloud Storage Team (₹2,000/mo)</option>
                    <option value="Enterprise Suite">Enterprise Suite (₹15,000/mo)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Billing Frequency</label>
                  <select
                    className="form-control"
                    value={formInterval}
                    onChange={(e) => setFormInterval(e.target.value as any)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly (12 months)</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Product Variant</label>
                  <select
                    className="form-control"
                    value={formVariant}
                    onChange={(e) => setFormVariant(e.target.value as any)}
                  >
                    <option value="Standard">Standard (+₹0)</option>
                    <option value="Odoo Brand (+₹560)">Odoo Brand Variant (+₹560)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Discount Rule</label>
                  <select
                    className="form-control"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value as any)}
                  >
                    <option value="None">None</option>
                    <option value="FESTIVE10">FESTIVE10 (10% off)</option>
                    <option value="BULK20">BULK20 (₹2,000 flat off)</option>
                  </select>
                </div>
              </div>

              <div style={{ margin: "10px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formPrioritySupport}
                    onChange={(e) => setFormPrioritySupport(e.target.checked)}
                  />
                  <span>Priority SLA Support (+₹490/mo)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formExtraStorage}
                    onChange={(e) => setFormExtraStorage(e.target.checked)}
                  />
                  <span>Extra 500GB Cloud Storage (+₹800/mo)</span>
                </label>
              </div>

              {/* Live Calculation Preview */}
              <div className="calculation-box">
                <div className="calc-row">
                  <span>Subtotal:</span>
                  <strong>₹{calculatedSubtotal.toLocaleString("en-IN")}</strong>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="calc-row" style={{ color: "#247352" }}>
                    <span>Discount:</span>
                    <strong>-₹{calculatedDiscount.toLocaleString("en-IN")}</strong>
                  </div>
                )}
                <div className="calc-row">
                  <span>GST (18%):</span>
                  <strong>₹{calculatedTax.toLocaleString("en-IN")}</strong>
                </div>
                <div className="calc-row total-row">
                  <span>Calculated Total:</span>
                  <strong>₹{calculatedTotal.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-light"
                  onClick={() => setCreateSubModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-light"
                  onClick={() => handleCreateSubscription("Draft")}
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="button button-staff"
                >
                  Issue Quotation →
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* --- MODAL 2: RECORD PAYMENT --- */}
      {recordPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setRecordPaymentModalOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="wallet" size={19} /></span>
              <button
                type="button"
                className="icon-button modal-close"
                onClick={() => setRecordPaymentModalOpen(false)}
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <p className="panel-eyebrow">RECONCILIATION</p>
            <h2>Record Payment for {selectedInvoiceForPayment.id}</h2>
            <p className="modal-description">
              Match settlement for {selectedInvoiceForPayment.customerName} ({selectedInvoiceForPayment.description}).
            </p>

            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  className="form-control"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI / Razorpay">UPI / Razorpay</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Cheque">Corporate Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Transaction Reference / Bank Ref</label>
                <input
                  type="text"
                  className="form-control"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. HDFC99281940"
                  required
                />
              </div>

              <div className="form-group">
                <label>Audit Note</label>
                <input
                  type="text"
                  className="form-control"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Reconciled against bank statement"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-light"
                  onClick={() => setRecordPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-staff">
                  Confirm & Mark Paid
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* --- MODAL 3: PRINTABLE INVOICE PREVIEW --- */}
      {printInvoiceModalOpen && activeInvoiceForPrint && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setPrintInvoiceModalOpen(false);
        }}>
          <section className="printable-invoice-modal" role="dialog" aria-modal="true">
            <div className="print-modal-header no-print">
              <span className="print-title">Print Preview: {activeInvoiceForPrint.id}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="button button-staff button-small"
                  onClick={() => window.print()}
                >
                  <Icon name="printer" size={14} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="icon-button modal-close"
                  onClick={() => setPrintInvoiceModalOpen(false)}
                >
                  <Icon name="x" size={17} />
                </button>
              </div>
            </div>

            <div className="invoice-paper" id="invoice-sheet">
              <div className="inv-sheet-top">
                <div>
                  <div className="staff-brand-logo">
                    <span className="staff-brand-mark"><span /><span /></span>payloop
                  </div>
                  <p className="inv-company-sub">
                    Payloop Subscriptions Pvt Ltd<br />
                    B-402, High Street Towers, Lower Parel<br />
                    Mumbai, Maharashtra 400013 · GSTIN: 27AAACP8912E1Z2
                  </p>
                </div>
                <div className="inv-sheet-meta">
                  <h1>TAX INVOICE</h1>
                  <table className="inv-meta-table">
                    <tbody>
                      <tr>
                        <td>Invoice No:</td>
                        <td><strong>{activeInvoiceForPrint.id}</strong></td>
                      </tr>
                      <tr>
                        <td>Issued Date:</td>
                        <td>{activeInvoiceForPrint.issuedDate}</td>
                      </tr>
                      <tr>
                        <td>Due Date:</td>
                        <td>{activeInvoiceForPrint.dueDate}</td>
                      </tr>
                      <tr>
                        <td>Status:</td>
                        <td>
                          <span className={`invoice-status-pill inv-${activeInvoiceForPrint.status.toLowerCase()}`}>
                            {activeInvoiceForPrint.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="inv-sheet-billto">
                <div>
                  <span className="inv-label">BILLED TO:</span>
                  <strong>{activeInvoiceForPrint.customerName}</strong>
                  <p>
                    Tax ID: {activeInvoiceForPrint.customerTaxId}<br />
                    Email: {activeInvoiceForPrint.customerEmail}
                  </p>
                </div>
                <div>
                  <span className="inv-label">SUBSCRIPTION REFERENCE:</span>
                  <p>
                    ID: {activeInvoiceForPrint.subscriptionId}<br />
                    Idempotency Key: {activeInvoiceForPrint.idempotencyKey.slice(0, 20)}...
                  </p>
                </div>
              </div>

              <table className="inv-sheet-items">
                <thead>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: "right" }}>QTY</th>
                    <th style={{ textAlign: "right" }}>RATE</th>
                    <th style={{ textAlign: "right" }}>TAX</th>
                    <th style={{ textAlign: "right" }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{activeInvoiceForPrint.description}</strong>
                      <div style={{ color: "#79746d", fontSize: "10px" }}>Recurring cycle billing</div>
                    </td>
                    <td style={{ textAlign: "right" }}>1</td>
                    <td style={{ textAlign: "right" }}>₹{activeInvoiceForPrint.subtotal.toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right" }}>₹{activeInvoiceForPrint.tax.toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹{activeInvoiceForPrint.total.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>

              <div className="inv-sheet-totals">
                <div className="inv-payment-notes">
                  <strong>Payment Remittance:</strong>
                  <p>
                    A/C Name: Payloop Operations Pvt Ltd<br />
                    A/C No: 50200088921834<br />
                    IFSC: HDFC0000128 · Lower Parel
                  </p>
                </div>
                <div className="inv-totals-box">
                  <div className="tot-row">
                    <span>Subtotal:</span>
                    <span>₹{activeInvoiceForPrint.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="tot-row">
                    <span>GST (18%):</span>
                    <span>₹{activeInvoiceForPrint.tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="tot-row grand-total">
                    <span>Total Due:</span>
                    <strong>₹{activeInvoiceForPrint.total.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              <div className="inv-sheet-foot">
                <p>This is a computer generated document validated with Payloop Idempotency Lock.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- MODAL 4: CUSTOMER DRAWER --- */}
      {customerDetailModalOpen && selectedCustomer && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setCustomerDetailModalOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="users" size={19} /></span>
              <button
                type="button"
                className="icon-button modal-close"
                onClick={() => setCustomerDetailModalOpen(false)}
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <p className="panel-eyebrow">CUSTOMER PROFILE</p>
            <h2>{selectedCustomer.company}</h2>
            <p className="modal-description">Primary Contact: {selectedCustomer.name} · {selectedCustomer.city}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "12px 0", fontSize: "11px" }}>
              <div style={{ background: "#f7faf8", padding: "10px", borderRadius: "8px" }}>
                <span style={{ color: "#798780", fontSize: "9px" }}>Billing Email</span>
                <strong style={{ display: "block" }}>{selectedCustomer.email}</strong>
              </div>
              <div style={{ background: "#f7faf8", padding: "10px", borderRadius: "8px" }}>
                <span style={{ color: "#798780", fontSize: "9px" }}>Lifetime Spend</span>
                <strong style={{ display: "block", color: "#1c523b" }}>₹{selectedCustomer.totalSpend.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-light"
                onClick={() => setCustomerDetailModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-staff"
                onClick={() => {
                  setCustomerDetailModalOpen(false);
                  setFormCustomer(selectedCustomer.id);
                  setCreateSubModalOpen(true);
                }}
              >
                + Create New Quote
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- MODAL 5: STAFF ACCOUNT SETTINGS --- */}
      {accountSettingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setAccountSettingsOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="grid" size={19} /></span>
              <button
                type="button"
                className="icon-button modal-close"
                onClick={() => setAccountSettingsOpen(false)}
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <p className="panel-eyebrow">STAFF PROFILE</p>
            <h2>Account Settings</h2>
            <p className="modal-description">
              Manage your staff account access and authorizations.
            </p>
            <div style={{ background: "rgba(0,0,0,0.03)", padding: "14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ marginBottom: "6px" }}><strong>Name:</strong> {currentStaff.name}</div>
              <div style={{ marginBottom: "6px" }}><strong>Email:</strong> {currentStaff.email}</div>
              <div style={{ marginBottom: "6px" }}><strong>Role:</strong> <span className="profile-role-tag">{currentStaff.role}</span></div>
              <div><strong>Powers:</strong> <span style={{ color: "var(--staff-muted)" }}>{currentStaff.permissions}</span></div>
            </div>
            <p style={{ display: "none" }}>
            </p>

            <div className="settings-options">
              <button type="button" onClick={() => {
                setPasswordMessage("");
                setAccountSettingsOpen(false);
                setChangePasswordOpen(true);
              }}>
                <span className="settings-option-icon"><Icon name="check" size={16} /></span>
                <span><strong>Change password</strong><small>Update your staff account password</small></span>
                <Icon name="chevronRight" size={17} />
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-light"
                onClick={() => setAccountSettingsOpen(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {changePasswordOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setChangePasswordOpen(false);
        }}>
          <section className="manage-modal" role="dialog" aria-modal="true" aria-labelledby="staff-change-password-title">
            <div className="modal-top">
              <span className="modal-icon"><Icon name="check" size={19} /></span>
              <button
                type="button"
                className="icon-button modal-close"
                aria-label="Close change password"
                onClick={() => setChangePasswordOpen(false)}
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <p className="panel-eyebrow">CHANGE PASSWORD</p>
            <h2 id="staff-change-password-title">A fresh start for your password.</h2>
            <p className="modal-description">
              Use at least 9 characters with uppercase, lowercase, and a special character.
            </p>
            <form className="dialog-form" onSubmit={submitPassword}>
              <label>Current password<input type="password" name="currentPassword" autoComplete="current-password" required /></label>
              <label>New password<input type="password" name="newPassword" autoComplete="new-password" minLength={9} required /></label>
              <label>Confirm new password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={9} required /></label>
              {passwordMessage && <p className="form-feedback" role="status">{passwordMessage}</p>}
              <div className="modal-actions">
                <button type="button" className="button button-light" onClick={() => {
                  setChangePasswordOpen(false);
                  setAccountSettingsOpen(true);
                }}>Back</button>
                <button type="submit" className="button button-staff">Update password</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Toast Feedback */}
      {notice && <div className="toast-message" role="status">{notice}</div>}
    </main>
  );
}
