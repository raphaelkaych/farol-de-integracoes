"use client";

import { useRef, useState } from "react";
import { validReleaseWindow, type Actor, type ChangeInput, type Sandbox } from "../lib/contractshield/contract";
import { useBrowserReady } from "./use-browser-ready";

const scenarios = {
  registrar: { title: "Registrar mudança", expected: "POST · HTTP 201 · mudança registrada" },
  externo: { title: "Consultar objeto de outro escopo", expected: "GET com credencial externa · HTTP 404" },
  leitor: { title: "Escrever como leitor", expected: "POST com perfil leitor · HTTP 403" },
  campo: { title: "Injetar propriedade protegida", expected: "POST com organization · HTTP 422" },
  reenvio: { title: "Reenvio concorrente", expected: "Dois POST com a mesma chave · HTTP 201 e 200 · um ID" },
  versao: { title: "Consultar contrato v2", expected: "GET ?version=2 · HTTP 200 · revision adicionada" },
  limite: { title: "Ultrapassar limite do corpo", expected: "POST com mais de 2 KiB · HTTP 413" },
};
type Scenario = keyof typeof scenarios;
type Result = { method: "GET" | "POST"; actor: Actor; url: string; status: number; body: Record<string, unknown> };

async function call(sandbox: Sandbox, actor: Actor, url: string, body?: object, key: string = crypto.randomUUID()): Promise<Result> {
  const method = body === undefined ? "GET" : "POST";
  const headers = new Headers({ Authorization: "Bearer " + sandbox.actors[actor] });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    headers.set("Idempotency-Key", key);
  }
  const response = await fetch(url, { method, headers, body: body && JSON.stringify(body) });
  return { method, actor, url, status: response.status, body: await response.json() as Result["body"] };
}

async function experiment(sandbox: Sandbox, scenario: Scenario, input: ChangeInput) {
  const endpoint = "/api/contractshield/changes";
  const valid = { service: "catalogo", releaseWindow: "comercial" };
  if (scenario === "reenvio") {
    const key = crypto.randomUUID();
    const results = await Promise.all([call(sandbox, "operador", endpoint, valid, key), call(sandbox, "operador", endpoint, valid, key)]);
    const statuses = results.map(({ status }) => status).sort();
    const passed = statuses[0] === 200 && statuses[1] === 201 && results[0].body.id === results[1].body.id;
    return { results, passed };
  }
  if (scenario === "externo" || scenario === "versao") {
    const seed = await call(sandbox, "operador", endpoint, valid);
    if (seed.status !== 201 || typeof seed.body.id !== "string") return { results: [seed], passed: false };
    const outside = scenario === "externo";
    const result = await call(sandbox, outside ? "externo" : "operador", endpoint + "?id=" + encodeURIComponent(seed.body.id) + (outside ? "" : "&version=2"));
    const passed = outside ? result.status === 404 : result.status === 200 && result.body.revision === 1 && result.body.id === seed.body.id;
    return { results: [seed, result], passed };
  }

  const actor = scenario === "leitor" ? "leitor" : "operador";
  const body = scenario === "campo" ? { ...valid, organization: "orbita" }
    : scenario === "limite" ? { ...valid, padding: "x".repeat(2049) }
    : scenario === "registrar" ? input : valid;
  const expected = { registrar: validReleaseWindow(input) ? 201 : 422, leitor: 403, campo: 422, limite: 413 }[scenario];
  const result = await call(sandbox, actor, endpoint, body);
  return { results: [result], passed: result.status === expected };
}

