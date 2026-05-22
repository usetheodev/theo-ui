#!/usr/bin/env bash
# Dogfood — end-to-end Tailwind v4 build against the published tarball.
#
# The companion `dogfood-v4-zero-config.ts` script asserts the SHAPE of the
# shipped artifacts. This script proves the SEMANTICS — it actually packs
# `@usetheo/ui`, installs it in a tmp project alongside `@tailwindcss/cli@^4`,
# runs Tailwind v4 against the fixture HTML, and grep-asserts that the
# expected utility classes appear in the emitted CSS.
#
# Why a shell script (not TS): adding `@tailwindcss/cli@^4` and
# `tailwindcss@^4` as a devDep would conflict with the existing `tailwindcss@^3`
# our local Ladle dev surface needs. Doing the install in an isolated tmp
# dir keeps the constraint clean.
#
# Run after `pnpm build`:
#
#   bash scripts/dogfood-v4-real-build.sh
#
# Exit 0 on success, 1 on any missing utility.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Pack the local tree (silent on the way in; we only want the filename).
PKG_TGZ_NAME=$(pnpm pack 2>&1 | tail -1)
PKG_TGZ="$ROOT/$PKG_TGZ_NAME"
trap 'rm -f "$PKG_TGZ"' EXIT

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"; rm -f "$PKG_TGZ"' EXIT

cp -r "$ROOT/tests/fixtures/v4-zero-config/"* "$TMPDIR/"
cd "$TMPDIR"

cat > package.json <<'EOF'
{"name":"v4-zero-config-runner","version":"0.0.0","private":true,"type":"module"}
EOF

echo "==> install @usetheo/ui (local tarball) + tailwindcss@^4 + @tailwindcss/cli@^4 ..."
npm install --silent --no-audit --no-fund \
  "$PKG_TGZ" @tailwindcss/cli@^4 tailwindcss@^4 >/dev/null

echo "==> tailwindcss v4 build against fixture ..."
npx @tailwindcss/cli -i entry.css -o out.css --content "./app.html" 2>&1 | tail -2

REQUIRED=(
  "bg-primary"
  "text-muted-foreground"
  "text-body-sm"
  "text-body-md"
  "max-w-md"
  "border-border"
  "bg-card"
  "text-accent-foreground"
  "text-display-2xl"
  "font-mono"
  "shadow-md"
)

PASS=0
FAIL=0

echo "==> assertions ==="
for cls in "${REQUIRED[@]}"; do
  COUNT=$(grep -cE "\.${cls}[^-a-zA-Z0-9]" out.css || true)
  if [ "$COUNT" -ge 1 ]; then
    echo "  ✓  .${cls} rule emitted ($COUNT match)"
    PASS=$((PASS + 1))
  else
    echo "  ✗  .${cls} rule NOT emitted"
    FAIL=$((FAIL + 1))
  fi
done

# Negative assertion: zero literal @tailwind directives may survive.
# `grep -c` writes "0" + exit 1 when nothing matches — capture it cleanly.
TW_DIRECTIVES=$(grep -cE "^@tailwind " out.css 2>/dev/null) || TW_DIRECTIVES=0
if [ "$TW_DIRECTIVES" -eq 0 ]; then
  echo "  ✓  zero literal @tailwind directives in output"
  PASS=$((PASS + 1))
else
  echo "  ✗  $TW_DIRECTIVES unresolved @tailwind directive(s) in output"
  FAIL=$((FAIL + 1))
fi

SIZE=$(stat -c '%s' out.css 2>/dev/null || stat -f '%z' out.css)
echo ""
echo "Dogfood v4 real-build — $PASS passed / $FAIL failed (out.css = ${SIZE} bytes)"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
