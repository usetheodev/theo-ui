---
name: deep-reference
description: "Deep dive multi-fonte em implementações de referência (clones locais, deps instaladas, GitHub via WebFetch, docs públicas) para extrair técnicas, padrões, dependências, algoritmos, performance, segurança, observabilidade, edge cases e cookbook de snippets — TUDO necessário para escrever o módulo equivalente no projeto atual sem precisar voltar a pesquisar. Multi-linguagem (TS/JS/Rust/Go/Python/Ruby/Java/PHP/Elixir/Kotlin/Swift). Gera um guia de implementação completo em `.claude/knowledge-base/reference/{topic}.md`. Use ANTES de codar qualquer módulo não-trivial em QUALQUER projeto."
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, WebFetch, WebSearch, Agent
argument-hint: "<topic> [--sources path1,path2,...] [--refs name1,name2,...] [--urls url1,url2,...] [--out path] [--depth exhaustive|standard] [--lang ts|rs|go|py|...]"
---

# deep-reference: Multi-Source Deep Dive → Implementation Blueprint

**Não é benchmark, não é marketing, não é "disruptive bet".** Esta skill produz um documento que um humano (ou outro Claude) lê e consegue **implementar o módulo no projeto atual sem precisar voltar a pesquisar nada**. Funciona em qualquer projeto, qualquer linguagem, qualquer ecossistema.

A skill é a evolução generalista de `to-reference`. Diferenças-chave:

| Aspecto | `to-reference` | `deep-reference` |
|---|---|---|
| Projeto-alvo | TheoKit (`packages/theo/`) | Auto-detectado (qualquer) |
| Fonte de prior art | `referencias/` (hardcoded) | 4 fontes plugáveis (ver §3) |
| Linguagens | TS-first | Multi-linguagem nativo |
| Output sections | 11 | 16 (adiciona Performance, Security, Observability, Cookbook, Glossary) |
| Auto-detecção | Não | Sim (stack, package manager, layout) |
| Discovery de docs | Inline (CHANGELOG/RFC) | Inline + WebFetch (RFCs externas, blogs, ADRs públicos) |

Exemplo concreto do output esperado:

> Input: `/deep-reference rate limiting --refs envoy,nginx,traefik,axum`
> Output: `.claude/knowledge-base/reference/rate-limiting.md` — 12–20 páginas com: como Envoy implementa token bucket distribuído (file:line), como NGINX usa leaky bucket em memória, qual algoritmo Traefik herda do Go ecosystem (`golang.org/x/time/rate`), benchmarks publicados de cada um, CVEs históricos (bypass via header injection), métricas/logs que expõem, edge cases (clock skew, burst em reload, IPv4-vs-IPv6 keying), snippets reutilizáveis, ADR template pronto, e **plano de implementação para este projeto** (arquivos a criar, API pública, deps a adotar, fases de rollout, testes).

Quem ler esse documento depois deve conseguir abrir um editor e começar a digitar código.

---

## 1. Argumentos

| Argumento | Default | Descrição |
|---|---|---|
| `<topic>` (posicional) | obrigatório | Tópico em natural language. Ex: `rate limiting`, `request context`, `migrations`, `Server Components`, `crash-only design`. |
| `--sources <paths>` | `referencias/,vendor/refs/,~/refs/,~/Projetos/refs/` | Lista CSV de diretórios onde procurar clones de referência. **Primeiro existente vence.** |
| `--refs <names>` | todos os subdirs do `--sources` que matcham o keyword | Subset explícito de implementações a analisar (`--refs envoy,nginx,traefik`). |
| `--urls <urls>` | vazio | URLs GitHub / docs / RFCs / blog posts a buscar via WebFetch (`--urls https://github.com/foo/bar/blob/main/src/foo.rs,https://datatracker.ietf.org/doc/rfc9110/`). |
| `--deps` (flag) | off | Inclui `node_modules/`, `vendor/`, `~/.cargo/registry/`, `~/.gem/`, `__pycache__/` etc. como fonte. **Use quando o referencial JÁ é dep instalada.** |
| `--out <path>` | `.claude/knowledge-base/reference/{topic-kebab}.md` | Caminho do output. Override apenas quando o projeto tem layout não-convencional. |
| `--depth exhaustive\|standard` | `exhaustive` | `exhaustive` (≈2h, todos com keyword); `standard` (≈45–60 min, mínimo 3 refs). Quality bar é o mesmo. |
| `--lang <ext>` | auto-detect | Força linguagem-alvo da análise (`--lang rs` analisa só `.rs`). Default: detecta via arquivos do projeto atual. |

---

## 2. Pre-flight — auto-detecção do projeto atual

**Antes de tocar qualquer prior art**, descubra o terreno em que o documento vai aterrissar. Sem isso o Implementation Guide é vago.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$PROJECT_ROOT"

# 1. Linguagens primárias (top 5 por contagem de arquivos)
find . -type f \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" \
  ! -path "*/build/*" ! -path "*/target/*" ! -path "*/.venv/*" \
  ! -path "*/vendor/*" \
  | sed -n 's/.*\.\([a-zA-Z]*\)$/\1/p' \
  | sort | uniq -c | sort -rn | head -10

# 2. Package manager / build system
for f in package.json pnpm-workspace.yaml Cargo.toml go.mod pyproject.toml \
         requirements.txt Gemfile composer.json build.gradle pom.xml \
         mix.exs deno.json bun.lockb; do
  [ -f "$f" ] && echo "✓ $f"
done

# 3. Monorepo? Onde ficam os pacotes?
for d in packages apps services crates libs cmd internal src lib; do
  [ -d "$d" ] && echo "dir: $d ($(ls -1 "$d" 2>/dev/null | wc -l) entries)"
done

# 4. Test framework presente
grep -lE "vitest|jest|mocha|pytest|cargo test|rspec|phpunit|junit|ginkgo|deno test" \
  -r --include="*.json" --include="*.toml" --include="*.yml" --include="Gemfile" . 2>/dev/null | head -5

# 5. Já existe algo parcial sobre o tópico?
KEYWORD="<topic principal>"
grep -rln "$KEYWORD" --include="*.{ts,tsx,js,mjs,rs,go,py,rb,java,kt,swift,php,ex,exs}" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=target . 2>/dev/null | head -20

# 6. Docs vizinhas que já tocaram esse universo
ls .claude/knowledge-base/reference/ 2>/dev/null
find docs/ -type f -iname "*.md" 2>/dev/null | xargs grep -l "$KEYWORD" 2>/dev/null
```

Salve em buffer mental:

- **Linguagem primária** + **secundárias** (norteia que arquivos ler)
- **Package manager** (norteia que deps catalogar)
- **Layout** (monorepo? single crate? src/lib? cmd/internal?)
- **Test framework** (norteia o §13 Test strategy)
- **Prior state** (módulo existe parcialmente? só interface? nada?)
- **Docs vizinhas** (evita escrever doc isolado quando há contexto)

Esses 6 itens viram o cabeçalho do output.

---

## 3. Discovery dinâmica de fontes (4 tipos)

**Regra:** uma fonte só entra na análise se for verificada. Não invente prior art.

### 3.1 Fonte A — Clones locais (default)

Procure nos paths do `--sources` (ou defaults). **Primeiro diretório que existir vence** e vira o `SOURCES_ROOT`.

```bash
DEFAULT_SOURCES="referencias vendor/refs $HOME/refs $HOME/Projetos/refs"
SOURCES_ROOT=""
for d in $DEFAULT_SOURCES; do
  if [ -d "$d" ] && [ -n "$(ls -A "$d" 2>/dev/null)" ]; then
    SOURCES_ROOT="$d"
    break
  fi
done

if [ -z "$SOURCES_ROOT" ]; then
  echo "⚠️  Nenhuma fonte local encontrada — passe --urls ou clone refs (ver §11)"
fi
```

Lista os clones disponíveis:

```bash
ls -d "$SOURCES_ROOT"/*/ 2>/dev/null | sed "s|$SOURCES_ROOT/||;s|/$||"
```

Para cada clone, descubra linguagem + tamanho:

```bash
for ref in "$SOURCES_ROOT"/*/; do
  name=$(basename "$ref")
  loc_ts=$(find "$ref" -name "*.ts" ! -path "*/node_modules/*" 2>/dev/null | wc -l)
  loc_rs=$(find "$ref" -name "*.rs" ! -path "*/target/*" 2>/dev/null | wc -l)
  loc_go=$(find "$ref" -name "*.go" 2>/dev/null | wc -l)
  loc_py=$(find "$ref" -name "*.py" ! -path "*/.venv/*" 2>/dev/null | wc -l)
  loc_rb=$(find "$ref" -name "*.rb" 2>/dev/null | wc -l)
  loc_java=$(find "$ref" -name "*.java" 2>/dev/null | wc -l)
  echo "$name | ts:$loc_ts rs:$loc_rs go:$loc_go py:$loc_py rb:$loc_rb java:$loc_java"
done
```

### 3.2 Fonte B — Deps já instaladas (`--deps`)

Quando o referencial JÁ é dependência direta do projeto. Lê código real, não release notes.

```bash
# Node
find node_modules -maxdepth 2 -name "package.json" 2>/dev/null | head
# Rust (cargo cache)
ls ~/.cargo/registry/src/*/  2>/dev/null
# Python (.venv ou site-packages)
find .venv/lib -maxdepth 3 -name "*.py" 2>/dev/null | head
find /usr/lib/python*/site-packages -maxdepth 2 -type d 2>/dev/null | head
# Ruby
bundle info <gem> 2>/dev/null
# Go (module cache)
ls "$(go env GOMODCACHE)" 2>/dev/null | head
```

Trate cada dep como um "framework" do inventário, com a versão exata do lockfile.

### 3.3 Fonte C — GitHub / GitLab via WebFetch (`--urls`)

Quando o clone seria desperdício (arquivo pontual, RFC específica) ou quando o repo é gigante.

Para `--urls` que apontam a um arquivo:

```bash
# WebFetch direto no raw URL
# https://github.com/foo/bar/blob/main/src/x.rs → https://raw.githubusercontent.com/foo/bar/main/src/x.rs
```

Para `--urls` que apontam a um diretório de repo: use `WebSearch` para listar arquivos, ou liste via API (`https://api.github.com/repos/foo/bar/contents/path`) e itere.

