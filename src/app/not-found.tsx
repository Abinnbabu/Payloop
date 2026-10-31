import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="landing-glow" aria-hidden="true" />
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Payloop home">
          <span className="brand-mark">
            <span />
            <span />
          </span>
          payloop
        </Link>
        <Link className="auth-back-link" href="/">
          Back to home <Icon name="arrowUpRight" size={14} />
        </Link>
      </header>
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "32px 20px",
        }}
      >
        <p className="eyebrow">PAGE NOT FOUND · 404</p>
        <h1
          style={{
            fontFamily: "var(--serif, Georgia, serif)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 500,
            margin: "12px 0 16px",
            letterSpacing: "-1.5px",
          }}
        >
          This loop seems <em>missing.</em>
        </h1>
        <p
          style={{
            maxWidth: "460px",
            color: "var(--muted, #827e77)",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: "0 0 28px",
          }}
        >
          The page or route you are looking for doesn’t exist or has moved. Let’s get you back on track.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/" className="button button-dark">
            Back to Home <Icon name="arrowRight" size={15} />
          </Link>
          <Link href="/login" className="button button-light">
            Sign In
          </Link>
        </div>
      </div>
      <footer className="auth-footer">
        <Link href="/">payloop</Link>
        <span>Good things, on repeat. © 2026 Payloop</span>
      </footer>
    </main>
  );
}

