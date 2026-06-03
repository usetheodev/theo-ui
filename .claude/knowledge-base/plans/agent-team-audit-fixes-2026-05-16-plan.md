# Plan: `@theokit/ui` — Agent Team Audit Fixes (2026-05-16)

> **Version 1.1** — Este plano resolve os 37 achados consolidados pelo time de 6 agentes especialistas (architecture-analyst, completeness-auditor, code-reviewer, test-auditor, dependency-analyzer, security-auditor) na reunião de 2026-05-16. O foco operacional: subir a nota agregada de **3.0/5** para **4.0+/5** fechando os 2 CRITICAL (npm 404, registry endpoint dead) + 9 HIGH + 13 MEDIUM + 13 LOW. Pós-execução, `pnpm add @theokit/ui` resolve, `https://ui.usetheo.dev/r/button.json` retorna 200, branch `feat/deep-review-remediation` está em `main`, marketing copy está sincronizada com integrações reais, e o pacote ganha um `<TheoUIProvider>` root + guards de segurança que estavam ausentes.
>
> **Changelog do plano:**
> - **v1.1 (2026-05-16)**: incorpora os 4 MUST FIX do edge-case review (`agent-team-audit-fixes-2026-05-16-edge-cases.md`). MF-1: reordena Phase 1 (T1.3 antes de T1.1 para não publicar tarball com claim falso). MF-2: T2.5 ganha sub-tasks de regeneração de registry items + nota de breaking change no CHANGELOG. MF-3: novo ADR D12 sobre compat vitest×happy-dom + fallback jsdom; T3.1 ganha pre-flight. MF-4: T4.1 expandida de 2 componentes para 7+ live regions + gate de regression.
> - **v1.0 (2026-05-16)**: versão inicial.

## Context

A revisão profunda de 2026-05-16 produzida pelos 6 agentes encontrou o seguinte padrão estrutural: **engenharia interna sólida (média 3.6/5 nas dimensões técnicas) vs produto inexistente como artefato consumível (completude 2.0/5)**. Os achados materiais, em ordem de impacto:

**CRITICAL (2)** — toda promessa de instalação no README/PITCH retorna erro:
- `pnpm add @theokit/ui` → 404 no npm (versão `0.0.0`, nunca publicada). Confirmado via `curl https://registry.npmjs.org/@theokit/ui` → HTTP/2 404.
- `npx shadcn add https://ui.usetheo.dev/r/button.json` → DNS-NXDOMAIN. Confirmado via `curl -sI` → zero resposta.

**HIGH (9):**
- Subpath exports decorativos: 102 entries no `package.json#exports` resolvem todas para `./dist/index.js` (`tsup.config.ts` com `splitting: false`).
- Registry pasta `registry/r/*.json` usa `import { cn } from "@/lib/cn"` — alias `@/` é precondição ambiental não documentada.
- Ausência de `<TheoUIProvider>` root: consumidor monta `ThemeProvider + Toaster` à mão.
- `PITCH.md:239` afirma que TheoKit dashboard importa `@theokit/ui` — confirmado via `grep -r "@theokit/ui" /home/paulo/Projetos/usetheo/theokit/`: **zero matches**. Marketing-grade false claim.
- `README.md:243` lista pipeline `quality:gates` desatualizado (omite `quality:bundle` e `quality:a11y`).
- `AgentStream / FullStream` story skipada em `ladle-axe.test.tsx:81-84` por `<header role="button">` sem ticket.
- `docs.usetheo.dev/ui` + `ui.usetheo.dev` dead.
- Branch `feat/deep-review-remediation` 16 commits adiante de `main`, sem PR aberto, CI nunca rodou os gates novos contra a branch protegida.
- `happy-dom@^16.3.0` (resolved `16.8.1`) carrega 3 CVEs incluindo CVE-2025-61927 (RCE em VM context). DevDeps only, mas todo contribuidor está exposto.

**MEDIUM (13):** ThemeProvider hard-couple a `violetForge`; module-level mutável `injectedFontUrls` quebra isolamento; CSS injection em `injectThemeCss` sem sanitização; `javascript:` URI sem guard em ProjectCard/PreviewEnvCard; nested `aria-live` em AgentStream/AgentStreaming (anuncia 2x); `MetricsPanel` tiles clicáveis sem `aria-label`; `PermissionModal` Esc-vs-Cancel asymmetry; composites exportados sob seção `// PRIMITIVES` do barrel; composite-to-composite import sem gate; ThemeProvider localStorage path **100% sem teste** (todos os tests usam `storageKey={null}`); Dialog/Sheet sem teste close-on-Escape; 3 editores (Agent/Skill/Rule) com `button-name` WCAG violation só comentada em STORY_SKIPS; `tailwindcss-animate` mal classificado como devDep mas consumido em runtime pelo preset.

**LOW (13):** `@radix-ui/react-popover` phantom dep (zero imports); peerDeps não cobrem React 19 explicitamente; `registry/index.json` sem `dependencies`; `foundations/` só stories sem exports JS; `DiffViewer` key=`${hunk.id}-${idx}` (perda de state em prepend); `EnvVarEditor` clipboard catch silencioso sem warn; Select casts sem narrowing em 3 editors; polymorphic ref cast inseguro (`HTMLAnchorElement & HTMLDivElement`) em 3 cards; `AgentStream <header role="button">` não testado em unit; 29 className assertions Tailwind-token-coupled; ref forwarding sem teste em 20+ componentes; 18 composites sem axe assertion no test file próprio; `@deprecated ScrollBar` em pacote `0.0.0` (deprecation theater); 5 orphan scripts em `scripts/` sem entry em `package.json`; CHANGELOG `validateExportsMap` doc-vs-code drift (CHANGELOG fala "5-entry set", real são 107+); `vite@5.4.21` + `esbuild@0.21.5` + `postcss@8.5.1` com CVEs de baixo impacto.

Evidência completa: notificações de tarefa nos agent IDs `acef867fd24467546` (arquitetura), `a6decf3ab463e5468` (completude), `a685752fbfd68242b` (código), `a7b43a2f925babc26` (testes), `a63d2c3e670bbaf29` (deps), `a2ce395ec9217fa44` (segurança), sessão de 2026-05-16.

## Objective

"Done" = (a) `pnpm add @theokit/ui` em projeto Vite vazio resolve sem erro; (b) `curl https://ui.usetheo.dev/r/button.json` retorna 200 com JSON válido; (c) `<TheoUIProvider>` exportado e documentado como primary entry point; (d) zero alegações falsas em README/PITCH/CHANGELOG; (e) ThemeProvider localStorage path tem cobertura de teste, Dialog/Sheet close-on-Escape tem cobertura; (f) `happy-dom >= 20`; (g) `pnpm quality:gates` passa verde em `main`; (h) nota agregada do agent-team-audit ≥ 4.0/5 em re-execução.

Metas mensuráveis:
1. **Zero CRITICAL aberto** após Phase 1.
2. **Zero HIGH aberto** após Phase 4.
3. **`curl -sf` em todas as URLs anunciadas no README + PITCH retorna 200** após Phase 1.
4. **Cobertura comportamental do ThemeProvider sobe de ~60% (sem branch localStorage) para ≥ 90%** após Phase 5.
5. **`pnpm audit --prod`** com zero HIGH/CRITICAL após Phase 6.
6. **`@theokit/ui@0.1.0-next.0` disponível em `npm view`** após Phase 1.

## ADRs

### D1 — Publicar em npm sob `--tag next` antes de fechar HIGHs estruturais

- **Decisão:** Subir versão `0.1.0-next.0` e publicar imediatamente com `npm publish --tag next` no início do plano, antes de qualquer refactor.
- **Rationale:** Os 2 CRITICAL bloqueiam adoção real. Estamos investindo em rigor de engenharia para uma library que zero pessoas conseguem instalar. Publicar primeiro converte feedback teórico em feedback empírico. Tag `next` (não `latest`) preserva o sinal "pre-1.0".
- **Consequences:** Habilita usuários externos; cria custo de deprecation futura se quebras chegarem; força versionamento disciplinado a partir de já. `CONTRIBUTING.md` já documenta política `--tag next`.

### D2 — Static hosting de `registry/r/` em `ui.usetheo.dev` via Cloudflare Pages (ou similar)

- **Decisão:** Deploy de `registry/r/*.json` + `registry/index.json` como assets estáticos em `https://ui.usetheo.dev/r/`. CORS aberto. Sem backend.
- **Rationale:** shadcn CLI exige apenas que a URL retorne JSON com schema correto. Zero lógica server-side justifica static hosting. CF Pages é grátis para projeto open source e tem CDN global.
- **Consequences:** Adiciona dependência operacional (DNS + provedor). CI passa a precisar de deploy step. Custo zero financeiro. Cache-busting via `registry:build` que adiciona ETag implícito por content-hash.

### D3 — `<TheoUIProvider>` como composição de `ThemeProvider + Toaster`, NÃO um novo contexto

- **Decisão:** Criar `src/theo-ui-provider.tsx` que renderiza `<ThemeProvider>{children + <Toaster />}</ThemeProvider>`. Sem context próprio, sem novas props customizadas além de pass-through.
- **Rationale:** Toda lib madura (`MUI ThemeProvider`, `shadcn` setup, `Mantine MantineProvider`) tem entry-point único. Não introduzir contexto novo evita ossificar API antes de feedback real. Tooltip.Provider permanece per-instance (Radix recomenda) — não vamos sobrescrever isso.
- **Consequences:** API stable mesmo se decisões internas mudarem. README ganha exemplo único. ADR D5 do plano anterior (manter ThemeProvider runtime + ThemeScript) permanece válida.

### D4 — Manter `splitting: false` no tsup; documentar subpath exports como aliases de conveniência

- **Decisão:** Não ativar code splitting do tsup. Manter `dist/index.js` único. Atualizar JSDoc/README explicando que os 102 subpath entries são aliases (`@theokit/ui/button` = `@theokit/ui` com tree-shaking pelo bundler do consumidor).
- **Rationale:** Code splitting cria N arquivos com overhead de imports cross-chunk. A library já é tree-shakeable (`sideEffects: ["**/*.css"]` + ESM puro). Mudar agora introduz risco de regressão sem ganho mensurável para consumer Vite/Next moderno. O gap real é **documentação**, não **bundling**.
- **Consequences:** Subpath exports continuam funcionais para typecheck e DX, mas com expectativa correta. Consumer que importa `@theokit/ui/button` em runtime sem tree-shaking (Jest, CDN browser direto) recebe o bundle completo — documentado.

### D5 — Upgrade `happy-dom` 16 → 20 (não trocar por jsdom)

- **Decisão:** Bump direto da major. Testar suite em CI. Se incompatibilidade aparecer, fix forward.
- **Rationale:** CVE-2025-61927 é RCE em VM context. jsdom seria opção segura mas custa ~3x mais lento em rodar nossa suite (medido em projetos pares). happy-dom v20 tem patches para os 3 CVEs reportados.
- **Consequences:** Risco menor de quebra de teste em APIs DOM esotéricas. Vitest config talvez precise de ajuste. Custo: ~30 min de trial + fixes.

### D6 — CSS injection em `injectThemeCss` resolvida com **allowlist regex**, não escape

- **Decisão:** `colorScaleToCss` e `fontsToCss` validam valores contra regex: `/^(#[0-9a-fA-F]{3,8}|oklch\(|rgb\(|hsl\(|var\()/.test(value)` para cores; `/^[\w\s,"\-]+$/` para font family. Valores inválidos → rejeitados em dev (throw), no-op em produção.
- **Rationale:** Escape de `}` ou `;` em CSS é frágil — CSS aceita várias formas de comentário. Allowlist é mais simples e defensável. Themes são código, não user input, então rejeição estrita é aceitável.
- **Consequences:** Themes customizados com valores exóticos (ex: `linear-gradient(...)` como cor) precisam mover o gradiente para outra layer. Documentar.

### D7 — Reorganizar barrel `src/index.ts` por seção SEM mudar ordem de exports (preserva tree-shaking)

- **Decisão:** Mover os 8 composites que estão indevidamente sob `// PRIMITIVES` para depois do marcador `// COMPOSITES`. NÃO renomear exports. NÃO mudar tipos.
- **Rationale:** Mudança puramente editorial. Quality gate de taxonomia já enforça mecanicamente; o problema é só sinal humano no barrel.
- **Consequences:** Diff visível mas zero impacto em consumer. Quality gate `validateExportsMap` precisa rodar após para confirmar que `package.json#exports` continua consistente.

### D8 — Manter Tailwind v3 + adicionar **`tailwindcss-animate` como `dependencies`** (não peer)

- **Decisão:** Mover `tailwindcss-animate` para `dependencies` em `package.json`. Não migrar para Tailwind v4 (escopo de plano futuro).
- **Rationale:** O preset shipa esse import em runtime; classificar como devDep induz peer-dep faltante em consumer manual. Tailwind v4 tem config model fundamentalmente diferente — separamos.
- **Consequences:** +1 deps direta. Consumer já precisa de Tailwind como peer — nenhum custo adicional perceptível.

### D9 — Phantom `@radix-ui/react-popover` removida sem warm-up

- **Decisão:** Remover do `dependencies` no `package.json`. Quando Popover for implementado, adicionar de volta com o componente no mesmo PR.
- **Rationale:** Zero imports. Custo de install desnecessário. Não há "preparação para o futuro" — viola YAGNI.
- **Consequences:** Bundle node_modules consumidores diminui ~15 KB. Se Popover for adicionado, é trabalho do PR daquele componente.

### D10 — Não tentar fix de polymorphic `ref` cast nesta iteração — apenas documentar

