# Theo Design System — Violet Forge

> **Decisão (2026-05-13)**: Direção D ("Violet Forge") foi escolhida.
> Este documento é a referência normativa do DS Theo daqui em diante. As direções alternativas (A/B/C) permanecem ao final como histórico de decisão.
>
> Origem dos tokens: `docs/design-audit.md` (extração dos 6 concorrentes) + diretrizes estéticas (fontes distintivas, paleta dominante, fuga do "purple gradient on white").

---

## Identidade

**Violet Forge** mantém o roxo canônico do Theo (`#7C3AED`) como primary, mas reconstrói o contexto para fugir do cliché "purple on white" do DS antigo e do território Railway (gradient magenta+roxo glow). O resultado é uma **forja roxa** — dark-first, com accent terracota quente, tipografia editorial e textura sutil.

**Pilares**:
1. **Mantém equity de marca** (roxo Theo `#7C3AED` permanece como primary).
2. **Dark-first** (alinha com 4/6 concorrentes; light é warm off-white, nunca branco puro).
3. **Accent terracota** `#C96442` — burnt sienna já presente 66× nas referências, fuga do yellow brutalist antigo.
4. **Tipografia editorial OSS**: Boska (display) + Switzer (body) + JetBrains Mono (code).
5. **Background com textura** (dot grid violet-tint + radial glow estático), nunca solid.
6. **Motion disciplinada**: violet glow em hover, stagger sutil em entrada. Sem gradient animado.

---

## Tokens normativos

### Paleta — light mode

```
--background:        #FAF9F7    /* warm off-white, nunca #FFFFFF puro */
--foreground:        #0E0B14    /* charcoal violet-tinted */
--card:              #FFFFFF    /* surfaces elevadas sobre off-white */
--card-foreground:   #0E0B14
--popover:           #FFFFFF
--popover-foreground:#0E0B14
--primary:           #7C3AED    /* Theo violet — equity */
--primary-deep:      #5B21B6    /* violet-800 — pressed */
--primary-glow:      #A78BFA    /* violet-400 — halo hover */
--primary-foreground:#FFFFFF
--secondary:         #EFECE6
--secondary-foreground:#0E0B14
--accent:            #C96442    /* burnt sienna */
--accent-deep:       #9C4A2E
--accent-foreground: #FFFFFF
--muted:             #EFECE6    /* warm muted */
--muted-foreground:  #5A5260
--border:            #1A1622    /* near-black tinted, hairline */
--input:             #E5E2DC
--ring:              #7C3AED
--success:           #16A34A
--success-foreground:#FFFFFF
--warning:           #D97706
--warning-foreground:#FFFFFF
--destructive:       #DC2626
--destructive-foreground:#FFFFFF
```

### Paleta — dark mode (dominante)

```
--background:        #0E0B14    /* charcoal violet-tinted */
--foreground:        #F5F2EE    /* warm off-white */
--card:              #15111E    /* surface raised */
--card-foreground:   #F5F2EE
--popover:           #15111E
--popover-foreground:#F5F2EE
--primary:           #7C3AED
--primary-deep:      #5B21B6
--primary-glow:      #A78BFA
--primary-foreground:#FFFFFF
--secondary:         #1A1622
--secondary-foreground:#F5F2EE
--accent:            #C96442
--accent-deep:       #9C4A2E
--accent-foreground: #FFFFFF
--muted:             #1A1622
--muted-foreground:  #9890A8
--border:            #26212F
--input:             #1A1622
--ring:              #7C3AED
--success:           #22E58C
--success-foreground:#0E0B14
--warning:           #F59E0B
--warning-foreground:#0E0B14
--destructive:       #FF4F6D
--destructive-foreground:#0E0B14
```

### Tipografia

| Família | Fonte | Uso | Pesos |
|---|---|---|---|
| Display | **Boska** | Headlines, hero, títulos de seção | 400, 500, 700, 900 |
| Body | **Switzer** | Body, UI, navegação | 400, 500, 600, 700 |
| Mono | **JetBrains Mono** | Code, paths, métricas, timestamps | 400, 500, 700 |

Ambas Boska e Switzer são da **Indian Type Foundry**, OSS, hospedadas via Fontshare. JetBrains Mono é Apache 2.0.

### Type scale

