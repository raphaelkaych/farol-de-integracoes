"use client";

import { useState } from "react";
import { inspectReturn, maxReturnLength, returnFixtures, type ReturnFinding } from "../lib/return-radar";
import { useBrowserReady } from "./use-browser-ready";

const format = (payload: unknown) => JSON.stringify(payload, null, 2);

export function ReturnRadar() {
  const ready = useBrowserReady();
  const [example, setExample] = useState<string>(returnFixtures[0].id);
  const [http, setHttp] = useState<string>(String(returnFixtures[0].http));
  const [body, setBody] = useState<string>(format(returnFixtures[0].payload));
  const [result, setResult] = useState<ReturnFinding>();

  function load(id: string) {
    const fixture = returnFixtures.find((item) => item.id === id);
    if (!fixture) return;
    setExample(id);
    setHttp(String(fixture.http));
    setBody(format(fixture.payload));
    setResult(undefined);
  }

  return (
    <div className="return-layout">
      <form className="lab-panel return-editor" aria-labelledby="return-editor-title" onSubmit={(event) => {
        event.preventDefault();
        setResult(inspectReturn(Number(http), body));
      }}>
        <h2 id="return-editor-title">Resposta do serviço</h2>
        <div className="demo-form">
          <label>Exemplo
            <select value={example} onChange={(event) => load(event.target.value)} disabled={!ready}>
              {returnFixtures.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Código HTTP
            <input type="number" min="100" max="599" step="1" required value={http} disabled={!ready}
              onChange={(event) => { setHttp(event.target.value); setResult(undefined); }} />
          </label>
        </div>
        <label>Corpo JSON
          <textarea value={body} maxLength={maxReturnLength} spellCheck={false} autoComplete="off" disabled={!ready}
            onChange={(event) => { setBody(event.target.value); setResult(undefined); }} />
        </label>
        <p className="lab-meta">Use os exemplos fictícios ou edite o JSON. A análise roda no seu navegador.</p>
        <button type="submit" className="button button-primary" disabled={!ready}>Validar retorno</button>
        <noscript><p className="lab-meta">Ative o JavaScript para usar o validador.</p></noscript>
      </form>
      <section className="lab-panel return-result" aria-labelledby="return-result-title">
        <h2 id="return-result-title">Decisão do fluxo</h2>
        <div role="status" className="return-finding">
          {result ? (
            <>
              <span className="pill" data-status={result.decision === "Avançar" ? "entregue" : "retentativa"}>{result.decision}</span>
              <p>{result.detail}</p>
              {result.fields && <p className="lab-meta">Confira {result.fields.map((field) => <code key={field}>{field}</code>)}</p>}
            </>
          ) : <p className="lab-meta">Valide uma resposta para ver como o fluxo deve seguir.</p>}
        </div>
        <details className="return-contract">
          <summary>Ver contrato didático</summary>
          <ul>
            <li><code>200 · aceito</code> com protocolo de texto</li>
            <li><code>202 · em_fila</code> com protocolo de texto</li>
            <li><code>200 · rejeitado</code> com motivo de texto</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
