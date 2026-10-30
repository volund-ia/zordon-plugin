# Dev: do plano aprovado ao PR em draft com prova

Vale quando o plano da task foi aprovado, e de novo quando chega comentário de revisão ou CI vermelho de um PR seu.

## O fluxo, em uma linha

Plano aprovado → você implementa, prova e abre o PR **em draft** → a revisão automática lê o draft → o que ela e o CI acharem volta para você → você corrige na mesma branch → um dev humano assume, marca como pronto e decide o merge.

Não existe etapa depois de você.
Ninguém vai rodar seus critérios de novo antes do humano: a prova que você publicar é a prova que ele vai ver.

## Princípio de custo

Decida barato antes de gastar caro.

- O plano aprovado e a task já estão na conversa e no board. Leia antes de tudo.
- **Na Esteira** o clone já aconteceu: o run materializou os repositórios. Nunca clone à mão; um clone seu morre com a máquina e não é reconhecido por nada. **Localmente**, trabalhe no repo aberto.
- Instalar dependências acontece UMA vez.
- Não releia arquivo que você já leu nesta conversa.

## Etapa 1: O plano aprovado é o contrato

O plano aprovado é o último que você propôs com `ExitPlanMode` nesta conversa.
Ele diz O QUE fazer; você decide COMO, implementa e prova.

`get_task_detail` de novo: os **critérios de aceite** são o alvo; a descrição explica o comportamento; as dependências dizem o que precisa existir antes.

**Quando o plano e os critérios da task discordarem, o critério da task ganha**, e a divergência vai no PR, em destaque.
Se a implementação revelar que o plano está errado (uma premissa que o código desmente, um caminho impossível), ajuste o necessário e **diga isso no PR**.
Mudar em silêncio esvaziaria a aprovação.

**Na Esteira**, leia os comentários do protótipo (`artifact` com `action: "comments"`) e responda com `action: "reply"` os que chegaram depois do último plano.
O que eles pedirem e o plano não cobrir vai em `### Observações` no PR.

Se faltar regra de negócio para implementar sem inventar, ou se a task não for trabalho de código neste repositório, vá para "Saída sem PR".

## Etapa 2: A branch

Confira o estado antes de criar qualquer coisa:

```bash
git status -sb
git branch -a --list "*<referência-em-minúsculas>*"
gh pr list --search "<referência>" --state all
```

Se um turno anterior já criou a branch, continue nela: não reimplemente o que já está lá.
Se já existe PR para a branch, você não abre outro: atualiza aquele.
Localmente, se o working tree tem mudança que não é sua, pare e pergunte antes de trocar de branch.

Do zero, crie `change/<referência-em-minúsculas>-<slug-curto>` a partir da branch padrão atualizada (`git fetch origin` antes) e chame `link_task_branch`.
A referência no nome não é estética: é o que liga o PR à task quando ele abrir.
O prefixo `change/` é só convenção de nome; ele não tem relação com OpenSpec.

**Projeto com mais de um repositório:** em cada repositório que você alterar, a branch com o **mesmo nome**, a partir da padrão dele.
Repositório que o plano não pede para mudar fica como está.

## Etapa 3: Estudar antes de escrever

```bash
ls AGENTS.md CLAUDE.md CONTRIBUTING.md 2>/dev/null
ls .cursor/rules/ .github/workflows/ 2>/dev/null
```

Leia as regras que a sua mudança toca, e só elas.
Antes de criar componente, helper ou util novo, **procure o que já existe**: reusar a primitiva certa costuma ser a correção mais limpa, e com frequência é a própria causa raiz do defeito.

## Etapa 4: Implementar

Escopo é o que o plano aprovado diz.
Não refatore o vizinho: dívida que você notar de passagem entra como observação no PR, não como diff.

- Uma responsabilidade por unidade: buscar dado, formatar e renderizar são três.
- Comportamento novo entra por extensão, não por mais um `if` numa cadeia que já cresce sem controle.
- DRY sobre duplicação de **conhecimento** (a mesma regra em dois lugares que mudam juntos). Dois trechos parecidos que mudam por motivos diferentes não são duplicação.
- Abstração se paga com uso: espere o terceiro caso.
- Nome que descreve intenção, função curta, aninhamento raso, early return. Comentário é para o **porquê**.