```
display-2xl: 72px / 1.0 / -0.04em  Boska Black
display-xl:  56px / 1.05 / -0.03em Boska Bold
display-lg:  44px / 1.1 / -0.025em Boska Bold
display-md:  36px / 1.15 / -0.02em Boska Medium
headline:    28px / 1.2 / -0.015em Boska Medium
title-lg:    22px / 1.3 / -0.01em  Switzer 700
title-md:    18px / 1.35 / -0.005em Switzer 600
body-lg:     17px / 1.55 / 0       Switzer 500
body-md:     15px / 1.55 / 0       Switzer 500
body-sm:     13px / 1.5 / 0        Switzer 500
label:       12px / 1.2 / 0.04em   Switzer 700
label-caps:  11px / 1.2 / 0.12em   Switzer 800 uppercase
code:        14px / 1.6 / 0        JetBrains Mono 500
code-sm:     12px / 1.6 / 0        JetBrains Mono 500
```

### Spacing scale

Base 4px (steps of 4). Tokens em `--space-N` onde N é o valor em px.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
--space-32:  128px
```

### Radii

```
--radius-none: 0px
--radius-sm:   4px      /* dense tables, utility controls */
--radius-md:   6px      /* inputs, small buttons */
--radius-lg:   10px     /* buttons, cards small */
--radius-xl:   14px     /* cards padrão */
--radius-2xl:  20px     /* hero cards, modals */
--radius-full: 9999px   /* badges, pills */
```

Mais arredondado que o brutalist antigo (6→14) para sair do "edge sharp puro" e ficar editorial.

### Elevação (sem blur exagerado)

```
--shadow-sm:    0 1px 2px 0 rgba(14,11,20,0.06)
--shadow-md:    0 2px 8px -2px rgba(14,11,20,0.08), 0 1px 3px rgba(14,11,20,0.06)
--shadow-lg:    0 12px 32px -8px rgba(14,11,20,0.12), 0 4px 12px rgba(14,11,20,0.08)
--shadow-glow:  0 0 24px rgba(124,58,237,0.25)   /* signature violet glow para CTAs */
--shadow-glow-strong: 0 0 32px rgba(124,58,237,0.4)
```

### Background textures (signature)

Dark mode: dot grid violet 6% + radial violet glow estático no canto superior do hero.

```css
.bg-dotted-violet {
  background-image: radial-gradient(rgba(124,58,237,0.08) 1px, transparent 1px);
  background-size: 20px 20px;
}

.bg-hero-glow {
  background-image: radial-gradient(
    ellipse 60% 50% at 70% 0%,
    rgba(124,58,237,0.18) 0%,
    transparent 60%
  );
}
```

Light mode: paper grain via SVG noise filter (1.5% opacidade).

### Motion

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)
--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 360ms
--stagger:       60ms
```

Padrões:
- **Hover em primary**: `box-shadow: var(--shadow-glow)` + lift -1px.
- **Active/pressed**: glow some, cor migra para `--primary-deep`, scale 0.98.
- **Card entrance**: stagger 60ms entre cards, transform `translateY(8px) → 0`, opacity `0 → 1`, duration 200ms ease-out-soft.
- **Status pulse**: `running` faz pulse de halo violet (scale 1 → 1.02 → 1, 1.5s ease-in-out infinite).

### Princípios de uso

**Faça**:
- Primary como CTA dominante na tela, **um por contexto**.
- Accent terracota para celebrar (success crítico, milestones, beta tags) — não para erro.
- Background dark com dot grid sutil — deixar visível entre cards.
- Tipografia Boska só em display sizes (≥28px) — em sizes menores cai em Switzer.
- Light mode com warm off-white, **nunca `#FFFFFF` puro**.

**Não faça**:
- Gradient roxo→magenta (território Railway).
- Yellow brutalist `#FFC700` (era o cliché do DS antigo).
- Bordas pretas 2px grossas em todo lugar (era brutalist).
- Inter, Roboto, Space Grotesk, Geist (já saturadas ou propriedade de concorrente).
- Blur shadows pesadas tipo Material — usar `--shadow-glow` violet pontual para CTAs.

---

## Alternativas consideradas (histórico)

As 3 direções abaixo foram exploradas antes da decisão pela Direção D. Permanecem documentadas para rationale futura.

### Análise das três direções

Cada direção é completa: fonte display + body + mono, paleta primária + neutros + semânticos, background, padrão de motion, tom emocional, e como se diferencia dos concorrentes.