- **Decisão:** Polymorphic cast `HTMLAnchorElement & HTMLDivElement` em ProjectCard/Sidebar/ModelCard fica como está. Adicionar comentário JSDoc explicando o trade-off. Refactor para discriminated union vai para backlog v0.2.0.
- **Rationale:** Mudar a API de polymorphic components é breaking change. Estamos pre-1.0 mas o time já estabilizou o pattern. Documentar agora; refazer depois com type-tests dedicados.
- **Consequences:** Type safety menor que ideal continua. Aceito até v0.2.0.

### D11 — Subir nota agregada do agent-team-audit como gate de DoD

- **Decisão:** Phase final (8) re-executa os 6 agentes especialistas e exige nota agregada ≥ 4.0/5. Critério de "Done".
- **Rationale:** Os mesmos agentes que produziram o baseline avaliam a remediação. Evita auto-engano ("nós resolvemos tudo") substituindo por evidência observável.
- **Consequences:** Phase 8 leva ~30 min para rodar. Pode reabrir achados não esperados — protocolo: incorporar como hotfix se HIGH/CRITICAL, registrar como LOW backlog caso contrário. Tolerância: se agregada fica em 3.8–3.9 com nenhuma dimensão < 3.5, decidir caso-a-caso entre mini-sprint de fechamento ou aceitar como "good enough" (consultar usuário).

### D12 — Upgrade `happy-dom` 16 → 20 pode forçar `vitest` 2 → 3; fallback é `jsdom`

- **Decisão:** Antes de bumpar `happy-dom`, verificar matriz de compatibilidade `vitest@^2.1.8 × happy-dom@>=20`. Se incompatível, bumpar vitest para `^3.x` no mesmo PR. Se ainda houver quebras em > 5% dos tests após 4h de fix, fallback para `jsdom` (aceitar ~3x runtime).
- **Rationale:** CVE-2025-61927 (RCE) exige upgrade do happy-dom. Vitest 2.x foi feito contra happy-dom 14-16; v20 mudou API de `Window` constructor e `fetch` global. Tentar bumpar só happy-dom é fonte conhecida de quebra silenciosa no ambiente de teste. jsdom é hardened, maintained, e tem a maior parity API com browser — custo de runtime é o único trade-off.
- **Consequences:** Se vitest precisar bump: adiciona ~30 min ao escopo de T3.1 + risco de quebra em configs custom (`vitest.config.ts`). Se jsdom: ~3x runtime de testes em CI (de ~10s para ~30s na suite atual), aceitar como custo de segurança. Janela de decisão: 4h após início de T3.1. ADR D12 documenta o gate.

## Dependency Graph

```
Phase 0 (pre-flight: commit + merge)
        │
        ▼
Phase 1 (CRITICAL: publish + registry deploy + false claims)
        │
        ├─────────────────────┬──────────────────────┐
        ▼                     ▼                      ▼
   Phase 2                Phase 3                Phase 6
   (arch HIGH)            (security HIGH/MED)    (deps cleanup)
        │                     │                      │
        └──────────┬──────────┘                      │
                   ▼                                 │
            Phase 4 (code quality MED)               │
                   │                                 │
                   ▼                                 │
            Phase 5 (test coverage gaps)             │
                   │                                 │
                   └────────────┬────────────────────┘
                                ▼
                        Phase 7 (docs/CHANGELOG drift + LOW polish)
                                │
                                ▼
                        Phase 8 (Re-audit + Dogfood QA)
```

- **Phase 0**: pre-requisito puro (sem mudança de código produção).
- **Phase 1**: CRITICAL gate. Bloqueia todo o resto (publicar antes de polir é estratégia explícita — D1).
- **Phase 2 + 3 + 6**: paralelizáveis (arquivos disjuntos). Recomendado executar em sequência se um único contribuidor; em paralelo se 2+.
- **Phase 4** depende de Phase 2 (TheoUIProvider) + Phase 3 (não mexer em ThemeProvider em paralelo).
- **Phase 5** depende de Phase 4 (testa o que foi fixado).
- **Phase 7** depende de toda implementação anterior (docs reflete realidade final).
- **Phase 8** é gate mandatório de DoD.

---

## Phase 0: Pre-flight — commit working tree, abrir PR

**Objective:** Trazer o trabalho não comitado para `feat/deep-review-remediation`, abrir PR de merge para `main`, garantir que CI roda os gates atuais antes de qualquer mudança nova.

### T0.1 — Commit dos 4 arquivos pendentes

#### Objective
Eliminar working tree drift: `CHANGELOG.md` modificado, `README.md` modificado, `CLAUDE.md` novo, `PITCH.md` novo entram no git.

#### Evidence
`git status` mostra 2 modified + 2 untracked. Trabalho de 2026-05-15 (Voice and Tone formalization) ficou fora do version control.

#### Files to edit
```
CHANGELOG.md — modificado (entry Voice/Tone 2026-05-15)
README.md — modificado (aspirational rewrite HERO/BODY)
CLAUDE.md — (NEW) contract Claude ↔ projeto
PITCH.md — (NEW) landing-page copy
```

#### Deep file dependency analysis
- `CHANGELOG.md`: já tem entry preparada para a sessão 2026-05-15; diff já no working tree.
- `README.md`: rewrite editorial. Diff conhecido (visto na auditoria).
- `CLAUDE.md`: novo arquivo, sem dependências de código.
- `PITCH.md`: novo arquivo. **ATENÇÃO**: contém claim falso sobre TheoKit integration (`PITCH.md:239`). Será corrigido em T1.3 antes do merge.

#### Deep Dives
- **NÃO** commitar `PITCH.md` ainda — espera T1.3 para corrigir a alegação falsa. Outros 3 podem entrar.
- Mensagem do commit: seguir convenção `docs(governance): formalize Voice and Tone + Claude project contract`.

#### Tasks
1. Verificar `git status` para confirmar estado.
2. `git add CHANGELOG.md README.md CLAUDE.md`.
3. Commit com mensagem padronizada.
4. `git status` deve mostrar somente `PITCH.md` untracked.

#### TDD
```
RED:     N/A — task de governança git, sem código novo
GREEN:   Commit existe; `git log -1 --name-only` lista os 3 arquivos
REFACTOR: None expected
VERIFY:  git log --oneline -1 && git status
```

#### Acceptance Criteria
- [ ] `git log -1` mostra o commit novo
- [ ] `git status` mostra apenas `PITCH.md` como untracked
- [ ] Mensagem do commit segue padrão `docs(governance):`

#### DoD
- [ ] Commit realizado
- [ ] Working tree limpo exceto `PITCH.md`
- [ ] Push para `origin/feat/deep-review-remediation`

---

### T0.2 — Abrir PR `feat/deep-review-remediation` → `main`

#### Objective
Sair do estado "16 commits órfãos". Abrir PR draft (até Phase 8) com link para este plano.

#### Evidence
Completeness Gap 9: branch nunca foi promovida. CI nunca rodou os gates novos contra `main`.

#### Files to edit
```
.github/pull_request_template.md — verificar se existe; usar se sim
```

#### Deep file dependency analysis
- Operação git/GitHub. Zero arquivos de código alterados.

#### Deep Dives
- PR **draft** até Phase 8 estar verde. Permite que CI rode todos os gates a cada push.
- Body do PR linka para `.claude/knowledge-base/plans/agent-team-audit-fixes-2026-05-16-plan.md`.

#### Tasks
1. `gh pr create --draft --base main --head feat/deep-review-remediation --title "feat: deep-review remediation + agent-team audit fixes"`
2. Body do PR cita plano + checklist de fases.
3. Verificar CI: `gh pr checks <PR>`.

#### TDD
```
RED:     N/A
GREEN:   PR aberto em estado draft; CI iniciado
REFACTOR: None expected
VERIFY:  gh pr view --json state,isDraft,statusCheckRollup
```

#### Acceptance Criteria
- [ ] PR draft criado em GitHub
- [ ] CI rodando contra a branch
- [ ] Body do PR linka para este plano

#### DoD
- [ ] PR draft existe
- [ ] CI passa (gates atuais, pre-Phase 1)

---

## Phase 1: CRITICAL — corrigir claims falsos, publish, registry deploy

**Objective:** Eliminar os 2 CRITICAL e os 4 HIGH de marketing copy desalinhada. Após esta phase, qualquer usuário consegue instalar o pacote.

**Ordem inviolável (MF-1):** `T1.3 → T1.1 → T1.2`. Justificativa: `npm publish` empacota `README.md` na tarball. Se T1.1 roda antes de T1.3, a primeira versão pública do pacote contém claims falsos e pipeline `quality:gates` desatualizado — irreversível sem `npm unpublish` (janela de 72h) ou bump `0.1.0-next.1`. T1.2 vem por último porque depende de DNS externo e pode bloquear; melhor empilhar lá no fim para não atrasar T1.1.

### T1.3 — Corrigir alegações falsas em README, PITCH, CHANGELOG (FIRST)

#### Objective
Eliminar 4 alegações inverificáveis ou falsas detectadas pelo completeness-auditor. **Esta task PRECEDE T1.1 (npm publish) — qualquer mudança aqui deve estar commitada antes de qualquer `npm publish`, senão a tarball ship com docs erradas (MF-1).**

#### Evidence
- `PITCH.md:239`: "TheoKit dashboard template já importa @theokit/ui" — `grep -r "@theokit/ui" /home/paulo/Projetos/usetheo/theokit/` retorna zero. **Materialmente falso**.
- `README.md:243`: pipeline `quality:gates` documentado sem `quality:bundle` e `quality:a11y` (ver `package.json#scripts['quality:gates']`).
- `CHANGELOG.md`: entry Phase 3 fala "canonical 5-entry set" para `package.json#exports` — código real tem 107+ entries após commit `77b2f7a`.
- `PITCH.md:241` + tertiary CTAs: linkam `docs.usetheo.dev/ui` e `ui.usetheo.dev` (gallery) — DNS-NXDOMAIN.

#### Files to edit
```
PITCH.md — corrigir linha 239 (TheoKit claim) + tertiary CTAs (dead links)
README.md — atualizar linha 243 (pipeline quality:gates)
CHANGELOG.md — adicionar nota corretiva em [Unreleased] sobre exports map
```

#### Deep file dependency analysis
- `PITCH.md` (atualmente untracked, criado em 2026-05-15): linha 239 menciona integração que não existe. **Decisão**: remover claim, substituir por exemplo concreto que funciona hoje (consumir em qualquer Next.js app). Após edit, `git add PITCH.md` (entra no version control nesta task, NÃO em T0.1 — para evitar commitar claim falso).
- `README.md`: linha 243 lista 9 gates; real são 11. Atualizar para refletir `package.json#scripts['quality:gates']` exato. Comando de verificação: `node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).scripts['quality:gates'])"`.
- `CHANGELOG.md`: NÃO editar entry antiga (regra Keep a Changelog — versões released são imutáveis). Adicionar entry em `[Unreleased]`: "Note: prior CHANGELOG entry under Phase 3 referenced 'canonical 5-entry set' for `package.json#exports`. Current state has 107+ subpath entries per ADR-77b2f7a; see `package.json` for canonical source."

#### Deep Dives
- **PITCH.md linha 239 substituição**:
  ```diff
  - Build a full agent app with TheoKit — `npx create-theokit my-app` already imports `@theokit/ui` when you pick the dashboard template.
  + Build any React surface — install `@theokit/ui@next` and ship 102 components in minutes. TheoKit integration is on the roadmap.
  ```
- **Tertiary CTAs**: `docs.usetheo.dev/ui` e `ui.usetheo.dev` (gallery raiz). **Decisão**: `docs.usetheo.dev/ui` é responsabilidade do `theo-website` (fora deste projeto) — substituir link por `https://github.com/usetheodev/theo-ui#component-catalog`. `ui.usetheo.dev` (gallery) será resolvido em T1.2 servindo Ladle build em `/gallery`. Por enquanto, link aponta para `ui.usetheo.dev` que após T1.2 redireciona ou serve catálogo.
- **Por que esta task vem PRIMEIRO (MF-1)**: `npm publish` empacota `README.md` (e qualquer asset listado em `files[]` do package.json — `PITCH.md` não está). Publicar com README contendo gates desatualizado é irreversível em < 72h sem `npm unpublish`. Hard ordering: T1.3 → T1.1.

#### Tasks
1. Editar `PITCH.md:239` removendo claim TheoKit (diff acima).
2. Editar `PITCH.md` tertiary CTAs: substituir `docs.usetheo.dev/ui` por GitHub anchor; manter link `ui.usetheo.dev` (resolverá em T1.2).
3. Editar `README.md:243` espelhando `package.json#scripts['quality:gates']` real.
4. Adicionar nota corretiva em `CHANGELOG.md` na seção `[Unreleased]` sobre exports map.
5. `git add PITCH.md README.md CHANGELOG.md`.
6. Commit: `docs(truth): align README/PITCH/CHANGELOG with shipped reality (MF-1)`.
7. Push para `feat/deep-review-remediation`. CI deve continuar verde.

#### TDD
```
RED:     test_pitch_no_theokit_dashboard_claim() — grep "already imports @theokit/ui" PITCH.md retorna 0 lines
RED:     test_readme_quality_gates_matches_package_json() — script que parseia ambos e diffa
RED:     test_pitch_dead_links_removed() — curl-loop sobre href= no PITCH.md → todos ≤ 400 (com ui.usetheo.dev como exceção até T1.2)
GREEN:   Após edit + commit: 3 testes verde
REFACTOR: None expected
VERIFY:  grep -c "already imports @theokit/ui" PITCH.md  # esperado: 0
```

