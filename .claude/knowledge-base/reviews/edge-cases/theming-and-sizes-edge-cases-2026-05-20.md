# Edge Case Review — theming-and-sizes

Data: 2026-05-20
Plano: `.claude/knowledge-base/plans/theming-and-sizes-plan.md`
Tasks analisadas: 19 (T0.1, T1.1-T1.10, T2.1-T2.4, T3.1-T3.2, T4.1-T4.2, T5.1-T5.2)
Edge cases encontrados: 8 (MUST FIX: 2, SHOULD TEST: 4, DOCUMENT: 2)

---

## MUST FIX

### EC-1: `<Input>` HTML `size` attribute colide com prop `size` do CVA

- **Task afetada:** T1.1 (Input.tsx ganha size)
- **Família:** Format / Type conflict
- **Cenário:** `InputHTMLAttributes<HTMLInputElement>` declara `size?: number | undefined` nativo (controla largura do text-input em caracteres, é spec HTML). Adicionar `size?: 'sm' | 'md' | 'lg'` via `VariantProps<typeof inputVariants>` à `InputProps extends InputHTMLAttributes` gera **type conflict**: TypeScript vai inferir intersection `number & 'sm'|'md'|'lg'` = `never`, ou no melhor caso union que quebra type narrowing dentro do componente. **Consumers que hoje fazem `<Input size={20}>` para text-cols vão quebrar silenciosamente.**
- **Impacto:** Quebra backwards-compat para consumers que usam o atributo HTML legítimo. Type error no `pnpm typecheck`.
- **Fix sugerido:** Usar `Omit` no extends:
  ```tsx
  export interface InputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
      VariantProps<typeof inputVariants> {}
  ```
  Atualizar T1.1 → "Deep Dives" para mencionar o Omit. Adicionar 1 RED test que confirma TypeScript não permite `<Input size={20}>`.

### EC-2: `<Select>` Trigger pode ter mesma colisão se renderizar como `<select>` nativo

- **Task afetada:** T1.9 (Select.tsx ganha size)
- **Família:** Format / Type conflict
- **Cenário:** Plano diz "Select.Trigger é Radix Select.Trigger (button)" — confirmado, Radix Select usa `<button>` no trigger, não `<select>`. **Mas** se a implementação atual de `select.tsx` em algum lugar expõe `<select>` nativo via prop drilling para `SelectHTMLAttributes<HTMLSelectElement>`, o conflito existe (`<select size>` HTML atributo = number).
- **Impacto:** Mesmo do EC-1 se acontecer.
- **Fix sugerido:** Em T1.9 → "Deep file dependency analysis", adicionar checagem: `grep -n "SelectHTMLAttributes\|HTMLSelectElement" src/components/primitives/select/select.tsx`. Se houver match, aplicar `Omit<..., 'size'>` igual T1.1. Se Radix-only (`<button>` trigger), nenhuma ação.

---

## SHOULD TEST

### EC-3: `defineTheme` com nome de tema built-in (last-writer-wins)

- **Task afetada:** T2.1 (defineTheme)
- **Cenário:** `defineTheme({ name: 'violet-forge', light: { primary: '0 0% 0%' } })` — usuário sobrescreve o tema built-in. Comportamento atual de `<ThemeProvider>`: "dedup by theme name; last writer wins" (verificado em `theme-provider.tsx:255`). Isso é comportamento desejado (permite ao consumer substituir o default) mas precisa de teste explícito.
- **Teste sugerido:** `test_defineTheme_overrides_builtin_when_same_name` — `<ThemeProvider themes={[violetForge, defineTheme({ name: 'violet-forge', light: { primary: hex('#000') } })]} defaultTheme="violet-forge">` + assert que CSS var `--primary` reflete `#000` (último vence). Adicionar à T2.1 TDD.

### EC-4: `hex()` case-insensitive

- **Task afetada:** T2.2 (hex/rgb helpers)
- **Cenário:** Plano testa `hex('#7C3AED')` mas não `hex('#7c3aed')`. Consumers vão usar ambas as variações.
- **Teste sugerido:** `test_hex_case_insensitive` — `hex('#7c3aed') === hex('#7C3AED')` + ambos iguais a `'262 83% 58%'`. Adicionar à T2.2 TDD.

### EC-5: `hex()` 4-char com alpha curto

- **Task afetada:** T2.2 (hex/rgb helpers)
- **Cenário:** Plano cobre `#7C3AED80` (8-char com alpha) e `#abc` (3-char short), mas não o caso intermediário `#abc4` (4-char short com alpha). Browsers modernos aceitam essa forma.
- **Teste sugerido:** `test_hex_4char_with_alpha` — `hex('#abc4') === hex('#abc')` (alpha descartado, RGB expandido). Adicionar à T2.2 TDD.

### EC-6: `<ThemeBuilder>` aninhado dentro de `<TheoUIProviderIsland>`

- **Task afetada:** T4.2 (theming.mdx + ThemeBuilder)
- **Cenário:** ADR D4 do plano levanta: "ThemeProvider aninhado precisa lidar com `data-theme` colidindo com o do app". `theo-opendocs/app/theoui/layout.tsx` já envolve tudo em `<TheoUIProviderIsland>` (que aplica `data-theme="violet-forge"` no root). Quando o ThemeBuilder cria outro `<ThemeProvider themes={[customTheme]}>` aninhado, **dois `data-theme` no DOM tree** — CSS cascade pega o mais próximo (interno wins). Funciona, mas testar.
- **Teste sugerido:** Smoke via browse após deploy: `$B js "(() => { const outer = document.documentElement.getAttribute('data-theme'); const inner = document.querySelector('[data-theme-scope=\"preview\"]')?.getAttribute('data-theme'); return JSON.stringify({outer, inner}); })()"`. Inner deve ser `'custom'`, outer deve permanecer `'violet-forge'`. Adicionar à T4.2 SMOKE section.

