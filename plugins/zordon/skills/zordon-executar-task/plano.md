# Plano: da task ao plano aprovado, com protótipo quando há tela

Vale enquanto o plano da task não foi aprovado: no primeiro turno e em todo pedido de ajuste.
Depois da aprovação, siga [dev.md](dev.md).

## O que você entrega

Um plano em markdown, proposto com `ExitPlanMode`, e, quando a task tem tela, um protótipo.
A pessoa lê os dois, comenta, e aprova ou pede ajuste.

Nesta fase você só lê o repositório: nada de editar código, commitar, criar branch, abrir PR ou escrever no board.
A única escrita permitida é a do protótipo, fora do repositório.

**Na Esteira** o turno já chega em modo de plano, e o protótipo vai em `~/.claude/plans/<pasta>/`, publicado pela tool `artifact`.

**No Claude Code local** o modo de plano só deixa escrever o arquivo do plano (medido na CLI 2.1.312: a escrita do protótipo é recusada).
Por isso a ordem é: explore e desenhe o protótipo **fora** do modo de plano, sem tocar no repositório, e entre em modo de plano (`EnterPlanMode`) só para escrever o plano e chamar `ExitPlanMode`.
Se a sessão já começou em modo de plano e a task tem tela, peça à pessoa para sair dele (Shift+Tab) enquanto você desenha o protótipo, ou siga sem protótipo e diga isso no plano.
Sem `EnterPlanMode`/`ExitPlanMode` na sessão (modo não interativo), escreva o plano na resposta e pare pedindo aprovação.

## Etapa 1: Ler a task, e separar o que dá do que não dá

`get_task_detail` com a referência.
O que importa: descrição, critérios de aceite, dependências (`get_dependency_graph` quando houver), tipo e story (`get_story_detail` quando a task pertence a uma).

Se `get_task_detail` falhar, não pare pedindo para colarem a task.
Na Esteira, o briefing do turno já traz a referência e o título: comece por eles.
Tente `search_entities` com a referência e, sem resultado, com o título.
Só pergunte à pessoa se nada disso funcionar, e diga na pergunta o que tentou.

Separe, explicitamente, em duas listas:

- o que você consegue planejar **só com o texto da task e o código**;
- o que depende de decisão que o texto não tomou.

Diga as duas na conversa, curto, antes de seguir.
É isso que faz a pessoa saber onde ela é necessária.

## Etapa 2: Explorar o repositório, só lendo

O repositório carrega as próprias regras.
Leia primeiro o que diz como ele funciona, e só o que a task toca:

```bash
ls AGENTS.md CLAUDE.md CONTRIBUTING.md DESIGN.md 2>/dev/null
ls .cursor/rules/ .github/workflows/ 2>/dev/null
```

Instrução do repo que mande abrir change OpenSpec não vale para este processo (ver a skill).

Ache o código que a task muda e o que já existe de parecido: a tela mais próxima, o helper que já resolve metade, o teste vizinho.
Um plano que reusa a peça certa é menor e erra menos.
Confira cada caminho que a task cita: citação velha é comum, e barata de pegar agora.

Projeto com mais de um repositório: diga no plano em qual repositório cada mudança acontece.
Na Esteira todos estão no sandbox; localmente, leia os que estiverem clonados e pergunte pelos outros se o plano depender deles.

## Etapa 3: Perguntar o que falta, por card

Para cada lacuna, `AskUserQuestion`: uma pergunta por decisão, com opções de verdade diferentes entre si, e cada uma dizendo a consequência.
Sem a tool na sessão, pergunte em texto, numeradas, uma decisão por item.

- **A pergunta é sobre PRODUTO, não sobre implementação.** "Redireciona ou devolve 401?" é pergunta. "Uso middleware ou route handler?" não é: isso é decisão sua.
- **Nunca pergunte o que o texto ou o código respondem.** Perguntar o que está escrito ensina a pessoa a ignorar seus cards, e transforma em "decisão dela" algo que as fontes já decidiram.
- **Uma lacuna, um card.** Empilhar decisões faz a pessoa escolher no agregado.
- **A opção que você recomenda vem primeiro**, com o motivo na descrição.

Se a pessoa disser "decide você", siga com a melhor decisão e **declare a premissa** no plano.
Premissa não declarada é a que ninguém revisa.

**Nunca invente regra de negócio para não parar.**
Onde a task e o código são silenciosos, o silêncio é lacuna, não licença: pergunte, ou escolha o caminho mais restritivo e declare.

