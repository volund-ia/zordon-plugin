// O hook de início de sessão roda de verdade no Claude Code deste sistema.
//
// A CLI roda hook de comando em bash no Linux e no macOS, em Git Bash no
// Windows e, no Windows sem Git Bash, em PowerShell. O comando do hook tem de
// funcionar nos três; este teste instala o plugin num HOME vazio, abre uma
// sessão com chave de API inválida (o hook roda antes de qualquer chamada ao
// modelo) e confere a saída do SessionStart no stream.
//
// Rodar: node tests/hook-sessao.mjs [--powershell]
//   --powershell força `shell: "powershell"` no hook, o caminho do Windows sem Git Bash.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const powershell = process.argv.includes("--powershell");
const windows = process.platform === "win32";

const tmp = mkdtempSync(join(tmpdir(), "zordon-hook-"));
const home = join(tmp, "home");
const marketplace = join(tmp, "marketplace");
const repo = join(tmp, "repo");
cpSync(RAIZ, marketplace, { recursive: true, filter: (p) => !p.includes(`${join(RAIZ, ".git")}`) });

const hooksJson = join(marketplace, "plugins", "zordon", "hooks", "hooks.json");
const hooks = JSON.parse(readFileSync(hooksJson, "utf8"));
const esperado = hooks.hooks.SessionStart[0].hooks[0].command.match(/^echo '(.*)'$/s)?.[1];
assert.ok(esperado, "o hook não é um echo com aspas simples");
if (powershell) {
  hooks.hooks.SessionStart[0].hooks[0].shell = "powershell";
  writeFileSync(hooksJson, JSON.stringify(hooks, null, 2));
}

const env = {
  ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("CLAUDE") && k !== "AI_AGENT")),
  HOME: home,
  USERPROFILE: home,
  ANTHROPIC_API_KEY: "sk-ant-invalida",
};
const claude = (args, cwd) => {
  const r = spawnSync("claude", args, { cwd, env, encoding: "utf8", shell: windows, input: "", timeout: 180_000 });
  return { ...r, saida: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};

spawnSync("git", ["init", "-q", repo]);
for (const args of [["plugin", "marketplace", "add", marketplace], ["plugin", "install", "zordon@volund"]]) {
  const r = claude(args, tmp);
  assert.equal(r.status, 0, `claude ${args.join(" ")}: ${r.saida}`);
}

const sessao = claude(["-p", "oi", "--output-format", "stream-json", "--verbose"], repo);
const eventos = sessao.stdout
  .split(/\r?\n/)
  .filter((l) => l.startsWith("{"))
  .map((l) => JSON.parse(l));
const resposta = eventos.find((e) => e.subtype === "hook_response" && e.hook_event === "SessionStart");
assert.ok(resposta, `nenhum hook_response de SessionStart no stream:\n${sessao.saida.slice(0, 2000)}`);
assert.equal(resposta.outcome, "success", `hook falhou: ${JSON.stringify(resposta).slice(0, 1000)}`);
assert.equal(resposta.stdout.trim(), esperado, "o texto do hook chegou diferente (aspas, acento ou quebra)");

console.log(`ok: hook de sessão em ${process.platform}${powershell ? " (powershell)" : ""}`);