#### Acceptance Criteria
- [ ] `grep -c "already imports @theokit/ui" PITCH.md` retorna 0 (claim removida)
- [ ] `README.md:243` lista 11 gates conforme `package.json`
- [ ] CHANGELOG `[Unreleased]` documenta correção do export map
- [ ] `PITCH.md` rastreado em git (não mais untracked)
- [ ] CI verde após push
- [ ] Pre-flight para T1.1: `git status` mostra working tree limpo

#### DoD
- [ ] 3 arquivos editados + 1 adicionado ao git
- [ ] Commit em `feat/deep-review-remediation`
- [ ] CI verde
- [ ] **Gate explícito para T1.1**: este commit deve estar em `origin/feat/deep-review-remediation` antes de qualquer `npm publish`

---

### T1.1 — Bump version + `npm publish --tag next` (SECOND)

#### Objective
Publicar `@theokit/ui@0.1.0-next.0` no registry público do npm. **Pré-requisito inviolável: T1.3 commitada e pusha em `feat/deep-review-remediation` (MF-1).**

#### Evidence
`curl https://registry.npmjs.org/@theokit/ui` → HTTP/2 404. Confirmado pelo completeness-auditor + verificação manual. ADR D1 justifica timing.

#### Files to edit
```
package.json — version: 0.0.0 → 0.1.0-next.0
CHANGELOG.md — registrar release 0.1.0-next.0 movendo [Unreleased] entries
```

#### Deep file dependency analysis
- `package.json`: campo `version` é a única mudança. `publishConfig.access: "public"` já está correto.
- `CHANGELOG.md`: convenção Keep a Changelog exige movimentação manual de `[Unreleased]` para `[0.1.0-next.0] - 2026-05-16`. Mantemos `[Unreleased]` vazio para próximo ciclo. **Importante**: a nota corretiva sobre exports map adicionada em T1.3 vai junto para `[0.1.0-next.0]` — não fica órfã em `[Unreleased]`.

#### Deep Dives
- **Pre-publish gate inviolável (MF-1)**: confirmar `git log -1 --oneline | grep "docs(truth)"` mostra commit de T1.3. Se não, ABORT.
- **Pre-publish gates**: rodar localmente antes do `npm publish` real:
  - `pnpm install --frozen-lockfile`
  - `pnpm quality:gates` → verde
  - `pnpm pack --dry-run` → inspecionar conteúdo da tarball, confirmar `LICENSE`, `CHANGELOG.md`, `README.md` (com pipeline atualizado de T1.3), `dist/`
- **Auth**: usuário precisa de `~/.npmrc` com `//registry.npmjs.org/:_authToken=<TOKEN>` e ser owner da org `@theokit` ou ter permissão. Se a org não existe ainda:
  - `npm org create usetheo` (se nome livre) OU
  - Verificar via `npm access ls-collaborators @theokit/ui` quem é owner
- **Tag**: `--tag next` impede que `npm install @theokit/ui` (sem versão) puxe esta. Consumer precisa de `npm install @theokit/ui@next`. Documentado em README.

#### Tasks
1. **GATE MF-1**: `git log -1 --oneline` mostra commit `docs(truth):` (de T1.3). Se não, voltar para T1.3.
2. Confirmar `pnpm quality:gates` verde.
3. `pnpm pack --dry-run` e inspecionar saída — em particular, confirmar que `README.md` contém pipeline atualizado.
4. Editar `package.json` versão.
5. Editar `CHANGELOG.md` movendo entries `[Unreleased]` → `[0.1.0-next.0] - 2026-05-16`.
6. Commit: `chore(release): 0.1.0-next.0`.
7. `npm publish --tag next` (com auth válida).
8. Verificar: `npm view @theokit/ui` → mostra metadata.
9. Verificar: `npm install @theokit/ui@next` em pasta `/tmp/test-install` vazia → resolve OK.
10. Verificar: `cat /tmp/test-install/node_modules/@theokit/ui/README.md | grep -c "quality:bundle"` ≥ 1 (provando que README publicado tem fixes de T1.3).

#### TDD
```
RED:     test_t13_commit_landed() — git log mostra commit docs(truth):
RED:     test_npm_view_returns_package() — antes do publish, `npm view @theokit/ui` ERRO E404
RED:     test_install_in_clean_project_resolves() — antes, `npm install @theokit/ui@next` ERRO
RED:     test_published_readme_contains_t13_fixes() — README na tarball menciona quality:bundle (proof MF-1 OK)
GREEN:   Após publish: 4 testes verde
REFACTOR: None expected
VERIFY:  npm view @theokit/ui version && tar tzf $(npm pack --dry-run --json | jq -r .[0].filename) | grep README
```

#### Acceptance Criteria
- [ ] `npm view @theokit/ui version` retorna `0.1.0-next.0`
- [ ] `npm install @theokit/ui@next` em projeto vazio resolve
- [ ] `pnpm pack --dry-run` lista `LICENSE`, `CHANGELOG.md`, `README.md`, `dist/`
- [ ] Tag `next` aplicada: `npm view @theokit/ui dist-tags` mostra `next: 0.1.0-next.0`
- [ ] Versão `latest` NÃO existe (`npm view @theokit/ui dist-tags.latest` undefined)
- [ ] **MF-1 proof**: README publicado contém `quality:bundle` e `quality:a11y` (fixes de T1.3 no shipped artifact)

#### DoD
- [ ] T1.3 commit confirmado em `origin/feat/deep-review-remediation` ANTES do publish
- [ ] Publish bem-sucedido
- [ ] CHANGELOG atualizado com release
- [ ] Commit `chore(release):` em `feat/deep-review-remediation`
- [ ] CI verde

---

### T1.2 — Deploy de `registry/r/` em `ui.usetheo.dev` (Cloudflare Pages) (THIRD)

#### Objective
Tornar `https://ui.usetheo.dev/r/<component>.json` acessível com CORS aberto.

#### Evidence
`curl -sI https://ui.usetheo.dev/r/button.json` → zero resposta (DNS-NXDOMAIN). CLAUDE.md marca como "(planned)" mas README e PITCH apresentam como funcional.

#### Files to edit
```
.github/workflows/deploy-registry.yml — (NEW) workflow para publish em Pages
registry/_headers — (NEW) CORS headers para CF Pages
DNS de usetheo.dev — adicionar CNAME ui → CF Pages
```

#### Deep file dependency analysis
- `.github/workflows/deploy-registry.yml`: workflow novo, dispara em push em `main` que toca `registry/r/**`. Faz `pnpm registry:build` + deploy via `cloudflare/pages-action`.
- `registry/_headers`: convenção CF Pages para headers HTTP. Define `Access-Control-Allow-Origin: *` em `/r/*`.
- DNS: operação fora do repo. Documentar em `docs/operations/registry-deployment.md` (NEW).

#### Deep Dives
- **Alternativa low-cost se CF não disponível**: GitHub Pages serve `registry/r/` direto. Limitação: HTTPS apenas em `<user>.github.io`. CNAME para `ui.usetheo.dev` resolvido via DNS A record. Custo: zero. Trade-off: GH Pages não suporta `_headers`, precisamos de CORS via `<meta>` ou inferir do `shadcn` (que aceita raw JSON).
- **Decisão atual**: tentar CF Pages primeiro. Fallback GH Pages se org não tem CF.
- **Schema validation pré-deploy**: workflow roda `pnpm registry:validate` antes de deploy. Falha bloqueia.
- **Cache busting**: registry items raramente mudam estrutura; CF Pages cache padrão (`Cache-Control: max-age=14400`) é OK para consumidores `shadcn add`. PR futuro pode adicionar `Cache-Control: no-cache` em `index.json` se necessário.

#### Tasks
1. Criar projeto CF Pages (ou GH Pages) apontando para repo.
2. Configurar build: `pnpm install && pnpm registry:build` → output dir `registry/`.
3. Adicionar `registry/_headers` com CORS.
4. Criar workflow `.github/workflows/deploy-registry.yml`.
5. Configurar DNS: `ui.usetheo.dev` CNAME → CF Pages domain (ou A record GH Pages).
6. Verificar: `curl -sI https://ui.usetheo.dev/r/button.json` → 200, `Content-Type: application/json`.
7. Verificar: `npx shadcn@latest add https://ui.usetheo.dev/r/button.json` em projeto fixture resolve.

#### TDD
```
RED:     test_registry_endpoint_returns_200() — antes do deploy: curl falha
RED:     test_cors_header_present() — antes: nenhuma resposta
RED:     test_shadcn_add_resolves() — antes: erro de network
GREEN:   Após deploy: todos os 3 verde
REFACTOR: None expected
VERIFY:  curl -sf https://ui.usetheo.dev/r/button.json -o /dev/null && curl -sI https://ui.usetheo.dev/r/button.json | grep -i "access-control-allow-origin"
```

#### Acceptance Criteria
- [ ] `curl -sf https://ui.usetheo.dev/r/button.json` exit 0
- [ ] `curl -sI` mostra `Access-Control-Allow-Origin: *`
- [ ] `curl -sI` mostra `Content-Type: application/json`
- [ ] `npx shadcn add https://ui.usetheo.dev/r/button.json` em fixture instala
- [ ] Workflow rodando em `main`: deploy automático a cada mudança em `registry/`
- [ ] `https://ui.usetheo.dev/r/agent-event.json` também resolve (asserção em ≥ 3 componentes diferentes)

#### DoD
- [ ] DNS resolvendo
- [ ] HTTPS válido
- [ ] Workflow de deploy verde
- [ ] CORS aberto

---

## Phase 2: HIGH arquiteturais — TheoUIProvider, subpath docs, registry alias docs, barrel cleanup, ThemeProvider violetForge

**Objective:** Fechar os 5 achados HIGH/MEDIUM de arquitetura: provider root, subpath misleading, alias undocumented, barrel mistagged, hard-couple.

### T2.1 — Criar `<TheoUIProvider>` como entry point único

#### Objective
Exportar `TheoUIProvider` que compõe `ThemeProvider + Toaster` com defaults sensatos. Reduz documentação consumer-side de "monte estes 2 providers" para "wrap your app with one provider".

#### Evidence
Architecture Gap 6: nenhuma blessed configuration de provider stack. Todo consumer descobre por conta própria. Comparáveis (`MUI`, `shadcn`, `Mantine`) têm entry-point único.

#### Files to edit
```
src/theo-ui-provider.tsx — (NEW) ~40 linhas
src/index.ts — adicionar export
src/theo-ui-provider.test.tsx — (NEW) 4 testes
src/theo-ui-provider.stories.tsx — (NEW) Ladle story
registry/r/theo-ui-provider.json — (NEW) registry entry (registry:ui)
README.md — Quickstart usa <TheoUIProvider>
docs/architecture.md — adicionar §"Provider stack"
```

#### Deep file dependency analysis
- `theo-ui-provider.tsx` (NEW): import `ThemeProvider` de `./themes/theme-provider`, import `Toaster` de `./components/primitives/toast/toaster`. Função `TheoUIProvider(props)` retorna `<ThemeProvider {...themeProps}>{children}<Toaster {...toasterProps} /></ThemeProvider>`.
- `src/index.ts`: adicionar `export { TheoUIProvider } from './theo-ui-provider'` na seção `// COMPOSITES` ou nova seção `// PROVIDERS`.
- Teste: assert que render `<TheoUIProvider><div data-testid="child"/></TheoUIProvider>` aplica `data-theme` no html e que `<Toaster>` está no DOM.
- Story Ladle: demonstra wrapper completo com switcher de tema.
- Registry: registry:ui type, declarando `dependencies: ['theme-provider', 'toaster']` em `registryDependencies`.
- README: Quickstart code sample troca de `<ThemeProvider>...<Toaster/>` para `<TheoUIProvider>`.

#### Deep Dives
- **Props API**:
  ```ts
  type TheoUIProviderProps = {
    children: React.ReactNode;
    theme?: Parameters<typeof ThemeProvider>[0]; // pass-through
    toaster?: Parameters<typeof Toaster>[0];     // pass-through
  };
  ```
  Sem context próprio. Sem novas props além de pass-through.
- **NÃO** wrappar `Tooltip.Provider` aqui — Radix docs explicitamente recomendam per-instance (já feito em `tooltip.tsx:63`). Forçar provider global aumentaria latência de hover.
- **Backward compat**: `<ThemeProvider>` e `<Toaster>` continuam exportados individualmente. `<TheoUIProvider>` é açúcar.

#### Tasks
1. RED: escrever `theo-ui-provider.test.tsx` com 4 testes (renders children, applies theme, mounts toaster, accepts theme prop pass-through).
2. Implementar `theo-ui-provider.tsx`.
3. GREEN: tests passam.
4. Adicionar export em `src/index.ts`.
5. Criar story.
6. Gerar registry item: `pnpm registry:build`.
7. Atualizar README Quickstart.
8. Adicionar seção em `docs/architecture.md`.
9. Atualizar `scripts/validate-quality-gates.ts` skip-list se necessário (taxonomia: este é composite).
10. `pnpm quality:gates` → verde.

#### TDD
```
RED:     theo_ui_provider_renders_children() — children visível no DOM
RED:     theo_ui_provider_applies_theme() — html.dataset.theme === expected
RED:     theo_ui_provider_mounts_toaster() — getByRole('region', {name:/notifications/i}) existe
RED:     theo_ui_provider_passes_through_theme_props() — defaultMode='dark' resulta em dataset.mode='dark'
GREEN:   Implementar componente.
REFACTOR: extrair Toaster default props se duplicação aparecer (provavelmente não)
VERIFY:  pnpm vitest src/theo-ui-provider.test.tsx
```

