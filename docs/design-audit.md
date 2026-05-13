# Auditoria Visual dos Concorrentes PaaS

> Fase 2 da iniciativa Theo Desktop. Coleta empírica do design system de cada concorrente direto do código servido, com extração de tokens reais (paleta, tipografia, padrões) via `curl` + `grep` nas landings públicas.
>
> Coletado em: 2026-05-13.

---

## Procedência da informação

Cada item desta auditoria é marcado com:

- **[extraído]** — token literalmente presente no HTML/CSS servido pela URL pública (raw HTML salvo em `docs/audit/<concorrente>/raw/index.html`).
- **[inferido]** — não está no HTML mas é evidente do conjunto (ex: dark mode é o background dominante).
- **[conhecimento]** — vem do conhecimento prévio do produto, não foi confirmado nesta coleta.

Quando um valor é **[conhecimento]**, ele não deve ser usado como base normativa sem validação visual posterior.

---

## 1. Vercel

### Marca
- Posicionamento: **frontend cloud premium, dev-first, Next.js-native**.
- Tagline: "Build and deploy on the AI Cloud" **[extraído via WebFetch]**.

### Paleta
Vercel quase elimina cor da identidade — o branding é preto/branco extremo com accents semânticos pontuais.

| Cor | Hex | Uso provável |
|---|---|---|
| Off-white | `#FAFAFA` **[extraído]** | Background light theme |
| Mint | `#45DEC4` **[extraído]** | Highlight de feature, badge |
| Green | `#00DC82` **[extraído]** | Success, deploy ok |
| Blue | `#0096FF` **[extraído]** | Info / link |
| Light Blue | `#52AEFF` **[extraído]** | Variant |
| Orange | `#FF3E00` **[extraído]** | Frontend framework (Svelte-like) |
| Red-pink | `#FF1E56` **[extraído]** | Destructive / alert |
| Red | `#E5484D` **[extraído]** | Error |

Sem paleta neutra escalada explícita no HTML — Vercel usa **Geist Gray scale** internamente (gray-50 → gray-1000) **[conhecimento]** com valores HSL não literalmente expostos em `vercel.com/geist/colors` (a página usa "right click to copy raw values" via JS).

### Tipografia
- **Geist Sans** (display + body) **[extraído]** — peso 400/600/800, hospedada em `/vc-ap-vercel-marketing/_next/static/immutable/media/*.woff2`.
- **Geist Mono** **[extraído]** — referenciada via `font-family:var(--font-mono)`.
- Geist é uma família proprietária do Vercel, derivada de Inter mas com refinamentos. **Já é território do Vercel** — não devemos usar.

### Padrões visuais
- **Minimalismo terminal-like**: alta densidade, cards com bordas finas neutras, sem shadow elaborada **[conhecimento]**.
- Botões: pretos sólidos (light) / brancos sólidos (dark), sem cor de marca.
- Grid layout fortemente dimensional (CSS vars `--grid-columns`, `--cross-column` etc.) **[extraído]**.
- Code blocks: monospaced presence é parte da identidade.

### Tom
**Premium engineering, sem ornamentos, terminal vibe**. "Não somos um design system, somos um vendor de infraestrutura".

---

## 2. Railway

### Marca
- Posicionamento: **PaaS para infrastructure people**, hobby-friendly, dark-mode-dominante.

### Paleta (todos os 11 stops literalmente presentes no HTML)
**[extraído]** — Railway publica paleta completa em CSS vars HSL com pares light/dark.

#### Background base
- Light: `hsl(0, 0%, 100%)`
- Dark: **`hsl(250, 24%, 9%)` ≈ `#13111c`** — roxo-quase-preto característico.

#### Foreground
- Light: `hsl(250, 24%, 9%)` (mesma do dark bg, alto contraste)
- Dark: `hsl(0, 0%, 100%)`

#### Escala blue (light)
- `--blue-50: hsl(220, 55%, 97%)`
- `--blue-500: hsl(220, 80%, 55%)` (canônico)
- `--blue-950: hsl(220, 55%, 10%)`

#### Escala cyan, pink, purple — todas seguindo o mesmo pattern
Mesma estrutura 50→950 com paridade light/dark. Pink centra em hue 270° (roxo-magenta).

#### Acento característico: gradiente radial roxo→magenta com glow
Extraído literal de uma classe inline do CTA:

```css
--c1:#aa0aaa; --c2:#6d1dbd; --c3:#381dbd;
background-image: radial-gradient(73.46% 138.39% at 50.21% 0%,
  var(--c1) 50%, var(--c2) 75.47%, var(--c3) 100%);
box-shadow:
  0px 0px 6px 0px rgba(180,40,180,0.25),
  0px 0px 16px 0px rgba(102,43,223,0.25);
```

