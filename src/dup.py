#!/usr/bin/env python3
"""
fix_missing_types.py — fill in SessionRole / UserRole / UserPermissions in
                       src/lib/types.ts from src/lib/auth.ts.bak, then trim
                       src/lib/auth.ts's re-export line to what actually exists.

Handles the current error set:
  TS2305  './types' has no exported member 'X'    (auth.ts re-export too broad)
  TS2304  Cannot find name 'SessionRole'          (types.ts missing definition)

Run from project root. Safe to re-run. Backs up both files before writing.
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

ROOT = Path.cwd()
LIB = ROOT / "src" / "lib"
TYPES = LIB / "types.ts"
AUTH = LIB / "auth.ts"
AUTH_BAK = LIB / "auth.ts.bak"

# Names we may need to backfill into types.ts, in dependency order.
BACKFILL = ["SessionRole", "UserRole", "UserPermissions"]


# --------------------------------------------------------------------------- #
# io
# --------------------------------------------------------------------------- #

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8") if p.exists() else ""


def backup(p: Path) -> None:
    if p.exists():
        dst = p.with_suffix(p.suffix + ".pre_fix_missing")
        shutil.copy2(p, dst)
        print(f"  backup -> {dst.relative_to(ROOT)}")


def write(p: Path, s: str) -> None:
    p.write_text(s, encoding="utf-8")
    print(f"  wrote  -> {p.relative_to(ROOT)}")


# --------------------------------------------------------------------------- #
# declaration finder (handles type + interface, with or without semicolon)
# --------------------------------------------------------------------------- #

def find_decl(src: str, name: str) -> tuple[str, int, int] | None:
    for prefix in (r"export\s+", r""):
        pat = re.compile(rf"(?m)^{prefix}(?:type|interface)\s+{re.escape(name)}\b")
        m = pat.search(src)
        if not m:
            continue
        start = m.start()
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
                    j = i + 1
                    if j < len(src) and src[j] == ";":
                        j += 1
                    return src[start:j], start, j
            elif ch == ";" and not opened:
                return src[start:i + 1], start, i + 1
            i += 1
        return None
    return None


def is_defined(src: str, name: str) -> bool:
    return find_decl(src, name) is not None


def extract_exported(src: str, name: str) -> str | None:
    d = find_decl(src, name)
    if not d:
        return None
    text = d[0]
    # normalize to `export ...`
    text = re.sub(r"^(?:export\s+)?", "export ", text, count=1)
    return text.strip()


# --------------------------------------------------------------------------- #
# step 1 — backfill missing declarations into types.ts
# --------------------------------------------------------------------------- #

def backfill_types() -> None:
    types_src = read(TYPES)
    if not types_src:
        print(f"!! {TYPES.relative_to(ROOT)} not found — run fix_types_v2.py first", file=sys.stderr)
        sys.exit(1)

    if not AUTH_BAK.exists():
        print(
            f"!! {AUTH_BAK.relative_to(ROOT)} not found. It's the pre-v2 backup "
            "containing the original SessionRole/UserRole/UserPermissions "
            "definitions. If you don't have it, copy those types manually from "
            "git history into src/lib/types.ts.",
            file=sys.stderr,
        )
        sys.exit(1)

    bak_src = read(AUTH_BAK)

    to_add: list[str] = []
    for name in BACKFILL:
        if is_defined(types_src, name):
            print(f"  {name:<17} already in types.ts — skip")
            continue
        decl = extract_exported(bak_src, name)
        if decl is None:
            print(f"  {name:<17} NOT in auth.ts.bak — cannot backfill")
            continue
        print(f"  {name:<17} found in auth.ts.bak — adding")
        to_add.append(decl)

    if not to_add:
        print("  nothing to add to types.ts")
        return

    # Insert *above* SessionUser if present, otherwise append.
    su = find_decl(types_src, "SessionUser")
    block = "\n\n".join(to_add) + "\n\n"
    if su:
        start = su[1]
        new_types = types_src[:start] + block + types_src[start:]
    else:
        new_types = types_src.rstrip() + "\n\n" + block

    backup(TYPES)
    write(TYPES, new_types)


# --------------------------------------------------------------------------- #
# step 2 — trim auth.ts re-export line to names that exist in types.ts
# --------------------------------------------------------------------------- #

def trim_auth_reexports() -> None:
    auth_src = read(AUTH)
    types_src = read(TYPES)

    # which names actually exist now?
    existing = [n for n in BACKFILL + ["SessionUser"] if is_defined(types_src, n)]
    existing_unique = list(dict.fromkeys(existing))

    names_import = ", ".join(existing_unique)
    import_line = f'import type {{ {names_import} }} from "./types";'
    export_line = f'export type {{ {names_import} }} from "./types";'

    # replace any existing import/export-from-types lines with the trimmed versions
    new = re.sub(
        r'(?m)^import\s+type\s+\{[^}]*\}\s+from\s+"\./types";\s*$',
        import_line,
        auth_src,
    )
    new = re.sub(
        r'(?m)^export\s+type\s+\{[^}]*\}\s+from\s+"\./types";\s*$',
        export_line,
        new,
    )
    # if neither was present, inject after last import
    if "from \"./types\"" not in new:
        lines = new.splitlines()
        idx = [i for i, ln in enumerate(lines) if ln.startswith("import ")]
        block = ["", export_line, import_line]
        if idx:
            at = idx[-1] + 1
            lines[at:at] = block
        else:
            lines = [export_line, import_line] + lines
        new = "\n".join(lines) + "\n"

    new = re.sub(r"\n{3,}", "\n\n", new)

    if new != auth_src:
        backup(AUTH)
        write(AUTH, new)
    else:
        print("  auth.ts re-exports already correct — skip")


# --------------------------------------------------------------------------- #
# step 3 — sanity: every referenced identifier in types.ts resolves
# --------------------------------------------------------------------------- #

PRIMITIVES = {
    "string", "number", "boolean", "unknown", "any", "null", "undefined",
    "true", "false", "Date", "Record", "Partial", "Required", "Readonly",
    "Pick", "Omit", "Array",
}


def audit_types() -> list[str]:
    src = read(TYPES)
    # names declared in this file
    declared = set(re.findall(r"(?m)^export\s+(?:type|interface)\s+(\w+)", src))
    # names imported
    imported = set()
    for m in re.finditer(r'import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+[^;]+;', src):
        for tok in m.group(1).split(","):
            imported.add(tok.strip().split(" as ")[0].strip())
    known = declared | imported | PRIMITIVES

    # collect identifiers used in type positions inside declared blocks
    missing: set[str] = set()
    for name in list(declared):
        d = find_decl(src, name)
        if not d:
            continue
        body = d[0]
        # find `: Identifier` and `Identifier |` usages, crude but effective
        for m in re.finditer(r":\s*([A-Z]\w*)", body):
            t = m.group(1)
            if t not in known:
                missing.add(t)
        for m in re.finditer(r"([A-Z]\w*)\s*[|;&]", body):
            t = m.group(1)
            if t not in known:
                missing.add(t)
    return sorted(missing)


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #

def main() -> int:
    if not LIB.is_dir():
        print("Run from project root (dir containing src/lib).", file=sys.stderr)
        return 1

    print("[1/3] backfilling types.ts from auth.ts.bak")
    backfill_types()

    print("\n[2/3] trimming auth.ts re-exports to what actually exists")
    trim_auth_reexports()

    print("\n[3/3] audit: unresolved identifiers inside types.ts")
    missing = audit_types()
    if missing:
        print("  !! these identifiers are referenced but not declared/imported:")
        for m in missing:
            print(f"       - {m}")
        print("  Either define them in types.ts or import them explicitly.")
    else:
        print("  ok — every referenced type resolves")

    print("\nDone. Next: npx tsc --noEmit --pretty")
    print("Revert: mv src/lib/types.ts.pre_fix_missing src/lib/types.ts   (same for auth.ts)")
    return 0 if not missing else 0


if __name__ == "__main__":
    raise SystemExit(main())