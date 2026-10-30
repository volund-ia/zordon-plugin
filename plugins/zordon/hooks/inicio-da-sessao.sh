#!/bin/sh
# SessionStart: lembra o agente de que este repositório é ligado ao Zordon.
#
# Sem isso, a criação de task sem pedido nunca dispara: num pedido de código
# ("faz o X aceitar Y") nada lembra o board, e a skill não é carregada (medido
# com o Claude Code 2.1.312 em 30/10/2026: o agente codou direto).
#
# Fica em silêncio fora de repositório git e em repositório sem o MCP do Zordon
# no .mcp.json. O que imprime vira contexto da sessão.
raiz=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
grep -qs "zordon.volund.com.br" "$raiz/.mcp.json" || exit 0

branch=$(git -C "$raiz" branch --show-current 2>/dev/null)
ref=$(printf '%s' "$branch" | grep -oiE '[A-Z][A-Z0-9]{1,3}-T-[0-9]+' | head -n 1 | tr 'a-z' 'A-Z')

if [ -n "$ref" ]; then
  echo "Zordon: este repositório é ligado ao board, e a branch atual ($branch) é da task $ref. Trabalho dessa task segue nela; trabalho de código que não é dela pede outra task (zordon-criar-task, \"Sem pedido\")."
else
  echo "Zordon: este repositório é ligado ao board, e a branch atual (${branch:-sem branch}) não tem referência de task."
  echo "Se esta sessão for editar código, antes da primeira edição siga a skill zordon-criar-task, seção \"Sem pedido\": procure a task e, se não existir, proponha e só crie com um sim."
fi
echo "Se a conversa combinar trabalho que ainda não está no board, proponha a task do mesmo jeito (zordon-criar-task, \"Sem pedido\")."
