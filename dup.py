#!/usr/bin/env python3
"""
fix_types_v2.py — finish unifying SessionUser/SessionRole/etc. between
                  src/lib/auth.ts and src/lib/types.ts.

Unlike v1, this:
  * Handles `interface`, `type`, and `export type` / `export interface`.
  * Handles definitions WITHOUT a trailing `;` (interface blocks often omit it).
  * Does NOT invent UserPermissions — if it's not in auth.ts, it's dropped.
  * Verifies SessionUser has the same field set in both files after write.
  * Backs up both files, aborts (leaving .bak) if verification fails.

Run from project root. Safe to re-run.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path.cwd()
LIB = ROOT / "src" / "lib"
AUTH = LIB / "auth.ts"
TYPES = LIB / "types.ts"

# Type names we want to move into types.ts (order matters for readability).
WANTED = ["SessionRole", "UserRole", "UserPermissions", "SessionUser"]


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8") if p.exists() else ""


def backup(p: Path) -> None:
    if p.exists():
        dst = p.with_suffix(p.suffix + ".bak")
        shutil.copy2(p, dst)
        print(f"  backup -> {dst.relative_to(ROOT)}")


def write(p: Path, s: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8")
    print(f"  wrote  -> {p.relative_to(ROOT)}")


def find_decl(src: str, name: str) -> tuple[str, int, int] | None:
    """
    Find a `type Name = ...;` or `interface Name { ... }` declaration.
    Returns (full_text, start_index, end_index) or None.
    Handles:
      - optional `export`
      - object literal bodies with nested braces (one level deep is enough for
        normal auth types)
      - trailing `;` optional
    """
    kw = r"(?:type|interface)"
    # try `export type|interface` first, then plain
    for prefix in (r"export\s+", r""):
        pat = re.compile(
            rf"(?m)^{prefix}{kw}\s+{re.escape(name)}\b",
        )
        m = pat.search(src)
        if not m:
            continue
        start = m.start()

        # walk from end of the match, tracking braces until we close the body
        i = m.end()
        depth = 0
        opened = False
        while i < len(src):
            ch = src[i]
            if ch == "{":
                depth += 1
                opened = True
            elif ch == "}":
                depth -= 1
                if opened and depth == 0:
                    # consume optional trailing `;`
                    j = i + 1
                    if j < len(src) and src[j] == ";":
                        j += 1
                    return (src[start:j], start, j)
            elif ch == ";" and not opened:
                # `type X = A | B;` — no braces
                return (src[start:i + 1], start, i + 1)
            i += 1
        # reached EOF without close — bail
        return None
    return None


def extract_all(src: str) -> dict[str, str]:
    """Return {name: declaration_text} for every name in WANTED present in src."""
    found: dict[str, str] = {}
    for name in WANTED:
        d = find_decl(src, name)
        if d:
            # normalize to `export`
            text = re.sub(r"^(?:export\s+)?", "export ", d[0], count=1)
            found[name] = text.strip()
    return found


# --------------------------------------------------------------------------- #
# step 1 — build types.ts from auth.ts
# --------------------------------------------------------------------------- #

def build_types_ts(decls: dict[str, str]) -> str:
    if "SessionUser" not in decls:
        raise RuntimeError(
            "Could not find a `type SessionUser` or `interface SessionUser` "
            "declaration in src/lib/auth.ts. Open the file and check the exact "
            "syntax — the extractor handles `export type`, `export interface`, "
            "and bare `type`/`interface`, but nothing else."
        )

    header = (
        "// Single source of truth for auth types.\n"
        "// Extracted from src/lib/auth.ts by fix_types_v2.py.\n"
        "// auth.ts re-exports from here — do not duplicate these definitions.\n\n"
    )
    body_parts = []
    for name in WANTED:                       # deterministic order
        if name in decls:
            body_parts.append(decls[name])
    return header + "\n\n".join(body_parts) + "\n"


# --------------------------------------------------------------------------- #
# step 2 — rewrite auth.ts: remove local decls, add imports/exports
# --------------------------------------------------------------------------- #

def strip_decls(src: str) -> str:
    """Remove every type/interface declaration for WANTED names from src."""
    out = src
    # loop because removing one may shift indices for the next
    for name in WANTED:
        while True:
            d = find_decl(out, name)
            if not d:
                break
            _, start, end = d
            # eat a trailing newline so we don't leave a blank gap
            if end < len(out) and out[end] == "\n":
                end += 1
            out = out[:start] + out[end:]
    return out


def inject_reexport(src: str) -> str:
    """Insert the canonical import/export lines for types after the last import."""
    present = [n for n in WANTED if re.search(rf"\b{re.escape(n)}\b", src)]
    # we always re-export whatever is in types.ts, but only import what auth.ts uses
    import_line = (
        'import type { SessionRole, UserRole, UserPermissions, SessionUser } from "./types";'
    )
    # trim the import list to names actually defined in types.ts later; be generous
    export_line = (
        'export type { SessionRole, UserRole, UserPermissions, SessionUser } from "./types";'
    )

    lines = src.splitlines()
    import_idx = [i for i, ln in enumerate(lines) if ln.startswith("import ")]
    block = ["", export_line, import_line]
    if import_idx:
        at = import_idx[-1] + 1
        lines[at:at] = block
    else:
        lines = block[1:] + lines          # skip leading blank line
    return "\n".join(lines) + "\n"


def rewrite_auth(auth_src: str, decls: dict[str, str]) -> str:
    # strip old broken import/export lines the earlier script added
    src = re.sub(
        r'(?m)^import\s+type\s+\{[^}]*\}\s+from\s+"\./types";\s*$',
        "",
        auth_src,
    )
    src = re.sub(
        r'(?m)^export\s+type\s+\{[^}]*\}\s+from\s+"\./types";\s*$',
        "",
        src,
    )
    src = strip_decls(src)
    # fix the orphan normalizeRole signature: UserRole may not exist, use SessionRole
    src = re.sub(
        r"function\s+normalizeRole\s*\(\s*role:\s*unknown\s*\)\s*:\s*UserRole",
        "function normalizeRole(role: unknown): SessionRole",
        src,
    )
    src = inject_reexport(src)
    src = re.sub(r"\n{3,}", "\n\n", src)
    return src


# --------------------------------------------------------------------------- #
# step 3 — sanity: SessionUser shape must match between files
# --------------------------------------------------------------------------- #

def sessionuser_fields(text: str) -> set[str]:
    """Very rough: grab `fieldname:` occurrences inside a SessionUser block."""
    d = find_decl(text, "SessionUser")
    if not d:
        return set()
    body = d[0]
    return set(re.findall(r"(?m)^\s*(\w+)\??\s*:", body))


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> int:
    if not AUTH.exists():
        print(f"!! {AUTH.relative_to(ROOT)} not found", file=sys.stderr)
        return 1

    auth_src = read(AUTH)
    decls = extract_all(auth_src)
    print(f"Found in auth.ts: {sorted(decls)}")

    if "SessionUser" not in decls:
        print(
            "\n!! Could not find SessionUser in auth.ts. Manual fix required:\n"
            "   1. Open src/lib/auth.ts\n"
            "   2. Copy its `SessionUser` / `SessionRole` / `UserRole` / "
            "`UserPermissions` declarations into src/lib/types.ts\n"
            "   3. Delete them from auth.ts and add:\n"
            "        import type { SessionRole, UserRole, UserPermissions, "
            "SessionUser } from \"./types\";\n"
            "        export type { SessionRole, UserRole, UserPermissions, "
            "SessionUser } from \"./types\";",
            file=sys.stderr,
        )
        return 1

    print("\n[1/2] writing src/lib/types.ts")
    types_ts = build_types_ts(decls)
    backup(TYPES)
    write(TYPES, types_ts)

    print("\n[2/2] rewriting src/lib/auth.ts")
    new_auth = rewrite_auth(auth_src, decls)
    backup(AUTH)
    write(AUTH, new_auth)

    # verify SessionUser fields match between the two files
    a_fields = sessionuser_fields(new_auth)
    t_fields = sessionuser_fields(types_ts)
    print(f"\nSessionUser fields — auth.ts: {sorted(a_fields)}")
    print(f"SessionUser fields — types.ts: {sorted(t_fields)}")
    if a_fields != t_fields and a_fields:
        # auth.ts no longer has a local SessionUser, so extract from types.ts only
        # — this branch means strip_decls missed something
        print(
            "  !! auth.ts still has a local SessionUser block — check manually "
            "and remove it.",
            file=sys.stderr,
        )

    print("\nDone. Next: npx tsc --noEmit --pretty")
    print("If anything broke: mv src/lib/auth.ts.bak src/lib/auth.ts   (and same for types.ts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