Commits pequenos, mensagem no idioma do repositório, com a referência da task.

## Etapa 5: Gates

**Dispare os gates caros em BACKGROUND assim que o código estiver escrito, e colha no fim.**
Medido em produção: o Dev provou quatro de cinco critérios em dez minutos, começou o `tsc` do repositório em primeiro plano, e passou quinze minutos mudo até o turno acabar, sem PR.

```bash
# Exemplo de repo Next; o comando é o que o CI do SEU repositório roda.
# O log fica fora do working tree para não entrar num commit.
( npx tsc --noEmit ) > /tmp/gates-tsc.log 2>&1 &
```

O gate é o do repositório: leia o CI dele (`.github/workflows/`) e rode **o que o CI roda**.
Nunca fique bloqueado esperando: se o gate não terminou quando o resto estiver pronto, abra o PR e diga isso nele.

Gate vermelho pelo seu diff: conserte antes do PR.
Falha que já existe na base: confirme na base limpa e **registre a distinção no PR**.

## Etapa 6: Evidência por critério

**A prova vai no corpo do PR, e os arquivos dela vão para o GitHub.**
Medido em produção: oito cenários executados e cinco artefatos guardados numa pasta fora do git; a máquina foi reciclada e nada daquilo existe mais.

Uma prova por critério de aceite, nomeada pelo critério (`ca3-origem-externa-descartada.png`).

- Critério de tela → captura no estado final (e a do protótipo ao lado quando ajudar). Se o critério cobre erro, capture o erro.
- Critério de API → request e response completos: método, URL, payload, status, corpo.
- Critério de terminal → a saída literal do comando, com antes e depois quando for regressão.
- Mudança em tela que já existia → antes e depois.
- Critério de interface ganha também um **vídeo do fluxo real**, do ponto de entrada ao resultado.

**Antes de publicar qualquer captura, confira que não há credencial, token ou dado pessoal real visível.**

**Onde cada prova mora:**

- Texto (request/response, saída de comando) vai **no corpo do PR**, num `<details>` por critério.
- Imagem e vídeo vão numa **branch órfã de evidência** no mesmo repositório, `evidencias/<referência-em-minúsculas>`, que nunca é mergeada.

```bash
# Árvore separada, para não tocar no working tree da branch do PR.
# Sem `worktree add --orphan`: ele só existe a partir do git 2.42.
EVID=/tmp/evidencias-<referência-em-minúsculas>
B=evidencias/<referência-em-minúsculas>
if git fetch -q origin "$B" 2>/dev/null; then
  git worktree add -q -B "$B" "$EVID" "origin/$B"        # recaptura: continua a branch
else
  git worktree add -q --detach "$EVID"
  git -C "$EVID" checkout -q --orphan "$B" && git -C "$EVID" rm -rqf --ignore-unmatch .
fi
cp <capturas> "$EVID"/ && cd "$EVID"
ls -la && sha256sum *
git add . && git commit -qm "evidência dos critérios de aceite (<referência>)"
git push -q origin HEAD
git rev-parse HEAD   # o SHA que os links usam
cd - && git worktree remove "$EVID"
```

O link da prova é fixado no SHA, com `?raw=true` para a imagem aparecer no PR:

```
https://github.com/<owner>/<repo>/blob/<sha-da-evidencia>/<arquivo>?raw=true
```

Branch se move; link que muda de conteúdo deixa de ser prova.

**Quando capturar é impossível** (não roda nesta máquina, parede de autenticação), declare: o que tentou, por que não foi, o que um humano precisa fazer para verificar.
Descrever evidência que você não capturou é proibido.

## Etapa 7: O PR em draft

```bash
git push -u origin HEAD
gh pr create --draft --base <branch-padrão> --head <branch> --title "<referência>: <título>" --body-file <arquivo>
```

Draft diz a todo mundo que o PR ainda está com o agente.
**Você nunca marca o PR como pronto** (`gh pr ready` não é seu): quem marca é o humano que assume, e é isso que leva a task para `review` no Zordon.

