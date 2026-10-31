import Link from "next/link";
import { CookieBanner } from "@/components/cookie-banner";
import { Icon } from "@/components/icon";

const benefits = [
  {
    number: "01",
    title: "Everything, on one loop",
    body: "Subscriptions, renewals, and invoices finally get along. See the whole picture without hopping between tools.",
    icon: "layers" as const,
  },
  {
    number: "02",
    title: "The little things, handled",
    body: "Recurring billing keeps its rhythm, so your team can spend less time chasing dates and more time building.",
    icon: "sparkle" as const,
  },
  {
    number: "03",
    title: "Customers in control",
    body: "Give every customer a clear place to manage their plan, check a payment, or find an invoice.",
    icon: "grid" as const,
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <div className="landing-glow" aria-hidden="true" />
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Payloop home">
          <span className="brand-mark">
            <span />
            <span />
          </span>
          payloop
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-you">For you</a>
          <a href="#about">About us</a>
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/login">
            Log in
          </Link>
          <Link className="button button-dark button-small" href="/plans">
            Get started <Icon name="arrowUpRight" size={15} />
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-kicker">
          <span className="kicker-line" />
          A more human way to do subscriptions
          <span className="kicker-line" />
        </div>
        <h1>
          Your subscriptions,
          <br />
          <span>in a happier place.</span>
        </h1>
        <p className="hero-description">
          Plans, payments, and the little details in between. Payloop keeps your
          recurring business moving — and makes it feel easy.
        </p>
        <div className="hero-actions">
          <Link className="button button-dark" href="/dashboard">
            Take a look around <Icon name="arrowRight" size={17} />
          </Link>
          <a className="button button-light" href="#how-it-works">
            See how it works
          </a>
        </div>
        <div className="hero-note">
          <span className="note-dot" />
          Made for the businesses that run on recurring revenue
        </div>

        <div className="preview-wrap" aria-label="Preview of the Payloop dashboard">
          <div className="preview-glow" />
          <div className="preview-window">
            <div className="preview-sidebar">
              <div className="preview-logo">
                <span className="brand-mark brand-mark-small">
                  <span />
                  <span />
                </span>
                payloop
              </div>
              <span className="preview-nav-label">YOUR SPACE</span>
              <div className="preview-nav-item preview-nav-current">
                <Icon name="grid" size={15} /> Overview
              </div>
              <div className="preview-nav-item">
                <Icon name="layers" size={15} /> Subscriptions
              </div>
              <div className="preview-nav-item">
                <Icon name="receipt" size={15} /> Invoices
              </div>
              <div className="preview-user">
                <span className="avatar avatar-peach">AM</span>
                <span>
                  <strong>Aanya Mehta</strong>
                  <small>Personal account</small>
                </span>
              </div>
            </div>
            <div className="preview-main">
              <div className="preview-topline">
                <span>Good morning, Aanya <span className="wave">✳</span></span>
                <span className="preview-date">Your account at a glance</span>
              </div>
              <div className="preview-card-row">
                <div className="preview-stat">
                  <span>Active subscriptions</span>
                  <strong>03</strong>
                  <small><span className="stat-positive">Looking good</span> across your plans</small>
                </div>
                <div className="preview-stat preview-stat-peach">
                  <span>Next payment</span>
                  <strong>₹4,680</strong>
                  <small>Due 12 November <span className="preview-card-icon">↗</span></small>
                </div>
              </div>
              <div className="preview-subscription">
                <div className="preview-section-title">
                  <span>Your subscriptions</span><span className="preview-link">See all →</span>
                </div>
                <div className="preview-row">
                  <span className="product-icon product-purple">S</span>
                  <span className="preview-product"><strong>Studio workspace</strong><small>Pro plan · Renews 12 Nov</small></span>
                  <span className="plan-price">₹3,500 <small>/ month</small></span>
                  <span className="active-pill">Active</span>
                </div>
                <div className="preview-row">
                  <span className="product-icon product-sage">F</span>
                  <span className="preview-product"><strong>Flow analytics</strong><small>Starter plan · Renews 18 Nov</small></span>
                  <span className="plan-price">₹1,180 <small>/ month</small></span>
                  <span className="active-pill">Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-floating-note">
            <span className="floating-check"><Icon name="check" size={14} /></span>
            All caught up
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-art" aria-hidden="true">
          <span className="about-orbit about-orbit-one" />
          <span className="about-orbit about-orbit-two" />
          <span className="about-center-mark"><span /><span /></span>
          <span className="about-spark about-spark-one">✳</span>
          <span className="about-spark about-spark-two">✳</span>
        </div>
        <div className="about-copy">
          <p className="eyebrow">A little about us</p>
          <h2>Subscriptions should feel like a <span>good thing.</span></h2>
          <p>
            We think the best recurring businesses are built on trust, not
            reminders and spreadsheets. Payloop brings plans, payments, and
            people together so the everyday work feels lighter for everyone.
          </p>
          <p>
            One clear place for your team to run the business — and for your
            customers to feel right at home.
          </p>
          <Link className="text-button" href="/plans">
            Find your plan <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </section>

      <section className="trust-strip" aria-label="Product promise">
        <span>LESS ADMIN</span><i /> <span>MORE CLARITY</span><i /> <span>BETTER EVERY BILLING DAY</span>
      </section>

      <section className="feature-section" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">A good loop changes everything</p>
          <h2>All the moving parts.<br /><span>Moving together.</span></h2>
          <p className="section-description">
            A quieter, clearer way to handle the business behind every
            subscription — from the first sign-up to the next renewal.
          </p>
        </div>
        <div className="benefit-grid" id="for-you">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.number}>
              <div className="benefit-top">
                <span className="benefit-icon"><Icon name={benefit.icon} size={19} /></span>
                <span>{benefit.number}</span>
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
              <span className="benefit-arrow"><Icon name="arrowUpRight" size={17} /></span>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div className="cta-orb" aria-hidden="true" />
        <p className="eyebrow">Ready when you are</p>
        <h2>Let’s get your business<br />back in its rhythm.</h2>
        <Link className="button button-dark" href="/plans">
          Find your plan <Icon name="arrowRight" size={17} />
        </Link>
      </section>

      <footer className="site-footer">
        <Link className="brand" href="/" aria-label="Payloop home">
          <span className="brand-mark"><span /><span /></span>payloop
        </Link>
        <span>Good things, on repeat.</span>
        <span>© 2026 Payloop</span>
      </footer>
      <CookieBanner />
    </main>
  );
}
