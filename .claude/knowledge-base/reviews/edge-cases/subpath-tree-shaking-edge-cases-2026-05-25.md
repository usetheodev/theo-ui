# Edge Case Review — subpath-tree-shaking

**Data:** 2026-05-25
**Plano:** `.claude/knowledge-base/plans/subpath-tree-shaking-plan.md`
**Tasks analisadas:** 12 (T0.1, T1.1, T2.1, T3.1, T4.1, T4.2, T5.1, T5.2, T6.1, T6.2, T7.1, T7.2, T8.1, T9.1)
**Edge cases encontrados:** 16 (MUST FIX: 4, SHOULD TEST: 7, DOCUMENT: 5)
**Padrões Theo PaaS aplicáveis:** N/A (build pipeline, não backend)

---

## MUST FIX

### EC-1: chunk names com content-hash quebram o `validate-bundle-size.ts` gate
- **Task afetada:** T1.1, T3.1
- **Família:** Format / State
- **Cenário:** Tsup com `splitting: true` gera `dist/_chunks/<hash>.js` (ou `dist/plugin-Atb0VKtr.js` no atual — já hashed). Ao rebaselinar via `pnpm quality:bundle:update`, o baseline grava `_chunks/abc123.js`. Próximo build muda o hash (qualquer mudança em código compartilhado) → arquivo `abc123.js` deixa de existir → `validate-bundle-size.ts` reporta "missing on disk" → **todo PR seguinte quebra o gate**.
- **Impacto:** quality:gates passa no merge (rebaselined na hora) mas o próximo PR random falha o gate sem culpa. Devs perdem tempo investigando.
- **Fix sugerido:** filtrar `dist/_chunks/**` e qualquer arquivo com nome em padrão hash (`/\b[A-Za-z0-9]{8,}\.(js|d\.ts)$/`) no script de rebaseline OU configurar tsup com `esbuildOptions: { chunkNames: '_chunks/[name]' }` (sem hash) — adequado para um pacote npm (chunks são resolvidos no install, não precisam de cache-busting). Recomendo opção 2 (3 linhas no tsup.config.ts) sobre filtro no script (esconde estado real).

