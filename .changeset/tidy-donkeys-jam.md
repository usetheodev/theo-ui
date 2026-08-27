---
"@theokit/ui": patch
---

O gate de contrato do barrel deixa de falhar por um motivo diferente do que mede.

Cada um dos dois casos carregava o barrel compilado por conta própria, sob o timeout que o vitest
dimensiona para testes unitários. Sob contenção de runner isso estourava: quatro falhas, todas no
branch com mais pushes simultâneos, enquanto os demais passavam — e a mensagem dizia "Test timed
out", que soa a infraestrutura e convida a re-executar em vez de olhar. Um gate que as pessoas
aprendem a re-executar deixou de ser um gate, e este mede algo real: um símbolo em falta aqui é um
consumidor com o build já partido.

O import passa a acontecer uma vez, com um teto proporcional ao que ele faz. O teto não existe para
acomodar lentidão — se este import passar mesmo a demorar um minuto, isso é um defeito e o teto
apanha-o.
