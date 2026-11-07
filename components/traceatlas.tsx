"use client";

import { useState } from "react";
import { scenarios, type Scenario, type Span, type Trace, type TraceRun } from "../lib/traceatlas/model";
import { useBrowserReady } from "./use-browser-ready";

const hasError = (trace: Trace) => trace.spans.some((span) => span.status === "erro");

function Timeline({ trace }: { trace: Trace }) {
  const [selected, setSelected] = useState<Span | null>(null);
  const depth = (item: Span) => item.parent === null ? 0 : item.parent === "gateway" ? 1 : item.parent === "api" ? 2 : 3;

  return (
    <section className="lab-panel trace-timeline" aria-labelledby="trace-timeline-title">
      <h2 id="trace-timeline-title">Linha do tempo</h2>
      <p className="lab-meta">Cada barra indica o início e a duração de uma etapa no relógio simulado.</p>
      <ol className="trace-spans">
        {trace.spans.map((item) => (
          <li key={item.id}>
            <button className="span-row" type="button" aria-pressed={selected?.id === item.id}
              onClick={() => setSelected(item)}>
              <span className="span-service" style={{ paddingInlineStart: depth(item) * 8 }}>
                <strong>{item.service}</strong> <span>{item.operation}</span>
                {item.status === "erro" && <span className="trace-fault">Falha</span>}
              </span>
              <span className="span-track" aria-hidden="true"><i data-state={item.status}
                style={{ left: item.startMs / trace.durationMs * 100 + "%", width: item.durationMs / trace.durationMs * 100 + "%" }} /></span>
              <code>{item.durationMs} ms</code>
            </button>
          </li>
        ))}
      </ol>
      {selected && <p className="lab-guide" role="status">
        <strong>{selected.service}</strong> +{selected.startMs} ms · HTTP {selected.code} · pai {selected.parent ?? "raiz"}
      </p>}
      <details className="trace-log">
        <summary>Ver logs correlacionados</summary>
        <p className="lab-meta"><code>{trace.id}</code></p>
        <ol className="audit-list">{trace.logs.map((log) => <li key={log.spanId}>
          <code>+{log.atMs} ms</code><span><strong>{log.level}</strong> · {log.text}</span>
        </li>)}</ol>
      </details>
    </section>
  );
}

export function TraceAtlas() {
  const ready = useBrowserReady();
  const [scenario, setScenario] = useState<Scenario>("db-lento");
  const [run, setRun] = useState<TraceRun>();
  const [traceId, setTraceId] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function execute() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/traceatlas", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }),
      });
      if (!response.ok) throw new Error("trace");
      const result = await response.json() as TraceRun;
      setRun(result);
      setErrorsOnly(false);
      setTraceId((result.traces.find(hasError) ?? result.traces[0]).id);
    } catch {
      setError("A API não respondeu. Tente executar o cenário novamente.");
    } finally {
      setPending(false);
    }
  }

  const visible = run?.traces.filter((trace) => !errorsOnly || hasError(trace)) ?? [];
  const selected = visible.find((trace) => trace.id === traceId) ?? visible[0];

  return (
    <>
      <section className="lab-panel" aria-labelledby="trace-scenario-title">
        <div className="panel-heading"><h2 id="trace-scenario-title">Cenário de investigação</h2><span className="pill">Telemetria simulada</span></div>
        <div className="demo-form">
          <div className="trace-scenario-field">
            <label htmlFor="trace-scenario">Cenário</label>
            <select id="trace-scenario" value={scenario} onChange={(event) => setScenario(event.target.value as Scenario)} disabled={!ready || pending}>
              {(Object.keys(scenarios) as Scenario[]).map((key) => <option value={key} key={key}>{scenarios[key].title}</option>)}
            </select>
          </div>
          <button className="button button-primary" disabled={!ready || pending} onClick={execute}>Executar cenário</button>
        </div>
        <p className="lab-meta">{scenarios[scenario].detail}</p>
        <noscript><p className="lab-meta">Ative o JavaScript para executar os cenários do laboratório.</p></noscript>
        <p className="lab-feedback" role="status">{pending ? "Coletando o lote…" : error || (run ? "Rastros disponíveis para investigação." : "")}</p>
      </section>
      {run && (
        <>
          <section className="lab-summary ledger-summary" aria-label="Métricas do lote simulado">
            {[[run.metrics.count, "Rastros"], [run.metrics.p95 + " ms", "P95 simulado"], [run.metrics.failures, "Falhas finais"], [run.metrics.recovered, "Recuperados"]].map(([value, label]) => (
              <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>
            ))}
          </section>
          <div className="trace-layout">
            <section className="lab-panel" aria-labelledby="trace-list-title">
              <h2 id="trace-list-title">{scenarios[run.scenario].title}</h2>
              <p className="lab-meta">Rastros do lote simulado</p>
              <label className="trace-filter"><input type="checkbox" checked={errorsOnly} onChange={(event) => setErrorsOnly(event.target.checked)} /> Só rastros com falha</label>
              <ol className="trace-list">
                {visible.map((trace) => (
                  <li key={trace.id}><button type="button" aria-pressed={selected?.id === trace.id} onClick={() => setTraceId(trace.id)}>
                    <strong>Rastro {trace.id.split("-").at(-1)}</strong>
                    <span>{trace.durationMs} ms · {trace.recovered ? "Recuperado" : trace.status === "erro" ? "Falhou" : "Concluído"}</span>
                  </button></li>
                ))}
              </ol>
              {!visible.length && <p className="lab-meta">Nenhum rastro com falha neste lote.</p>}
            </section>
            {selected && <Timeline key={selected.id} trace={selected} />}
          </div>
          <section className="lab-panel trace-probe" aria-labelledby="trace-probe-title">
            <p className="eyebrow">MEDIÇÃO REAL DA DEMO</p>
            <h2 id="trace-probe-title">Sonda do banco D1</h2>
            <p className="lab-meta">A rota executou uma consulta de prontidão no banco do site. Essa medida fica separada das latências simuladas acima.</p>
            <p><strong>{run.probe.status === "disponivel" ? "Disponível" : "Indisponível"}</strong> · {run.probe.durationMs} ms</p>
            <p className="lab-meta">ID de correlação da requisição <code>{run.runId}</code></p>
          </section>
        </>
      )}
    </>
  );
}