Hover dobra a intensidade do shadow. Active reduz e clareia. Esse é **o** elemento de identidade do Railway.

### Tipografia
- **IBM Plex Serif** **[extraído]** — referenciada em `https://fonts.gstatic.com/s/ibmplexserif/v20/...woff2`. Provavelmente apenas display/hero.
- Body: `"Segoe UI", sans-serif` **[extraído]** — escolha conservadora.

### Padrões visuais
- Dark mode com base roxa em vez de neutra (250° de hue).
- Gradiente radial com glow em CTAs primários (não shadow plana, **glow real** com blur).
- Cards com bordas suaves, dark.

### Tom
**Tech premium drama, dark, glow-heavy**. Aspira a "sci-fi developer console".

---

## 3. Render

### Marca
- Posicionamento: **Heroku-spiritual successor, all-in-one cloud**, light theme dominante.
- Tagline confirmada: "The cloud for builders" **[extraído via WebFetch]**.

### Paleta
HTML não expõe tokens estáticos — Next.js + Tailwind compilado. Sem valores hex únicos colhidos com este nível de coleta (apenas vars de layout `--button-arrow-offset`, `--nav-bar-height` etc.).

Inferido **[conhecimento]**:
- Background: branco/cinza muito claro.
- Primary: roxo/violeta (Render moveu para uma identidade roxa nos últimos releases).
- Accents: cinza, verde para success.

### Tipografia
- 10 woff2 hashed servidos via `_next/static/media/` — sem nomes legíveis **[extraído como hashes]**.
- **[conhecimento]**: Render usa fontes proprietárias customizadas ou um sans-serif geométrico genérico.

### Padrões visuais
- **Corporativo SaaS limpo**. Cards bem espaçados, hierarquia conservadora.
- Foco em compliance/serviços (logos de Postgres, Docker, Kubernetes em destaque).

### Tom
**Confiável, profissional, sem personalidade visual marcante**. É o "BMW Série 3 dos PaaS".

---

## 4. Fly.io

> **Achado mais interessante da auditoria.** Fly é o concorrente com a identidade visual mais distintiva e arrojada.

### Marca
- Posicionamento: **deploy em qualquer região, low-level developers**, Phoenix/Elixir stack.
- Tagline confirmada: "Build fast. Run any code fearlessly", "Sandboxes That Feel Like a Superpower" **[extraído via WebFetch]**.

### Paleta (accents vívidos extraídos)
**[extraído]** literal do HTML — sem escala 50-950, hex direto:

| Cor | Hex | Caráter |
|---|---|---|
| **Laranja vívido** | `#FD4F00` | Marca principal, CTAs |
| **Roxo elétrico** | `#6100FF` | Highlight |
| **Magenta/pink** | `#FF008A` | Accent secundário |
| Pink-purple | `#996bec`, `#ba7bf0`, `#795BE9` | Variações |
| Amber/gold | `#FFC83A` | Highlight de alerta |
| Mint | `#6EE5C2` | Success |
| Blue clean | `#0091E2` | Info |
| Deep navy | `#092E20` | Texto/escuro |
| Stone | `#443635` | Neutros quentes |

Combinação **laranja + magenta + roxo elétrico** rara nesse mercado.

### Tipografia (auditoria com hit forte)
**[extraído]** das URLs de woff2 servidas:

| Função | Fonte | Caráter |
|---|---|---|
| **Display / headlines** | **Mackinac** (Bold + Medium, Italic) | Serif transitional com peso, presença editorial |
| **Sans body** | **Fricolage Grotesque** (variable) | Grotesque francesa, geométrica humanizada |
| **Monospace** | **Fragment Mono** (Regular + Italic) | Mono com personalidade, não-utilitária |

Cada uma delas é **rara** no espaço PaaS. Mackinac em particular dá presença editorial a um produto técnico — é o que mais nos inspira.

### Padrões visuais
- **Brutalist-friendly + retro-modern**.
- Background graph SVG: `--bg: url(/phx/ui/images/graph-*.svg)` **[extraído]** — textura de grafos como pano de fundo.
- Carrossel/marquee de logos com mask-image gradient nas bordas.

### Tom
**Confiante, técnico-com-personalidade, "low-level mas com swag"**. Anti-corporate.

---

## 5. Netlify

### Marca
- Posicionamento: **JAMstack pioneer, frontend + serverless functions**.
- Tagline confirmada: "Push your ideas to the web" **[extraído via WebFetch]**.

