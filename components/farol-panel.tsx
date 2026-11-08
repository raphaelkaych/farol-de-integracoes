"use client";

import { useEffect, useState } from "react";
import {
  destinationIsUp, maxActions, nextDue,
  type Action, type AuditEntry, type EventStatus, type Scenario, type State,
} from "../lib/farol/model";

const sessionKey = "farol-demo-token";
const names: Record<EventStatus, string> = {
  fila: "Em fila", retentativa: "Nova tentativa", entregue: "Entregue", dlq: "Na DLQ",
};
const messages: Record<AuditEntry["kind"], string> = {
  recebido: "Evento recebido na fila",
  duplicado: "Reenvio ignorado: evento já conhecido",
  retentativa: "ERP indisponível. Nova tentativa agendada",
  entregue: "ERP confirmou a entrega",
  dlq: "Limite de tentativas atingido. Evento enviado à DLQ",
  recuperado: "Destino restaurado manualmente",
  reprocessado: "Evento voltou da DLQ para a fila",
};

type Payload = { state?: State; token?: string; error?: string };

function storeToken(token: string) {
  try { sessionStorage.setItem(sessionKey, token); } catch { /* A sessão segue aberta na página atual. */ }
}

export function FarolPanel() {
  const [state, setState] = useState<State>();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(sessionKey) ?? ""; } catch { return; }
    if (!saved) return;
    const request = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Block new actions while restoring an external browser session.
    setPending(true);
    fetch("/api/farol", { headers: { Authorization: "Bearer " + saved }, signal: request.signal })
      .then(async (response) => {
        const result: Payload = await response.json();
        if (request.signal.aborted) return;
        if (response.ok && result.state) {
          setState(result.state);
          setToken(saved);
        } else {
          storeToken("");
          setFeedback(result.error ?? "Abra um novo cenário para continuar.");
        }
      })
      .catch(() => {
        if (!request.signal.aborted) setFeedback("Não foi possível restaurar a sessão. Você pode iniciar outro cenário.");
      })
      .finally(() => { if (!request.signal.aborted) setPending(false); });
    return () => request.abort();
  }, []);

  async function send(input: { action: "iniciar"; scenario: Scenario } | { action: Action; version: number }) {
    setPending(true);
    setFeedback("");
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (input.action !== "iniciar" && token) headers.Authorization = "Bearer " + token;
      const response = await fetch("/api/farol", { method: "POST", headers, body: JSON.stringify(input) });
      const result: Payload = await response.json();
      if (result.state) setState(result.state);
      if (response.ok && result.token) {
        storeToken(result.token);
        setToken(result.token);
      }
      if (!response.ok) {
        if (response.status === 404 && input.action !== "iniciar") {
          setToken("");
          storeToken("");
          setState(undefined);
        }
        setFeedback(result.error ?? "Não foi possível registrar a ação.");
      }
    } catch {
      setFeedback("A API não respondeu. Tente de novo. O painel atualiza se a ação anterior já foi registrada.");
    } finally {
      setPending(false);
    }
  }

  const readyAt = state ? nextDue(state) : null;
  const destinationUp = state ? destinationIsUp(state) : false;
  const delivered = state?.events.filter((event) => event.status === "entregue").length ?? 0;
  const dlq = state?.events.filter((event) => event.status === "dlq").length ?? 0;
  const waiting = state ? state.events.length - delivered - dlq : 0;
  const duplicates = state?.audit.filter((entry) => entry.kind === "duplicado").length ?? 0;
  const canAct = !!state && !pending && state.version < maxActions;
  const act = (action: Action) => { if (state && canAct) void send({ action, version: state.version }); };

  return (
    <div>
      <section className="lab-panel" aria-labelledby="cenario-titulo">
        <h2 id="cenario-titulo">{state ? "Escolher outro cenário" : "Escolha um cenário"}</h2>
        <div className="lab-scenarios">
          <button className="scenario" disabled={pending} aria-pressed={state?.scenario === "instavel"}
            onClick={() => void send({ action: "iniciar", scenario: "instavel" })}>
            <strong>01 / ERP instável</strong><small>Falha duas vezes e volta após 90 segundos no relógio da demo.</small>
          </button>
          <button className="scenario" disabled={pending} aria-pressed={state?.scenario === "indisponivel"}
            onClick={() => void send({ action: "iniciar", scenario: "indisponivel" })}>
            <strong>02 / ERP fora do ar</strong><small>O pedido vai para quarentena após três falhas. Você decide quando restaurar o ERP.</small>
          </button>
        </div>
        <p className="lab-meta">Dados fictícios. A sessão dura duas horas e fica vinculada a esta aba.</p>
      </section>
      <p className="lab-feedback" role="status">{pending ? "Consultando a API…" : feedback}</p>

      {state && (
        <>
          <p className="lab-guide">
            {state.scenario === "instavel"
              ? "Experimente reenviar o primeiro pedido e executar três rodadas. O relógio avança até a próxima tentativa pendente."
              : "Execute três rodadas para enviar o pedido à DLQ. Depois, restaure o ERP, reprocesse a fila de quarentena e execute mais uma rodada."}
          </p>
          <div className="lab-toolbar" aria-label="Ações da integração">
            <button className="button button-primary" disabled={!canAct || readyAt === null} onClick={() => act("rodada")}>Executar rodada {readyAt !== null ? "(+" + readyAt + "s)" : ""}</button>
            <button className="button button-outline" disabled={!canAct} onClick={() => act("enviar-1042")}>Reenviar PC-1042</button>
            <button className="button button-outline" disabled={!canAct || state.events.some((event) => event.id === "evt-1047")} onClick={() => act("enviar-1047")}>Adicionar PC-1047</button>
            <button className="button button-outline" disabled={!canAct || state.events.some((event) => event.id === "evt-1051")} onClick={() => act("enviar-1051")}>Adicionar PC-1051</button>
            <button className="button button-outline" disabled={!canAct || destinationUp} onClick={() => act("recuperar")}>Restaurar ERP</button>
            <button className="button button-outline" disabled={!canAct || !destinationUp || dlq === 0} onClick={() => act("reprocessar")}>Reprocessar DLQ</button>
          </div>
          <p className="lab-meta">Relógio: <strong>+{state.now}s</strong> · ERP: <strong>{destinationUp ? "disponível" : "indisponível"}</strong> · Revisão: {state.version}/{maxActions}</p>
          {state.version >= maxActions && <p className="lab-guide">O cenário atingiu o limite de ações. Escolha um novo para continuar.</p>}
          <div className="lab-summary" aria-label="Indicadores">
            {[[state.events.length, "Eventos únicos"], [waiting, "Pendentes"], [delivered, "Entregues"], [dlq, "Na DLQ"], [duplicates, "Duplicados"]].map(([value, label]) => (
              <div className="metric" key={label}><b>{value}</b><span>{label}</span></div>
            ))}
          </div>
          <div className="lab-grid">
            <section className="lab-panel" aria-labelledby="eventos">
              <h2 id="eventos">Fila de eventos</h2>
              <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="eventos">
                <table className="lab-table">
                  <thead><tr><th scope="col">Pedido / evento</th><th scope="col">Estado</th><th scope="col">Tentativas</th></tr></thead>
                  <tbody>
                    {state.events.map((event) => (
                      <tr key={event.id}>
                        <td><strong>{event.order}</strong> · {event.name}<br /><code>{event.id}</code></td>
                        <td><span className="pill" data-status={event.status}>{names[event.status]}</span></td>
                        <td>{event.attempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="lab-meta">DLQ é a fila de quarentena para eventos que esgotaram as tentativas.</p>
            </section>
            <section className="lab-panel" aria-labelledby="auditoria">
              <h2 id="auditoria">Histórico de execução</h2>
              <ol className="audit-list" tabIndex={0} aria-label="Mais recentes primeiro">
                {state.audit.slice().reverse().map((entry, index) => (
                  <li key={state.audit.length - index}>
                    <code>+{entry.at}s</code><div>{messages[entry.kind]}
                      <small>{[entry.eventId, entry.http && "HTTP " + entry.http, entry.nextAt !== undefined && "próxima em +" + entry.nextAt + "s"].filter(Boolean).join(" · ")}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
