"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import snapshots from "../lib/pulso-snapshots.json";

const sla = { P1: 60, P2: 240, P3: 1440 };
type Priority = keyof typeof sla;
type Ticket = { id: number; name: string; priority: Priority; due: number; resolved?: number };

const initialTickets: Ticket[] = [
  { id: 1, name: "ERP indisponível", priority: "P1", due: -15 },
  { id: 2, name: "Acesso ao relatório", priority: "P3", due: 1420 },
  { id: 3, name: "Falha em importação", priority: "P2", due: 20 },
];

function ticketStatus(ticket: Ticket, now: number) {
  if (ticket.resolved !== undefined) return ticket.resolved <= ticket.due ? "Resolvido no prazo" : "Resolvido em atraso";
  return ticket.due < now ? "Em atraso" : "Em aberto";
}

export function PlantaoDemo() {
  const [tickets, setTickets] = useState(initialTickets);
  const [priority, setPriority] = useState<Priority>("P2");
  const [title, setTitle] = useState("");
  const [clock, setClock] = useState(0);
  const [notice, setNotice] = useState("");

  function openTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) { setNotice("Informe um título para o chamado."); return; }
    const nextId = tickets.length + 1;
    setTickets([...tickets, { id: nextId, name: title.trim(), priority, due: clock + sla[priority] }]);
    setTitle("");
    setNotice("Chamado #" + nextId + " aberto.");
  }

  function resolve(ticket: Ticket) {
    setTickets(tickets.map((row) => row.id === ticket.id && row.resolved === undefined ? { ...row, resolved: clock } : row));
    setNotice("Chamado #" + ticket.id + " resolvido.");
  }

  const ordered = [...tickets].sort((a, b) => (
    Number(a.resolved !== undefined) - Number(b.resolved !== undefined) || a.due - b.due || a.id - b.id
  ));
  return (
    <section className="lab-panel" aria-labelledby="plantao-fila">
      <h2 id="plantao-fila">Fila do plantão</h2>
      <p className="lab-meta">P1: 1h · P2: 4h · P3: 24h. O relógio da demo está em <strong>+{clock} min</strong>.</p>
      <form className="demo-form" onSubmit={openTicket}>
        <label>Chamado fictício<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Falha na impressão" maxLength={85} required /></label>
        <label>Prioridade<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
          <option>P1</option><option>P2</option><option>P3</option>
        </select></label>
        <button className="button button-primary" type="submit">Abrir chamado</button>
        <button className="button button-outline" type="button" onClick={() => { setClock(clock + 30); setNotice("Relógio avançado em 30 minutos."); }}>Avançar 30 min</button>
      </form>
      <p className="lab-feedback" role="status">{notice}</p>
      <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="plantao-fila">
        <table className="lab-table">
          <thead><tr><th scope="col">Chamado</th><th scope="col">Prioridade</th><th scope="col">Prazo</th><th scope="col">Estado</th><th scope="col">Ação</th></tr></thead>
          <tbody>{ordered.map((ticket) => (
            <tr key={ticket.id}>
              <td>#{ticket.id} · {ticket.name}</td><td>{ticket.priority}</td>
              <td>{ticket.due >= 0 ? "+" : ""}{ticket.due} min</td>
              <td><span className="pill" data-status={ticketStatus(ticket, clock).includes("atraso") ? "dlq" : undefined}>{ticketStatus(ticket, clock)}</span></td>
              <td>{ticket.resolved === undefined ? <button className="button button-outline button-compact" onClick={() => resolve(ticket)} aria-label={"Resolver chamado " + ticket.id}>Resolver</button> : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="lab-meta">A demo roda nesta página. A versão do GitHub executa pelo terminal e grava os incidentes em SQLite.</p>
    </section>
  );
}

const encoder = new TextEncoder();
const demoKey = "segredo-publico-apenas-para-demonstracao";
type Delivery = "normal" | "alterado" | "sem-assinatura";
type Result = { code: number; text: string; delivery: Delivery };

async function simulateDelivery(delivery: Delivery, registered: number | null): Promise<{ result: Result; total: number | null }> {
  const value = delivery === "alterado" ? 19000 : 18990;
  const body = encoder.encode(JSON.stringify({ tipo: "pedido.criado", evento_id: "evt-001", pedido_id: "pd-101", total_centavos: value }));
  const key = await crypto.subtle.importKey("raw", encoder.encode(demoKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signed = delivery === "sem-assinatura"
    ? new Uint8Array(32)
    : await crypto.subtle.sign("HMAC", key, body);
  const valid = await crypto.subtle.verify("HMAC", key, signed, body);
  if (!valid) return { total: registered, result: { delivery, code: 401, text: "Assinatura rejeitada. Nenhum pedido gravado." } };
  if (registered === null) return { total: value, result: { delivery, code: 201, text: "Pedido registrado para o evento evt-001." } };
  if (registered === value) return { total: registered, result: { delivery, code: 200, text: "Reenvio aceito. O pedido já existia." } };
  return { total: registered, result: { delivery, code: 409, text: "Mesmo ID com outro valor. Registro original preservado." } };
}

export function PonteDemo() {
  const [registered, setRegistered] = useState<number | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);

  async function send(delivery: Delivery) {
    if (active.current) return;
    active.current = true;
    setPending(true);
    setError("");
    try {
      const { result, total } = await simulateDelivery(delivery, registered);
      setRegistered(total);
      setHistory((previous) => [...previous.slice(-11), result]);
    } catch {
      setError("A assinatura precisa de um navegador com Web Crypto em um endereço HTTPS.");
    } finally {
      active.current = false;
      setPending(false);
    }
  }

  return (
    <section className="lab-panel" aria-labelledby="ponte-envio">
      <h2 id="ponte-envio">Evento pedido.criado</h2>
      <p className="lab-meta">Pedido <code>pd-101</code> · Evento <code>evt-001</code> · Valor inicial R$ 189,90.</p>
      <div className="lab-toolbar">
        <button className="button button-primary" disabled={pending} onClick={() => void send("normal")}>{registered === null ? "Enviar pedido" : "Reenviar o mesmo pedido"}</button>
        <button className="button button-outline" disabled={pending || registered === null} onClick={() => void send("alterado")}>Reenviar com outro valor</button>
        <button className="button button-outline" disabled={pending} onClick={() => void send("sem-assinatura")}>Enviar com assinatura inválida</button>
        <button className="button button-outline" disabled={pending || !history.length} onClick={() => { setRegistered(null); setHistory([]); setError(""); }}>Reiniciar</button>
      </div>
      <p className="lab-feedback" role="status">{error || (pending ? "Verificando assinatura…" : history.at(-1)?.text ?? "Envie um evento para ver a resposta.")}</p>
      <div className="lab-summary">
        <div className="metric"><b>{registered === null ? 0 : 1}</b><span>Pedidos registrados</span></div>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Respostas do receptor">
        <table className="lab-table">
          <thead><tr><th scope="col">Status</th><th scope="col">Resultado</th></tr></thead>
          <tbody>{[...history].reverse().map((row, index) => (
            <tr key={history.length - index}><td><code>{row.code}</code></td><td>{row.text}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <p className="lab-meta">A demo calcula e verifica HMAC no navegador. A versão do GitHub tem um receptor HTTP em Python e grava os pedidos em SQLite.</p>
    </section>
  );
}

const formatPercent = (value: number) => Math.round(value * 100) + "%";

export function PulsoDemo() {
  const [selected, setSelected] = useState(1);
  const { data, reference } = snapshots[selected];
  const count = (field: "total" | "resolvidos" | "no_prazo" | "vencidos") => data.reduce((sum, row) => sum + row[field], 0);
  return (
    <section className="lab-panel" aria-labelledby="pulso-areas">
      <h2 id="pulso-areas">Chamados por área</h2>
      <div className="demo-form">
        <label>Data de referência (UTC)<select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
          {snapshots.map(({ label }, index) => <option value={index} key={label}>{label}</option>)}
        </select></label>
      </div>
      <div className="lab-summary" aria-live="polite" aria-label={"Indicadores em " + reference}>
        <div className="metric"><b>{count("total")}</b><span>Total no recorte</span></div>
        <div className="metric"><b>{count("vencidos")}</b><span>Abertos vencidos</span></div>
        <div className="metric"><b>{count("resolvidos") ? formatPercent(count("no_prazo") / count("resolvidos")) : "—"}</b><span>Resolvidos no prazo</span></div>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="pulso-areas">
        <table className="lab-table">
          <thead><tr><th scope="col">Área</th><th scope="col">Total</th><th scope="col">Abertos</th><th scope="col">Vencidos</th><th scope="col">SLA</th></tr></thead>
          <tbody>{data.map((row) => <tr key={row.area}>
            <th scope="row">{row.area}</th><td>{row.total}</td><td>{row.abertos}</td><td>{row.vencidos}</td>
            <td>{row.resolvidos ? formatPercent(row.no_prazo / row.resolvidos) : "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="lab-meta">Os recortes foram gerados pela consulta SQL do repositório original. O SLA divide os resolvidos no prazo pelo total resolvido até a referência.</p>
    </section>
  );
}
