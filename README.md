<div align="center">

<img src="https://raw.githubusercontent.com/usetheokit/theokit-ui/main/assets/banner.svg" alt="@theokit/ui — React components for AI-agent surfaces" width="840" />

# theokit-ui

pnpm workspace do **[@theokit/ui](packages/ui)** — biblioteca de componentes React com o design system Violet Forge, feita para superfícies de agentes de IA.

</div>

## Layout

| Caminho | O que é |
|---|---|
| [`packages/ui`](packages/ui) | O pacote publicado `@theokit/ui` — código, testes, registry, catálogo Ladle e a documentação do produto |
| `assets/` | Arte usada pelo README (a URL do banner aponta para `main/assets/`, por isso ela mora na raiz) |
| `.github/`, `.githooks/` | CI e gates locais, que valem para o repositório inteiro |

O `CHANGELOG.md` da raiz é um link para o do pacote: existe uma única fonte, e ela viaja no tarball publicado.

## Comandos

Rodados da raiz, orquestrados por Turborepo:

```bash
pnpm install            # instala o workspace inteiro
pnpm build              # turbo run build
pnpm test               # turbo run test
pnpm typecheck          # turbo run typecheck
pnpm lint               # turbo run lint
pnpm dev                # catálogo Ladle do pacote
pnpm quality:gates      # a bateria completa de gates do pacote
```

Qualquer comando específico do pacote roda direto nele:

```bash
pnpm --filter=@theokit/ui run <script>
# ou
cd packages/ui && pnpm <script>
```

## Documentação

O README do produto — instalação, componentes, temas, registry — está em **[`packages/ui/README.md`](packages/ui/README.md)**.

## Licença

Apache-2.0. Veja [LICENSE](LICENSE) e [NOTICE](NOTICE).