---

## DOCUMENT

### EC-7: `defineTheme` com light override sem dark override (visual inconsistente entre modos)

- **Risco aceito:** Consumer escreve `defineTheme({ name: 'red', light: { primary: hex('#ff0000') } })` — `light.primary` fica vermelho mas `dark.primary` herda violet de `violetForge`. Alternar para dark mode no app mostra cor diferente — pode surpreender. **Comportamento é correto** (D2 ADR documenta merge sempre com violetForge como base). Documentar no JSDoc de `defineTheme` com nota explícita:
  ```
  Note: If you override `light.primary` but not `dark.primary`, the two modes
  will use different colors (your override in light, violetForge default in dark).
  This is intentional — pass both to keep them in sync.
  ```
- **Adicionar à:** T2.1 → "Tasks" lista, item 4 (JSDoc).

### EC-8: T1.6/T1.7 Card e FormField — `size` em subparts sobrescreve context?

- **Risco aceito:** Plano diz Card propaga size via Context (D1 ADR não menciona override per-subpart). Não definido se `<Card size="lg"><Card.Header size="sm">` é válido. Decisão default: **subpart NÃO aceita size próprio** (mantém API enxuta; consumer que quer mix usa className). Documentar isso no JSDoc de `Card.Header / .Title / .Content / .Footer` para evitar surpresas. Se algum consumer reportar caso de uso real, abre-se RFC pra adicionar.
- **Adicionar à:** T1.6 + T1.7 → "Deep Dives", nota explícita "Subparts inherit `size` via Context; passing `size` directly to a subpart has no effect (use `className` for granular tweaks)."

---

## Padrões Sistêmicos Detectados

| Padrão | Encontrado? | Onde |
|---|---|---|
| Implemented but not wired | Não | T1.10 (sweep) cobre wiring de cada size |
| Correct code in wrong place | Não | — |
| Project name vs ID | N/A | Não há banco PG nesse plano |
| ArgoCD notifiers | N/A | Library UI, sem ArgoCD |
| Multi-cell | N/A | UI lib, sem cluster |
| Backwards compat na fronteira | **Sim** | EC-1 e EC-2 são esse padrão (mudança em type de API existente) |
| Bundle isolation invariant | **Sim, mas tratado** | T1.10 atualiza baseline. Engines (whiteboard/slide/slide-deck) **não tocados** — invariant preservado |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|---|---|---|---|---|
| T0.1 | 0 | 0 | 0 | 0 |
| T1.1 (Input) | 1 | 1 (EC-1) | 0 | 0 |
| T1.2 (Badge) | 0 | 0 | 0 | 0 |
| T1.3 (Toast) | 0 | 0 | 0 | 0 |
| T1.4 (Checkbox) | 0 | 0 | 0 | 0 |
| T1.5 (Switch) | 0 | 0 | 0 | 0 |
| T1.6 (Card) | 1 | 0 | 0 | 1 (EC-8) |
| T1.7 (FormField) | 1 | 0 | 0 | 1 (EC-8 — mesma decisão) |
| T1.8 (Textarea) | 0 | 0 | 0 | 0 |
| T1.9 (Select) | 1 | 1 (EC-2) | 0 | 0 |
| T1.10 (Sweep) | 0 | 0 | 0 | 0 |
| T2.1 (defineTheme) | 2 | 0 | 1 (EC-3) | 1 (EC-7) |
| T2.2 (hex/rgb) | 2 | 0 | 2 (EC-4, EC-5) | 0 |
| T2.3 (ThemeProvider) | 0 | 0 | 0 | 0 |
| T2.4 (CHANGELOG) | 0 | 0 | 0 | 0 |
| T3.1 (RFC) | 0 | 0 | 0 | 0 |
| T3.2 (Bump) | 0 | 0 | 0 | 0 |
| T4.1 (Bump opendocs) | 0 | 0 | 0 | 0 |
| T4.2 (ThemeBuilder) | 1 | 0 | 1 (EC-6) | 0 |
| T5.1 (Cross-val) | 0 | 0 | 0 | 0 |
| T5.2 (Dogfood) | 0 | 0 | 0 | 0 |

**Veredicto:** PLANO PRECISA DE AJUSTE (2 MUST FIX) — mudanças triviais, mas obrigatórias antes de iniciar implementação.

---

## Ações concretas para incorporar ao plano

1. **T1.1 — Deep Dives**: trocar `extends InputHTMLAttributes<HTMLInputElement>` por `extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>`. Adicionar RED test confirmando.
2. **T1.9 — Deep file dependency analysis**: adicionar checagem grep + `Omit<..., 'size'>` se source usa `SelectHTMLAttributes`. (Provavelmente Radix-only, mas validar antes de codar.)
3. **T1.6 e T1.7 — Deep Dives**: nota JSDoc esclarecendo que subparts não aceitam `size` próprio (Context-only).
4. **T2.1 — Tasks**: JSDoc adicional explicando inconsistência light/dark se só um modo é overridden. Adicionar `test_defineTheme_overrides_builtin_when_same_name` à TDD.
5. **T2.2 — TDD**: adicionar `test_hex_case_insensitive` + `test_hex_4char_with_alpha`. Soma vai de 10 → 12 testes.
6. **T4.2 — SMOKE**: adicionar smoke verificando `data-theme` aninhado não vaza para outer.