### Direção A — "Editorial Furnace"

> Premium editorial com presença térmica. **Persimmon + cream + ink black**.

**Aposta**: dashboard de PaaS deveria ser tão refinado quanto um magazine. Tipografia editorial + paleta quente que ninguém ocupa.

#### Tipografia
- **Display**: `PP Editorial New` (Pangram Pangram) — serif contemporânea, contraste alto, italic dramático para hero.
- **Body**: `Söhne Buch` ou alternativa OSS `General Sans` — sans neutra com presence, peso 400/500/600.
- **Mono**: `Berkeley Mono` (paga) ou alternativa OSS `Departure Mono` — mono com personalidade retro-tech.

#### Paleta primária
| Token | Light | Dark | Uso |
|---|---|---|---|
| `--background` | `#FBF7F0` (cream) | `#0D0A08` (ink near-black) | Page floor |
| `--foreground` | `#0D0A08` | `#FBF7F0` | Text |
| `--primary` | `#D94B2B` (persimmon) | `#FF6B47` (persimmon glow) | CTA |
| `--primary-fg` | `#FBF7F0` | `#0D0A08` | Text on primary |
| `--accent` | `#1A1714` (ink) | `#FFD56B` (amber) | Highlight |
| `--muted` | `#EBE4D6` | `#1F1A14` | Surfaces |
| `--muted-fg` | `#5B524A` | `#A89B8C` | Secondary text |
| `--border` | `#2A241C` (warm ink) | `#3D3429` | Hard structural |
| `--ring` | `#D94B2B` | `#FF6B47` | Focus |

#### Background
- **Light**: cream `#FBF7F0` com **paper grain noise** SVG sutil (1.5% opacidade).
- **Dark**: ink `#0D0A08` com **diagonal hatch pattern** ultra-sutil para textura.

#### Motion
- Page transitions com **stagger** de 80ms entre elementos.
- Hover em cards: lift de 2px + warm shadow `0 8px 24px rgba(217,75,43,0.15)`.
- Glow no primary CTA: leve halo persimmon em focus/hover.

#### Diferenciação
- Nenhum concorrente usa serif editorial como display (Fly usa Mackinac — serif transitional, diferente perfil).
- Nenhum usa persimmon como primary (Fly tem laranja `#FD4F00` mais saturado e disperso).
- Cream como background light é único — todos os outros usam branco/cinza neutro.

#### Tom
**Premium engineering com calor humano**. Funciona para quem quer fugir de "console frio".

---

### Direção B — "Industrial Console"

> Brutalist técnico maduro. **Bone + steel + electric forest**.

**Aposta**: Theo é infraestrutura de verdade. Quer parecer um terminal industrial bem desenhado, não um SaaS brilhante.

#### Tipografia
- **Display**: `Boska` (Indian Type Foundry) — serif geométrica moderna, alto contraste, pesos extremos.
- **Body**: `Switzer` (Indian Type Foundry) — sans humanista variável, OSS, peso 400/500/600/700.
- **Mono**: `JetBrains Mono` ou `Commit Mono` — mono técnica com ligatures.

#### Paleta primária
| Token | Light | Dark | Uso |
|---|---|---|---|
| `--background` | `#E8E6E1` (bone) | `#10110F` (graphite) | Page floor |
| `--foreground` | `#10110F` | `#E8E6E1` | Text |
| `--primary` | `#0E5C3F` (forest deep) | `#00E586` (electric mint) | CTA |
| `--primary-fg` | `#E8E6E1` | `#10110F` | Text on primary |
| `--accent` | `#FFB627` (industrial amber) | `#FFB627` (same) | Highlight |
| `--muted` | `#D5D3CD` | `#1C1E1A` | Surfaces |
| `--muted-fg` | `#4A4D46` | `#8E928A` | Secondary text |
| `--border` | `#10110F` | `#2A2E26` | Hard structural |
| `--ring` | `#00E586` | `#00E586` | Focus |
| `--destructive` | `#C32A12` | `#FF4D2D` | Errors |

#### Background
- **Light**: bone `#E8E6E1` com **fine dot grid** (1px dot a cada 16px, 8% opacidade).
- **Dark**: graphite `#10110F` com **horizontal scan lines** (2px line a cada 4px, 2% opacidade) — vibe CRT.