**Cada URL fetched vira uma linha do inventário com tag `remote`.** A âncora `file:line` no documento aponta para o URL completo + range de linhas (`...src/x.rs#L42-L58`).

### 3.4 Fonte D — Documentação pública / RFCs / blogs (`--urls`)

Mesma mecânica que 3.3, mas a tag no inventário é `external-doc`. Fontes típicas:

- **RFCs**: `datatracker.ietf.org`, `tools.ietf.org`
- **W3C / WHATWG**: `w3.org/TR/...`, `whatwg.org`
- **ADRs públicas**: `github.com/{org}/architecture-decisions/`
- **Design docs**: `docs.google.com` (se público), Notion público, Confluence público
- **Posts oficiais do time**: blog da empresa mantenedora (`engineering.fb.com`, `netflixtechblog.com`, `aws.amazon.com/blogs`)
- **Talks com transcrição**: `infoq.com`, `youtube.com` (transcription)

Evite Stack Overflow / Medium random — viés de qualidade alto. Aceito apenas quando o autor é mantenedor verificável do projeto referencial.

---

## 4. Processo

### Passo 1 — Mapear o problema

Antes de tocar qualquer fonte:

1. **Qual o problema concreto** este projeto quer resolver com este módulo?
2. **Qual o pacote/diretório-alvo?** (descoberto no §2; ex: `packages/api/src/middleware/`, `internal/ratelimit/`, `src/ratelimit/`, `lib/rate_limit/`)
3. **Já existe algo parcial?** Output do grep do §2 item 5.
4. **Quais docs vizinhas já existem?** (output do §2 item 6)
5. **Qual a restrição de licença do projeto?** (Apache-2.0? MIT? Commercial?) — proíbe certos patterns convergentes (e.g. herdar de GPL).

Salve esses 5 itens — viram a §1 do output.

### Passo 2 — Inventário COMPLETO de arquivos relevantes (mandatório)

**Regra inviolável:** o output cita TODOS os arquivos que tocam o tópico — não uma amostra, não os "principais". Se um arquivo aparece num grep do keyword e não é descartado por motivo explícito (test fixture trivial, generated code), ele entra no inventário.

Para cada fonte (A, B, C, D), gere o inventário com 4 passadas complementares:

```bash
KEYWORD="<termo principal>"             # ex: rate-limit, ratelimit, throttle
ALT_KEYWORDS="<sinônimos pipe-separated>"  # ex: "throttle|leaky.bucket|token.bucket|quota"

inventory_for_clone() {
  local fw="$1"
  local name=$(basename "$fw")
  echo "=== $name ==="

  # Passada 1 — Nome do arquivo contém o keyword
  find "$fw" -type f \
    \( -iname "*${KEYWORD}*" -o -iregex ".*\(${ALT_KEYWORDS}\).*" \) \
    ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" \
    ! -path "*/target/*" ! -path "*/.venv/*" ! -path "*/.git/*" \
    ! -path "*/vendor/*" 2>/dev/null

  # Passada 2 — Conteúdo menciona o keyword (multi-linguagem)
  grep -rln -iE "(${KEYWORD}|${ALT_KEYWORDS})" "$fw" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" --include="*.jsx" \
    --include="*.rs" --include="*.go" --include="*.py" --include="*.rb" \
    --include="*.java" --include="*.kt" --include="*.scala" --include="*.swift" \
    --include="*.php" --include="*.cs" --include="*.cpp" --include="*.c" --include="*.h" \
    --include="*.ex" --include="*.exs" --include="*.erl" --include="*.clj" \
    --include="*.md" --include="*.mdx" --include="*.txt" --include="*.rst" \
    --include="*.json" --include="*.toml" --include="*.yml" --include="*.yaml" \
    --include="*.lock" --include="Cargo.lock" --include="*.gemspec" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=target --exclude-dir=.venv --exclude-dir=.git \
    --exclude-dir=vendor 2>/dev/null

  # Passada 3 — Docs / RFCs / design docs no tree
  find "$fw" -type f \
    \( -iname "RFC*" -o -iname "DESIGN*" -o -iname "ARCHITECTURE*" \
       -o -iname "INTERNALS*" -o -iname "CONTRIBUTING*" -o -iname "CHANGELOG*" \
       -o -iname "ADR*" -o -iname "HACKING*" -o -iname "DEVELOPMENT*" \
       -o -iname "SECURITY*" -o -iname "THREAT*" \) \
    ! -path "*/node_modules/*" 2>/dev/null \
    | xargs grep -l -iE "(${KEYWORD}|${ALT_KEYWORDS})" 2>/dev/null

  # Passada 4 — Configs / specs / openapi / proto
  find "$fw" -type f \
    \( -iname "*.proto" -o -iname "openapi*.yaml" -o -iname "swagger*.json" \
       -o -iname "*.schema.json" -o -iname "*.graphql" \) \
    ! -path "*/node_modules/*" 2>/dev/null \
    | xargs grep -l -iE "(${KEYWORD}|${ALT_KEYWORDS})" 2>/dev/null
}

for fw in "$SOURCES_ROOT"/*/; do
  inventory_for_clone "$fw"
done
```

Junte os 4 conjuntos, deduplica, **ordene por caminho**. Esse é o inventário final.

Para fontes B (deps), C (remote URL), D (external doc): cada arquivo/URL é uma linha do inventário com tag apropriada (`installed-dep`, `remote`, `external-doc`).

#### Triagem do inventário

Para cada arquivo, classifique em uma das 6 categorias:

| Tag | Significado | Tratamento |
|---|---|---|
| `core` | implementação principal do módulo | Read inteiro, anota no output |
| `support` | helper / type / util usado pelo core | Read inteiro, anota |
| `test` | spec / fixture / golden / bench | Read **seletivo** — extrai expectativas + casos + perf data |
| `doc` | RFC / CHANGELOG / README / ADR / SECURITY | Read inteiro — vira fonte de edge cases, perf e security |
| `config` | proto / openapi / schema / yaml de feature | Read seletivo — extrai contrato observável |
| `installed-dep` ou `remote` ou `external-doc` | fontes B/C/D | Read no escopo do trecho relevante (não dump inteiro do repo) |