### Paleta (teal-centric)
**[extraído]** — sistema `--ntl-*` (Netlify Design System) padronizado.

#### Primárias (teal/turquesa — identidade Netlify)
- `#05BDBA` (canônico teal)
- `#14D8D4` (teal mais claro)
- `#5DE4C7` (mint variant)
- `#7FDBCA` (mint claro)
- `#DEFFFE` (mint pastel — surface)

#### Dark backgrounds
- `#0C2A2A` (deep teal-tinted dark)
- `#014847` (mid teal-dark)
- `#0d1818`, `#181a1c` (near-black)

#### Accents
- `#2E51ED` (electric blue)
- `#C792EA` (lavender accent)
- `#89DDFF`, `#5FB3FF`, `#ADD7FF` (blue tones)
- `#A6ACCD` (muted blue-gray)
- `#3AC364` (success green)

### Tipografia
**[extraído]**: `font-family: YouTube Noto, Roboto, Arial, Helvetica, sans-serif` — **fallback genérico, sem fonte custom no marketing**. Eles usam fontes mais específicas no dashboard logado **[conhecimento]** mas a landing cai em system fonts.

### Padrões visuais
- Sistema de tokens nomeado e exportado (`--ntl-font-family-display`, `--ntl-grid-column-min-size`, `--ntl-space-*`).
- **Linha clara, ilustrações line-art, ícones outline** **[extraído via WebFetch + conhecimento]**.

### Tom
**Friendly, accessível, JAMstack-evangelist**. Equilibra tech e design.

---

## 6. Coolify

### Marca
- Posicionamento: **open-source self-hostable alternative** a Vercel/Heroku/Netlify/Railway.
- Tagline confirmada: "Self-hosting with superpowers" **[extraído via WebFetch]**.

### Paleta (saturada, OSS-vibrante)
**[extraído]** — Tailwind gray scale + accents saturados:

#### Accents vibrantes (provavelmente para syntax highlight ou destaques)
- `#1ddde8` (cyan elétrico)
- `#dd00f3` (magenta puro)
- `#1de840` (lime elétrico)
- `#ff2400` (red-orange saturado)
- `#e3e81d` (yellow ácido)
- `#e8b71d` (amber)
- `#2b1de8` (blue elétrico)

#### Neutros (Tailwind gray 200-700)
`#4b5563`, `#6b7280`, `#9ca3af`, `#d1d5db`, `#e5e7eb`

#### Semânticos (Tailwind defaults)
- `#4ade80` (green-400)
- `#60a5fa` (blue-400)
- `#f87171` (red-400)
- `#fb923c` (orange-400)
- `#fcd34d` (amber-300)
- `#fca5a5` (red-300)

### Tipografia
**[extraído]**: `font-family: ui-monospace, monospace` — sem fonte custom servida no HTML. **Hacker/terminal aesthetic** assumida.

### Padrões visuais
- Densidade alta, paleta variada saturada (OSS vibe), screenshots de dashboard frequentes.
- Sem identidade visual única — Tailwind UI defaults predominam **[conhecimento]**.

### Tom
**Open-source hacker pragmático, "less corporate"**, comunidade-first.

---

## Comparação cruzada

### Background dominante por concorrente

| Concorrente | Modo dominante | Cor base |
|---|---|---|
| Vercel | Light com toggle dark | `#FAFAFA` light / black dark |
| Railway | **Dark roxo-quase-preto** | `hsl(250, 24%, 9%)` |
| Render | Light corporativo | White/gray claro |
| Fly.io | Light com accents fortes | White + texturas |
| Netlify | Light + dark balanceado | White / deep teal `#0C2A2A` |
| Coolify | Dark hacker | Tailwind slate/zinc |

**Insight**: 4 de 6 são dark-first ou dark-friendly. Light-first é minoria (Render, Netlify parcial).

### Tipografia distintiva por concorrente

| Concorrente | Display | Body | Mono | Distintividade |
|---|---|---|---|---|
| Vercel | Geist Sans | Geist Sans | Geist Mono | ⭐⭐⭐⭐ (família própria) |
| Railway | IBM Plex Serif | Segoe UI fallback | — | ⭐⭐⭐ (Plex Serif é incomum) |
| Render | desconhecido (hashed) | desconhecido | — | ⭐ (sem evidência) |
| **Fly.io** | **Mackinac** | **Fricolage Grotesque** | **Fragment Mono** | ⭐⭐⭐⭐⭐ (rara combinação) |
| Netlify | system fallback | system fallback | — | ⭐ (no marketing) |
| Coolify | ui-monospace | ui-monospace | system | ⭐ (default Tailwind) |

