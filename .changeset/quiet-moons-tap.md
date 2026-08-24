---
"@theokit/ui": patch
---

A PR de versão deixa de nascer reprovando o próprio gate de formatação.

`changeset version` reescreve `packages/ui/package.json` com a formatação dele, que expande
`sideEffects` em três linhas onde o Biome quer uma. Como `format:check` é o primeiro passo de
`quality:gates`, toda PR "Version Packages" falhava ali antes de exercitar qualquer outra coisa —
não por um defeito no pacote, mas pelo formatador discordando de quem escreveu o arquivo.

`version-packages` passa a rodar o formatador sobre o manifesto que acabou de reescrever.