Arquivos `core` + `support` + `doc` + `config` vão para deep read (Passo 3). Arquivos `test` viram fonte de edge case + perf enumeration (Passos 6, 8).

**Nenhum arquivo é descartado sem justificativa explícita escrita no output.** Se você considera um arquivo irrelevante, ele entra na seção "Arquivos avaliados e descartados" com 1 frase explicando por quê. Isso evita o cherry-picking que distorce análise.

### Passo 3 — Deep read (NÃO grep apenas)

Para **todos** os arquivos do inventário classificados como `core`, `support`, `doc` ou `config`, **leia o arquivo inteiro** (Read tool, sem offset). Arquivos `test` recebem read seletivo focado em `describe`/`it`/`test_`/`#[test]`/`Describe(`/`def test_` headers + assertion shape + benchmark blocks.

Para cada arquivo lido, anote:

1. **API pública** — exports nomeados, tipos, defaults, visibilidade (`pub`, `export`, `public`)
2. **Algoritmo interno** — passo a passo do que o módulo FAZ, em prosa
3. **Estado/data structures** — Maps, Sets, classes, atomics, lock-free queues, etc.
4. **Concorrência model** — async runtime? threads? goroutines? actor? worker pool?
5. **Dependências externas** — imports de não-stdlib (`react`, `tokio`, `gevent`, `acorn`, etc.)
6. **Side effects** — escreve filesystem? mexe em globals? injeta `<script>`? abre sockets?
7. **TODOs/FIXMEs/HACKs/XXX** — copie literalmente, com file:line
8. **Padrão de design** — Factory? Plugin? Middleware? Observer? Visitor? Actor? Saga?
9. **Error handling style** — Result vs exception? Panic policy? Retry strategy?
10. **Performance hot path** — fast path identificado? branch prediction hint? SIMD? zero-copy?
11. **Security boundary** — onde valida input? como sanitiza? que assume confiável?
12. **Observability hooks** — quais métricas expõe? que logs estruturados? trace spans?

Resultado: notas estruturadas por framework. Não passe para o Passo 4 sem ter feito leitura completa de pelo menos 3 frameworks com 3 arquivos cada (mínimo 9 reads completos).

### Passo 4 — Catalogar dependências externas

Quais libs cada framework usa para resolver o problema?

```bash
# Node / TS
grep -rn "^import.*from ['\"][^./]" "$fw" --include="*.ts" --include="*.js" 2>/dev/null \
  | grep -iE "(${KEYWORD}|${ALT_KEYWORDS})" \
  | awk -F"['\"]" '{print $2}' | sort -u

# Rust
grep -rn "^use " "$fw" --include="*.rs" 2>/dev/null \
  | grep -iE "(${KEYWORD}|${ALT_KEYWORDS})" \
  | awk '{print $2}' | cut -d: -f1 | sort -u
cat "$fw"/Cargo.toml 2>/dev/null | grep -iE "(${KEYWORD}|${ALT_KEYWORDS})"

# Go
grep -rn "^import" "$fw" --include="*.go" -A 20 2>/dev/null \
  | grep -E "\".+/.+\"" | awk -F'"' '{print $2}' | sort -u

# Python
grep -rn "^from\|^import" "$fw" --include="*.py" 2>/dev/null \
  | awk '{print $2}' | sort -u
```

Para cada lib:

