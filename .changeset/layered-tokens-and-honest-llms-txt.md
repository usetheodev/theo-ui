---
"@theokit/ui": minor
---

Tokens do design system passam a ser sobrescritíveis pelo consumidor, e a documentação passa a
descrever a API que existe.

**Theming (usetheokit/theokit-ui#72).** A paleta (`:root` e `.dark` em `tokens.css`) estava fora de
qualquer cascade layer. CSS sem layer vence todas as regras dentro de layers, independentemente da
especificidade — por isso um consumidor não conseguia sobrescrever um único token a partir da sua
própria folha de estilos: nem com `@layer base`, nem repetindo o nosso seletor (o pacote é injetado
duas vezes, e a ordem do documento favorecia-nos). O modo de falha era silencioso: `var(--card)`
continuava a resolver, para o NOSSO valor, e uma app podia correr no tema errado sem que nada o
denunciasse.

A paleta passa a ser declarada em `@layer theme` — a primeira da ordem canónica que este pacote já
publicava. Continua a aplicar-se ao nível do documento e continua a preceder o preflight, mas agora
o consumidor ganha por omissão. Os blocos de `forced-colors` (WCAG 1.4.1) e `prefers-reduced-motion`
(WCAG 2.3.3) permanecem deliberadamente fora de layer: acessibilidade não é negociável por paleta.

**Documentação (usetheokit/theokit-ui#73).** O `llms.txt` — que se declara "factual ground truth" —
documentava `<ThemeProvider initial=… extra=…>` e `defineTheme({ mode, palette })`: quatro nomes que
nunca existiram, o que faz o código escrito a partir dele não compilar. Também dizia 10 temas com 11
publicados, e a versão estava duas minor atrás. Além disso, nada nesse ficheiro mencionava
`@usetheo/ui`, onde vivem os primitivos genéricos (`Sidebar`, `DataTable`, `Select`, `Badge`,
`EmptyState`…) — um leitor à procura deles reescrevia-os à mão.

Corrigido, e coberto por testes: `scripts/llms-txt.test.ts` compara as props documentadas com as
declaradas no código, a contagem de temas com `builtinThemes` e a versão com o `package.json`.
`src/styles/token-override.test.ts` garante que nenhum token de paleta volta a ser emitido fora de
uma layer.
