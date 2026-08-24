---
"@theokit/ui": patch
---

O release volta a escrever a própria tag.

A 1.4.2 foi publicada no npm corretamente, mas chegou lá sem tag no git e sem GitHub release — o
mesmo sintoma que usetheokit/theokit-ui#46 descreve, por uma causa nova. O `changesets/action`
descobre o que foi publicado lendo a saída de `changeset publish`, e o `@changesets/cli@3.x`
mudou esse formato: o action concluiu que nada tinha sido publicado, não empurrou as tags, não
criou o release, e mesmo assim terminou com sucesso.

A dependência passa a acompanhar o `^2.31.0` que os cinco repositórios irmãos usam, que é o par
que o action sabe ler. A tag `v1.4.2` e o release correspondente foram criados à mão; a partir
daqui o ciclo se fecha sozinho.