**Insight crítico**: Fly e Vercel são os únicos com identidade tipográfica forte. Os outros 4 são tipograficamente neutros. Há **oportunidade clara** de diferenciação por escolha de fonte para o Theo.

### Acento de marca por concorrente

| Concorrente | Accent dominante | Outros accents |
|---|---|---|
| Vercel | Quase ausente (black/white) | `#00DC82` green, `#FF3E00` orange |
| Railway | **Magenta+roxo gradiente glow** | Pink-purple #aa0aaa→#381dbd |
| Render | (não confirmado) | — |
| Fly.io | **Laranja `#FD4F00` + magenta `#FF008A` + roxo elétrico `#6100FF`** | Combinação rara |
| Netlify | **Teal `#05BDBA`** | Lavender, electric blue |
| Coolify | Multi-saturado | Cyan + magenta + lime + red-orange |

**Insight**: O espaço de **roxo/violet** está saturado (Railway, Render). O espaço de **teal** é do Netlify. O espaço de **laranja+magenta** é do Fly. Vercel quase neutraliza. **Cores ainda disponíveis no espaço PaaS premium**: amber/gold profundo, persimmon/coral, sage/forest, navy elétrico, rose-tinted neutros.

### Padrão de elevação

| Concorrente | Elevation |
|---|---|
| Vercel | Bordas finas neutras + shadow muito sutil |
| Railway | **Glow shadow com blur (multi-layer rgba)** |
| Render | Card shadow conservadora |
| Fly.io | Texturas + ilustrações + drop shadow direto |
| Netlify | Cards limpos com shadow soft |
| Coolify | Tailwind defaults |

---

## Insights para a síntese (Fase 3)

### O que o espaço PaaS faz consistentemente
1. **Cards de projeto** com status badge + métrica + timestamp.
2. **Build log stream** com timestamps, levels (info/warn/error coloridos), filtros.
3. **Top nav** com workspace switcher à esquerda + ações à direita.
4. **Sidebar** com seções colapsáveis.
5. **Command palette** ⌘K para navegação.
6. **Tabs** para alternar entre Overview / Deployments / Settings / Logs / Metrics.

### Gaps que ninguém ocupa bem (oportunidade Theo)
1. **Fonte distintiva fora de Inter/Geist/IBM Plex/Mackinac/Space Grotesk** — campo aberto.
2. **Paleta dominante quente** (laranja/coral/amber) com discipline — Fly toca isso mas dispersa em muitos accents.
3. **Composição assimétrica** em dashboards de PaaS — todos usam grid simétrico de cards.
4. **Background com textura/grão/pattern** que reforça identidade técnica sem ser "starfield" genérico.
5. **Motion identidade** — Railway tem o glow, mas ninguém faz transições de página com personalidade.

### O que evitar (anti-padrões já saturados)
- Roxo gradient on white → Railway, Render.
- Geist family → Vercel (propriedade dele).
- IBM Plex Sans → IBM, Railway parcial.
- Inter / Roboto / Space Grotesk / Helvetica → "default AI-generated".
- Mackinac → já é a Fly.
- Teal/turquesa primário → já é Netlify.
- Dark slate hacker default → Coolify.

### Hipóteses para o DS Theo (a validar na Fase 3)
- **Fonte display**: candidatos não-saturados — `Boska` (serif moderno geométrico), `PP Editorial New` (serif elegante editorial), `Author` (serif clean contemporâneo), `Cabinet Grotesk` (sans humanista com character), `General Sans` (geométrica neutra), `Migra` (display elegante).
- **Body**: candidatos — `Switzer`, `General Sans`, `Synonym`, `Erode` para variação.
- **Mono**: candidatos — `Berkeley Mono` (paga), `JetBrains Mono`, `Departure Mono` (retro), `Commit Mono`, `Monaspace` (GitHub).
- **Cor primária**: explorar **persimmon/coral (`#E94F37`-ish)** ou **electric amber (`#FFB627`-ish)** ou **forest-electric (`#0B5345`-ish com glow)**. Fugir do roxo.
- **Background**: textura sutil tipo grain noise ou pattern geométrico em vez de solid.
- **Modo dominante**: a definir — provavelmente dark para alinhar com 4/6, mas com paleta quente que diferencia.

---

## Próximos passos

1. **Fase 3 (Síntese)**: aplicar os insights acima + as diretrizes de aesthetics do brief para propor 2-3 direções de DS Theo, escolher uma, e materializar em `docs/design-system.md` + `tokens.css`.
2. Posteriormente, **validar visualmente** cada componente do registry contra os concorrentes (não para imitar, para garantir que cumprem o mesmo job-to-be-done com identidade própria).
