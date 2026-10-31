#!/usr/bin/env python3
"""
apply_fixes.py — idempotent patcher for the StaffPage / StaffClient TS2322 fix.

Fixes applied:
  1. lib/types.ts            — new file with SessionUser / UserRole (pure types).
  2. lib/auth.ts             — import type from ./types, re-export, normalizeRole.
  3. app/staff/staff-client.tsx — add explicit StaffClientProps + typed function.
  4. app/staff/page.tsx      — wrap loadSessionUser in try/catch, case-insensitive role,
                               force-dynamic, redirects outside try/catch.

Safe to re-run: each patch is skipped if its marker is already present.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path.cwd()

# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #

def read(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def marker_present(path: Path, marker: str) -> bool:
    return marker in read(path)


# --------------------------------------------------------------------------- #
# 1. lib/types.ts
# --------------------------------------------------------------------------- #

def fix_types_file() -> None:
    print("[1/4] lib/types.ts")
    path = ROOT / "lib" / "types.ts"
    content = '''// Pure type-only module. Safe to import from Server and Client Components.
// No runtime imports — nothing server-side leaks into the client bundle.

export type UserRole = "Staff" | "Admin" | "Customer";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};
'''
    if path.exists() and "SessionUser" in read(path):
        print("  already present, skipping")
        return
    write(path, content)


# --------------------------------------------------------------------------- #
# 2. lib/auth.ts
# --------------------------------------------------------------------------- #

AUTH_HEADER = "// --- types (shared with client) ---"
AUTH_IMPORT = '''import type { SessionUser, UserRole } from "./types";
export type { SessionUser, UserRole };
'''
NORMALIZE_FN = '''
// --- role normalization ------------------------------------------------
function normalizeRole(role: unknown): UserRole {
  switch (String(role).toLowerCase()) {
    case "staff":    return "Staff";
    case "admin":    return "Admin";
    case "customer": return "Customer";
    default:         return "Customer"; // fail-closed
  }
}
'''


def fix_auth_file() -> None:
    print("[2/4] lib/auth.ts")
    path = ROOT / "lib" / "auth.ts"
    src = read(path)
    if not src:
        print("  !! lib/auth.ts not found — create it manually", file=sys.stderr)
        return

    # (a) ensure the type import + re-export exist
    if AUTH_HEADER not in src:
        # drop the import right after the last top-of-file import line
        import_lines = [
            i for i, ln in enumerate(src.splitlines())
            if ln.startswith("import ")
        ]
        if import_lines:
            insert_at = import_lines[-1] + 1
            lines = src.splitlines()
            block = ["", AUTH_HEADER, *AUTH_IMPORT.splitlines()]
            lines[insert_at:insert_at] = block
            src = "\n".join(lines) + "\n"
        else:
            src = AUTH_HEADER + "\n" + AUTH_IMPORT + "\n" + src

    # (b) append normalizeRole helper if not already defined
    if "function normalizeRole" not in src:
        src = src.rstrip() + "\n" + NORMALIZE_FN

    # (c) if the old body referenced a raw role, wrap it
    #     (best-effort: replace `role: payload.role` with normalized form)
    src = re.sub(
        r"role:\s*payload\.role\b",
        "role: normalizeRole(payload.role)",
        src,
    )

    write(path, src)


# --------------------------------------------------------------------------- #
# 3. app/staff/staff-client.tsx
# --------------------------------------------------------------------------- #

CLIENT_CONTENT = '''"use client";

import type { SessionUser } from "@/lib/types";

export type StaffClientProps = {
  user: SessionUser;
};

export function StaffClient({ user }: StaffClientProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Staff Workspace</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {user.email} ({user.role})
      </p>

      {/* dashboard content here */}
    </div>
  );
}

export default StaffClient;
'''


def fix_staff_client() -> None:
    print("[3/4] app/staff/staff-client.tsx")
    path = ROOT / "app" / "staff" / "staff-client.tsx"
    src = read(path)

    if not src:
        # create fresh if missing
        write(path, CLIENT_CONTENT)
        return

    # If the file already declares StaffClientProps → nothing to do
    if "StaffClientProps" in src and "user: SessionUser" in src:
        print("  already typed, skipping")
        return

    # Otherwise: prepend typed header + rewrite the signature.
    # Handles `function StaffClient()`, `export function StaffClient()`,
    # `const StaffClient = memo(...)`, `forwardRef(...)`.
    new = src

    # ensure type import
    if "@/lib/types" not in new and 'from "@/lib/auth"' not in new:
        new = (
            'import type { SessionUser } from "@/lib/types";\n' + new
        )
    else:
        # rewrite any SessionUser import that came from auth → types
        new = new.replace('from "@/lib/auth"', 'from "@/lib/types"')

    # ensure props type declared
    if "StaffClientProps" not in new:
        new = (
            "export type StaffClientProps = { user: SessionUser };\n\n"
            + new
        )

    # rewrite common component signatures to accept props
    new = re.sub(
        r"export\s+function\s+StaffClient\s*\(\s*\)",
        "export function StaffClient({ user }: StaffClientProps)",
        new,
    )
    new = re.sub(
        r"function\s+StaffClient\s*\(\s*\)",
        "function StaffClient({ user }: StaffClientProps)",
        new,
    )
    new = re.sub(
        r"memo\s*\(\s*function\s+StaffClient\s*\(\s*\)",
        "memo<StaffClientProps>(function StaffClient({ user }",
        new,
    )
    new = re.sub(
        r"forwardRef\s*<\s*[^,>]+,\s*[^>]+>\s*\(\s*function\s+StaffClient\s*\(\s*\)",
        "forwardRef<HTMLDivElement, StaffClientProps>(function StaffClient({ user }, ref",
        new,
    )

    write(path, new)


# --------------------------------------------------------------------------- #
# 4. app/staff/page.tsx
# --------------------------------------------------------------------------- #

PAGE_CONTENT = '''import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionUser } from "@/lib/auth";
import { StaffClient } from "./staff-client";

export const metadata: Metadata = {
  title: "Staff Workspace — Payloop",
  description:
    "Daily operations dashboard for Payloop staff: customer management, quote generation, subscriptions lifecycle, invoicing, and payment reconciliation.",
};

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  let user = null;
  try {
    user = await loadSessionUser();
  } catch (err) {
    console.error("[staff] loadSessionUser failed:", err);
    user = null;
  }

  if (!user) {
    redirect("/login?next=/staff");
  }

  if (user.role?.toLowerCase() === "customer") {
    redirect("/dashboard");
  }

  return <StaffClient user={user} />;
}
'''


def fix_staff_page() -> None:
    print("[4/4] app/staff/page.tsx")
    path = ROOT / "app" / "staff" / "page.tsx"
    src = read(path)

    if not src:
        print("  !! app/staff/page.tsx not found — creating", file=sys.stderr)
        write(path, PAGE_CONTENT)
        return

    # If already patched (try/catch + case-insensitive + force-dynamic) → skip
    already = (
        "force-dynamic" in src
        and "loadSessionUser failed" in src
        and "toLowerCase() === \"customer\"" in src
    )
    if already:
        print("  already patched, skipping")
        return

    # Surgical patches if the file exists but is unpatched.
    new = src

    # (a) force-dynamic
    if "force-dynamic" not in new:
        new = re.sub(
            r"(export const metadata[^=]*=\s*\{[\s\S]*?\};)",
            r"\1\n\nexport const dynamic = \"force-dynamic\";",
            new,
            count=1,
        )

    # (b) wrap loadSessionUser in try/catch
    if "loadSessionUser failed" not in new:
        new = re.sub(
            r"const\s+user\s*=\s*await\s+loadSessionUser\(\);",
            (
                "let user = null;\n"
                "  try {\n"
                "    user = await loadSessionUser();\n"
                "  } catch (err) {\n"
                "    console.error(\"[staff] loadSessionUser failed:\", err);\n"
                "    user = null;\n"
                "  }"
            ),
            new,
            count=1,
        )

    # (c) case-insensitive customer check
    new = re.sub(
        r'user\.role\s*===\s*"Customer"',
        'user.role?.toLowerCase() === "customer"',
        new,
    )

    # (d) collapse blank lines introduced by the try/catch insert
    new = re.sub(r"\n{3,}", "\n\n", new)

    write(path, new)


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> int:
    if not (ROOT / "app").is_dir() and not (ROOT / "lib").is_dir():
        print(
            "Run this from your Next.js project root "
            "(the dir containing app/ and lib/).",
            file=sys.stderr,
        )
        return 1

    fix_types_file()
    fix_auth_file()
    fix_staff_client()
    fix_staff_page()
    print("\nDone. Next steps:")
    print("  1. Verify lib/auth.ts still exports loadSessionUser.")
    print("  2. Run `npx tsc --noEmit` to confirm TS2322 is gone.")
    print("  3. Smoke-test: logged-out /staff → /login?next=/staff;")
    print("     customer /staff → /dashboard; staff /staff → dashboard.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
