import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Plans & pricing — Payloop",
  description: "Find the Payloop subscription plan that fits your business.",
};

const plans = [
  {
    name: "Essentials",
    description: "A nice and simple start for small teams.",
    price: "₹890",
    interval: "per month",
    className: "pricing-card-sage",
    features: ["One workspace", "Core subscription tools", "Monthly invoices", "Email support"],
  },
  {
    name: "Growth",
    description: "A little more room for things to grow.",
    price: "₹2,490",
    interval: "per month",
    className: "pricing-card-featured",
    features: ["Everything in Essentials", "Team collaboration", "Recurring billing", "Priority support option"],
  },
  {
    name: "Team",
    description: "The shared space your whole team needs.",
    price: "₹4,680",
    interval: "per month",
    className: "pricing-card-lavender",
    features: ["Everything in Growth", "Shared team workspace", "More storage and seats", "A helping hand when you need it"],
  },
];

export default function PlansPage() {
  return (
    <main className="pricing-page">
      <div className="landing-glow" aria-hidden="true" />
      <header className="site-header pricing-header">
        <Link className="brand" href="/" aria-label="Payloop home"><span className="brand-mark"><span /><span /></span>payloop</Link>
        <nav className="site-nav" aria-label="Main navigation"><Link href="/#how-it-works">How it works</Link><Link href="/#about">About us</Link></nav>
        <div className="header-actions"><Link className="header-login" href="/login">Log in</Link><Link className="button button-dark button-small" href="/signup">Create account <Icon name="arrowUpRight" size={14} /></Link></div>
      </header>
      <section className="pricing-intro">
        <p className="hero-kicker"><span className="kicker-line" /> A plan for your kind of rhythm <span className="kicker-line" /></p>
        <h1>Good things, at<br /><span>your own pace.</span></h1>
        <p>Pick a plan that feels right. No surprises, just the tools to keep your recurring business moving.</p>
        <span className="pricing-demo-note"><span className="note-dot" /> Sample pricing for this product preview</span>
      </section>
      <section className="pricing-grid" aria-label="Plans and pricing">
        {plans.map((plan, index) => (
          <article className={`pricing-card ${plan.className}`} key={plan.name}>
            {index === 1 && <span className="popular-badge">A little extra loved</span>}
            <p className="pricing-plan-label">{plan.name.toUpperCase()} PLAN</p>
            <h2>{plan.name}</h2>
            <p className="pricing-description">{plan.description}</p>
            <div className="pricing-price">{plan.price}<span> / mo</span></div>
            <p className="pricing-interval">Billed monthly · cancel any time</p>
            <Link className={`button ${index === 1 ? "button-dark" : "button-light"} pricing-cta`} href="/signup">
              Sign up for {plan.name} <Icon name="arrowRight" size={15} />
            </Link>
            <div className="pricing-divider" />
            <p className="pricing-includes">A few good things included</p>
            <ul>{plan.features.map((feature) => <li key={feature}><Icon name="check" size={15} />{feature}</li>)}</ul>
          </article>
        ))}
      </section>
      <section className="pricing-footnote"><p>Not sure yet? <Link href="/signup">Create an account</Link> and take a look around.</p><span>Sample plans for the Payloop UI preview. Billing is not connected.</span></section>
      <footer className="site-footer"><Link className="brand" href="/"><span className="brand-mark"><span /><span /></span>payloop</Link><span>Good things, on repeat.</span><span>© 2026 Payloop</span></footer>
    </main>
  );
}
