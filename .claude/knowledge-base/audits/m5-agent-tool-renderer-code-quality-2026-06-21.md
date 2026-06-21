# Code Quality Audit: m5-agent-tool-renderer

**Date:** 2026-06-21
**Mode:** plan-bound
**Verdict:** PASS_WITH_CAVEATS
**Score cap:** 89
**Hard caps triggered:** symbol_fab_unverifiable_typescript

## Summary

- Languages audited: typescript
- Languages skipped: python, rust, go
- Total findings: 27 (0 HARD, 0 SOFT_CAP, 27 SOFT_FLOOR, 0 INFO)

## Findings by detector

### D1 — Dead code
_No findings._

### D2 — Symbol fabrication
| File | Symbol | Severity | Message |
|---|---|---|---|
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/avatar'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/avatar' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/button'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/button' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/card'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/card' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/command-palette'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/command-palette' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/blocks/deployment-row'` | SOFT_FLOOR | Could not verify npm package '@/components/blocks/deployment-row' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/dialog'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/dialog' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/tabs'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/tabs' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/toast'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/toast' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/components/ui/toaster'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/toaster' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/types/chat'` | SOFT_FLOOR | Could not verify npm package '@/types/chat' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/App.tsx` | `import from '@/lib/types'` | SOFT_FLOOR | Could not verify npm package '@/lib/types' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/avatar.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/command-palette.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/command-palette.tsx` | `import from '@/lib/types'` | SOFT_FLOOR | Could not verify npm package '@/lib/types' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/command-palette.tsx` | `import from '@/components/ui/dialog'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/dialog' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/toast.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/toaster.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/toaster.tsx` | `import from '@/components/ui/toast'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/toast' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/card.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/dialog.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/tabs.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/badge.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/ui/button.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/blocks/deployment-row.tsx` | `import from '@/lib/cn'` | SOFT_FLOOR | Could not verify npm package '@/lib/cn' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/tests/fixture-shadcn-app/src/components/blocks/deployment-row.tsx` | `import from '@/components/ui/badge'` | SOFT_FLOOR | Could not verify npm package '@/components/ui/badge' (ambiguous response) |
| `home/paulo/Projetos/usetheo/theokit-tools/theo-ui/src/test/setup.ts` | `import from '@testing-library/jest-dom/vitest'` | SOFT_FLOOR | Could not verify npm package '@testing-library/jest-dom/vitest' (ambiguous response) |

### D3 — Cross-package orphan exports
_No findings._

### D4 — Mutation testing
_No findings._

## Related

- Golden rule: [`.claude/rules/code-quality-golden-rule.md`](../../rules/code-quality-golden-rule.md)
- Allowlist: [`.claude/rules/code-quality-allowlist.txt`](../../rules/code-quality-allowlist.txt)
- Thresholds: [`.claude/rules/code-quality-thresholds.txt`](../../rules/code-quality-thresholds.txt)

---

## Disposition (M5-3 cycle — 2026-06-21)

Verdict **PASS_WITH_CAVEATS** (89). The only cap is `symbol_fab_unverifiable_typescript`
(SOFT_FLOOR) — all 27 D2 findings are `@/...` path-alias imports inside
`tests/fixture-shadcn-app/` that the registry-introspection step misreads as npm
packages and cannot verify (ambiguous response). They are pre-existing
false-positives in a test fixture, unrelated to this slice. **Zero** findings
reference `src/components/composites/agent-tool-renderer/*` or the edited
`chat-message.tsx`. D1 (dead code) reported no findings. Slice delta: CLEAN.
PASS_WITH_CAVEATS proceeds to /review per cycle-code-quality.