export function ContractShield() {
  const ready = useBrowserReady();
  const sandbox = useRef<Sandbox>(null);
  const [scenario, setScenario] = useState<Scenario>("externo");
  const [input, setInput] = useState<ChangeInput>({ service: "catalogo", releaseWindow: "comercial" });
  const [result, setResult] = useState<Awaited<ReturnType<typeof experiment>>>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setPending(true); setError(""); setResult(undefined);
    try {
      if (!sandbox.current || sandbox.current.expiresAt <= Date.now()) {
        const response = await fetch("/api/contractshield/session", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
        });
        if (!response.ok) throw new Error("session");
        sandbox.current = await response.json() as Sandbox;
      }
      setResult(await experiment(sandbox.current, scenario, input));
    } catch {
      setError("A API não respondeu. Abra outra sessão ou tente novamente em instantes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="contract-grid">
      <section className="lab-panel contract-controls" aria-labelledby="contract-operation">
        <p className="eyebrow">01 / OPERAÇÃO</p>
        <h2 id="contract-operation">Escolha um cenário</h2>
        <label>Operação<select disabled={!ready || pending} value={scenario}
          onChange={(event) => { setScenario(event.target.value as Scenario); setResult(undefined); setError(""); }}>
          {(Object.keys(scenarios) as Scenario[]).map((key) => <option key={key} value={key}>{scenarios[key].title}</option>)}
        </select></label>
        {scenario === "registrar" && <div className="contract-fields">
          <label>Serviço<select disabled={!ready || pending} value={input.service}
            onChange={(event) => { setInput({ ...input, service: event.target.value as ChangeInput["service"] }); setResult(undefined); }}>
            <option value="catalogo">Catálogo</option><option value="notificacoes">Notificações</option><option value="cobranca">Cobrança</option>
          </select></label>
          <label>Janela<select disabled={!ready || pending} value={input.releaseWindow}
            onChange={(event) => { setInput({ ...input, releaseWindow: event.target.value as ChangeInput["releaseWindow"] }); setResult(undefined); }}>
            <option value="comercial">Comercial</option><option value="noturna">Noturna</option>
          </select></label>
        </div>}
        <p className="lab-guide"><strong>Contrato esperado</strong><br />{scenario === "registrar" && !validReleaseWindow(input)
          ? "HTTP 422 · cobrança exige janela noturna" : scenarios[scenario].expected}</p>
        <div className="links">
          <button className="button button-primary" type="button" disabled={!ready || pending} onClick={() => void run()}>{pending ? "Executando…" : "Executar requisição"}</button>
          <button className="button button-outline" type="button" disabled={!ready || pending} onClick={() => {
            sandbox.current = null; setResult(undefined); setError("");
          }}>Reiniciar sessão</button>
        </div>
        <p className="lab-meta">As operações usam dados fictícios. As credenciais expiram em 15 minutos.</p>
        {result && <a className="text-link" href="#contract-response">Ir para a resposta ↓</a>}
        <a className="text-link" href="/contractshield.openapi.json">Ler contrato OpenAPI ↗</a>
      </section>
      <section className="lab-panel" aria-labelledby="contract-response">
        <p className="eyebrow">02 / RESPOSTA DA API</p>
        <h2 id="contract-response">Inspecione o retorno</h2>
        <p className="lab-feedback" role="status">{pending ? "Consultando a API…" : error || (result ? (result.passed ? "Comportamento esperado verificado." : "Resposta diferente da expectativa do cenário.") : "Execute um cenário para ver as respostas HTTP.")}</p>
        {result?.results.map((item, index) => (
          <figure className="code-sample contract-response" key={index}>
            <figcaption>{item.method} · {item.actor} · HTTP {item.status}</figcaption>
            <p className="lab-meta"><code>{item.url}</code></p>
            <pre><code>{JSON.stringify(item.body, null, 2)}</code></pre>
          </figure>
        ))}
        {scenario === "externo" && (
          <details className="return-contract">
            <summary>Ver exemplo de regressão</summary>
            <p className="lab-meta">Exemplo simulado · HTTP 200 para uma credencial de outra organização indicaria exposição indevida. Neste cenário, o teste exige HTTP 404.</p>
          </details>
        )}
      </section>
    </div>
  );
}
