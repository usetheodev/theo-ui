---
"@theokit/ui": patch
---

O workflow de CI passa a se chamar `ci.yml`, como nos seis repositórios irmãos.

Era o último nome fora do padrão do framework: `quality-gates.yml` com job `quality:gates`, onde
todos os outros usam `ci.yml` com um job `Verify`. Renomear o job renomeia o status check que o
branch protection exige, então a proteção de `main` e de `develop` foi atualizada no mesmo passo —
sem isso, toda PR aberta ficaria esperando por um check que nunca mais reportaria.
