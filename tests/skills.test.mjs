// As skills do plugin contra o processo que elas descrevem.
//
// O agente lê skill como instrução: uma frase que contradiz o processo vira um
// passo que ele tenta cumprir. Estes testes impedem que a contradição passe do
// commit; sem eles, ela apareceria na primeira task real, com alguém olhando.
//
// Rodar: node --test tests/*.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const SKILLS = resolve(import.meta.dirname, "..", "plugins", "zordon", "skills");
const skill = (nome, arquivo = "SKILL.md") => readFileSync(resolve(SKILLS, nome, arquivo), "utf8");
const plano = () => skill("zordon-executar-task", "plano.md");
const dev = () => skill("zordon-executar-task", "dev.md");

/** Todo texto que o agente lê, com o caminho para a mensagem de erro. */
const textos = readdirSync(SKILLS).flatMap((s) =>
  readdirSync(resolve(SKILLS, s))
    .filter((f) => f.endsWith(".md"))
    .map((f) => [`${s}/${f}`, readFileSync(resolve(SKILLS, s, f), "utf8")]),
);

/** Do título até o próximo `## `, ignorando os que estão dentro de bloco de código. */
const secao = (texto, titulo) => {
  const ini = texto.search(titulo);
  assert.ok(ini >= 0, `seção ${titulo} sumiu`);
  const linhas = texto.slice(ini).split("\n");
  let emCodigo = false;
  const fim = linhas.findIndex((l, i) => {
    if (l.startsWith("```")) emCodigo = !emCodigo;
    return i > 0 && !emCodigo && l.startsWith("## ");
  });
  return linhas.slice(0, fim < 0 ? undefined : fim).join("\n");
};

// ── Forma ───────────────────────────────────────────────────────────────────

test("as três skills existem", () => {
  assert.deepEqual(readdirSync(SKILLS).sort(), ["zordon", "zordon-criar-task", "zordon-executar-task"]);
});

test("frontmatter com o nome da pasta e description que cabe no Volund OS", () => {
  // O Alpha é semeado destas skills, e o catálogo do Volund OS corta em 500.
  for (const nome of readdirSync(SKILLS)) {
    const fm = skill(nome).match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(fm, `${nome}: sem frontmatter`);
    assert.match(fm[1], new RegExp(`^name: ${nome}$`, "m"), `${nome}: name diferente da pasta`);
    const desc = fm[1].match(/^description: (.*)$/m)?.[1] ?? "";
    assert.ok(desc.length >= 10 && desc.length <= 500, `${nome}: description com ${desc.length} chars`);
  }
});

test("nenhum texto cita o que saiu, nem tem travessão longo", () => {
  for (const [onde, t] of textos) {
    assert.doesNotMatch(t, /\bQA\b/, `${onde} cita o QA`);
    assert.doesNotMatch(t, /\bRevisor\b/, `${onde} cita o Revisor`);
    assert.doesNotMatch(t, /pipeline/i, `${onde} cita o pipeline`);
    assert.doesNotMatch(t, /especifica[çd]/i, `${onde} fala em especificação`);
    assert.doesNotMatch(t, /esteira:(especificando|rodando|handoff)/, `${onde} cita uma tag antiga`);
    assert.doesNotMatch(t, /esteira-(contrato|plano|dev|review|qa|especificacao)\b/, `${onde} cita uma skill que saiu`);
    assert.doesNotMatch(t, /—/, `${onde} tem travessão longo`);
  }
});

test("OpenSpec só aparece para ser proibido", () => {
  // Decisão de 30/10/2026: o processo nunca usa OpenSpec. As skills dizem isso
  // com todas as letras, porque os repositórios dos projetos ainda têm
  // `openspec/` e `AGENTS.md` mandando abrir change.
  for (const nome of ["zordon", "zordon-criar-task", "zordon-executar-task"]) {
    assert.match(skill(nome), /não usa OpenSpec/, `${nome} não proíbe o OpenSpec`);
  }
  for (const [onde, t] of textos) {
    for (const linha of t.split("\n").filter((l) => /openspec|opsx/i.test(l))) {
      assert.match(
        linha,
        /(^|[^\p{L}])n[ãa]o([^\p{L}]|$)|nunca|nada de|em vez de/iu,
        `${onde} cita OpenSpec sem ser para proibir: ${linha.trim().slice(0, 80)}`,
      );
    }
  }
});

