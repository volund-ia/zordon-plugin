---
name: zordon-criar-task
description: Cria task no board do Zordon bem formada e ancorada no código do repositório - procura duplicata, lê o código que a task toca e cita o caminho, escreve critérios de aceite verificáveis e resolve sprint, story, pessoas e tags reais. Use quando pedirem "cria uma task", "abre um bug", "registra isso no Zordon/no board", "quebra isso em tasks", "joga no backlog", ou ao achar trabalho que precisa virar task. Também para backfill de trabalho já entregue.
---

# Criar task no Zordon

Carregue antes a skill `zordon`: ela tem o vocabulário e as regras de escrita.
Esta skill é o procedimento para a task sair pronta para alguém (ou um agente) pegar sem precisar perguntar o que era.

O processo não usa OpenSpec: a task é o contrato, e nada de change, proposal ou spec-delta.

## O que separa uma task boa de uma ruim

Medido nas 2.842 tasks criadas em 30 dias: as que nasceram por agente têm critérios de aceite em 78% dos casos, as da tela em 28%.
Mas só 35% das tasks de agente citam um arquivo do código.
Task de código sem o caminho do código obriga quem pega a refazer a busca que você já podia ter feito, e é onde o escopo se perde.

Uma task boa responde três perguntas sem ninguém ao lado: **o que muda para quem usa**, **onde no código**, **como saber que ficou pronto**.

## Passo 1: Entender o pedido, e o projeto

Se a pessoa não disse o projeto e a conexão não tem um, `list_projects` e pergunte qual.
Se o pedido cabe em mais de uma task (duas telas, back e front com entregas separadas, um bug e uma melhoria), diga como vai quebrar antes de criar.
Uma task é uma entrega que alguém consegue terminar e provar sozinha.

## Passo 2: Procurar duplicata

Antes de criar, sempre:

- `search_entities` com as palavras do pedido (`kinds: ["task"]`);
- `list_project_tasks` com `searchTitle` quando o termo é específico.

Achou a mesma coisa: não crie outra.
Mostre a existente e pergunte se é para editar (`edit_task`), comentar ou criar mesmo assim.
Achou uma vizinha (mesma tela, mesmo fluxo): crie, e ligue com `dependsOn` se uma precisa da outra.

## Passo 3: Olhar o código

Se a task é de código e você está num repositório do projeto, leia antes de escrever:

- ache onde o comportamento mora hoje (`grep` pelo texto da tela, pela rota, pelo nome da tabela);
- confirme que o que você vai afirmar é verdade no código atual, não na memória de alguém;
- anote o caminho e, quando ajudar, a linha ou a função: `src/app/(dashboard)/tasks/[ref]/page.tsx`, `calcularPrazo()`.

Leia o `AGENTS.md`, `CLAUDE.md` ou equivalente do repo se a task toca regra que ele descreve (banco, permissão, design system).
Não implemente nada: criar task é descrever.

Sem acesso ao código (pedido de produto puro, repo de outro time): crie assim mesmo e diga na descrição que o "Onde no código" ficou para quem pegar.

## Passo 4: Escrever

**Título:** verbo e objeto, curto, na língua de quem usa.
"Mostrar feriados na régua da sprint", não "Feriados" nem "[FRONT] Ajuste régua".
Não ponha referência, prefixo de time nem tipo no título: o board já tem campo para isso.

**Descrição** (markdown):

```markdown
## Contexto
<por que isso existe e para quem; 2 a 4 linhas. De onde veio: reunião, pedido do cliente, bug visto em produção>

## O que muda
<o comportamento esperado, do ponto de vista de quem usa>

## Onde no código
- `caminho/arquivo.ts`: <o que está lá hoje e o que muda>

## Fora de escopo
<o que alguém poderia achar que entra e não entra; omita se não houver>
```

Bug troca "O que muda" por:

```markdown
## Como reproduzir
1. <passo>

**Esperado:** <...>
**Observado:** <...> (com o erro literal, a URL, o print quando houver)
```

**Critérios de aceite:** um comportamento observável por item, que alguém consegue verificar olhando a tela, chamando a API ou rodando um comando.
Inclua o caso negativo quando ele importa (quem não pode, o que não deve acontecer).

| Ruim | Bom |
|---|---|
| "Tela funcionando" | "A régua mostra cada feriado da sprint como um ponto cinza com o nome no hover" |
| "Tratar erros" | "Sem conexão, o botão Salvar mostra 'Sem conexão. Mudança revertida' e a lista volta ao estado anterior" |
| "Permissão correta" | "Convidado do projeto recebe 403 ao chamar `PUT /api/tasks/<id>`" |

**Nunca invente regra de negócio para completar um critério.** Se o pedido não diz o que acontece num caso, escreva o critério que você tem e ponha a dúvida em "Contexto" como pergunta aberta, ou pergunte à pessoa antes de criar.

**Campos:**

**Sem a pessoa pedir sprint, não passe `sprintId`: a task nasce no backlog.**
Não copie a sprint de uma task vizinha que apareceu na busca, nem "a sprint atual" por conta própria.
Pôr task em sprint compromete a capacidade do time e, em projeto ligado ao SISP, cria demanda para o cliente; é decisão de quem planeja.
O mesmo vale para responsável, prioridade e pontos: só o que a pessoa disse.


| Campo | Regra |
|---|---|
| `type` | `feature`, `bugfix`, `refactor`, `component`, `setup`, `seed`, `documentation`, `management` |
| `sprintId` | Só se a pessoa disser a sprint ("nessa sprint" é a corrente de `list_project_sprints`). Sem isso, omita |
| `userStoryId` | Só se existe story do mesmo objetivo (`list_project_stories`). Bug avulso não tem story |
| `assigneeIds` | Só quem a pessoa nomear, resolvido em `list_project_members` |
| `tagIds` | Só tags que já existem (`list_project_tags`). Criar tag nova é decisão de vocabulário do time: pergunte |
| `priority` | Número de 0 a 4. Só se a pessoa disser |
| `functionPoints` | Só se a pessoa disser ou pedir sua estimativa; estimar é do time |
| `dependsOn` | Referências das tasks que precisam vir antes |
| `externalRef` | Quando a task vem de uma fonte com id (linha de planilha, item de ata) ou quando você pode repetir a chamada: com o mesmo valor, a task existente volta em vez de nascer outra |
| `externalVisibility` | Só em projeto ligado ao SISP, e `externa` só se a pessoa pedir que o cliente veja |

## Passo 5: Criar e conferir

`create_task`, uma chamada por task.
Depois, responda à pessoa com a referência e o link (`https://zordon.volund.com.br/tasks/<referência>`) de cada task criada, e com o que ficou de fora ou em aberto.
Se a resposta trouxer `deduped: true`, a task já existia com aquele `externalRef`: diga isso em vez de "criei".

## Backfill (trabalho já entregue)

Quando a pessoa pede para registrar algo que já foi feito:

- `status: "done"` exige `sprintId` da sprint em que foi entregue (`list_project_sprints` com `includePast: true`);
- `doneAt` com a data real da entrega, e `dueDate` do mesmo dia;
- na descrição, o link do PR ou do commit que prova a entrega.

Sem a prova da entrega, crie como `todo` e diga por quê: `done` conta na velocidade da sprint.