#### Acceptance Criteria
- [ ] 4 tests passing
- [ ] Story Ladle existe e aparece no `pnpm ladle:build`
- [ ] Registry item `theo-ui-provider.json` validado por `pnpm registry:validate`
- [ ] README Quickstart usa `<TheoUIProvider>` como exemplo primário
- [ ] `docs/architecture.md` documenta o provider stack
- [ ] `pnpm quality:gates` verde
- [ ] vitest-axe não regride

#### DoD
- [ ] Componente implementado + testado
- [ ] Story + registry + docs atualizados
- [ ] Commit `feat(provider): TheoUIProvider as primary entry point`
- [ ] CI verde

---

### T2.2 — Documentar subpath exports como conveniência (ADR D4)

#### Objective
Adicionar JSDoc/comentário no `package.json` e documentação no README explicando que os 102 subpath exports são aliases tree-shakeable, não bundles separados.

#### Evidence
Architecture Gap 1: subpath exports criam contrato implícito que não corresponde ao build. `tsup.config.ts:11` tem `splitting: false` deliberado mas em lugar nenhum isso é documentado para consumer.

#### Files to edit
```
README.md — adicionar §"Bundle & module format" (LOW-002 já existe mas precisa expandir)
docs/architecture.md — adicionar §"Subpath exports rationale"
scripts/sync-exports.ts — adicionar comment header explicando policy
```

#### Deep file dependency analysis
- `README.md`: seção `Bundle & module format` já existe (commit eb3cad5 / LOW-002). Expandir para mencionar `splitting: false` + tree-shaking dependence on consumer bundler.
- `docs/architecture.md`: nova subseção explicando ADR D4.
- `scripts/sync-exports.ts`: header explica que subpath entries são aliases.

#### Deep Dives
- Conteúdo da seção:
  > **Subpath exports.** `@theokit/ui` exposes a subpath import per component (e.g., `import { Button } from "@theokit/ui/button"`). All subpath entries resolve to the same single bundle (`dist/index.js`). The library is tree-shakeable when consumed by ESM-aware bundlers (Vite, Rollup, Webpack 5, esbuild) — only the imported components survive into your final bundle. Subpath entries exist for IDE intellisense and import organization, not for code-splitting. Consumers using non-tree-shaking runtimes (Jest classic, Node REPL, raw browser ESM) will load the full bundle regardless of subpath.

#### Tasks
1. Editar `README.md` na seção existente.
2. Adicionar seção em `docs/architecture.md`.
3. Adicionar header comment em `scripts/sync-exports.ts`.
4. Commit: `docs(exports): clarify subpath alias semantics`.

#### TDD
```
RED:     test_readme_documents_splitting_false() — grep "tree-shake" + "splitting" no README ≥ 1 occurrence
GREEN:   Após edit
REFACTOR: None
VERIFY:  grep -c "subpath" README.md docs/architecture.md
```

#### Acceptance Criteria
- [ ] README documenta `splitting: false` e tree-shaking
- [ ] `docs/architecture.md` linka ADR D4
- [ ] `scripts/sync-exports.ts` tem header explicativo

#### DoD
- [ ] 3 arquivos editados
- [ ] Commit
- [ ] CI verde (sem impacto em gates)

---

### T2.3 — Documentar precondição de alias `@/` no registry copy-paste

#### Objective
Adicionar field `requires` (ou comentário equivalente) em `registry/index.json` e seção em `CONTRIBUTING.md` explicando que consumidores do registry shadcn-style precisam de `@/` configurado.

#### Evidence
Architecture Gap 5: 100 de 111 registry items usam `import { cn } from "@/lib/cn"`. Convenção shadcn. Mas projeto Vite com alias `~/` falha sem mensagem.

#### Files to edit
```
registry/index.json — adicionar field "metadata.requires"
docs/quality-gates.md — §"Registry copy-paste preconditions"
README.md — seção "Option B" linka para precondição
scripts/build-registry.ts — emitir warning se imports usam `@/` sem metadata
```

#### Deep file dependency analysis
- `registry/index.json`: schema do shadcn permite extension fields. Adicionar `metadata: { requires: { alias: { "@/*": "./src/*" } } }`.
- `docs/quality-gates.md`: docs já existe; adicionar nova seção §X.
- `README.md`: Option B (copy-paste) ganha bullet "Requires `@/` path alias mapped to `./src` in tsconfig.json".
- `scripts/build-registry.ts`: pós-build, varrer todos os JSONs e confirmar que TODOS declaram a precondição.

#### Deep Dives
- **Alternativa rejeitada**: substituir `@/lib/cn` por path relativo no source. Custo: source dos componentes fica menos legível, viola convenção shadcn-ui. Não vale a pena.
- **Solução**: documentação explícita + gate que falha se algum registry item usa `@/` sem declarar a precondição.

#### Tasks
1. Atualizar schema `registry/index.json` com field `metadata.requires`.
2. Atualizar `scripts/build-registry.ts` para emitir o field.
3. Atualizar `scripts/validate-registry.ts` para validar consistência.
4. Adicionar seção em `docs/quality-gates.md`.
5. Adicionar bullet em README Option B.
6. `pnpm registry:build && pnpm registry:validate`.

#### TDD
```
RED:     test_registry_declares_alias_requirement() — registry/index.json contém metadata.requires.alias["@/*"]
RED:     test_validate_registry_fails_if_alias_undeclared() — modificar fixture: remover metadata → validate falha
GREEN:   Implementar
REFACTOR: None
VERIFY:  pnpm registry:validate
```

#### Acceptance Criteria
- [ ] `registry/index.json` tem `metadata.requires`
- [ ] `docs/quality-gates.md` documenta precondição
- [ ] README Option B linka para precondição
- [ ] Gate falha se registry item viola

#### DoD
- [ ] 4 arquivos editados
- [ ] Gate atualizado
- [ ] Commit

---

### T2.4 — Reorganizar barrel `src/index.ts` (D7)

#### Objective
Mover os 8 composites mal posicionados de dentro da seção `// PRIMITIVES` para após `// COMPOSITES`.

#### Evidence
Architecture Gap 2. 8 nomes específicos: `SkillsList`, `SkillEditor`, `RuleEditor`, `CronJobsList`, `MCPServerList`, `AgentEditor`, `AgentComposer`, `ApprovalCard`.

#### Files to edit
```
src/index.ts — mover exports
scripts/sync-exports.ts — se gerador, confirmar que respeita ordem
```

#### Deep file dependency analysis
- `src/index.ts`: editorial. NÃO mudar nomes nem tipos.
- Quality gate `validateExportsMap` deve continuar verde porque o conjunto de exports é o mesmo — só a ordem muda.

#### Deep Dives
- Se `src/index.ts` é gerado por `sync-exports.ts`, mudar o script. Senão, editar o arquivo manualmente.
- Verificar com `head -200 src/index.ts` se há marcadores `// PRIMITIVES` / `// COMPOSITES`.

#### Tasks
1. Identificar gerador (script ou manual).
2. Mover blocos de export.
3. `pnpm typecheck`.
4. `pnpm sync:exports` (se aplicável).
5. `pnpm quality:gates`.