#### Motion
- Cursor blink em status indicators (electric mint pulsa em ‘running').
- Page transitions: cortes secos sem fade — feel "compile and reload".
- Hover: shadow muda de offset 2px → 4px sem blur (brutalist sólido).

#### Diferenciação
- Forest deep `#0E5C3F` + electric mint `#00E586` — ninguém ocupa esse espaço cromático.
- Bone vs branco vs cream — bone é cinza-quente único.
- Boska + Switzer juntos = identidade tipográfica forte sem conflitar com Geist/Mackinac/Plex.

#### Tom
**Workshop de engineering, não startup**. Funciona para quem valoriza "isto funciona em produção desde 2019".

---

### Direção C — "Aurora Terminal"

> Dark-first technicolor com vidro. **Deep oceanic + aurora gradient + sharp accents**.

**Aposta**: dashboard como aurora boreal. Dark dominante (alinha com 4/6 concorrentes) mas paleta quente-fria contrastada com gradiente real, não plano.

#### Tipografia
- **Display**: `Migra` (Pangram Pangram) — display sharp, italic high-contrast, presença dramática só em hero.
- **Body**: `General Sans` — sans neutra OSS com character sutil.
- **Mono**: `Monaspace Neon` (GitHub) — mono moderna com texture sutil.

#### Paleta primária (dark-first; light é deriva)
| Token | Dark | Light | Uso |
|---|---|---|---|
| `--background` | `#0A0E1A` (deep oceanic) | `#F4F5F8` (mist) | Page floor |
| `--foreground` | `#F4F5F8` | `#0A0E1A` | Text |
| `--primary` | `#3DD9D6` (cyan-aurora) | `#0BA6A3` (cyan deep) | CTA / aurora |
| `--primary-fg` | `#0A0E1A` | `#F4F5F8` | Text on primary |
| `--accent` | `#FF5C8A` (aurora pink) | `#E83B6B` | Highlight |
| `--muted` | `#161B2B` | `#E5E7EE` | Surfaces |
| `--muted-fg` | `#8B92A8` | `#5A6275` | Secondary text |
| `--border` | `#1F2538` | `#D6DAE4` | Hairlines |
| `--ring` | `#3DD9D6` | `#0BA6A3` | Focus |

**Gradiente aurora** (signature element para hero/CTAs especiais):
```css
background: radial-gradient(
  ellipse at 30% 0%,
  #3DD9D6 0%, #6F4DFF 35%, #FF5C8A 70%, transparent 100%
);
```

#### Background
- **Dark**: oceanic `#0A0E1A` com **subtle aurora wash** SVG no canto superior (linear gradient cyan→purple→pink, 3% opacidade, blurred).
- **Light**: mist `#F4F5F8` com **micro-grid** 24px branco-quase-translúcido.

#### Motion
- Aurora gradient com **slow shift** (45s loop, hue rotate sutil).
- Cards em hover: glass effect (`backdrop-blur` + border highlight).
- Status pulse com easing customizada (cubic-bezier 0.65, 0, 0.35, 1).

#### Diferenciação
- Cyan-teal mas com personalidade aurora (não plano como Netlify).
- Migra como display dá brilho editorial sharp diferente de Mackinac (sofisticado).
- Gradiente real animado é território vazio nesse mercado (Railway tem gradiente, mas estático).

#### Tom
**Sci-fi developer console com poesia**. Funciona para audiência que gosta de produtos com "wow moment".

---

## Comparativo das 4 direções

| Critério | A — Editorial Furnace | B — Industrial Console | C — Aurora Terminal | **D — Violet Forge** |
|---|---|---|---|---|
| Modo dominante | Light cream / Dark ink | Light bone / Dark graphite | **Dark-first** | **Dark-first** |
| Cor primária | Persimmon `#D94B2B` | Forest deep `#0E5C3F` | Cyan-aurora `#3DD9D6` | **Theo violet `#7C3AED`** |
| Accent companion | Amber `#FFD56B` / Ink | Industrial amber `#FFB627` | Aurora pink `#FF5C8A` | **Burnt sienna `#C96442`** |
| Display font | PP Editorial New (serif) | Boska (serif geométrico) | Migra (display sharp) | Boska (serif geométrico) |
| Body font | Söhne / General Sans | Switzer | General Sans | Switzer |
| Mono font | Berkeley Mono / Departure | JetBrains / Commit Mono | Monaspace Neon | Berkeley / JetBrains |
| Background texture | Paper grain noise | Dot grid / scan lines | Aurora wash + micro-grid | Dot grid violet-tint + glow |
| Motion | Stagger + warm glow | Cortes secos brutalist | Aurora shift + glass | Violet glow hover + stagger |
| Tom emocional | Premium humano | Industrial maduro | Sci-fi poético | Forja premium Theo |
| Mantém equity Theo (roxo) | ❌ | ❌ | ❌ | ✅ |
| Risco | "elegante demais para infra" | "frio demais" | "gimmicky se mal executado" | "se executar mal, vira Railway clone" |
| Diferenciação dos 6 concorrentes | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ (roxo é território disputado) |
| Custo de execução (motion + sutilezas) | médio | baixo | **alto** | baixo-médio |
| Alinha com "paleta dominante" | ✅ persimmon claro | ✅ forest claro | ⚠️ gradient pode pulverizar | ✅ violet+terracota disciplinado |
| Alinha com "fontes distintivas" | ✅ PPEN + Söhne raros | ✅ Boska + Switzer raros | ✅ Migra + Monaspace raros | ✅ Boska + Switzer raros |
| Alinha com "background com textura" | ✅ paper grain | ✅ dot/scan lines | ✅ aurora wash | ✅ dot grid + radial glow |
| Alinha com "fugir de purple gradient on white" | ✅ não tem roxo | ✅ não tem roxo | ✅ não tem roxo | ✅ é dark-first com violet sólido (não gradient) e light é warm off-white (não white puro) |

---

## Recomendação

Há dois candidatos fortes dependendo do peso que dou à **equity de marca do Theo (roxo já estabelecido)**:

### Se equity de marca importa muito → **Direção D ("Violet Forge")**

1. **Mantém o roxo `#7C3AED` que já é Theo** — não joga fora reconhecimento prévio.
2. **Sai do cliché**: dark-first (não "purple on white"), light é warm off-white (não branco puro), accent é terracota `#C96442` (não yellow brutalist).
3. **Burnt sienna `#C96442` já aparece 66x nas próprias referências** — accent já validado internamente.
4. **Tipografia Boska + Switzer** rara no espaço PaaS — diferenciação tipográfica forte mesmo dividindo o roxo com Railway/Render.
5. **Risco gerenciável**: única ameaça é parecer "Railway clone se mal executado" — mas Railway usa gradient magenta+roxo com glow, enquanto Theo usaria roxo sólido + terracota + tipografia editorial. Diferenciação clara se executada com disciplina.

### Se equity não importa e queremos diferenciação máxima → **Direção B ("Industrial Console")**

1. **Maior diferenciação cromática**: forest deep + electric mint + industrial amber é território cromático genuinamente desocupado.
2. **Custo de execução mais baixo** (motion brutalist).
3. **Roxo está saturado no espaço PaaS** (Railway + Render) — fugir dele é estrategicamente válido.
4. **Trade-off**: descarta o reconhecimento de marca prévio do Theo.

### Veredito

**Direção D é minha recomendação ajustada** dado o sinal forte do usuário ("crie uma opção com o roxo do Theo") — a equity de marca é importante. Mas vale notar que **D depende de execução disciplinada** para não cair em Railway clone:
- Roxo **sólido**, não gradient.
- Accent **terracota**, não yellow/magenta.
- Background **violet-tinted charcoal**, não black neutro nem magenta-tinted (Railway).
- Tipografia **editorial** (Boska serif), não geométrica neutra.

---

## Decisão pendente

Antes de gerar `tokens.css` e prosseguir para Fase 4 (bootstrap), preciso da sua escolha entre:

- **A** (Editorial Furnace — persimmon + cream + serif editorial)
- **B** (Industrial Console — forest + bone + brutalist, sem roxo)
- **C** (Aurora Terminal — cyan-aurora + dark oceanic + gradient signature, sem roxo)
- **D** (Violet Forge — Theo violet `#7C3AED` + burnt sienna + dark-first editorial) ← **recomendado**
- **Híbrido / outra** — descreva o que ajustar.

Após sua escolha, materializo:
1. `src/styles/tokens.css` com CSS vars completas.
2. `tailwind.config.ts` consumindo as vars.
3. `docs/design-system.md` reescrito como referência única (sem as 3 direções, só a escolhida).
4. Primeiros sample swatches em Ladle (no bootstrap da Fase 4).
