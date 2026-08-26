---
"@theokit/ui": patch
---

O release deixa de precisar de um gesto manual para os seus próprios testes correrem.

A PR "Version Packages" nascia bloqueada: o GitHub não inicia workflow runs a partir de eventos
autorados por `GITHUB_TOKEN` — senão um workflow disparava-se a si próprio em ciclo — e a PR
chegava com nenhum dos checks obrigatórios a correr, sem forma de os satisfazer. Alguém tinha de
a fechar e reabrir para os disparar como evento humano, em todos os releases.

O workflow passa a emitir um token efémero de uma GitHub App. O que isso custa está dito onde é
lido: a chave privada da App é um segredo de longa duração, menor que o token pessoal que isto
evita, e a publicação no npm continua a ser OIDC sem token nenhum.