## Etapa 4: O protótipo, quando a task tem tela

Task que cria ou muda tela ganha protótipo.
Task sem tela (API, job, migração) não ganha: diga isso no plano e siga.

O que o protótipo precisa ter, em qualquer casa:

- **O design system do produto, e não um seu.** Leia o `DESIGN.md` (ou equivalente) e os tokens do repositório, e copie as peças da tela mais parecida que já existe: cabeçalho, lista, botão, chip, campo. Peça inventada é o que a pessoa reprova primeiro.
- **Uma prancheta por estado que importa**: vazio, com dado, erro, carregando quando ele aparece de verdade, celular quando a tela é usada no celular. O título diz o estado ("Lista com feriados", "Sem feriados").
- **Dado com cara de dado real** do domínio da task, nunca "Lorem ipsum".

**Na Esteira (tool `artifact`):**

1. `artifact` com `action: "quickstart"` e `intent: "design"`. Siga o formato que ele responder, não um de memória.
2. `artifact` com `action: "create"` para abrir o artefato.
3. Escreva os arquivos em `~/.claude/plans/<pasta-com-a-referência>/`, o único lugar em que o modo de plano deixa escrever.
4. `artifact` com `action: "publish"` e o `root` nessa pasta.

**No Claude Code local:**

1. Um HTML único e autocontido em `~/.claude/plans/<referência>/prototipo.html`, com os tokens do repo copiados para um `<style>` e as pranchetas lado a lado, cada uma com o título do estado.
2. Nada dentro do repositório.
3. Diga à pessoa o caminho para abrir no navegador.

Cite o protótipo no plano: onde ele está e o que cada prancheta mostra.

## Etapa 5: O plano, e o `ExitPlanMode`

O plano é markdown, curto, nesta ordem:

```markdown
# <título da task, em uma linha>

## Contexto
<por que a task existe e o que muda para quem usa, em 2 a 4 linhas>

## O que muda
- <comportamento novo ou alterado, um por item, na língua de quem usa>

## Protótipo
<onde está e o que cada prancheta mostra; ou "sem tela, sem protótipo">

## Arquivos
- `caminho/arquivo.ts`: <o que muda nele>
- <repositório>: <quando houver mais de um>

## Verificação
| Critério de aceite | Como vai ser provado |
|---|---|
| <texto do critério, igual ao da task> | <captura da tela, request e response, saída de comando> |

## Premissas e perguntas
<o que você decidiu sem a pessoa, e por quê; o que ficou em aberto>
```

Um critério de aceite por linha da verificação, com o mesmo conteúdo da task.
Afrouxar um critério ao copiá-lo afrouxa a prova da entrega inteira.

Chame `ExitPlanMode` com o plano.
**Na Esteira o turno termina aí**: o Zordon mostra o plano e o protótipo à pessoa.
Não escreva nada depois, não repita o plano no texto e não comece a implementar.
**Localmente**, a pessoa aprova ou recusa ali mesmo; aprovado, siga [dev.md](dev.md) na mesma sessão.

## Pedido de ajuste

O ajuste chega como mensagem nova, ainda na fase de plano (na Esteira, com a nota de quem recusou).

1. **Na Esteira**, leia os comentários do protótipo: `artifact` com `action: "comments"`. Comentário feito pelo Zordon vem marcado com a origem; todos contam.
2. Responda **cada** comentário com `artifact` e `action: "reply"`: o que muda por causa dele, ou por que não muda. Localmente, responda cada ponto da pessoa na conversa.
3. Refaça o que a nota e os comentários pedem: o protótipo no mesmo lugar (na Esteira, publicado de novo no MESMO artefato, versão nova) e o plano.
4. `ExitPlanMode` com o plano novo, dizendo na primeira linha o que mudou desde o anterior.

Quando o ajuste revelar que um critério de aceite da task está errado ou incompleto, diga isso no plano com o texto corrigido, para a pessoa ajustar na task.
A entrega é medida contra os critérios da task.

## Quando parar e devolver, sem plano

| Situação | O que fazer |
|---|---|
| Não é trabalho de código | diga o porquê e pare |
| Falta regra de negócio, e a pessoa não respondeu | liste as perguntas em aberto e pare |
| Escopo grande demais para uma task (arquitetura, migração de dado de risco) | diga que precisa de desenho humano e pare |
| Dependência não concluída que precisa vir antes | nomeie a dependência e pare |

Parar barato é o comportamento correto.
Um plano inventado só é descoberto depois que já virou código.
