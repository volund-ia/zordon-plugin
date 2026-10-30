# Plugin do Zordon

Skills que agentes leem como instrução: o Alpha da Esteira e o Claude Code de quem trabalha nos repositórios dos projetos.

- Texto em PT-BR, uma frase por linha, sem travessão longo (use " - ").
- O processo não usa OpenSpec; a palavra só aparece para proibir.
- Regra nova nasce de caso real: diga o que aconteceu (a task, o número medido) ao lado da regra.
- `description` do frontmatter com no máximo 500 caracteres (teto do catálogo do Volund OS).
- Antes do PR: `node --test tests/*.test.mjs` e `claude plugin validate plugins/zordon`.
- Mudou `zordon` ou `zordon-executar-task`: depois do merge, o seed do repositório do Zordon atualiza o Alpha.
