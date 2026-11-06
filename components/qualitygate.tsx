"use client";

import { useState } from "react";
import type { Comparison } from "../lib/qualitygate/engine";
import { scenarios, type Scenario } from "../lib/qualitygate/scenarios";

const repo = "https://github.com/raphaelkaych/farol-de-integracoes";

function Evidence({ title, result }: { title: string; result: Comparison["control"] }) {
  return (
    <article className="lab-panel qa-evidence" aria-label={title}>
      <div className="panel-heading">
        <h3>{title}</h3>
        <span className="pill" data-status={result.conforms ? "entregue" : "dlq"}>
          {result.conforms ? "Regra respeitada" : "Regra violada"}
        </span>
      </div>
      <ol className="qa-responses">
        {result.responses.map((response, index) => (
          <li key={index}>
            <code>HTTP {response.code}</code><span>{response.reason}</span>
            {response.receipt && <small>{response.receipt}</small>}
          </li>
        ))}
      </ol>
      <dl className="qa-metrics">
        <div><dt>Estoque final</dt><dd>{result.inventory.available}</dd></div>
        <div><dt>Reservas gravadas</dt><dd>{result.inventory.receipts.length}</dd></div>
      </dl>
    </article>
  );
}

export function QualityGate() {
  const [scenario, setScenario] = useState<Scenario>("stock");
  const [result, setResult] = useState<Comparison>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setPending(true);
    setError("");
    setResult(undefined);
    try {
      const response = await fetch("/api/qualitygate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }),
      });
      if (!response.ok) throw new Error("check failed");
      setResult(await response.json() as Comparison);
    } catch {
      setError("A API não respondeu. Tente executar a comparação novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="lab-panel" aria-labelledby="qa-scenarios">
        <h2 id="qa-scenarios">Cenários de teste</h2>
        <fieldset className="scenario-options" disabled={pending}>
          <legend className="sr-only">Selecione um cenário</legend>
          {(Object.keys(scenarios) as Scenario[]).map((key, index) => (
            <label key={key} className="scenario" data-selected={scenario === key}>
              <input type="radio" name="qa-scenario" value={key} checked={scenario === key}
                onChange={() => { setScenario(key); setResult(undefined); setError(""); }} />
              <span className="scenario-copy">
                <small>0{index + 1} / CENÁRIO</small>
                <strong>{scenarios[key].name}</strong>
                <span>{scenarios[key].premise}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="lab-guide"><strong>Regra esperada</strong> {scenarios[scenario].invariant}</p>
        <button className="button button-primary" type="button" onClick={run} disabled={pending}>
          {pending ? "Executando…" : "Executar comparação"}
        </button>
        <p className="lab-feedback" role="status">
          {error || (result ? "Comparação concluída. Os resultados estão abaixo." : "")}
        </p>
      </section>
      {result && (
        <section className="qa-results" aria-labelledby="qa-results-title">
          <h2 id="qa-results-title">Resultado da execução</h2>
          <p className="lab-meta">{scenarios[result.scenario].defect} Os códigos abaixo são retornos do serviço de reserva exercitado pela API.</p>
          <div className="lab-grid">
            <Evidence title="Implementação de referência" result={result.control} />
            <Evidence title="Implementação com defeito" result={result.injected} />
          </div>
        </section>
      )}
      <section className="lab-panel qa-proof" aria-labelledby="qa-ci">
        <div>
          <p className="eyebrow">EVIDÊNCIA / GITHUB ACTIONS</p>
          <h2 id="qa-ci">Histórico e artefatos de CI</h2>
          <p className="lab-meta">A comparação acima executa uma regra na API. O pipeline roda a suíte automatizada e publica os relatórios e o trace do cenário com falha esperada.</p>
        </div>
        <a className="button button-outline" href={repo + "/actions/workflows/validar.yml"}>Ver execuções de CI ↗</a>
      </section>
    </>
  );
}