// ── A base ──────────────────────────────────────────────────────────────────

test("a base marca o texto de agente e guarda o que é do humano", () => {
  const z = skill("zordon");
  assert.match(z, /começam com `\[agente\]`/);
  assert.match(z, /Notas só em append/);
  assert.match(z, /Tags `esteira:\*`\.\*\* São do Zordon/);
  assert.match(z, /\*\*`done`\.\*\*/);
  assert.match(z, /Falha de ambiente não é veredito/);
  assert.match(z, /`refs` \(até 50\)/, "a base não ensina a ler tasks em lote");
});

// ── Criar task ──────────────────────────────────────────────────────────────

test("criar task: duplicata, código, backlog por padrão, valor por execução", () => {
  const c = skill("zordon-criar-task");
  assert.match(c, /## Passo 2: Procurar duplicata/);
  assert.match(c, /## Passo 3: Olhar o código/);
  // Medido no E2E de 30/10: a task foi para a sprint de uma vizinha sem ninguém pedir.
  assert.match(c, /Sem a pessoa pedir sprint, não passe `sprintId`/);
  // Medido no E2E de 30/10: "retorna 20 dias úteis" quando o script retornava 21.
  assert.match(c, /Valor esperado sai de execução, não de cabeça/);
  assert.match(c, /Não acrescente comportamento que a pessoa não pediu/);
  assert.match(c, /Nunca invente regra de negócio/);
});

// ── Executar task: o plano ──────────────────────────────────────────────────

test("o plano só lê, pergunta por card e termina no ExitPlanMode", () => {
  const p = plano();
  assert.match(p, /só lê/i);
  assert.match(p, /AskUserQuestion/);
  assert.match(p, /Uma lacuna, um card/);
  assert.match(p, /Nunca invente regra de negócio/);
  const fim = secao(p, /^## Etapa \d+: O plano, e o `ExitPlanMode`/m);
  assert.match(fim, /Chame `ExitPlanMode`/);
  assert.match(fim, /Na Esteira o turno termina aí/);
  assert.match(fim, /## Verificação/);
});

test("leitura da task que falha: briefing e search_entities antes de perguntar", () => {
  // TDES-T-009: o get_task_detail falhou e o agente parou pedindo para colarem a task.
  const leitura = secao(plano(), /^## Etapa 1: /m);
  assert.match(leitura, /não pare pedindo para colarem a task/i);
  assert.match(leitura, /briefing do turno/);
  assert.match(leitura, /`search_entities`/);
});

test("protótipo: artifact na Esteira, HTML fora do modo de plano no terminal", () => {
  const prototipo = secao(plano(), /^## Etapa \d+: O protótipo/m);
  const quickstart = prototipo.indexOf('`action: "quickstart"`');
  const create = prototipo.indexOf('`action: "create"`');
  const publish = prototipo.indexOf('`action: "publish"`');
  assert.ok(quickstart >= 0 && create > quickstart && publish > create, "quickstart → create → publish");
  assert.match(prototipo, /design system do produto/i);
  // Medido na CLI 2.1.312: em modo de plano só o arquivo do plano é escrito.
  assert.match(plano(), /fora\*\* do modo de plano/);
  assert.match(plano(), /prototipo\.html/);
});

test("o ajuste responde cada comentário antes de replanejar", () => {
  const ajuste = secao(plano(), /^## Pedido de ajuste/m);
  const comments = ajuste.indexOf('`action: "comments"`');
  const reply = ajuste.indexOf('`action: "reply"`');
  const exit = ajuste.indexOf("`ExitPlanMode`");
  assert.ok(comments >= 0 && reply > comments && exit > reply, "comments → reply → ExitPlanMode");
  assert.match(ajuste, /MESMO artefato/);
});

// ── Executar task: o dev ────────────────────────────────────────────────────

test("o dev parte do plano aprovado e liga a branch à task", () => {
  const d = dev();
  assert.match(d, /critério da task ganha/);
  assert.match(d, /link_task_branch/);
  assert.match(d, /change\/<referência-em-minúsculas>-<slug-curto>/);
});

test("o PR nasce draft e nunca é marcado como pronto", () => {
  const d = dev();
  assert.match(d, /gh pr create --draft/);
  assert.match(d, /nunca marca o PR como pronto/i);
  assert.match(d, /Nunca force-push/i);
});

test("gates em background, prova no PR fixada no SHA", () => {
  // Medido em produção: quinze minutos mudo no `tsc` em primeiro plano, sem PR;
  // e artefatos guardados fora do git que sumiram com a máquina.
  const gates = secao(dev(), /^## Etapa \d+: Gates/m);
  assert.match(gates, /BACKGROUND/);
  assert.match(gates, /o que o CI roda/i);
  const evid = secao(dev(), /^## Etapa \d+: Evidência por critério/m);
  assert.match(evid, /branch órfã/);
  assert.match(evid, /blob\/<sha-da-evidencia>\//);
});

test("correções: mesma branch, thread, CI, e o que não procede", () => {
  const s = secao(dev(), /^## Correções/m);
  assert.match(s, /correção automática/);
  assert.match(s, /MESMA branch/);
  assert.match(s, /thread/i);
  assert.match(s, /CI vermelho/);
  assert.match(s, /Não procede/);
});

test("o processo nunca marca critério de aceite", () => {
  // ZRDN-T-101: o agente marcou os cinco critérios no mesmo run em que abriu o PR.
  assert.match(skill("zordon-executar-task"), /Nunca chame `check_acceptance_criteria`/);
});

// ── Criar task sem pedido ───────────────────────────────────────────────────

test("sem pedido: propõe nos dois momentos e só cria com um sim", () => {
  // Decisão de 30/10/2026: medido 16% dos PRs mergeados sem task. O agente
  // propõe antes de codar algo sem task e quando a conversa combina trabalho
  // novo; nada nasce sem o sim da pessoa.
  const c = skill("zordon-criar-task");
  const fm = c.match(/^description: (.*)$/m)[1];
  assert.match(fm, /SEM pedido/, "a description não dispara a skill sem pedido");
  const s = secao(c, /^## Sem pedido: propor, e criar só com um sim/m);
  assert.match(s, /Antes de codar algo que não tem task/);
  assert.match(s, /conversa ou uma reunião combinar trabalho/);
  assert.match(s, /Só crie com um sim explícito/);
  assert.match(s, /Silêncio, "depois vejo" ou mudança de assunto são não/);
  assert.match(s, /não pergunte de novo nesta conversa/);
  assert.match(s, /link_task_branch/, "a task nova não liga a branch");
  assert.match(skill("zordon"), /propõe e só cria com um sim/, "a base não aponta para a criação sem pedido");
});

test("o hook de sessão é um echo que roda em bash, Git Bash e PowerShell", () => {
  // A CLI roda hook de comando em bash (Linux, macOS), Git Bash ou PowerShell
  // (Windows sem Git Bash). Só `echo 'texto'` é igual nos três; aspa simples,
  // $ e crase dentro do texto quebrariam um deles.
  const h = JSON.parse(readFileSync(resolve(SKILLS, "..", "hooks", "hooks.json"), "utf8"));
  const cmd = h.hooks.SessionStart[0].hooks[0].command;
  const texto = cmd.match(/^echo '(.*)'$/s)?.[1];
  assert.ok(texto, "o hook não é echo '<texto>'");
  assert.doesNotMatch(texto, /['$`]/);
  // Medido no CI (windows-latest, PowerShell): acento chega como "reposit\uFFFDrio".
  assert.match(texto, /^[\x20-\x7e]+$/, "o texto do hook tem de ser ASCII");
  assert.match(texto, /zordon-criar-task/);
  assert.equal(h.hooks.SessionStart[0].hooks[0].shell, undefined, "shell fixo quebraria um dos sistemas");
});
