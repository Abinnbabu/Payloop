"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export function CookieBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <aside className="cookie-banner" aria-label="Cookie notice">
      <div className="cookie-copy">
        <p className="cookie-title">A little note about cookies</p>
        <p>
          We use essential cookies to keep your experience secure and smooth.
        </p>
      </div>
      <button
        className="cookie-close"
        type="button"
        aria-label="Dismiss cookie notice"
        onClick={() => setVisible(false)}
      >
        <Icon name="x" size={16} />
      </button>
    </aside>
  );
}