- **Nome** + versão pinada (no `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `Gemfile.lock`)
- **Função no contexto** (não a descrição genérica — o uso específico aqui)
- **Licença** (importa para projeto comercial)
- **Possível adoção no projeto atual** (sim / não / avaliar)
- **Trans-dep?** (sim/não — `yarn why` / `cargo tree` / `go mod why`)

Libs que aparecem em **2+ frameworks** são tipicamente ovos de ouro. Marque-as como **convergent dependency**.

### Passo 5 — Extrair padrões

Padrões convergentes (todos fazem assim) e divergentes (cada um faz diferente). Para cada padrão:

- **Nome do padrão** (use vocabulário consagrado — "Per-request context via TLS", "Sliding-window log", "Reactor pattern")
- **Quem usa** (com file:line, multi-framework)
- **Por que funciona** (mecânica concreta, não folclore)
- **Trade-off conhecido**
- **Como o projeto atual pode adaptá-lo**

### Passo 6 — Catalogar edge cases

Como cada framework descobriu os edge cases?

```bash
# Commits que mencionam fix/bug no tópico
cd "$fw"
git log --oneline --grep="${KEYWORD}\|${ALT_KEYWORDS}" --all-match --grep="fix\|hotfix\|bug\|cve\|sec" 2>/dev/null | head -50

# CHANGELOG entries
find "$fw" -maxdepth 2 -iname "CHANGELOG*" 2>/dev/null | xargs grep -iE "(${KEYWORD}|${ALT_KEYWORDS})" | head -40

# Issues / RFCs explícitos no tree
find "$fw" -maxdepth 4 -iname "RFC*" -o -iname "DESIGN*" -o -iname "ADR*" 2>/dev/null
```

Cada edge case vira uma linha na tabela do §9 — com a fonte (commit hash, changelog version, RFC URL).

### Passo 7 — Performance & complexity

Para cada framework, extraia:

- **Benchmarks publicados** — pasta `bench/`, `benches/`, `__benchmarks__/`, `perf/`, README "Performance" section
- **Resultados em CHANGELOG** — "10x faster", "reduced p99 to 5ms", "removed allocation in hot path"
- **Branch prediction / inlining / SIMD** — `#[inline]`, `__attribute__((hot))`, `if likely()`, intrinsics
- **Complexity declarada** — comentários `// O(n log n)`, RFCs com Big-O analysis
- **Memory profile** — alocações por op, peak RSS, GC pressure

```bash
# Localiza benchmarks
find "$fw" -type d \( -name "bench" -o -name "benches" -o -name "__benchmarks__" -o -name "perf" \) 2>/dev/null
find "$fw" -type f -iname "*bench*" -o -iname "*perf*" 2>/dev/null | head -30

# CHANGELOG performance entries
find "$fw" -maxdepth 2 -iname "CHANGELOG*" 2>/dev/null | xargs grep -iE "(perf|performance|faster|speedup|allocation|gc)" | head -30
```

### Passo 8 — Security & threat model

Para cada framework:

- **CVEs históricos** — busca no NVD / GitHub Security Advisories (via WebFetch se URL fornecida)
- **SECURITY.md** — política do projeto
- **Validação de input** — onde está a fronteira? que assume sanitizado?
- **Defaults seguros** — fails-open? fails-closed? rate limits explícitos?
- **Attack surface conhecida** — header injection? log injection? timing attack? clock skew?

```bash
find "$fw" -maxdepth 2 -iname "SECURITY*" -o -iname "THREAT*" 2>/dev/null
cd "$fw"
git log --oneline --grep="CVE-\|security\|sec:" --all 2>/dev/null | head -30
```

URL útil (passar via `--urls` quando aplicável):
- `https://github.com/{org}/{repo}/security/advisories`
- `https://nvd.nist.gov/vuln/search/results?query={pkg-name}`

### Passo 9 — Observability

Para cada framework, identifique:

- **Logging style** — structured (`tracing`, `slog`, `zerolog`, `pino`) vs printf? que campos? que níveis?
- **Métricas expostas** — Prometheus? StatsD? OpenTelemetry? que counters/histograms?
- **Trace spans** — OTel? Honeycomb beelines? que atributos?
- **Erros estruturados** — error types com codes? error wrapping?
- **Audit log** — eventos que precisam ser auditados (security-sensitive)?

```bash
grep -rn -iE "tracing::|slog\.|zerolog|pino\(|logger\.\b" "$fw" 2>/dev/null | head -20
grep -rn -iE "prometheus|opentelemetry|metric|histogram|counter" "$fw" 2>/dev/null | head -20
```

### Passo 10 — Cookbook (snippets reutilizáveis)

Esta é a seção que **economiza horas na implementação**. Para cada padrão importante, extraia o snippet mínimo viável que mostra como fazer aquilo. Snippets vão direto pro doc — devem compilar (ou ser claramente marcados como pseudo-código).

Formato:

````md
**Snippet: token bucket atomic refill**

Inspirado em `golang.org/x/time/rate` (rate.go:120-160).

```go
type Bucket struct {
    tokens     atomic.Int64
    lastRefill atomic.Int64 // unix nanos
    rate       int64        // tokens/sec
    capacity   int64
}

func (b *Bucket) Allow() bool {
    now := time.Now().UnixNano()
    last := b.lastRefill.Swap(now)
    elapsed := now - last
    refill := (elapsed * b.rate) / int64(time.Second)
    // ...
}
```

**Adaptado para o projeto atual (TypeScript):**

```ts
class Bucket {
  // similar atomic-ish via single-threaded event loop assumption
  // ...
}
```
````

### Passo 11 — ADR template + glossary

Antes do Implementation Guide, gere material reutilizável:

- **ADR template** preenchido com as decisões-chave do tópico (status: PROPOSED)
- **Glossário** — todo termo do domínio que apareceu (token bucket, leaky bucket, GCRA, sliding window) com definição em 1–2 linhas

### Passo 12 — Implementation Guide

A seção mais importante do output. Estrutura obrigatória (8 sub-secções):

1. **Arquitetura proposta** — diagrama ASCII (boxes + arrows)
2. **Files to create** — caminho exato dentro do diretório-alvo descoberto no §2
3. **Public API surface** — assinatura na linguagem do projeto
4. **Dependências a adotar** — packages com versão alvo + licença + justificativa
5. **Test strategy** — quais arquivos de teste, quais cenários BDD/property/fuzz
6. **Phases of rollout** — 2–5 fases incrementais
7. **Acceptance criteria** — checklist verificável
8. **Risks + mitigations**

Cada item DEVE ser concretamente acionável — alguém abre o editor e começa.

---

## 5. Estrutura do output — `.claude/knowledge-base/reference/{slug}.md`

`{slug}` é a versão kebab-case do tópico (ex: `Rate Limiting` → `rate-limiting.md`). Um arquivo por tópico. Reexecutar a skill no mesmo tópico **sobrescreve com aviso** — força commit antes:

```bash
SLUG="<topic-kebab>"
OUT="${OUT_OVERRIDE:-.claude/knowledge-base/reference/$SLUG.md}"
mkdir -p "$(dirname "$OUT")"
test -f "$OUT" && echo "WARN: $OUT existente. Commit suas mudanças antes." \
              || echo "OK: novo documento."
```

### Esqueleto canônico (16 seções)

```markdown
# Reference: {Topic}

**Date:** YYYY-MM-DD
**Depth:** exhaustive (default) | standard
**Project:** {nome do projeto, descoberto via package.json/Cargo.toml/etc.}
**Project language:** {primária + secundárias do §2}
**Project layout:** {monorepo/single/etc. do §2}
**Sources analyzed:** {clones locais + deps + URLs + docs externos}
**Frameworks analyzed:** {lista com versões / commit hash}
**Target directory:** {path descoberto no §2}
**Related references:** {outros docs em .claude/knowledge-base/reference/ que tocam o assunto}

---

## 1. Problem statement

- **What:** {1 parágrafo — o que precisamos implementar e por quê}
- **Current state:** {o que já existe, parcialmente ou não — output do §2 item 5}
- **Why now:** {gatilho — issue, plano, gap competitivo, requisito de compliance}
- **License constraint:** {Apache-2.0? MIT? Commercial? — bloqueia GPL transitive deps?}
- **Non-goals:** {o que esta análise NÃO cobre, para evitar scope creep}

## 2. Inventário completo de arquivos (mandatório)

Lista exaustiva — todo arquivo capturado nas 4 passadas, multiplicado por todas as fontes (A/B/C/D). Ordenado por framework e por caminho. **Sem cherry-picking.**

### {Framework 1} — inventário ({tag: local-clone | installed-dep | remote | external-doc})

| File / URL | Category | LOC / lines | Read in full? | Anchored in |
|---|---|---|---|---|
| `path/to/core.ts` | core | 412 | ✓ | §4.1, §6, §8 |
| `path/to/helper.ts` | support | 98 | ✓ | §4.2 |
| `test/scenario.test.ts` | test | 245 | seletivo | §9 |
| `docs/architecture/X.md` | doc | 320 | ✓ | §5 |
| `proto/api.proto` | config | 80 | ✓ | §4.1 |
| ... | ... | ... | ... | ... |

(uma tabela como esta para CADA framework + URLs externas)

### Arquivos avaliados e descartados (com motivo)

| File | Why discarded |
|---|---|
| `test/__fixtures__/01-trivial.js` | Fixture trivial sem invariante — coberto pelo arquivo 02 |
| `.bin/build-types` | Generated code (saída de codegen) |
| ... | ... |

Nenhum arquivo "some omitted for brevity". Se foi removido da consideração, está nesta tabela.

## 3. Glossary — vocabulário do domínio

| Termo | Definição | Onde apareceu |
|---|---|---|
| Token bucket | Algoritmo de rate limiting que enche um "balde" com N tokens/segundo... | Envoy, NGINX |
| GCRA (Generic Cell Rate Algorithm) | Variante do leaky bucket equivalente algebricamente... | Redis-cell, Cloudflare |
| ... | ... | ... |

## 4. Prior art — deep dive por framework

### 4.1 {Framework 1} — version {x.y.z} / commit {hash}

#### API pública
```{lang}
// {file:line}
export function foo(...): Bar { … }
export type Baz = …
```

#### Algoritmo interno (prosa, passo a passo)
1. {Passo 1, com file:line ancorado}
2. {Passo 2}
3. …

#### Estado mantido
- `{nome do Map/Set/Class/Atomic}` em `{file:line}` — guarda {o quê} pelo motivo de {qual}

#### Concorrência model
- Runtime: {tokio | async-std | std::thread | goroutine pool | event loop | thread-per-request}
- Sincronização: {Mutex | RwLock | atomics | channel | actor}
- Justificativa: {1–2 linhas}

#### Dependências externas usadas
| Lib | Versão | Licença | Para quê (uso específico) | Trans-dep? | Adotar aqui? |
|---|---|---|---|---|---|
| `acorn` | ^8.x | MIT | Parse JS para detectar `'use client'` | Sim (via vite) | Sim / Não / Avaliar |

#### Side effects observáveis
- Escreve em `~/.cache/{framework}/...`
- Adiciona listener em `process.on('exit')`
- Abre socket UDP para metrics export
- ...

#### TODOs / FIXMEs / HACKs literais
> `// FIXME: this loses precision when …` — `{file:line}`

#### Padrão de design
- Pattern: **Per-segment Factory + Plugin chain**
- Por que: {explicação em 1–2 frases}

#### Error handling style
- {Result<T,E> com erro enum dedicado | Panic + recover boundary | Exception com try/catch | Sentinel value}
- Retry: {sim/não, política}

#### Performance hot path
- Fast path: {descrição + file:line}
- Otimizações: {SIMD? inline hints? zero-copy?}
- Big-O declarado: {se há comentário/RFC}

#### Security boundary
- Trust boundary: {onde valida input}
- Sanitização: {como}
- Defaults: {fail-open | fail-closed}

#### Observability hooks
- Logs: {structured? formato? campos-chave}
- Métricas: {Prometheus? counters? histograms?}
- Traces: {OTel? attributes?}

(Repetir essa subsection para CADA framework — Next.js / Remix / Envoy / NGINX / Tokio / Go-stdlib / etc.)

## 5. Convergent patterns (todos concordam)

1. **{Pattern X}** — adotado por: {fw1} ({file:line}), {fw2} ({file:line}), {fw3} ({file:line}). Funciona porque {razão concreta + invariante preservada}. **Este projeto deve adotar.** Adaptação: {como aplicar dado o stack/linguagem do §2}.

## 6. Divergent patterns (trade-off real)

1. **{Decision Y}**
   - {fw1}: faz `A` (file:line) — trade-off: {custos}
   - {fw2}: faz `B` (file:line) — trade-off: {custos}
   - **Project choice:** `C porque {razão alinhada ao §1 constraints}`

## 7. Dependency inventory — bibliotecas comuns

Convergent libs (aparecem em 2+ frameworks):

| Lib | Frameworks que usam | Função | Licença | Project decision |
|---|---|---|---|---|
| `acorn` | Next.js, Vite | AST parsing | MIT | **Adotar** (já trans-dep via vite) |
| `magic-string` | Vite, Astro | Source-map-safe string edits | MIT | **Adotar** se precisarmos editar source |
| ... | ... | ... | ... | ... |

## 8. Algorithms / data structures não-óbvios

- **{Algorithm name}** ({framework} {file:line}) — {descrição em 1 parágrafo + complexidade + invariante mantida}
- **{Data structure name}** ({framework} {file:line}) — {por que essa estrutura, não a óbvia}

## 9. Performance & complexity

### Benchmarks publicados

| Framework | Benchmark | Hardware/setup | Resultado | Fonte (file:line ou URL) |
|---|---|---|---|---|
| Envoy | rate-limit throughput | 4 vCPU, 1Gbps | 480k req/s | `test/perf/...` |
| NGINX | leaky bucket cost | 8 vCPU | 1.2µs/req | RFC nginx-mailing-list URL |
| ... | ... | ... | ... | ... |

### Complexidade declarada / observada

| Operação | Framework | Big-O | Onde declarado |
|---|---|---|---|
| `Allow()` | go-rate | O(1) amortizado | `rate.go:42` (comentário) |
| ... | ... | ... | ... |

### Hot path tricks observados

- `#[inline(always)]` em `Bucket::tryAcquire` (tokio file:line) — justificado por benchmark X
- SIMD via `_mm_pause` em busy-wait loop (file:line)
- Zero-copy via slice borrowing (file:line)

### Implicações para este projeto

- Target throughput: {derivado dos benchmarks acima ou do problem statement}
- Estrutura de memória: {derivada}
- Concorrência: {derivada}

## 10. Security & threat model

### CVEs históricos relevantes

| CVE | Framework afetado | Tipo | Fix commit / version | Lição para este projeto |
|---|---|---|---|---|
| CVE-2023-XXXX | NGINX | Header injection bypass | 1.25.2 | Validar headers antes de keying |
| ... | ... | ... | ... | ... |

### Attack surface conhecida

- **Clock skew**: {como cada fw lida; impacto no projeto}
- **Header forgery (`X-Forwarded-For`)**: {como cada fw lida}
- **Timing attack via response latency**: {observado em fw X — mitigação}

### Defaults seguros

| Decisão | fw1 | fw2 | Projeto |
|---|---|---|---|
| Fail-open vs fail-closed | fail-closed | fail-open | **fail-closed** (alinhado a {constraint do §1}) |
| Default rate | 100 req/s | unlimited | **100 req/s explícito** |

### Validação de input

- {Onde validar — fronteira HTTP? handler? middleware?}
- {Quais sanitizações são obrigatórias}
- {Quais asserções pode-se assumir depois da fronteira}

## 11. Observability

### Logging

| Framework | Library | Format | Campos-chave |
|---|---|---|---|
| Envoy | spdlog | JSON | `trace_id`, `bucket_key`, `tokens_left` |
| NGINX | error_log | plain | `client_ip`, `req_id`, `status` |
| ... | ... | ... | ... |

### Métricas (Prometheus-style)

| Metric | Tipo | Tags | Frameworks que expõem |
|---|---|---|---|
| `ratelimit_allow_total` | counter | `bucket`, `result` | Envoy |
| `ratelimit_tokens_remaining` | gauge | `bucket` | go-rate |
| ... | ... | ... | ... |

### Trace spans

| Span name | Atributos | Quando criado | Frameworks que criam |
|---|---|---|---|
| `ratelimit.check` | `bucket.key`, `result`, `tokens_before` | a cada decisão | Envoy (otel-cpp) |
| ... | ... | ... | ... |

### Erros estruturados

- {Como cada fw modela erros do módulo — exception hierarchy? Result enum? error code int?}
- {Recomendação para o projeto}

### Implicações para este projeto

- Métricas mínimas a expor: {lista verificável}
- Spans mínimos: {lista verificável}
- Campos de log obrigatórios: {lista verificável}

## 12. Edge cases conhecidos (com fonte)

| Edge case | Como manifesta | Onde foi corrigido | Como prevenir aqui |
|---|---|---|---|
| Clock jumps backwards | Tokens "voltam" causando burst extra | go-rate v0.5.0 (commit abc123) | Usar monotonic clock + clamp |
| ... | ... | ... | ... |

## 13. Anti-patterns observados (não faça isso)

1. **{Anti-pattern X}** — {fw} cometeu em `{file:line}`. Sintoma: {qual bug ou perf hit}. Por que é tentador: {razão}. Faça em vez disso: {alternativa}.
2. ...

## 14. Cookbook — snippets reutilizáveis

### 14.1 {Snippet name}

Inspirado em `{fw}` (`{file:line}`).

```{lang-da-fonte}
// código original ou pseudo-código mínimo viável
```

**Adaptação para o stack do projeto ({linguagem do §2}):**

```{lang-do-projeto}
// código pronto para colar (ou stub claramente marcado)
```

(repetir para cada snippet de valor — token bucket, sliding window, header keying, etc.)

## 15. ADR template (PROPOSED)

```markdown
# ADR-XXX: {Decisão arquitetural derivada deste deep dive}

**Status:** PROPOSED
**Date:** YYYY-MM-DD
**Deciders:** {time}

## Context
{Síntese do §1 + §5/§6 convergência/divergência}

## Decision
{Escolha entre os patterns divergentes do §6, com referência ao snippet do §14}

## Consequences
**Positive:** {lista derivada de §9/§10/§11}
**Negative:** {lista derivada do trade-off do §6}
**Neutral:** {lista}

## Alternatives considered
{Outras opções do §6 + por que rejeitadas}

## References
{Top 5 file:line / URLs da §16}
```

## 16. Implementation Guide

### 16.1 Arquitetura proposta

```
┌─────────────────────┐
│  user code          │
└─────────┬───────────┘
          │ uses
          ▼
┌─────────────────────┐      ┌─────────────────┐
│  defineXxx() helper │─────▶│  XxxRegistry    │
└─────────┬───────────┘      └─────────────────┘
          │ resolved at {build|runtime}
          ▼
┌─────────────────────┐
│  internal/...       │
└─────────────────────┘
```

### 16.2 Files to create

```
{target-dir}/{module}.{ext}            — entrypoint público
{target-dir}/{module}-internal.{ext}   — algoritmo interno
{target-dir}/{module}-types.{ext}      — tipos + schema
tests/unit/{module}.test.{ext}         — TDD primary
tests/integration/{module}-pipeline.test.{ext} — pipeline real
tests/bench/{module}.bench.{ext}       — perf gate (derivado §9)
fixtures/{module}-basic/               — fixture reproduzível
```

### 16.3 Public API surface

```{linguagem-do-projeto}
// API pronta para começar a digitar
export function defineXxx<...>(...): XxxConfig<...> { … }

export interface XxxOptions {
  ...
}
```

### 16.4 Dependências a adotar

| Package | Version | Licença | Justification |
|---|---|---|---|
| `acorn` | `^8.11.0` | MIT | Already transitive via vite — pin direct para AST parsing |
| ... | ... | ... | ... |

(ou "nenhuma — implementação fica em pure {lang}")

### 16.5 Test strategy

- **Unit:** `tests/unit/{module}.test.{ext}` — N cenários BDD
  - Happy path
  - Validation error
  - Edge cases (lista os do §12)
  - Error scenarios
- **Property-based / Fuzz:** {se aplicável — qual property invariante testar}
- **Integration:** `tests/integration/{module}-pipeline.test.{ext}`
- **Benchmark gate:** `tests/bench/{module}.bench.{ext}` — limites do §9
- **Security tests:** {derivado do §10 — fuzz de input, header forgery, clock skew}
- **Fixture:** `fixtures/{module}-basic/`
- **E2E (se UI/HTTP):** `tests/e2e/{module}.spec.{ext}`

### 16.6 Phases of rollout

1. **Phase 1 — Core API + unit tests** (target: green TDD)
2. **Phase 2 — Wiring + integration tests** (target: pipeline end-to-end)
3. **Phase 3 — Observability instrumentation** (derivado §11)
4. **Phase 4 — Security hardening** (derivado §10)
5. **Phase 5 — Performance tuning + bench gates** (derivado §9)

### 16.7 Acceptance criteria

- [ ] {Critério funcional 1 verificável}
- [ ] {Critério funcional 2}
- [ ] Type-check / lint clean
- [ ] Test suite green ({unit + integration + bench + security})
- [ ] Métricas do §11 expostas e validadas
- [ ] Spans do §11 emitidos e validados
- [ ] CVE pattern do §10 coberto por teste de regressão
- [ ] Benchmark do §9 dentro dos thresholds
- [ ] Documentação interna referencia este doc

### 16.8 Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| {risco concreto} | high/med/low | high/med/low | {fix preventivo + fase de rollout} |

## 17. Open questions

Itens onde a pesquisa NÃO chegou em resposta. Cada um vira um TODO antes de começar a implementação.

1. {Pergunta} — possíveis caminhos: A / B / C — quem decide: {pessoa/time}
2. ...

## 18. Referências citadas (todos os arquivos do inventário)

Toda âncora `file:line` usada no documento aparece aqui, agrupada por framework. Esta seção é o índice reverso do inventário — permite navegar do conceito de volta ao código fonte.

### {Framework 1} ({tag})

#### Core
- `path/to/core.{ext}:1-412` — implementação principal; referenciada em §4.1, §6, §8, §11
- `path/to/use-x.{ext}:1-187` — parse e marcação de X; §4.1, §12

#### Support
- `path/to/helper.{ext}:1-98` — registro global; §4.2

#### Test (read seletivo)
- `path/to/test/scenario.test.{ext}:42-78` — cobre edge case Y (cenário em §12)
- `path/to/test/scenario.test.{ext}:120-145` — cobre re-export pattern (cenário em §12)

#### Doc / RFC / CHANGELOG / SECURITY
- `docs/architecture/x.md:1-320` — RFC interno; §5 (decisão de payload binário)
- `CHANGELOG.md` v14.0.4 — fix do boundary corruption; §12
- `SECURITY.md` — política de disclosure; §10

#### Config / Schema
- `proto/api.proto:1-80` — contrato observável; §4.1

#### Commits relevantes (git arqueologia)
- `abc123def` (2024-01-15) — "fix: boundary corruption when re-exporting" — §12
- `7890abcd1` (2024-02-03) — "perf: skip payload generation when no match" — §9

### URLs externas (Fontes C + D)

- `https://github.com/foo/bar/blob/main/src/x.rs#L42-L58` — implementação Rust de referência; §4.2
- `https://datatracker.ietf.org/doc/rfc9110/#section-5.6` — spec HTTP semantics; §10
- `https://engineering.fb.com/2021/.../scaling-rate-limit` — case study de produção; §9
- `https://nvd.nist.gov/vuln/detail/CVE-2023-XXXX` — CVE relevante; §10

(repetir essa estrutura para CADA framework do inventário)
```

Toda asserção no documento DEVE estar ancorada num item da §18. Sem fonte, sem afirmação.

---

## 6. Quality bar (inviolável)

Toda execução (default `exhaustive`, ou `standard` quando explicitamente passado) DEVE produzir:

- [ ] **Pre-flight do projeto preenchido** (linguagem, package manager, layout, test framework, prior state, docs vizinhas)
- [ ] Discovery dinâmica de fontes (clones locais + opcionalmente deps + URLs + docs externos) — não hardcoded
- [ ] **Inventário completo de arquivos por fonte** — todos os hits das 4 passadas, triados em `core` / `support` / `test` / `doc` / `config` / `installed-dep` / `remote` / `external-doc`, sem cherry-picking
- [ ] **Seção "Arquivos avaliados e descartados"** com 1 frase de justificativa por arquivo removido — se está vazia OU tem "..." no final, o inventário está incompleto
- [ ] Mínimo **3 frameworks/fontes** com deep-read (TODOS os arquivos `core` + `support` + `doc` + `config` lidos inteiros por framework)
- [ ] **Glossary** com mínimo 5 termos do domínio
- [ ] Tabela de dependências externas com versão pinada **e licença**
- [ ] Mínimo **5 padrões** identificados (convergent + divergent)
- [ ] Mínimo **5 edge cases** com fonte (commit hash, CHANGELOG, RFC)
- [ ] **Performance section** com mínimo 1 benchmark publicado + 1 hot-path observado + complexidade declarada
- [ ] **Security section** com mínimo 1 CVE histórico OU 1 attack vector analisado + defaults seguros
- [ ] **Observability section** com métricas + spans + erros estruturados — listas verificáveis para o projeto
- [ ] **Cookbook** com mínimo 2 snippets adaptados ao stack do projeto
- [ ] **ADR template** preenchido (status: PROPOSED)
- [ ] **Anti-patterns observed** com mínimo 2 entradas
- [ ] Implementation Guide com **todas as 8 subsections** preenchidas
- [ ] Lista de open questions (mínimo 2 — se zero, a pesquisa foi rasa demais)
- [ ] **§18 (Referências citadas) contém TODOS os arquivos do inventário** (não só os "principais"), agrupados por framework, com line range e cross-reference para as seções que os citam
- [ ] Toda asserção no documento ancorada em `file:line` ou URL da §18 — nenhuma afirmação solta
- [ ] Output no `--out` (default `.claude/knowledge-base/reference/{slug}.md`)

Se qualquer item falhar, a skill **NÃO termina** — volta ao passo correspondente.

### Verificação automática antes de finalizar

```bash
SLUG="<topic-kebab>"
DOC="${OUT_OVERRIDE:-.claude/knowledge-base/reference/$SLUG.md}"

# 1. Inventário completo — toda linha do inventário aparece na §18
INV_FILES=$(awk '/^## 2\. Inventário/,/^## 3\./' "$DOC" \
  | grep -oE '`[^`]+\.[a-zA-Z]+`' | sort -u)
REF_FILES=$(awk '/^## 18\. Referências/,/^$/' "$DOC" \
  | grep -oE '`[^`]+\.[a-zA-Z]+' | sort -u)
diff <(echo "$INV_FILES") <(echo "$REF_FILES") \
  || echo "FAIL: arquivos do inventário não citados na §18"

# 2. Sem "..." na seção de descartados (placeholder de preguiça)
awk '/^### Arquivos avaliados/,/^## 3\./' "$DOC" | grep -q "\.\.\." \
  && echo "FAIL: inventário tem reticências — completar antes de finalizar"

# 3. Todas as 16 seções principais existem
for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18; do
  grep -q "^## $n\." "$DOC" || echo "FAIL: §$n ausente"
done

# 4. Implementation Guide com 8 subsections
for sub in 16.1 16.2 16.3 16.4 16.5 16.6 16.7 16.8; do
  grep -q "^### $sub" "$DOC" || echo "FAIL: $sub ausente"
done

# 5. Quality gates específicos
grep -qE "^\| .+\| .+ \| (MIT|Apache|BSD|GPL|MPL|ISC|Commercial) \|" "$DOC" \
  || echo "FAIL: tabela de deps sem coluna de licença"
grep -qE "CVE-[0-9]{4}-[0-9]+" "$DOC" \
  || echo "WARN: nenhum CVE referenciado em Security — verificar se procedeu busca"
grep -qE "^## 14\. Cookbook" "$DOC" \
  && [ "$(awk '/^## 14\./,/^## 15\./' "$DOC" | grep -c '^```')" -ge 4 ] \
  || echo "FAIL: cookbook sem mínimo 2 snippets (4 blocos de código — original + adaptado)"
```

---

## 7. Anti-patterns

- **Grep-and-dump.** Pegar `grep` results e colar no doc sem ler o código não conta como deep dive.
- **API surface sem prosa.** Listar exports sem explicar o que fazem é inútil para quem vai implementar.
- **"TODO: investigate"** no Implementation Guide. Se está como TODO, ainda é Passo 3, não Passo 12.
- **Ignorar dependências externas.** A §7 é onde mora o tempo poupado — libs que outros já vetaram resolvem 60% do trabalho.
- **Implementation Guide vago.** "Implementar módulo X" não é guide. "Criar `internal/ratelimit/bucket.go` com `func NewBucket(rate int64, capacity int64) *Bucket` usando `golang.org/x/time/rate@v0.5.0` como base" é guide.
- **Pular open questions.** Pesquisa sem dúvidas é pesquisa rasa. Se não restou pergunta, leu superficialmente.
- **Inventário com `...` / "principais arquivos" / "alguns omitidos".** Cherry-picking distorce a análise — quem lê o doc depois não sabe se um arquivo foi ignorado por irrelevância ou por preguiça. Ou cita todos, ou justifica o descarte na seção dedicada. Não há terceira via.
- **Referência sem âncora `file:line` ou URL.** "X faz Y" sem `path/foo.rs:42` ou URL específica é folclore. Toda asserção do documento aponta para a §18.
- **Performance sem hardware/setup.** "10x faster" sem dizer em que máquina, com que carga, vs o quê — é marketing, não dado.
- **Security sem CVE concreto OU vetor analisado.** Falar de "ataque genérico" sem demonstrar onde o código defende ou onde já falhou é vapor.
- **Cookbook só com pseudo-código.** Pelo menos UMA das duas versões (original ou adaptada) tem que compilar como está. Snippet que não compila é nota de aula, não cookbook.
- **Cross-language sem disclaimer.** Se o referencial é Rust e o projeto é TypeScript, o snippet adaptado tem que reconhecer que a concorrência model é outra — não fingir paridade.

---

## 8. Tópicos comuns + keywords + frameworks-alvo

Genéricos — não amarrados a webdev. A coluna "Frameworks-líder a ler" é guia, não exigência: a skill faz discovery dinâmica em `$SOURCES_ROOT`.

### Sistemas e infraestrutura

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Rate limiting | `rate.limit, ratelimit, throttle, leaky.bucket, token.bucket, gcra, quota` | Envoy, NGINX, Traefik, golang/x/time/rate, redis-cell, Cloudflare workers |
| Circuit breaker | `circuit.breaker, hystrix, half.open, failure.threshold` | Hystrix, resilience4j, Polly, gobreaker, sony/gobreaker |
| Retry / backoff | `retry, backoff, exponential, jitter, attempt` | aws-sdk, polly, tenacity, backoff-go |
| Connection pooling | `pool, connection, idle, lifetime, max.size` | HikariCP, pgx, deadpool, sqlx pool |
| Caching | `cache, lru, lfu, ttl, eviction, write.through` | Caffeine, ristretto, lru-cache, moka |
| Distributed lock | `lock, lease, fence, mutex, distributed` | etcd, ZooKeeper, redlock, Consul |
| Pub/sub | `subscribe, publish, topic, partition, offset, consumer.group` | Kafka, NATS, Pulsar, Redis Streams |
| Idempotency | `idempotency.key, exactly.once, dedupe, replay` | Stripe API, Temporal, Kafka |

### Frameworks web e API

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Routing | `router, route, segment, dynamic, param, catchAll, regex` | Next.js, TanStack Router, axum, chi, gin, fastapi |
| Middleware | `middleware, handler, interceptor, before, after, tower.layer` | Hono, Nitro, Rails, Next.js, axum tower, express |
| Request context | `context, AsyncLocalStorage, ctx, request.scoped, ALS, c.Var` | Hono Context, Nitro useEvent, Next.js headers(), AsyncLocalStorage |
| OpenAPI / schema | `openapi, swagger, json-schema, zod-openapi, validation` | Hono zod-openapi, Fastify, tRPC-OpenAPI, FastAPI |
| Streaming | `stream, flush, sse, server.sent.events, chunked` | Next.js, Remix defer, Astro server-streaming, FastAPI StreamingResponse |
| WebSockets | `websocket, ws, upgrade, channel` | Bun, Hono, Nitro, ActionCable, FastAPI |
| Auth / sessions | `session, cookie, csrf, jwt, encrypt, oauth` | Lucia, NextAuth, Devise, Spring Security, FastAPI users |
| File upload | `multipart, formData, busboy, stream.parse` | Multer, busboy, fastify-multipart |

### Build / dev tools

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| HMR | `hmr, hot, accept, dispose, invalidate, reload` | Vite (canonical), webpack (legacy), turbopack |
| Bundling / code-splitting | `bundle, chunk, split, manualChunks, preload, dynamic.import` | Vite, Rollup, Turbopack, esbuild |
| Source maps | `source.map, sourcemap, magic.string, regenerate` | magic-string, source-map-js, swc |
| Type generation | `infer, generate, .d.ts, codegen` | tRPC, kysely-codegen, openapi-typescript |
| Config system | `defineConfig, config, options, defaults, schema` | Vite, Astro, Next.js, Vitest |
| CLI / scaffolding | `command, flag, scaffold, generate, create-, commander` | Vite CLI, Astro CLI, commander, clap, cobra |

### Dados e persistência

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Migrations | `migration, schema, up, down, versioned` | Flyway, Liquibase, knex migrations, sqlx-cli, alembic |
| Query builder / ORM | `query, builder, model, association, lazy.load` | ActiveRecord, Ecto, Diesel, Drizzle, Prisma, sqlx |
| Connection pooling | (ver "Sistemas") | (ver "Sistemas") |
| Background jobs | `job, queue, worker, dequeue, retry, sidekiq` | Sidekiq, BullMQ, Oban, asynq, Celery |
| Event sourcing | `event, aggregate, projection, eventstore, append.only` | EventStoreDB, Marten, EventStore Rust |

### Observabilidade e operação

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Structured logging | `slog, tracing, pino, zerolog, structured` | tracing (Rust), slog (Go), pino (TS), structlog (Py) |
| Metrics | `prometheus, statsd, otel, histogram, counter` | prometheus client libs, OTel SDKs |
| Tracing | `otel, opentelemetry, span, trace, propagation` | OTel SDKs |
| Health checks | `health, readiness, liveness, probe, /healthz` | k8s probes, spring actuator |
| Graceful shutdown | `shutdown, drain, sigterm, lifecycle, close` | tokio shutdown, http.Server.Shutdown |

### Frontend / UI

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Server Components | `server.component, use.client, use.server, rsc, react.server.dom` | Next.js, Remix RSC, Astro server islands |
| Forms / actions | `action, form, useFormState, defineAction, mutate` | Next.js, Remix, SvelteKit form actions, React Hook Form |
| Type-safe forms | `infer, schema, zod.resolver, validate, errors` | React Hook Form + Zod, conform, vee-validate |
| Component primitives | `radix, headless, slot, asChild, focus.trap` | Radix UI, Headless UI, Ark UI |
| Theming | `theme, css.var, design.token, color.scheme` | shadcn, Tamagui, Stitches |

### Testing

| Tópico | Keywords | Frameworks-líder |
|---|---|---|
| Unit testing | `describe, test, it, expect, vitest, jest` | Vitest, Jest, RSpec, pytest |
| Property-based | `property, fast.check, hypothesis, quickcheck` | fast-check, hypothesis, proptest |
| Fuzz testing | `fuzz, libfuzzer, atheris, cargo.fuzz` | cargo-fuzz, libfuzzer-sys, atheris |
| E2E | `playwright, cypress, selenium, e2e` | Playwright, Cypress |
| Mocks / fakes | `mock, spy, stub, vi.fn, mockito` | Vitest mocks, Mockito, unittest.mock |

---

## 9. Integração com outras skills

| Skill | Quando usar |
|---|---|
| `/to-research` | DEPOIS de `deep-reference`: web search + RFCs + benchmarks publicados que escaparam do clone |
| `/to-plan` | Consome `.claude/knowledge-base/reference/{slug}.md` direto na §16 (Implementation Guide) |
| `/edge-case-plan` | Cruza com os edge cases catalogados no §12 |
| `/codex review` | Roda em cima do Implementation Guide antes de começar a codar |
| `/meeting` (se existir) | Decisões com trade-off divergente vão pra reunião com o doc anexo + ADR template do §15 |

---

## 10. Comparação rápida: `to-reference` vs `deep-reference`

Use `to-reference` quando:
- Você está no TheoKit (`packages/theo/...`)
- A análise é exclusivamente em clones em `referencias/`
- O foco é TS / framework Next.js-like

Use `deep-reference` quando:
- Projeto não-TheoKit (Theo PaaS, theo-code, theo-ui, ou qualquer projeto externo)
- Linguagem ≠ TypeScript (Rust, Go, Python, Ruby, etc.)
- Precisa cruzar com deps já instaladas, URLs do GitHub, ou docs públicas
- Precisa das seções enriquecidas (Performance, Security, Observability, Cookbook, ADR, Glossary)
- Default para qualquer tópico não-trivial em qualquer projeto

---

## 11. Setup de fontes (uma vez por máquina ou por projeto)

`referencias/` e equivalentes são gitignored — cada dev clona localmente. Default tiers por categoria de problema:

### Tier 1 — Web / framework

```bash
mkdir -p ~/refs && cd ~/refs
git clone --depth 1 https://github.com/vercel/next.js.git           next.js
git clone --depth 1 https://github.com/remix-run/remix.git          remix
git clone --depth 1 https://github.com/honojs/hono.git              hono
git clone --depth 1 https://github.com/nitrojs/nitro.git            nitro
git clone --depth 1 https://github.com/TanStack/router.git          tanstack-router
git clone --depth 1 https://github.com/vitejs/vite.git              vite
git clone --depth 1 https://github.com/withastro/astro.git          astro
git clone --depth 1 https://github.com/sveltejs/kit.git             sveltekit
git clone --depth 1 https://github.com/fastify/fastify.git          fastify
git clone --depth 1 https://github.com/trpc/trpc.git                trpc
git clone --depth 1 https://github.com/rails/rails.git              rails
```

### Tier 2 — Sistemas / runtime

```bash
git clone --depth 1 https://github.com/envoyproxy/envoy.git         envoy
git clone --depth 1 https://github.com/tokio-rs/tokio.git           tokio
git clone --depth 1 https://github.com/tokio-rs/axum.git            axum
git clone --depth 1 https://github.com/gin-gonic/gin.git            gin
git clone --depth 1 https://github.com/go-chi/chi.git               chi
git clone --depth 1 https://github.com/tiangolo/fastapi.git         fastapi
git clone --depth 1 https://github.com/encode/starlette.git         starlette
```

### Tier 3 — Dados / mensageria

```bash
git clone --depth 1 https://github.com/sqlx-rs/sqlx.git             sqlx
git clone --depth 1 https://github.com/launchbadge/sqlx.git         sqlx-launchbadge
git clone --depth 1 https://github.com/diesel-rs/diesel.git         diesel
git clone --depth 1 https://github.com/prisma/prisma.git            prisma
git clone --depth 1 https://github.com/drizzle-team/drizzle-orm.git drizzle
git clone --depth 1 https://github.com/nats-io/nats-server.git      nats
```

Adicione `referencias/` ou o path equivalente ao `.gitignore` do projeto antes de clonar dentro do tree.

---

## 12. Exemplo de invocação

### Exemplo 1 — Rate limiting (qualquer projeto, multi-fonte)

```
/deep-reference rate limiting \
  --refs envoy,nginx,traefik,axum,redis-cell \
  --urls https://datatracker.ietf.org/doc/rfc6585/,https://github.com/cloudflare/pingora/blob/main/pingora-limits/src/rate.rs \
  --depth exhaustive
```

Espera-se:
1. Pre-flight: detecta `Cargo.toml` → projeto Rust; layout `internal/`; framework `axum` já é dep
2. Discovery: lista frameworks com keyword `rate-limit` em `~/refs/`
3. Inclui leitura do raw URL do Cloudflare Pingora (Fonte C)
4. Inclui leitura da RFC 6585 (Fonte D)
5. Deep read em `envoy/source/extensions/filters/.../ratelimit/...`
6. Deep read em `nginx/src/http/modules/ngx_http_limit_req_module.c`
7. Comparação com `axum-extra` rate-limit middleware
8. Output: `.claude/knowledge-base/reference/rate-limiting.md` com:
   - 16 seções
   - Glossário (token bucket, leaky bucket, GCRA, sliding window)
   - Benchmarks publicados de Envoy + Pingora
   - CVE-2023-* analisado (header injection)
   - Métricas Prometheus que ambos expõem
   - Cookbook: token bucket atomic + GCRA Lua
   - ADR template pronto
   - Implementation Guide para `internal/ratelimit/{bucket,middleware,types}.rs`

### Exemplo 2 — Migrations (Ruby/Rails project consumindo deps)

```
/deep-reference migrations --deps --refs rails,alembic,sqlx-cli,knex --depth exhaustive
```

Espera-se:
1. Pre-flight: detecta `Gemfile` → projeto Ruby; framework Rails já está em `vendor/bundle/`
2. Discovery: inclui Fonte B (deps em `vendor/bundle/gems/`)
3. Lê código real do ActiveRecord migrations a partir de `vendor/bundle/`
4. Compara com clones locais de `alembic` (Python), `sqlx-cli` (Rust), `knex` (Node)
5. Output cobre: versioning schemes, lock semantics, rollback safety, online vs offline migrations, breaking change detection

### Exemplo 3 — Server Components (sem clones — só URLs)

```
/deep-reference Server Components \
  --urls https://github.com/vercel/next.js/blob/canary/packages/next/src/build/webpack/loaders/next-flight-loader/index.ts,https://github.com/facebook/react/blob/main/packages/react-server-dom-webpack/src/ReactFlightWebpackPlugin.js,https://github.com/reactwg/server-components/discussions/5 \
  --depth standard
```

Espera-se:
1. Pre-flight: projeto identifica que NÃO tem RSC ainda; target dir `src/server/`
2. Fonte C apenas: lê 3 URLs via WebFetch
3. Deep dive focado nos 3 arquivos + discussion RFC
4. Output: ainda cobre 16 seções (Performance/Security/Observability/Cookbook), mas com nota explícita de que clones locais não foram usados — útil para `Open questions` denser

---

## 13. Quando esta skill NÃO se aplica

- **Tópico tem doc recente (<30 dias) em `.claude/knowledge-base/reference/`** — use `--depth standard` para refresh OU complemente o doc existente em vez de sobrescrever.
- **Mudança trivial em código já entendido** — overkill. Vá direto pra implementação.
- **Discussão de produto, não de implementação** — use uma skill de planejamento ou meeting, não esta.
- **Prior art não existe** — se `$SOURCES_ROOT` está vazio E `--urls` não foi passado, **pare e instrua o usuário a clonar** (§11) ou passar URLs. Não invente prior art a partir de conhecimento prévio do modelo — viés de treino distorce análise.

---

## 14. Compatibilidade com global CLAUDE.md

Esta skill respeita os princípios inquebráveis:

- **Regra de Confiança 95%** — se algum framework não foi lido em profundidade suficiente para gerar todas as 16 seções, a skill PARA e pede ao usuário para clarificar escopo (ou aceitar `--depth standard` com cobertura reduzida em frameworks, mantendo as 16 seções).
- **Não Reinvente** — a §7 (dependency inventory) é a operacionalização literal desta regra: catalogar libs maduras antes de escrever uma linha.
- **Testes** — §16.5 (Test strategy) é mandatório; ele deriva diretamente dos edge cases (§12), perf (§9) e security (§10).
- **Error Handling** — §4 inclui error handling style por framework; §16 inclui erros estruturados na seção 11 (Observability).
- **Honestidade extrema** — sem cherry-picking no inventário; toda asserção ancorada em fonte; open questions obrigatórias.
- **Git rules** — não modifica histórico nem faz checkout em `referencias/`. Apenas `git log --grep` (read-only).

Se entrar em conflito com `<projeto>/CLAUDE.md`, **o CLAUDE.md do projeto vence** — flag o conflito antes de gerar o doc.