#### TDD
```
RED:     test_barrel_organization() — script de teste que lê `src/index.ts`, identifica seção `// COMPOSITES`, confirma que os 8 nomes estão APÓS o marcador
GREEN:   Após reorganização
REFACTOR: None
VERIFY:  pnpm test
```

#### Acceptance Criteria
- [ ] 8 nomes movidos
- [ ] `pnpm quality:gates` verde
- [ ] `pnpm typecheck` verde
- [ ] Nenhum consumer perde export

#### DoD
- [ ] Edit feito
- [ ] Commit `refactor(barrel): move composites out of primitives section`

---

### T2.5 — ThemeProvider: remover hard-couple a `violetForge` (com registry regen, MF-2)

#### Objective
Permitir consumidor passar `themes={[customTheme]}` sem que `violetForge` seja injetado no bundle final. **Regenerar e revalidar os 3 registry items que shipam o source de ThemeProvider (MF-2)**.

#### Evidence
Architecture Gap 4: `src/themes/theme-provider.tsx:4` importa `violetForge` no top-level. `mergedThemes` sempre começa com `[violetForge]` (linha 128). `fallback` em linha 214 usa `violetForge` como safety net.

**MF-2 (edge-case-plan)**: `grep -l "ThemeProvider" registry/r/*.json` revela 3 arquivos:
- `registry/r/theme-provider.json` — ship o **source completo** de `theme-provider.tsx` em `content` field (consumer recebe via `npx shadcn add theme-provider`).
- `registry/r/theme-script.json` — não é consumer; apenas referencia no JSDoc.
- `registry/r/tokens.json` — apenas comentário CSS.

Impact real: o **content shipped em `theme-provider.json`** vai mudar (já que o source `.tsx` muda). Consumer que rodou `shadcn add theme-provider` no passado tem código antigo (com `themes` opcional + violetForge hardcoded); novos shadcn adds receberão a nova API (`themes` required). Sem aviso explícito, esses consumers experimentam breaking change "invisível".

#### Files to edit
```
src/themes/theme-provider.tsx — remover top-level import; aceitar `themes` prop como única fonte
src/themes/index.ts — exportar `defaultThemes = [violetForge, classicPaper, auroraTerminal]`
src/themes/theme-provider.test.tsx — adicionar teste de "passes custom theme only"
src/theo-ui-provider.tsx — passar `themes={defaultThemes}` por default (preserva DX)
docs/design-system.md — migration note
CHANGELOG.md — breaking change explícito + migration recipe
registry/r/theme-provider.json — regenerado via `pnpm registry:build`
scripts/validate-registry.ts — adicionar gate que detecta breaking-change drift
```

#### Deep file dependency analysis
- `theme-provider.tsx`:
  - Remover `import { violetForge } from './violet-forge'`.
  - Mudar `mergedThemes` para `themes ?? []` (apenas).
  - Mudar `fallback` para `themes[0]` com error se `themes.length === 0`.
  - Atualizar tipo `ThemeProviderProps` para `themes: Theme[]` (required) com JSDoc explicando migration.
- `theme-provider.test.tsx`: 3 testes — `passes custom theme only` (sem violetForge no DOM), `defaultThemes export contains 3`, `throws helpful error if themes=[]`.
- `theo-ui-provider.tsx` (criado em T2.1): wrapper usa `themes={defaultThemes}` por default. Consumer que usa `<TheoUIProvider>` (path recomendado) não sente quebra.
- `registry/r/theme-provider.json`: regenerado automaticamente por `pnpm registry:build` após source change. **Inspecionar diff antes de commitar**: `git diff registry/r/theme-provider.json` deve mostrar nova versão do source. Se diff inesperado (e.g., outro componente afetado em cascata), abortar.
- `validate-registry.ts`: novo gate `validateApiCompatibility` — para cada `registry:ui` item, comparar `content` contra git HEAD do `main`. Se assinatura de prop muda (ex: required → optional, ou vice-versa), exigir entry em `CHANGELOG.md > [Unreleased] > Changed (breaking)`. Heurística: regex sobre tipos `Props`.

#### Deep Dives
- **Backward compat strategy**: dois canais distintos:
  1. **Canal npm (`pnpm add @theokit/ui`)**: consumer importa `ThemeProvider`. Quebra silenciosa se não passar `themes`. **Mitigação**: TypeScript pega em compile time (`themes` agora required). README + CHANGELOG migration recipe.
  2. **Canal shadcn (`npx shadcn add theme-provider`)**: consumer recebe **source copy-paste**. Novos shadcn adds pegam o novo source automaticamente. Consumers antigos têm versão velha do source e não são afetados até decidirem re-rodar `shadcn add`. **Não há mecanismo de auto-update no shadcn pattern por design**. CHANGELOG documenta para quem fizer re-add.
- **`<TheoUIProvider>` (T2.1)** default-inclui `defaultThemes` — então o "out-of-box" Quickstart do README continua funcionando com 0 mudança visível.
- **Bundle impact**: consumer que importa só `<ThemeProvider>` (não `<TheoUIProvider>`) e passa seu próprio theme não inclui mais `violetForge.ts` (~6 KB).
- **CHANGELOG entry obrigatória**:
  ```markdown
  ### Changed (breaking)
  - `<ThemeProvider>` now requires `themes` prop (was optional with implicit `violetForge` default). Migration:
    ```tsx
    // Before
    import { ThemeProvider } from "@theokit/ui";
    <ThemeProvider>...</ThemeProvider>

    // After (option A — keep all built-ins)
    import { ThemeProvider, defaultThemes } from "@theokit/ui";
    <ThemeProvider themes={defaultThemes}>...</ThemeProvider>

    // After (option B — use wrapper, no migration needed)
    import { TheoUIProvider } from "@theokit/ui";
    <TheoUIProvider>...</TheoUIProvider>
    ```
  ```

#### Tasks
1. RED: 3 testes em `theme-provider.test.tsx`.
2. Refactor `theme-provider.tsx`.
3. Export `defaultThemes` em `src/themes/index.ts` E re-export em `src/index.ts`.
4. Atualizar `theo-ui-provider.tsx` (de T2.1) para passar `themes={defaultThemes}` por default.
5. Atualizar `docs/design-system.md` com migration note.
6. `pnpm registry:build` — regenerar `registry/r/theme-provider.json` com novo source.
7. Inspecionar `git diff registry/r/theme-provider.json` — verificar que só `theme-provider.json` mudou (não outros items por cascade).
8. Atualizar `CHANGELOG.md` em `[Unreleased] > Changed (breaking)` com migration recipe.
9. Implementar `validateApiCompatibility` gate em `scripts/validate-registry.ts`.
10. Rodar `pnpm registry:validate` — confirma gate verde.
11. `pnpm quality:gates` — verde.

#### TDD
```
RED:     test_theme_provider_with_custom_theme_only() — render com themes=[custom], assert <style> NOT contains "[data-theme=\"violet-forge\"]"
RED:     test_default_themes_export() — defaultThemes contém 3 themes
RED:     test_theme_provider_throws_with_empty_themes() — render com themes=[] lança error com mensagem útil
RED:     test_theo_ui_provider_uses_default_themes() — render <TheoUIProvider> sem theme prop, assert violetForge presente no DOM (mantém DX out-of-box)
RED:     test_registry_theme_provider_regenerated() — git diff em registry/r/theme-provider.json confirma novo source (contém "themes: Theme[]" required)
RED:     test_validate_api_compat_gate_catches_breaking() — modificar fixture de registry para simular breaking sem entry no CHANGELOG → gate falha
GREEN:   Implementar todos os 6
REFACTOR: extrair função `mergeThemes` se a lógica de fallback ficar tortuosa
VERIFY:  pnpm vitest src/themes/ && pnpm registry:validate && pnpm quality:gates
```

#### Acceptance Criteria
- [ ] 6 novos tests passando
- [ ] Bundle de consumer custom não inclui `violetForge`
- [ ] `defaultThemes` exportado do entry-point
- [ ] `<TheoUIProvider>` continua funcionando "out of box"
- [ ] CHANGELOG `[Unreleased] > Changed (breaking)` documenta migration recipe completa
- [ ] `registry/r/theme-provider.json` regenerado; `git diff` mostra apenas esse arquivo
- [ ] `scripts/validate-registry.ts` ganha `validateApiCompatibility` gate
- [ ] `pnpm quality:gates` verde

#### DoD
- [ ] Implementação completa
- [ ] Tests verdes
- [ ] Registry regenerado e diff inspecionado
- [ ] CHANGELOG breaking change entry obrigatória presente
- [ ] Gate de compat ativo
- [ ] Commit `refactor(theme-provider)!: themes prop required, regen registry (MF-2)`
- [ ] Bundle size: tsup output mostra que `violetForge` virou chunk separável (verificável manualmente)

#### DoD
- [ ] Refactor feito
- [ ] Tests verdes
- [ ] Bundle size: tsup output mostra que `violetForge` virou chunk separável (verificável manualmente)
- [ ] Commit `refactor(theme-provider): decouple from violetForge default`

---

## Phase 3: Security HIGH/MEDIUM — happy-dom upgrade, CSS sanitization, javascript: guard

**Objective:** Fechar os 3 achados de segurança que impactam o pacote ou contribuidores.

### T3.1 — Upgrade `happy-dom` para `>= 20` (com pre-flight vitest compat, MF-3)

#### Objective
Eliminar CVE-2025-61927 (RCE) + 2 outras CVEs HIGH em `happy-dom@16.8.1` (devDep). **Aderir ao ADR D12: pre-flight de compat vitest 2.x × happy-dom 20+, com janela de decisão de 4h para fallback vitest 3+ ou jsdom.**

#### Evidence
Security SEC-004. CVEs publicadas. Affecting test environment de todo contribuidor.

**MF-3 (edge-case-plan)**: `package.json` declara `vitest: ^2.1.8` + `happy-dom: ^16.3.0`. Vitest 2.x foi feito contra happy-dom 14-16. v20 mudou API de `Window` constructor e `fetch` global. Sem compat audit, bump silencioso pode bloquear o ambiente de teste inteiro.

#### Files to edit
```
package.json — bump happy-dom de ^16.3.0 para ^20.0.0; possivelmente bump vitest de ^2.1.8 para ^3.x
pnpm-lock.yaml — regenerar
vitest.config.ts — possível ajuste se API mudou
.github/workflows/ci.yml — possível ajuste de comando se vitest 3 mudou flags
```

#### Deep file dependency analysis
- `package.json`: trocar `happy-dom` para `^20.0.0`. Se pre-flight (passo 1 abaixo) indicar incompat, também trocar `vitest` para `^3.x`.
- `pnpm-lock.yaml`: regen via `pnpm install`.
- `vitest.config.ts`: vitest 3 mudou shape de `test.environment` options. Inspecionar diff.
- Tests dependem de happy-dom: 105 arquivos. Maioria não toca APIs esotéricas — risco de quebra direto baixo, risco via vitest 3 incompat maior.

#### Deep Dives
- **Pre-flight (MF-3, OBRIGATÓRIO antes de qualquer install)**:
  1. Verificar compat oficial: `npm view happy-dom@20 peerDependencies` e checar matriz Vitest no `CHANGELOG.md` do happy-dom.
  2. Verificar versão atual: `pnpm exec vitest --version` (esperado `2.1.8`).
  3. Decisão #1: se happy-dom@20 declara `peerDependencies` exigindo vitest >= 3 → bumpar ambos no mesmo PR.
  4. Decisão #2: se silent compat unclear → tentar `pnpm add -D happy-dom@^20.0.0` em branch separada, rodar `pnpm test --run`, medir taxa de quebra:
     - Quebras < 5% → fix forward apenas com tweaks.
     - Quebras 5-20% → considerar bump vitest junto.
     - Quebras > 20% OU bloqueio em init → executar D12 fallback (jsdom).
- **Procedimento principal** (após pre-flight):
  1. Branch separada `chore/happy-dom-upgrade` (ou continuar em `feat/deep-review-remediation`).
  2. `pnpm add -D happy-dom@^20.0.0` (+ `vitest@^3` se pre-flight indicou).
  3. `pnpm test --run` — medir.
  4. Se quebras: examinar API changes via `happy-dom` CHANGELOG entre 16 e 20.
- **D12 fallback (jsdom)**: se 4h após início e tests ainda < 95% passando:
  1. `pnpm remove happy-dom && pnpm add -D jsdom @types/jsdom`.
  2. `vitest.config.ts`: `environment: "jsdom"`.
  3. Re-rodar test. jsdom é hardened, sem CVEs ativos.
  4. Aceitar custo de ~3x runtime em CI (de ~10s para ~30s na suite atual).
- **Known v20 breaking changes** (revisar do CHANGELOG upstream): `Window` constructor signature, `fetch` global resolution, `URL` parsing. Suite atual não usa essas APIs diretamente — mock via vitest setup.

#### Tasks
1. **Pre-flight MF-3 (gate inviolável)**: rodar comandos do bloco "Pre-flight" acima. Documentar decisão em comentário do commit.
2. `pnpm add -D happy-dom@^20.0.0` (+ vitest se necessário).
3. `pnpm test --run`. Medir taxa de passing.
4. Se < 95% passing após 4h: executar fallback jsdom (D12).
5. Se >= 95% passing: localizar e ajustar tests quebrados.
6. `pnpm audit --dev` confirmar zero HIGH em happy-dom.
7. CI verde.

#### TDD
```
RED:     test_pre_flight_compat_documented() — commit message contém "Pre-flight: happy-dom@20 + vitest@X compat"
RED:     test_no_high_cve_in_test_environment() — pnpm audit --dev | grep happy-dom OR jsdom — zero high
RED:     test_test_suite_passes_post_upgrade() — pnpm test --run exit 0, count >= 467 passing
RED:     test_decision_path_recorded() — README ou commit indica se vitest bumpou OU jsdom adotado OU happy-dom@20 standalone
GREEN:   Após pre-flight + upgrade + fixes
REFACTOR: Atualizar `vitest.config.ts` se necessário
VERIFY:  pnpm test --run && pnpm audit --dev
```

#### Acceptance Criteria
- [ ] **MF-3 pre-flight executado e documentado** (commit message ou ADR D12 update)
- [ ] CVE-2025-61927 + 2 outros HIGH fechados (`pnpm audit --dev` mostra)
- [ ] `pnpm test --run` verde (todos os 467+ tests)
- [ ] Decisão registrada: happy-dom@20 standalone OU vitest@3+ junto OU jsdom fallback
- [ ] CI verde
- [ ] Se jsdom: documentado em `docs/architecture.md` + ADR D12 atualizado com outcome

#### DoD
- [ ] Pre-flight feito + decisão documentada
- [ ] Upgrade aplicado conforme decisão
- [ ] Lockfile atualizado
- [ ] Tests verdes
- [ ] Commit `chore(deps): upgrade happy-dom to >=20 (fixes CVE-2025-61927, MF-3 pre-flight: <decisão>)`

---

### T3.2 — Sanitização de CSS injection em `injectThemeCss` (D6)

#### Objective
Impedir CSS injection via valores de theme não-validados.

#### Evidence
Security SEC-001. `colorScaleToCss` e `fontsToCss` em `src/themes/theme-provider.tsx:27-39` interpolam valores diretamente.

#### Files to edit
```
src/themes/theme-provider.tsx — adicionar guards
src/themes/theme-provider.test.tsx — adicionar tests para CSS injection rejection
```

#### Deep file dependency analysis
- `theme-provider.tsx`: novas helpers `isValidColorValue(v: string): boolean` e `isValidFontFamily(v: string): boolean`. Aplicar em loops de `colorScaleToCss` / `fontsToCss`. Em DEV, lançar erro com nome do token inválido; em PROD, fallback para valor seguro (e.g., `transparent` para cor, `inherit` para font).
- Testes: 3 cases — color value malicioso é rejeitado, font family maliciosa é rejeitada, theme name inválido é rejeitado.

#### Deep Dives
- **Regex finais**:
  - Color: `/^(#[0-9a-fA-F]{3,8}|oklch\([^)]+\)|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|var\(--[a-zA-Z0-9-]+\)|transparent|currentColor|inherit)$/`
  - Font family: `/^[\w\s,"'\-\.]+$/` (permite "Geist", `"Geist Mono"`, `system-ui, sans-serif`).
  - Theme name: `/^[a-z][a-z0-9-]*$/` (kebab-case).
- **Não escapar — rejeitar**. Theme é código, não user input. Erro em DEV permite catch durante desenvolvimento.
- **Behavior**: em PROD, log via `warnStorageFailure`-like helper (sem `console.error` ruidoso) e use fallback. Documentar em JSDoc.

#### Tasks
1. RED: 3 tests de injection rejection.
2. Implementar `isValidColorValue` + `isValidFontFamily` + `isValidThemeName`.
3. Aplicar guards.
4. Teste DEV throw + PROD fallback.
5. JSDoc.

#### TDD
```
RED:     test_color_value_with_close_brace_rejected() — registerTheme com color="red; } body { background: red"  → throw em dev
RED:     test_font_family_with_url_rejected() — fonts.display = 'url(evil.com)' → throw em dev
RED:     test_theme_name_with_quote_rejected() — theme.name = 'foo" }' → throw em dev
GREEN:   Implementar
REFACTOR: Extrair `validators.ts` se a lógica crescer
VERIFY:  pnpm vitest src/themes/theme-provider.test.tsx
```

#### Acceptance Criteria
- [ ] 3 tests passing
- [ ] Validators isolados (testáveis em unit)
- [ ] DEV throw com mensagem clara
- [ ] PROD fallback seguro
- [ ] JSDoc documenta restrição
- [ ] Themes built-in passam validation (smoke test)

#### DoD
- [ ] Implementação completa
- [ ] Tests verdes
- [ ] Commit `fix(security): sanitize theme CSS values to prevent injection`

---

### T3.3 — `safeHref()` guard contra `javascript:` URI

#### Objective
Prevenir XSS via `<a href="javascript:...">` em `ProjectCard` e `PreviewEnvCard`.

#### Evidence
Security SEC-003. Componentes aceitam URL e renderizam direto em `<a>`.

#### Files to edit
```
src/lib/safe-href.ts — (NEW)
src/lib/safe-href.test.ts — (NEW)
src/components/composites/preview-env-card/preview-env-card.tsx:114 — aplicar
src/components/composites/project-card/project-card.tsx:130 — aplicar
SECURITY.md — listar como hardening
```

#### Deep file dependency analysis
- `safe-href.ts`: função pura. Sem deps. Retorna `undefined` se href maliciosa.
- 2 composites: importam e aplicam em props `url`/`href`.
- Testes unit para safe-href + integration test em cada composite.

#### Deep Dives
- **Implementação**:
  ```ts
  const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];
  export function safeHref(url: string | undefined | null): string | undefined {
    if (!url) return undefined;
    const trimmed = url.trim().toLowerCase();
    for (const dangerous of DANGEROUS_PROTOCOLS) {
      if (trimmed.startsWith(dangerous)) return undefined;
    }
    return url;
  }
  ```
- **Por que `data:text/html`**: scripts inline em data URIs. Outros data URIs (image/png etc) são OK mas o atributo `href` raramente os quer; permitimos `mailto:` `tel:` `http(s):` `ftp:` etc.

#### Tasks
1. RED: tests para safe-href (`javascript:`, `JaVaScRiPt:`, ` javascript:` com espaço, `vbscript:`, `data:text/html`, valores válidos).
2. Implementar `safe-href.ts`.
3. Aplicar em `project-card.tsx:130` e `preview-env-card.tsx:114`.
4. RED: integration tests nos 2 cards verificando que href malicioso vira undefined.
5. Atualizar `SECURITY.md` adicionando o hardening.

#### TDD
```
RED:     safe_href_rejects_javascript_protocol()
RED:     safe_href_rejects_case_insensitive()
RED:     safe_href_rejects_leading_whitespace_javascript()
RED:     safe_href_rejects_vbscript()
RED:     safe_href_rejects_data_text_html()
RED:     safe_href_accepts_https()
RED:     safe_href_accepts_mailto()
RED:     project_card_strips_dangerous_href()
RED:     preview_env_card_strips_dangerous_href()
GREEN:   Implementar
REFACTOR: None
VERIFY:  pnpm vitest src/lib/safe-href src/components/composites/project-card src/components/composites/preview-env-card
```

#### Acceptance Criteria
- [ ] 7+ tests de safe-href passando
- [ ] 2 integration tests passando
- [ ] SECURITY.md atualizada
- [ ] Bundle size: +~200 bytes (aceitável)

#### DoD
- [ ] Implementação + tests + docs
- [ ] Commit `fix(security): block javascript: URI in card href props`

---

## Phase 4: Code quality MEDIUM — aria-live, injectedFontUrls, MetricsPanel, PermissionModal

**Objective:** Fechar 4 issues de código identificados pelo code-reviewer.

### T4.1 — `LiveRegionContext` para TODOS os live regions (MF-4)

#### Objective
Eliminar double-announcement em screen readers para a **classe** de bug, não apenas o caso `AgentStream/AgentStreaming`. Implementar `LiveRegionContext` aplicado em **todos os 7+ componentes** que declaram `aria-live` ou `role=log/status/alert`.

#### Evidence
Code Issue 1 original: `AgentStream` (role=log, polite) + `AgentStreaming` (role=status, polite) aninhado anuncia 2x.

**MF-4 (edge-case-plan)**: `grep -rn "aria-live\|role=\"log\"\|role=\"status\"" src/components/` revelou que o bug não é específico desses 2 componentes — é uma classe. Componentes com live region:

| Componente | Role/Live | Tipo | Pode aninhar? |
|---|---|---|---|
| `agent-stream` (composite) | role=log, polite | container | provê context |
| `agent-streaming` (primitive) | role=status, polite | child | lê context |
| `chat-thread` (primitive) | role=log, polite | container | provê context |
| `agent-error-card` (primitive) | aria-live=assertive | child | lê context |
| `agent-starting-state` (primitive) | aria-live=polite via `<output>` | child | lê context |
| `auto-compact-notice` (primitive) | aria-live=polite | child | lê context |
| `build-log-stream` (primitive) | aria-live={live} prop | container/child híbrido | ambos |
| `terminal-panel` (primitive) | aria-live={live} prop | container/child híbrido | ambos |
| `skeleton` (primitive) | role=status, polite | child (com container override doc) | lê context |

Cenário concreto sem MF-4: `<ChatThread>` renderiza `<ChatMessage>` que pode conter `<AgentStreaming>`. Bug igual ao original, nome diferente. Próxima auditoria reabre como "Code Issue 1.1".

#### Files to edit
```
src/lib/live-region-context.tsx — (NEW) context + helpers + tests
src/lib/live-region-context.test.tsx — (NEW) unit tests do hook
src/components/primitives/agent-streaming/agent-streaming.tsx — read context
src/components/primitives/chat-thread/chat-thread.tsx — provide context
src/components/primitives/agent-error-card/agent-error-card.tsx — read context
src/components/primitives/agent-starting-state/agent-starting-state.tsx — read context
src/components/primitives/auto-compact-notice/auto-compact-notice.tsx — read context
src/components/primitives/build-log-stream/build-log-stream.tsx — read OR provide depending on usage
src/components/primitives/terminal-panel/terminal-panel.tsx — read OR provide
src/components/primitives/skeleton/skeleton.tsx — read context (já tem container override doc)
src/components/composites/agent-stream/agent-stream.tsx — provide context
+ test files para cada (8 arquivos)
scripts/validate-quality-gates.ts — novo gate validateLiveRegionDiscipline
docs/architecture.md — §"Live region discipline" com ADR inline
```

#### Deep file dependency analysis
- `src/lib/live-region-context.tsx`: context novo, primitive (no `@theokit/ui` deps). Quality gate de taxonomia OK porque vai em `src/lib/`, não em `src/components/primitives/`.
- Componentes **container** (provê `value={true}`): `agent-stream`, `chat-thread`. Renderizam outros componentes com aria-live dentro.
- Componentes **child** (lê context, omite próprio aria-live se context==true): `agent-streaming`, `agent-error-card`, `agent-starting-state`, `auto-compact-notice`, `skeleton`. Hipóteses sobre `build-log-stream` e `terminal-panel`: provavelmente containers já (`<ol aria-live>` em volta de items), mas verify.
- **Híbrido**: `build-log-stream` e `terminal-panel` aceitam `live` prop, são container do próprio scroll mas podem ser child de outro live region. Solução: se context==true E `live` foi explicitamente passado, respeitar prop (override consumer). Se context==true E `live` foi default, omitir.
- `validate-quality-gates.ts`: novo gate `validateLiveRegionDiscipline` — regex sobre `src/components/**/*.tsx` por `aria-live=` em literal sem `useInLiveRegion()` import na mesma file → warn (ou error, decidir tolerance).

#### Deep Dives
- **API do context**:
  ```tsx
  // src/lib/live-region-context.tsx
  import { createContext, useContext } from "react";

  const LiveRegionContext = createContext<boolean>(false);

  /**
   * Provider — wrap a region that declares aria-live to suppress nested live regions.
   * Use in container components (AgentStream, ChatThread, etc.).
   */
  export const LiveRegionProvider = LiveRegionContext.Provider;

  /**
   * Hook — returns true if the calling component is inside a live region.
   * Components that declare aria-live should check this and omit their own
   * aria-live when nested, to prevent double announcement.
   */
  export function useInLiveRegion(): boolean {
    return useContext(LiveRegionContext);
  }
  ```
- **Pattern em child component**:
  ```tsx
  const inLiveRegion = useInLiveRegion();
  return (
    <div
      role={inLiveRegion ? undefined : "status"}
      aria-live={inLiveRegion ? undefined : "polite"}
    >
      ...
    </div>
  );
  ```
- **Pattern em container component**:
  ```tsx
  return (
    <LiveRegionProvider value={true}>
      <div role="log" aria-live="polite">{children}</div>
    </LiveRegionProvider>
  );
  ```
- **Híbrido (build-log-stream)**:
  ```tsx
  const inLiveRegion = useInLiveRegion();
  const liveValue = liveProp ?? (inLiveRegion ? "off" : "polite");
  // ...
  return (
    <LiveRegionProvider value={liveValue !== "off"}>
      <ol aria-live={liveValue}>...</ol>
    </LiveRegionProvider>
  );
  ```

#### Tasks
1. RED: 9 testes — 1 para `live-region-context` (hook), 1 standalone + 1 nested para cada um dos 7 componentes child + 1 para container double-nesting (chat-thread > agent-stream).
2. Implementar `src/lib/live-region-context.tsx`.
3. Refactor `agent-streaming.tsx` (read context).
4. Refactor `agent-stream.tsx` (provide context).
5. Refactor `chat-thread.tsx` (provide context).
6. Refactor `agent-error-card.tsx` (read context).
7. Refactor `agent-starting-state.tsx` (read context).
8. Refactor `auto-compact-notice.tsx` (read context).
9. Refactor `skeleton.tsx` (read context).
10. Refactor `build-log-stream.tsx` (híbrido).
11. Refactor `terminal-panel.tsx` (híbrido).
12. Implementar `validateLiveRegionDiscipline` gate.
13. Documentar em `docs/architecture.md` §"Live region discipline" (inline ADR).
14. `pnpm quality:gates` verde.
15. Sanity-check com vitest-axe sweep — confirmar zero regression.

#### TDD
```
RED:     test_use_in_live_region_default_false() — hook standalone retorna false
RED:     test_use_in_live_region_inside_provider_true() — wrapped em provider retorna true
RED:     test_agent_streaming_standalone_has_live_region() — sem provider, aria-live="polite"
RED:     test_agent_streaming_nested_in_agent_stream_no_double_announce() — dentro de AgentStream, aria-live omitido
RED:     test_chat_thread_provides_live_region_context() — children dentro veem context=true
RED:     test_agent_error_card_nested_omits_live() — dentro de live region, sem aria-live próprio
RED:     test_agent_starting_state_nested_omits_live() — idem
RED:     test_auto_compact_notice_nested_omits_live() — idem
RED:     test_skeleton_nested_omits_live() — idem
RED:     test_build_log_stream_hybrid_consumer_override() — prop live="polite" sempre vence
RED:     test_build_log_stream_hybrid_nested_defaults_off() — nested, prop default → live="off"
RED:     test_terminal_panel_hybrid() — mesma lógica
RED:     test_validate_live_region_discipline_catches_regression() — fixture com aria-live sem useInLiveRegion → gate falha
RED:     test_double_nesting_chat_thread_agent_stream() — 2 níveis de container, child mais interno omite live
GREEN:   Implementar context + 9 refactors + gate
REFACTOR: extrair helper `useLiveAttrs()` se padrão repetir (provavelmente vale)
VERIFY:  pnpm vitest src/lib/live-region-context && pnpm vitest src/components && pnpm quality:gates
```

#### Acceptance Criteria
- [ ] `src/lib/live-region-context.tsx` criado e testado
- [ ] 14+ tests passing (cobertura por componente)
- [ ] Vitest-axe sweep zero regression
- [ ] 7 componentes child refatorados; 2 containers provedores; 2 híbridos com comportamento documentado
- [ ] `validateLiveRegionDiscipline` gate ativo
- [ ] `docs/architecture.md` documenta o pattern
- [ ] Quality gate de taxonomia: `live-region-context.tsx` em `src/lib/`, OK
- [ ] **MF-4 regression proof**: gate dispara em fixture intencionalmente quebrada

#### DoD
- [ ] Implementação completa (10+ arquivos modificados)
- [ ] Tests verdes
- [ ] Gate ativo bloqueando regression
- [ ] Docs com ADR explicando pattern
- [ ] Commit `fix(a11y)!: LiveRegionContext for all live regions (MF-4)`

---

### T4.2 — `injectedFontUrls` scoped por instância (não module-level)

#### Objective
Permitir múltiplas instâncias `<ThemeProvider>` em micro-frontend sem que uma silenciosamente skipe font injection.

#### Evidence
Code Issue 2: `theme-provider.tsx:59` declara `const injectedFontUrls = new Set<string>()` no module level.

#### Files to edit
```
src/themes/theme-provider.tsx — mover Set para useRef dentro do componente
src/themes/theme-provider.test.tsx — adicionar teste de múltiplas instâncias
```

#### Deep file dependency analysis
- `theme-provider.tsx`: remover declaração module-level. Dentro de `ThemeProvider`, criar `const injectedFontUrlsRef = useRef(new Set<string>())`. Substituir todos os `injectedFontUrls.has`/`.add` por `injectedFontUrlsRef.current.has`/`.add`.
- Atenção: lógica de "já injetei essa font" agora é por instância. Múltiplas instâncias do mesmo theme injetam fontes duplicadas no `<head>`? Não — o que injecta é o CSS via `<style id="theo-ui-theme">` (substituído). Fonts são `@font-face` em CSS, idempotente.

#### Deep Dives
- **Investigar mais**: o Set existe para evitar inject duplicado? Ler o código exato para confirmar. Se Set rastreia algo que precisa ser globalmente único (e.g., `link rel="preload"`), mover para componente quebra. Se rastreia algo per-render, OK mover.
- Hipótese (baseada no nome): rastreia URLs de fonts já adicionadas como `<link rel="preload">`. Se sim, mover para useRef faz cada instância adicionar seus próprios links — duplica preloads se 2 providers. Solução melhor: usar `WeakSet` na window OU verificar `document.head.querySelector(\`link[href="${url}"]\`)`.
- **Decisão pendente**: ler o código antes de mover.

#### Tasks
1. Ler `theme-provider.tsx` linhas 59 + onde o Set é usado.
2. RED: test "duas instâncias com themes diferentes injetam fontes de ambos".
3. RED: test "uma instância re-renderizando não duplica fontes".
4. Decidir: scope per-instance OR check DOM.
5. Implementar.

#### TDD
```
RED:     test_multiple_providers_inject_distinct_fonts() — render 2 providers com diferentes themes, ambos têm fonts no <head>
RED:     test_re_render_does_not_duplicate_fonts() — re-render mesmo provider, count <link rel=preload> não cresce
GREEN:   Implementar
REFACTOR: Se DOM check é a solução, extrair helper `findOrInjectFontPreload`
VERIFY:  pnpm vitest src/themes/theme-provider.test.tsx
```

#### Acceptance Criteria
- [ ] 2 tests passing
- [ ] Múltiplas instâncias funcionam
- [ ] Re-render não duplica DOM

#### DoD
- [ ] Implementação
- [ ] Commit `fix(theme): scope font injection tracking to instance, not module`

---

### T4.3 — `MetricsPanel` tiles clicáveis: adicionar `aria-label`

#### Objective
Tornar `<button>` rendererizado por `Tile` em `MetricsPanel` acessível por screen reader.

#### Evidence
Code Issue 3: tile clicável tem accessible name composto pelos children (label + value + delta + sparkline icon). AT pronuncia tudo, sem "action verb".

#### Files to edit
```
src/components/primitives/metrics-panel/metrics-panel.tsx:86-118 — adicionar aria-label no <button>
src/components/primitives/metrics-panel/metrics-panel.test.tsx — assert aria-label
```

#### Deep file dependency analysis
- `metrics-panel.tsx`: adicionar `aria-label={`View ${metric.label} details`}` no branch button do Tile. Aceitar prop opcional `metric.actionLabel` para customização.

#### Deep Dives
- **Texto**: `aria-label="View {label} details"` é o padrão de tile clicável. Se consumer quer texto custom, usa `metric.actionLabel`.
- **Edge case**: se `onClick` ausente, tile renderiza `<div>` — sem aria-label.

#### Tasks
1. RED: test "button tile has aria-label".
2. RED: test "non-clickable tile is rendered as div (no aria-label)".
3. Implementar.

#### TDD
```
RED:     test_clickable_tile_has_aria_label() — render com onClick, expect button has aria-label containing label
RED:     test_non_clickable_tile_is_div() — render sem onClick, expect no <button>
RED:     test_custom_action_label_used_if_provided() — metric.actionLabel='Drill down', expect aria-label='Drill down'
GREEN:   Implementar
REFACTOR: None
VERIFY:  pnpm vitest src/components/primitives/metrics-panel
```

#### Acceptance Criteria
- [ ] 3 tests passing
- [ ] Axe não reporta button-name issue
- [ ] Default aria-label aplicado

#### DoD
- [ ] Implementação
- [ ] Commit `fix(a11y): aria-label on MetricsPanel clickable tiles`

---

### T4.4 — `PermissionModal`: tratar Esc consistente com Cancel

#### Objective
Resolver Esc-vs-Cancel asymmetry em `PermissionModal`.

#### Evidence
Code Issue 4: Esc dispara `onOpenChange(false)` (built-in Radix) mas NÃO `onDecide`. Esc parece "Cancel" para usuário mas no-op para app.

#### Files to edit
```
src/components/composites/permission-modal/permission-modal.tsx:47-130 — wrap onOpenChange para emitir onDecide("denied")
src/components/composites/permission-modal/permission-modal.test.tsx — test keyboard Esc
```

#### Deep file dependency analysis
- `permission-modal.tsx`: substituir `onOpenChange={onOpenChange}` por wrapper:
  ```tsx
  function handleOpenChange(open: boolean) {
    if (!open && /* dismissal didn't come from button */) {
      onDecide("denied");
    }
    onOpenChange?.(open);
  }
  ```
- **Problema**: Radix emite `onOpenChange(false)` para overlay click + Esc + close button. Não distingue. Precisamos rastrear flag `decidedRef`.
- Adicionar useRef `decidedRef.current = false`. Button click muda para `true` antes de chamar `onDecide`. `handleOpenChange` checa flag.

#### Deep Dives
- **Implementação**:
  ```tsx
  const decidedRef = useRef(false);
  function handleDecide(decision: PermissionDecision) {
    decidedRef.current = true;
    onDecide(decision);
  }
  function handleOpenChange(open: boolean) {
    if (!open && !decidedRef.current) {
      onDecide("denied");
    }
    decidedRef.current = false;
    onOpenChange?.(open);
  }
  ```
- 3 buttons (Cancel, Always, Allow once) chamam `handleDecide`. Esc/overlay click dispara `handleOpenChange` sem flag → `onDecide("denied")`.
- Atualizar JSDoc removendo "the modal does NOT auto-close" e substituindo por "the modal closes via onOpenChange; if dismissed without explicit decision (Esc, overlay click), `onDecide('denied')` is called automatically".

#### Tasks
1. RED: test "Esc dispara onDecide('denied')".
2. RED: test "Cancel button dispara onDecide('denied') e onOpenChange(false)".
3. RED: test "Allow button dispara onDecide('allowed_once') e NÃO denied".
4. Implementar com `decidedRef`.

#### TDD
```
RED:     test_esc_dispatches_onDecide_denied() — user.keyboard('{Escape}'), spy.onDecide chamado com 'denied'
RED:     test_overlay_click_dispatches_denied() — click outside, onDecide('denied')
RED:     test_explicit_cancel_does_not_double_fire() — click Cancel, onDecide('denied') chamado 1x, NÃO 2x
RED:     test_allow_button_does_not_dispatch_denied() — click Allow, onDecide('allowed_once') 1x, NÃO denied
GREEN:   Implementar
REFACTOR: extrair logic se ficar tortuosa
VERIFY:  pnpm vitest src/components/composites/permission-modal
```

#### Acceptance Criteria
- [ ] 4 tests passing
- [ ] JSDoc atualizado
- [ ] Sem double-fire

#### DoD
- [ ] Implementação
- [ ] Commit `fix(permission-modal): treat Esc as Cancel consistently`

---

## Phase 5: Test coverage gaps — ThemeProvider localStorage, Dialog/Sheet Esc, editors WCAG, AgentStream header

**Objective:** Fechar gaps de teste identificados pelo test-auditor.

### T5.1 — Cobertura de ThemeProvider localStorage path

#### Objective
Adicionar testes que exercitam o caminho `storageKey != null` (default produção).

#### Evidence
Tests Gap 1: todos os 9 tests usam `storageKey={null}`. Linhas 146-191 de `theme-provider.tsx` (read + write + try/catch) sem cobertura.

#### Files to edit
```
src/themes/theme-provider.test.tsx — adicionar 5 tests
```

#### Deep file dependency analysis
- Tests cobrindo: initial read on mount, write after setTheme, fallback se localStorage.getItem throws, fallback se localStorage.setItem throws, fallback se valor armazenado é inválido.

#### Deep Dives
- **Mock localStorage**: vitest oferece `vi.stubGlobal('localStorage', mockLS)`. Definir antes de `render`.
- **Cleanup**: `afterEach(() => vi.unstubAllGlobals())`.

#### Tasks
1. Escrever 5 tests RED.
2. Confirmar que falham (sem changes do componente).
3. **Importante**: aqui os tests cobrem código existente — não há GREEN do componente. Apenas TDD para validar comportamento atual + regression future.

#### TDD
```
RED → existing code:
  test_reads_initial_theme_from_localStorage() — mock getItem retorna 'classic-paper', expect dataset.theme === 'classic-paper'
  test_writes_theme_to_localStorage_on_setTheme() — setTheme('aurora-terminal'), expect mockLS.setItem chamado com correto key/value
  test_falls_back_to_default_when_getItem_throws() — getItem lança, expect dataset.theme === defaultTheme
  test_falls_back_when_setItem_throws() — setItem lança, expect setTheme silenciosa, dataset.theme aplicado mesmo assim
  test_ignores_invalid_stored_value() — getItem retorna 'invalid', expect fallback para defaultTheme
GREEN:   Tests passam contra código existente (validação de implementação atual)
REFACTOR: None
VERIFY:  pnpm vitest src/themes/theme-provider.test.tsx
```

#### Acceptance Criteria
- [ ] 5 tests novos passing
- [ ] Coverage de `theme-provider.tsx` lines 146-191 sobe para 100%
- [ ] `pnpm test:coverage` mostra melhora

#### DoD
- [ ] Tests adicionados
- [ ] Commit `test(theme): cover localStorage read/write/fallback paths`

---

### T5.2 — Dialog/Sheet close-on-Escape tests

#### Objective
Adicionar regression test para comportamento Radix built-in.

#### Evidence
Tests Gap 2: nem `dialog.test.tsx` nem `sheet.test.tsx` testam Esc.

#### Files to edit
```
src/components/primitives/dialog/dialog.test.tsx — adicionar 1 test
src/components/primitives/sheet/sheet.test.tsx — adicionar 1 test
```

#### Deep file dependency analysis
- Tests usam `user.keyboard('{Escape}')` após open.

#### Tasks
1. RED: 2 tests.
2. Confirmar GREEN (Radix já implementa).

#### TDD
```
RED → existing behavior:
  test_dialog_closes_on_escape() — abrir Dialog, user.keyboard('{Escape}'), expect queryByRole('dialog') === null
  test_sheet_closes_on_escape() — idem
GREEN:   Tests passam (Radix nativo)
REFACTOR: None
VERIFY:  pnpm vitest src/components/primitives/dialog src/components/primitives/sheet
```

#### Acceptance Criteria
- [ ] 2 tests passing
- [ ] Regression catch garantido

#### DoD
- [ ] Tests
- [ ] Commit `test(dialog,sheet): cover close-on-escape behavior`

---

### T5.3 — Fix WCAG violations em AgentEditor / SkillEditor / RuleEditor

#### Objective
Resolver `button-name` violation que está silenciada em STORY_SKIPS.

#### Evidence
Tests Gap 3: 3 editores tem Radix Select em estado unselected sem aria-label.

#### Files to edit
```
src/components/composites/agent-editor/agent-editor.tsx — adicionar aria-label aos Selects
src/components/composites/skill-editor/skill-editor.tsx — idem
src/components/composites/rule-editor/rule-editor.tsx — idem
src/test/ladle-axe.test.tsx — remover entries dos STORY_SKIPS
```

#### Deep file dependency analysis
- Cada Select.Trigger ganha `aria-label="Select {field}"` (tone, category, severity, etc.).
- Após fix, story sweep volta a rodar nos 3 editores.

#### Deep Dives
- Estratégia: ler cada `Select.Trigger` nos 3 arquivos e adicionar aria-label adequado.
- Atenção: se o Select já está envolto em `<label>` (FormField pattern), aria-label não é necessário — verificar.

#### Tasks
1. Inspecionar cada Select.Trigger nos 3 editores.
2. Adicionar aria-label onde faltar.
3. Remover entries de STORY_SKIPS.
4. `pnpm test src/test/ladle-axe.test.tsx`.

#### TDD
```
RED:     test_agent_editor_story_passes_axe() — render AgentEditor story, expect zero axe violations
RED:     test_skill_editor_story_passes_axe() — idem
RED:     test_rule_editor_story_passes_axe() — idem
GREEN:   Após fix
REFACTOR: extrair helper se há repetição
VERIFY:  pnpm quality:a11y
```

#### Acceptance Criteria
- [ ] STORY_SKIPS limpo para os 3 editores
- [ ] `pnpm quality:a11y` verde
- [ ] Zero violations nos 3 stories

#### DoD
- [ ] Fix aplicado
- [ ] Commit `fix(a11y): label Select triggers in Agent/Skill/Rule editors`

---

### T5.4 — Fix AgentStream `<header role="button">` + assertion

#### Objective
Resolver violação semântica em AgentStream story FullStream.

#### Evidence
Tests Gap 4: `<header role="button">` é semanticamente errado.

#### Files to edit
```
src/components/composites/agent-stream/agent-stream.tsx — trocar <header role="button"> por <div role="button">  (ou outra estrutura)
src/components/composites/agent-stream/agent-stream.test.tsx — adicionar regression test
src/test/ladle-axe.test.tsx — remover STORY_SKIPS entry para FullStream
```

#### Deep file dependency analysis
- `agent-stream.tsx`: localizar uso de `<header role="button">`. Refactor para `<button>` se possível (mais semântico) ou `<div role="button" tabIndex={0} onKeyDown={handleKey}>` (Radix pattern).

#### Tasks
1. Localizar uso.
2. Refactor.
3. Adicionar regression test.
4. Remover STORY_SKIPS entry.
5. `pnpm quality:a11y`.

#### TDD
```
RED:     test_agent_stream_no_header_role_button() — render AgentStream, expect document NOT contains <header role="button">
RED:     test_agent_stream_full_story_passes_axe() — render FullStream story, axe clean
GREEN:   Após refactor
REFACTOR: None
VERIFY:  pnpm quality:a11y
```

#### Acceptance Criteria
- [ ] Refactor feito
- [ ] Test passing
- [ ] STORY_SKIPS limpo para FullStream

#### DoD
- [ ] Commit `fix(a11y): remove header role=button in AgentStream`

---

## Phase 6: Dependencies cleanup — tailwindcss-animate, phantom popover, React 19, deps minor

**Objective:** Fechar 4 gaps de deps + supply chain.

### T6.1 — Mover `tailwindcss-animate` para `dependencies`

#### Files to edit
```
package.json — mover de devDependencies para dependencies
```

#### Tasks
1. `pnpm remove -D tailwindcss-animate`.
2. `pnpm add tailwindcss-animate`.
3. Verificar `pnpm pack` inclui em deps.

#### TDD
```
RED:     test_tailwindcss_animate_in_dependencies() — parse package.json, expect em deps
GREEN:   Após move
REFACTOR: None
VERIFY:  jq '.dependencies["tailwindcss-animate"]' package.json
```

#### Acceptance Criteria
- [ ] Em `dependencies`
- [ ] Lockfile atualizado

#### DoD
- [ ] Commit `chore(deps): move tailwindcss-animate to dependencies (consumed at runtime)`

---

### T6.2 — Remover phantom `@radix-ui/react-popover`

#### Files to edit
```
package.json — remover
```

#### Tasks
1. Confirmar zero imports: `grep -r "react-popover" src/ registry/`.
2. `pnpm remove @radix-ui/react-popover`.

#### TDD
```
RED:     test_no_phantom_popover() — grep retorna 0
GREEN:   Após remove
REFACTOR: None
VERIFY:  grep -r "react-popover" src/ registry/ ; echo $?  # esperado: 1
```

#### Acceptance Criteria
- [ ] Removida
- [ ] Lockfile atualizado
- [ ] CI verde

#### DoD
- [ ] Commit `chore(deps): remove unused @radix-ui/react-popover`

---

### T6.3 — Testar contra React 19 + atualizar peerDeps

#### Files to edit
```
package.json — peerDependencies.react: ">=18.2.0 || ^19.0.0"
package.json — adicionar peerDependenciesMeta se necessário
.github/workflows/ci.yml — matrix com react@18 e react@19
```

#### Tasks
1. Adicionar matrix job em CI rodando contra React 19.
2. Se falha: identificar incompatibilidades e fix.
3. Atualizar peerDeps range explícito.

#### TDD
```
RED:     test_react_19_compat() — CI matrix
GREEN:   Após fixes
VERIFY:  gh pr checks
```

#### Acceptance Criteria
- [ ] CI matrix React 18 + 19 verde
- [ ] peerDeps range explícito

#### DoD
- [ ] Commit `chore(react): test against React 19, broaden peerDeps`

---

### T6.4 — Upgrade vite/esbuild/postcss (LOW CVEs)

#### Files to edit
```
package.json — bump vite, esbuild, postcss
pnpm-lock.yaml — regenerar
```

#### Tasks
1. `pnpm update vite postcss`.
2. `pnpm test --run`.
3. `pnpm audit --dev` confirma redução.

#### Acceptance Criteria
- [ ] `pnpm audit --dev` HIGH/CRITICAL count menor que antes
- [ ] Tests verdes

#### DoD
- [ ] Commit `chore(deps): bump dev tooling to address known CVEs`

---

## Phase 7: Docs / CHANGELOG drift + LOW polish

**Objective:** Fechar achados LOW e polir documentação.

### T7.1 — Atualizar `README.md:243` (pipeline `quality:gates` real)

#### Files to edit
```
README.md
```

#### Tasks
1. Ler `package.json#scripts['quality:gates']`.
2. Espelhar lista no README.

#### Acceptance Criteria
- [ ] README e package.json concordam

#### DoD
- [ ] Commit `docs(readme): sync quality:gates pipeline list`

---

### T7.2 — Nota de correção CHANGELOG sobre `validateExportsMap`

#### Files to edit
```
CHANGELOG.md — entry em [Unreleased]
```

#### Tasks
1. Adicionar entrada explicando que Phase 3 falava "5-entry set" mas commit `77b2f7a` expandiu para 107+.

#### Acceptance Criteria
- [ ] CHANGELOG transparente sobre mudança

#### DoD
- [ ] Commit `docs(changelog): clarify exports map evolution`

---

### T7.3 — Mover 5 scripts orphan para `scripts/archive/`

#### Files to edit
```
scripts/generate-registry-stubs.ts → scripts/archive/
scripts/seed-a11y-tests.ts → scripts/archive/
scripts/add-tailwind-preset-dep.ts → scripts/archive/
scripts/expand-short-descriptions.ts → scripts/archive/
scripts/refine-registry-descriptions.ts → scripts/archive/
scripts/archive/README.md — (NEW) explica que arquivos rodam 1x
```

#### Tasks
1. `mkdir scripts/archive`.
2. Mover.
3. Adicionar README explicativo.

#### Acceptance Criteria
- [ ] Diretório `archive/` existe com 5 scripts + README
- [ ] `scripts/` raiz só tem operacionais

#### DoD
- [ ] Commit `chore(scripts): archive one-off migration scripts`

---

### T7.4 — Remover `@deprecated ScrollBar` (D — não houve external consumer)

#### Files to edit
```
src/components/primitives/scroll-area/scroll-area.tsx:119 — remover @deprecated JSDoc + export ScrollBar standalone
src/index.ts — remover export ScrollBar (manter ScrollArea.Bar)
CHANGELOG.md — registrar breaking change pre-1.0
```

#### Tasks
1. Remover export.
2. Atualizar CHANGELOG.
3. `pnpm typecheck`.

#### Acceptance Criteria
- [ ] `import { ScrollBar } from '@theokit/ui'` falha typecheck
- [ ] `ScrollArea.Bar` continua funcionando

#### DoD
- [ ] Commit `chore(api): remove deprecated standalone ScrollBar (pre-1.0)`

---

### T7.5 — Adicionar `registry/index.json` campo `dependencies` por item

#### Files to edit
```
scripts/build-registry.ts — emitir dependencies/registryDependencies em index.json
registry/index.json — (regenerado)
```

#### Tasks
1. Modificar build script.
2. Regen.

#### Acceptance Criteria
- [ ] index.json carrega deps info por item

#### DoD
- [ ] Commit `chore(registry): include deps in index.json catalog`

---

### T7.6 — `EnvVarEditor` clipboard catch com warn em dev

#### Files to edit
```
src/components/composites/env-var-editor/env-var-editor.tsx:147 — adicionar warnStorageFailure-style
```

#### Tasks
1. Importar helper de warn.
2. Adicionar no catch.

#### DoD
- [ ] Commit `fix(env-var-editor): warn on clipboard failure in dev`

---

## Phase 8: Re-audit + Dogfood QA (MANDATORY)

**Objective:** Validar que as 7 phases moveram a nota agregada para ≥ 4.0/5 e que `/dogfood full` retorna saúde ≥ 70.

### T8.1 — Re-executar os 6 agentes do team-audit

#### Tasks
1. Reunir os 6 agentes (architecture-analyst, completeness-auditor, code-reviewer, test-auditor, dependency-analyzer, security-auditor).
2. Cada um re-roda contra `feat/deep-review-remediation` pós-merge.
3. Comparar notas pré (3.0, 2.0, 3.5, 3.5, 4.0, 4.0) vs pós.

#### Acceptance Criteria
- [ ] Nota agregada ≥ 4.0/5
- [ ] Zero CRITICAL aberto
- [ ] Zero HIGH novo

#### DoD
- [ ] Relatório salvo em `.claude/knowledge-base/reviews/agent-team-audit-2026-XX-XX.md`

---

### T8.2 — `/dogfood full`

#### Tasks
1. Executar.
2. Health score ≥ 70.
3. Zero CRITICAL novo.

#### Acceptance Criteria
- [ ] Health ≥ 70
- [ ] Zero CRITICAL

#### DoD
- [ ] Dogfood pass
- [ ] PR draft → ready for review
- [ ] Merge para `main`

---

## Coverage Matrix

| # | Gap | Severity | Task(s) | Resolução |
|---|---|---|---|---|
| 1 | npm 404 (`@theokit/ui` nunca publicado) | CRITICAL | T1.1 | `npm publish --tag next` versão 0.1.0-next.0 |
| 2 | Registry URL `ui.usetheo.dev/r/*.json` dead | CRITICAL | T1.2 | Deploy static em CF/GH Pages + DNS |
| 3 | PITCH.md TheoKit dashboard false claim | HIGH | T1.3 | Remover claim |
| 4 | README quality:gates pipeline stale | HIGH | T1.3, T7.1 | Sincronizar com package.json |
| 5 | AgentStream FullStream a11y silently skipped | HIGH | T5.4 | Fix + remove from STORY_SKIPS |
| 6 | docs.usetheo.dev/ui + ui.usetheo.dev gallery dead | HIGH | T1.3 | Remover ou servir Ladle |
| 7 | Branch 16 commits órfã | HIGH | T0.2 | Abrir PR draft |
| 8 | happy-dom v16 CVE-2025-61927 RCE | HIGH | T3.1 | Upgrade para v20+ |
| 9 | Subpath exports decorativos | HIGH | T2.2 | Documentar como aliases |
| 10 | Registry `@/` alias undocumented | HIGH | T2.3 | Adicionar metadata + docs |
| 11 | Ausência de TheoUIProvider root | HIGH | T2.1 | Criar provider composto |
| 12 | Composites em // PRIMITIVES section | MEDIUM | T2.4 | Mover para seção correta |
| 13 | Composite-to-composite coupling | MEDIUM | (backlog v0.2.0) | Tracked para próximo plano |
| 14 | ThemeProvider hard-couple violetForge | MEDIUM | T2.5 | defaultThemes export |
| 15 | Nested aria-live em 7+ componentes (classe inteira, MF-4) | MEDIUM | T4.1 | LiveRegionContext universal + gate de regression |
| 16 | Module-level injectedFontUrls | MEDIUM | T4.2 | useRef scope per-instance |
| 17 | MetricsPanel tile sem aria-label | MEDIUM | T4.3 | aria-label default |
| 18 | PermissionModal Esc-vs-Cancel | MEDIUM | T4.4 | decidedRef + handleOpenChange |
| 19 | ThemeProvider localStorage sem teste | MEDIUM | T5.1 | 5 tests novos |
| 20 | Dialog/Sheet Esc sem teste | MEDIUM | T5.2 | 2 tests |
| 21 | 3 editores WCAG silenciados | MEDIUM | T5.3 | aria-label nos Selects |
| 22 | tailwindcss-animate misclass | MEDIUM | T6.1 | Move para deps |
| 23 | CSS injection em injectThemeCss | MEDIUM | T3.2 | Validators allowlist |
| 24 | javascript: URI sem guard | MEDIUM | T3.3 | safeHref() utility |
| 25 | CHANGELOG validateExportsMap stale | MEDIUM | T7.2 | Nota corretiva |
| 26 | 5 orphan scripts | MEDIUM | T7.3 | Mover para archive/ |
| 27 | @radix-ui/react-popover phantom | LOW | T6.2 | Remover |
| 28 | peerDeps sem React 19 | LOW | T6.3 | Atualizar range + matrix |
| 29 | registry/index.json sem deps | LOW | T7.5 | Emitir em build |
| 30 | foundations/ só stories | LOW | (backlog) | Tracked |
| 31 | DiffViewer key=idx | LOW | (backlog) | Tracked p/ v0.2.0 (precisa id field em DiffLine) |
| 32 | EnvVarEditor silent clipboard catch | LOW | T7.6 | warnStorageFailure |
| 33 | AgentEditor Select casts sem narrowing | LOW | (backlog) | Tracked |
| 34 | Polymorphic ref cast inseguro | LOW | (backlog ADR D10) | Documentado, refactor v0.2.0 |
| 35 | AgentStream header role=button unit test | LOW | T5.4 | Já coberto |
| 36 | className-Tailwind-token-coupled tests | LOW | (backlog) | Tracked |
| 37 | ref forwarding sem teste 20+ comps | LOW | (backlog) | Tracked p/ test sprint |
| 38 | 18 composites sem axe assertion próprio | LOW | (backlog) | Cobertura via ladle sweep aceita |
| 39 | ScrollBar @deprecated em v0.0.0 | LOW | T7.4 | Remover (pre-1.0 break) |
| 40 | esbuild/vite/postcss CVEs LOW | LOW | T6.4 | Upgrade |
| MF-1 | Phase 1 ordem incorreta (publish antes de fix de claims) | EDGE-CASE | T1.3 (FIRST) | Reordenação + gate explícito em T1.1 |
| MF-2 | Registry items perdem regen ao mudar source ThemeProvider | EDGE-CASE | T2.5 (sub-tasks) | `pnpm registry:build` + `validateApiCompatibility` gate |
| MF-3 | happy-dom v20 pode quebrar vitest 2.x | EDGE-CASE | ADR D12 + T3.1 pre-flight | Bump vitest se necessário; fallback jsdom |
| MF-4 | Live-region bug é classe (7+ componentes), não caso isolado | EDGE-CASE | T4.1 expandida | Context universal + gate de discipline |

**Coverage: 30/40 gaps cobertos + 4 MUST FIX do edge-case review (34 itens totais resolvidos). 10 itens LOW em backlog explicitamente.**

## Global Definition of Done

- [ ] Phase 0–7 completas
- [ ] All tests passing (`pnpm test --run`)
- [ ] Zero clippy/lint warnings (`pnpm lint:ci`)
- [ ] `pnpm typecheck` verde
- [ ] `pnpm quality:gates` verde
- [ ] Bundle size dentro de ±5% do baseline (T8 pode rebaseline se mudanças justificarem)
- [ ] Backward compat preservada exceto onde ADR explicitamente quebra (T2.5 → `themes` required; T7.4 → ScrollBar standalone removido)
- [ ] **Runtime-metric proof**: `npm view @theokit/ui version` retorna `0.1.0-next.0` E `curl -sf https://ui.usetheo.dev/r/button.json | jq .name` retorna `"button"`. NÃO basta "código compila e test passa" — pelo menos 1 deploy real e 1 install real foram observados (D1, D2).
- [ ] **Dogfood QA PASS** — `/dogfood full` health score ≥ 70, zero CRITICAL
- [ ] **Re-audit do agent-team com nota agregada ≥ 4.0/5** (T8.1)
- [ ] PR `feat/deep-review-remediation` → `main` mergeado

## Final Phase: Dogfood QA (MANDATORY)

> Esta phase roda APÓS as 8 phases anteriores. O plano não está done até dogfood passar.

**Objective:** Validar que as mudanças implementadas funcionam como um usuário real as experimentaria, não apenas como unit tests asseguram.

### Execution

Run `/dogfood full`. Always full. No shortcuts.

Como adicional desta plan: também executar **end-to-end manual smoke**:
1. Em `/tmp/dogfood-vite` (projeto Vite vazio): `pnpm add @theokit/ui@next` → resolve OK.
2. Importar `<TheoUIProvider>` e `<Button>` num App.tsx; `pnpm dev` → render correto.
3. Em `/tmp/dogfood-shadcn` (projeto Next.js com tsconfig `@/*` configurado): `npx shadcn@latest add https://ui.usetheo.dev/r/button.json` → arquivo criado em `src/components/ui/button.tsx` com `import { cn } from "@/lib/cn"` resolvendo.

### Acceptance Criteria

- [ ] Health score ≥ 70/100
- [ ] Zero CRITICAL issues introduzidas
- [ ] Zero HIGH issues em features modificadas
- [ ] Smoke E2E (Vite install + shadcn add) verde
- [ ] Pré-existentes documentados (não causados por este plano)

### If Dogfood Fails

1. Identificar quais issues são causadas por este plano vs pré-existentes.
2. Fix CRITICAL/HIGH causados pela plan antes de marcar como done.
3. Re-rodar `/dogfood full`.
4. Pré-existentes vão para backlog, não bloqueiam.
