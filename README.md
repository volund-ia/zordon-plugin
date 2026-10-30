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

As skills precisam do MCP do Zordon na sessão.
No `.mcp.json` do repositório, com o id do projeto:

```json
{
  "mcpServers": {
    "zordon": {
      "type": "http",
      "url": "https://zordon.volund.com.br/mcp?agent=vitoria&project=<id-do-projeto>"
    }
  }
}
```

## De onde vem

Este repositório é publicado automaticamente a partir de `agent-surface/plugin/` do repositório do Zordon, a cada merge na `main`.
Não edite aqui: a próxima publicação sobrescreve.
O Alpha da Esteira é semeado a partir das mesmas skills.
