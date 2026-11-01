# Plugin do Zordon para Claude Code

Skills para agentes trabalharem no board do [Zordon](https://zordon.volund.com.br) pelo MCP dele.

| Skill | Para quê |
|---|---|
| `zordon` | Base: vocabulário do board, como ler barato, o que nunca é do agente |
| `zordon-criar-task` | Task bem formada: procura duplicata, lê o código e cita o caminho, critérios verificáveis |
| `zordon-executar-task` | O processo do Alpha da Esteira: plano com protótipo, dev, PR em draft com prova por critério |

O processo não usa OpenSpec.

## Ligar num repositório de projeto

No `.claude/settings.json` do repositório:

```json
{
  "extraKnownMarketplaces": {
    "volund": {
      "source": { "source": "github", "repo": "volund-ia/zordon-plugin" }
    }
  },
  "enabledPlugins": {
    "zordon@volund": true
  }
}
```

Quem abrir o Claude Code no repositório recebe o pedido para confiar no marketplace e instalar o plugin.
À mão: `claude plugin marketplace add volund-ia/zordon-plugin` e `claude plugin install zordon@volund`.

O plugin traz o MCP do Zordon (`plugins/zordon/.mcp.json`), numa URL sem projeto fixo, igual para todo repositório.
Na primeira sessão, a pessoa autentica pelo `/mcp` do Claude Code.

Quem diz o projeto é o repositório: o agente roda `git remote get-url origin` e chama `list_projects` com `repo`, que devolve os projetos ligados a ele.
Para isso o repositório precisa estar ligado ao projeto no Zordon (Editar projeto, Repositórios).
Repositório sem projeto ligado: o agente pergunta o projeto quando a pessoa pede trabalho no board, e não faz nada sem pedido.

O `.mcp.json` do repositório com `project=<id>` na URL deixa de ser necessário.

## Este repositório é a fonte

Editar uma skill é um PR aqui.
O CI roda `node --test tests/*.test.mjs` (as skills contra o processo) e o `claude plugin validate`.
Cada commit na `main` vira uma versão nova: quem já tem o plugin recebe com `claude plugin update zordon@volund` ou no próximo início do Claude Code.

O Alpha da Esteira (Volund OS) usa as mesmas skills `zordon` e `zordon-executar-task`.
Quem semeia é o `scripts/esteira/seed.mjs` do repositório do Zordon, que lê este repositório na `main`; depois de mudar uma dessas skills, rode o seed para o Alpha pegar a versão nova.