### EC-2: T2.1 `regen-subpath-exports.ts` silenciosamente pula componentes com build parcial
- **Task afetada:** T2.1
- **Família:** Format / State
- **Cenário:** Se tsup falha emitindo `.d.ts` para um componente mas o `.js` saiu, o script faz `try { statSync(jsFile); statSync(dtsFile); } catch { continue; }` e **pula sem warning**. O `package.json#exports` fica sem a entry para esse componente. `import { X } from "@theokit/ui/x"` quebra em runtime do consumer com `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **Impacto:** silent drift entre source tree (87 primitives) e exports map (e.g. 86). Acceptance criterion "todos os primitives têm subpath" passa ou falha aleatoriamente.
- **Fix sugerido:** comparar set(`src/components/{primitives,composites}/*/`) excluindo `EXCLUDE` contra entries geradas. Se contagem diverge, `process.exit(1)` com lista dos faltantes. Adicionar como step 3.5 entre validation e write:
  ```ts
  const expected = new Set([...primitiveSlugs, ...compositeSlugs].filter(s => !EXCLUDE.has(s)));
  const got = new Set(Object.keys(newExports).filter(k => k !== "." && !PRESERVE_KEYS.has(k)).map(k => k.slice(2)));
  const missing = [...expected].filter(s => !got.has(s));
  if (missing.length > 0) { console.error("missing entries:", missing); process.exit(1); }
  ```

### EC-3: T5.2 smoke test "same identity?" claim está incorreta
- **Task afetada:** T5.2
- **Família:** Format
- **Cenário:** O plano sugere `console.log('same identity?', Alert === AlertSub)` e espera `true`. **Mas com per-component dist files separados, cada bundle define seu próprio `forwardRef(...)`**. Barrel `dist/index.js` e subpath `dist/primitives/alert/index.js` exportam a MESMA função CONCEITUAL, mas com referências de função DIFERENTES. `===` retornará `false`.
- **Impacto:** o smoke test falha mesmo com a implementação correta. Dev investiga em falso. Pior: se desenvolvedor "consertar" forçando identidade (ex: subpath re-exporta do barrel), defeats o propósito do tree-shaking.
- **Fix sugerido:** trocar o smoke por verificações comportamentais:
  ```ts
  console.log('barrel:', Alert.displayName, '/ subpath:', AltAlert.displayName);
  console.log('same render?', renderToString(<Alert title="x" />) === renderToString(<AltAlert title="x" />));
  ```
  E remover a linha `same identity?` do plano completamente. **Esperar** que `===` seja `false` — isso é EVIDÊNCIA de que o split funcionou.

### EC-4: T8.1 sed-based migration é não-robusto para imports multi-componente
- **Task afetada:** T8.1
- **Família:** Format
- **Cenário:** O canary script faz `sed "s|import { Alert } from \"@theokit/ui\"|import { Alert } from \"@theokit/ui/alert\"|g"`. **Mas TheoCloud tem imports multi-componente** como `import { Card, Button, Avatar, Alert, ... } from "@theokit/ui"` (literal da brief #4 §"The defect"). O sed pattern NÃO casa essa linha. Resultado: dos top 10 imports migrados, 0 ou poucos efetivamente movem para subpath; bundle delta medido será ~0 KB; gate falha; investiga-se a implementação que ESTÁ correta.
- **Impacto:** falha-positivo no Phase 8 hard gate. Plano não fecha porque medição não reflete realidade.
- **Fix sugerido:** documentar no T8.1 que migration NÃO é via sed — usar manual split em ~13 arquivos do dashboard:
  ```diff
  - import { Card, Button, Alert, ... } from "@theokit/ui";
  + import { Card, Button } from "@theokit/ui";  // não migrados nesta fase
  + import { Alert } from "@theokit/ui/alert";    // top 10
  ```
  Ou usar `jscodeshift` com um codemod simples. Manter o sed só para imports já isolados (uma única import por linha). Aceitar que o canary requer ~30 min de migração manual cuidadosa, NÃO automação.

---

## SHOULD TEST

### EC-5: componentes com `index.tsx` em vez de `index.ts`
- **Task afetada:** T1.1
- **Teste sugerido:** verificar que o auto-glob suporta ambas extensões. Atualmente apenas `slide/plugins/mermaid/index.tsx` existe (já tratado por entry manual). Mas se um futuro componente usar `.tsx` para JSX no entry (legítimo em alguns casos), auto-glob skip silently. Adicionar fallback:
  ```ts
  for (const ext of ["index.ts", "index.tsx"]) {
    const f = join(baseDir, dirent.name, ext);
    try { if (statSync(f).isFile()) { out[`${prefix}/${dirent.name}/index`] = f; break; } } catch {}
  }
  ```
  E test smoke: depois do build, todos os 87 primitives + 27 composites - 3 excluded = **111** dist entries existem.

### EC-6: `PRESERVE_KEYS` no regen script pode ficar desatualizado
- **Task afetada:** T2.1
- **Teste sugerido:** `test_preserve_keys_covers_all_non_component_exports` — antes de chamar `regen-subpath-exports.ts`, capturar set de chaves no `package.json#exports` que NÃO são `./<kebab>/...` simples (ou seja, são `*.css`, com `/`, etc.). Asserir que `PRESERVE_KEYS ⊇ esse set`. Catch o caso onde alguém adiciona `./fonts-cdn-v2.css` e o script omite.

### EC-7: tests existentes podem quebrar com `splitting: true`
- **Task afetada:** T5.1
- **Teste sugerido:** rodar full `pnpm test` (1577+ tests) ANTES da mudança e DEPOIS — espera-se delta zero. Tests não usam `dist/`, usam source — então não devem quebrar. Mas confirmar via execução, não inspeção.

### EC-8: Ladle build pode quebrar se hot-reload usa source path
- **Task afetada:** T5.1
- **Teste sugerido:** rodar `pnpm ladle:build` (não apenas dev) e verificar que stories carregam todos os componentes. Ladle usa source paths via Vite, então `splitting: true` no tsup NÃO afeta — mas confirmar com smoke (`grep "Alert" .ladle/build/index.html` ou similar).

### EC-9: CHANGELOG com placeholders no merge final
- **Task afetada:** T6.1 (relação com T8.1)
- **Teste sugerido:** `test_changelog_no_placeholders` — `grep -E '<TBD>|<placeholder>|FIXME|XXX' CHANGELOG.md` deve retornar zero matches antes do merge. O plano corretamente diz "atualizar com números reais em T8.1" mas falta o gate.

### EC-10: composite vendora primitives via shared chunk failure
- **Task afetada:** T1.1
- **Teste sugerido:** `test_composite_subpath_size_small` — depois do build, `dist/composites/code-block/index.js` deve ser **muito menor** que `dist/primitives/copy-button/index.js` (CodeBlock só usa CopyButton via reference; CopyButton deve vir do shared chunk, não vendor inline). Threshold concreto: `wc -c dist/composites/code-block/index.js < 5000`. Se falhar, investiga `splitting` configuration.

### EC-11: bundle baseline tolerância em arquivos minúsculos
- **Task afetada:** T3.1
- **Teste sugerido:** `test_small_files_tolerance` — per-component dist files de ~1-3 KB minified. ±5% de 1024 bytes = 51 bytes. Whitespace/comment changes podem trigger gate sem regressão real. Considerar configurar tolerância maior (ex: `tolerancePercent: 10`) para arquivos abaixo de 5 KB, ou usar tolerância absoluta `max(±5%, ±200 bytes)`. Validar via build determinístico repetido.

---

## DOCUMENT

### EC-12: cross-platform path separators (Linux/macOS assumption)
- **Risco aceito:** `tsup` entry keys usam `/` (forward slash) literalmente — `"primitives/alert/index"`. No Windows com PowerShell/cmd, `node:path.join()` usa `\`, então `entries[...] = "primitives\\alert\\index.ts"` poderia colidir. Em `tsup.config.ts` rodando em Linux/macOS (assumido em CLAUDE.md), não é problema. Documentar como "platform support: Linux + macOS only".

### EC-13: kebab-case naming convention assumida pelo auto-glob
- **Risco aceito:** o helper usa `dirent.name` direto como key (e.g., `"primitives/alert/index"`). Funciona porque todas as 116 pastas são kebab-case. Se alguém criar `src/components/primitives/MyComponent/index.ts`, vira `"primitives/MyComponent/index"` — quebra a convenção `package.json#exports["./my-component"]`. **Mitigação:** o gate `validate-quality-gates.ts` já enforça kebab-case na estrutura de pastas. Não precisa de validação dupla.

### EC-14: `readdirSync` order não-determinístico cria diff churn
- **Risco aceito:** ordem dos arquivos em `readdirSync` depende do filesystem (ext4 retorna em ordem de inode, btrfs ordena, macOS HFS+ ordena). O `entry` map ordering pode mudar entre máquinas → `dist/` filenames são iguais mas ordem em `package.json#exports` poderia mudar. **Mitigação já presente:** regen-subpath-exports.ts faz `Object.entries(...).sort([a],[b] => a.localeCompare(b))` antes de escrever. Garante determinismo.

### EC-15: GNU sed vs BSD sed cross-platform em T8.1
- **Risco aceito:** `sed -i.bak` funciona em ambos. `sed -i` sem extensão NÃO funciona em macOS. O plano usa `-i.bak` (compatível). Mas se desenvolvedor copy-paste sem o `.bak`, quebra em macOS. **Mitigação:** já corretamente escrito no plano. Se quiser zero ambiguity, prefer `sed -i'' -e ...` ou trocar por `node` one-liner.

### EC-16: `pnpm link` vs `npm pack` para canary
- **Risco aceito:** `pnpm link` usa symlinks. Se `dist/_chunks/` tem nested resolves, symlink pode quebrar em alguns sistemas (raro em 2026). Brief explicitamente usa `pnpm link`; manter consistência. Se canary falhar com erro de resolução, fallback é `pnpm pack && pnpm install /path/to.tgz` (uma frase no plano).

---

## Padrões Sistemicos Detectados

| Padrão | Encontrado? | Onde |
|--------|-------------|------|
| Implemented but not wired | Mitigado | T1.1 emite dist; T2.1 wire em exports map; T5.2 smoke valida ambos |
| Cosmetic-only feature (subpath sem dist real) | **CRIA fix para esse padrão** | T1.1 + T2.1 são literalmente o anti-padrão de Brief #4 |
| Correct code in wrong place | N/A | Plano não move código |
| Project name vs ID | N/A | Build pipeline |
| Hashed chunk filename churn | **DETECTADO** | EC-1 (MUST FIX) |
| Silent partial build | **DETECTADO** | EC-2 (MUST FIX) |
| Reference-equality smoke that should be behavioral | **DETECTADO** | EC-3 (MUST FIX) |
| Migration via sed without AST awareness | **DETECTADO** | EC-4 (MUST FIX) |
| Auto-gen MDX dump (Brief #1 lesson) | N/A | Plano não toca docs MDX |
| Hand-maintained list drift | Plano corretamente evita | D1 (auto-glob) |

---

## Resumo

| Task | Edges encontrados | MUST FIX | SHOULD TEST | DOCUMENT |
|------|-------------------|----------|-------------|----------|
| T0.1 (baseline snapshot)        | 0 | 0 | 0 | 0 |
| T1.1 (tsup auto-glob)           | 4 | 1 (EC-1)         | 2 (EC-5, EC-10) | 3 (EC-12, EC-13, EC-14) |
| T2.1 (regen-subpath-exports)    | 2 | 1 (EC-2)         | 1 (EC-6)        | 0 |
| T3.1 (bundle baseline)          | 2 | 1 (EC-1 shared)  | 1 (EC-11)       | 0 |
| T4.1 (ADR)                      | 0 | 0 | 0 | 0 |
| T4.2 (smoke vite-plugin)        | 0 | 0 | 0 | 0 |
| T5.1 (quality:gates)            | 2 | 0 | 2 (EC-7, EC-8) | 0 |
| T5.2 (barrel smoke)             | 1 | 1 (EC-3)         | 0 | 0 |
| T6.1 (CHANGELOG)                | 1 | 0 | 1 (EC-9) | 0 |
| T6.2 (npm publish)              | 0 | 0 | 0 | 0 |
| T7.1, T7.2 (opendocs + llms)    | 0 | 0 | 0 | 0 |
| T8.1 (TheoCloud canary)         | 3 | 1 (EC-4)         | 0 | 2 (EC-15, EC-16) |
| T9.1 (dogfood)                  | 0 | 0 | 0 | 0 |
| **TOTAL** | **16** | **4** | **7** | **5** |

---

## Veredicto

**PLANO PRECISA DE AJUSTE** — 4 MUST FIX (todos com fix em ≤3 linhas).

### Mudanças mandatórias antes de iniciar a implementação:

| EC | Ajuste no plano |
|----|-----------------|
| **EC-1** | T1.1: adicionar `esbuildOptions: { chunkNames: "_chunks/[name]" }` ao tsup config para chunk names estáveis (3 linhas). T3.1: documentar que `dist/_chunks/*` aceita-se sem hash. |
| **EC-2** | T2.1: adicionar validation step 3.5 no `regen-subpath-exports.ts` — comparar source folders contra entries geradas, fail-loud se divergência. |
| **EC-3** | T5.2: remover claim `same identity? === true`. Substituir por `renderToString` comparison. **Esperar `===` ser `false` — é evidência de split correto.** |
| **EC-4** | T8.1: trocar o snippet sed por instrução manual: "split os imports multi-componente em ~13 arquivos do TheoCloud; usar AST codemod ou edit manual; aceitar ~30 min de trabalho cuidadoso". O sed pattern fica como ferramenta auxiliar APENAS para imports single-componente já isolados. |

### Análise positiva (o que o plano fez bem):

- **Coverage matrix 20/20** — Brief #4 totalmente coberto.
- **Hard gate empírico** — Phase 8 é o gate de mérito, não "feature shipped".
- **Auto-glob com exclude list** — evita drift que CAUSOU o defeito original.
- **Validation step refusa stragglers** — EC-1 do brief (cosmetic exports) não pode voltar.
- **Risk register honesto** — DTS time, splitting risks, baseline rebaseline já documentados.
- **Open questions** — 5 questões abertas razoáveis, sem over-engineering.

Plano está estruturalmente saudável. Os 4 MUST FIX são ajustes de detalhe técnico em fases específicas, não problemas de arquitetura. Após incorporar, plano está pronto para implementação. 7 SHOULD TEST viram tests adicionais nos respective TDD blocks. 5 DOCUMENT viram notas no plano sem mudar implementação.