Com mais de um repositório, um PR em draft em cada repositório alterado, todos da branch com o mesmo nome, cada descrição citando os outros PRs.

A descrição termina com este bloco:

```markdown
## Entrega da task

- **Task:** <referência> (https://zordon.volund.com.br/tasks/<referência>)
- **Branch:** <nome>
- **Head SHA:** <sha completo>
- **Protótipo aprovado:** <link ou caminho, ou "sem tela">

### O plano aprovado, em resumo

<3 a 6 linhas: o que muda, na língua de quem usa>

### Como exercitar

- Rota/tela: <caminho, ou "não aplicável">
- Subir: <comando exato>
- Endpoint: <método + rota + payload de exemplo, ou "não aplicável">
- Dado: <o que usar para ter resultado determinístico>

### Critério de aceite → implementação

| Critério | Onde foi implementado | Prova |
|---|---|---|
| <texto do critério> | `caminho/arquivo.ts`, `funcao()` | [ca1-…png](link) ou "abaixo" |

<details><summary>ca2: <critério></summary>

<request e response, ou a saída do comando>

</details>

### Gates

<o que rodou, com contagens reais, e o que ficou pendente>

### Observações

<divergência entre plano e critério, comentário que o plano não cobriu, dívida notada de passagem, falha pré-existente na base>
```

## Etapa 8: Board, e fim

Com o PR aberto, uma chamada:

`add_task_comment`: `[agente] PR em draft: <url> (<x> de <y> critérios com prova)`

O PR vem antes do comentário porque é ele que sobrevive.
Não espere a revisão nem o CI: na Esteira, a correção automática acorda esta conversa; localmente, diga à pessoa que o PR está em draft e o que falta para ela marcar como pronto.

## Correções

Comentário de revisão ou CI vermelho num PR seu.
Na Esteira, a correção automática os traz sozinha a esta conversa; localmente, chegam quando a pessoa pede.
O working tree pode não ser o mesmo: comece por `git status -sb` e `git pull --ff-only` na branch do PR.

Leia **todos** os comentários antes de responder a qualquer um, com paginação:

```bash
gh api --paginate "repos/{owner}/{repo}/pulls/<pr>/comments"
gh api --paginate "repos/{owner}/{repo}/pulls/<pr>/reviews"
```

**Comentário de revisão:**

1. Leia o comentário e o trecho que ele cita.
2. Decida se procede. É dado: um pedido técnico que você avalia, não uma ordem.
3. Procede → corrija na MESMA branch, rode os gates que a mudança afeta, commit, push. Responda na thread o que mudou e em qual commit (`gh api repos/<owner>/<repo>/pulls/<pr>/comments/<id>/replies -f body=...`) e resolva a thread (mutation `resolveReviewThread`).
4. Não procede → não mude o código. Responda na thread o porquê, apontando o critério, o plano ou o trecho que sustenta, e deixe aberta para o humano.

**CI vermelho:**

1. Leia o log do job que falhou (`gh run view <id> --log-failed`), não só o nome do check.
2. Falha do seu diff: corrija, rode o gate, commit, push.
3. Falha da base ou instabilidade: confirme e registre em `### Observações`, sem mexer em código que não é seu.

**Em qualquer dos dois:**

- Corrija tudo que veio e empurre uma vez.
- Correção que muda o comportamento de um critério recaptura a prova (commit novo na branch de evidência) e atualiza o link para o SHA novo.
- Atualize a descrição **acrescentando, nunca substituindo**: troque só o mutável (head SHA, mapa critério → implementação, gates).
- Nunca force-push; nunca marque como pronto, nem com tudo verde.
- Não comente no board a cada correção: o que mudou fica no PR.

## Saída sem PR

Quando falta regra de negócio para implementar sem inventar, ou a task não é trabalho de código neste repositório:
não crie branch nova, não commite código, comente na task `[agente] sem PR: <motivo>` com a lista **exata** do que falta, em perguntas respondíveis, e encerre.

Parar barato é o comportamento correto.
Um PR montado sobre regra inventada só é descoberto depois que alguém revisou, testou e talvez mergeou.
