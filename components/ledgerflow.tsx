"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  exportCsv, maxRevision, parseCsv, sampleCsv, states, statusByReference,
  type Entry, type Origin, type Role, type Status, type View,
} from "../lib/ledgerflow/model";
import { useBrowserReady } from "./use-browser-ready";

const sessionKey = "ledgerflow-demo";
const pageSize = 6;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const actions: Record<string, string> = {
  importar: "Importação", conciliar: "Conciliação", criar: "Criação", atualizar: "Atualização", remover: "Remoção",
};
type Payload = { state?: View; token?: string; message?: string; error?: string; code?: string };
type Editor = { id?: string; reference: string; origin: Origin; date: string; amount: string };

function saveToken(value: string) {
  try { sessionStorage.setItem(sessionKey, value); } catch { /* A sessão continua nesta página. */ }
}

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function editValues(entry?: Entry): Editor {
  return entry ? { id: entry.id, reference: entry.reference, origin: entry.origin, date: entry.date, amount: String(entry.cents) }
    : { reference: "LF-1005", origin: "sistema", date: "2026-10-05", amount: "" };
}

export function LedgerFlow() {
  const ready = useBrowserReady();
  const [view, setView] = useState<View>();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Status | "todos">("todos");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Editor>();
  const [inspected, setInspected] = useState<string>();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const busy = useRef(false);
  const editorDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (editor && editorDialog.current && !editorDialog.current.open) editorDialog.current.showModal();
  }, [editor]);

  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(sessionKey) ?? ""; } catch { return; }
    if (!saved) return;
    const controller = new AbortController();
    busy.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Block new actions while restoring an external browser session.
    setPending(true);
    fetch("/api/ledgerflow", { headers: { Authorization: "Bearer " + saved }, signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as Payload;
        if (controller.signal.aborted) return;
        if (response.ok && result.state) { setView(result.state); setToken(saved); }
        if (response.status === 404) { saveToken(""); setMessage("A sessão expirou. Abra outra para continuar."); }
      })
      .catch(() => { if (!controller.signal.aborted) setMessage("A sessão anterior não respondeu."); })
      .finally(() => {
        if (!controller.signal.aborted) { busy.current = false; setPending(false); }
      });
    return () => { controller.abort(); busy.current = false; };
  }, []);

  async function request(body: Record<string, unknown>, startRole?: Role) {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setMessage("");
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (!startRole) headers.Authorization = "Bearer " + token;
      const response = await fetch("/api/ledgerflow", {
        method: "POST", headers,
        body: JSON.stringify(startRole ? { action: "iniciar", role: startRole } : { ...body, version: view?.revision }),
      });
      const result = await response.json() as Payload;
      if (result.code === "sessao_ausente") {
        setView(undefined); setToken(""); saveToken(""); setEditor(undefined); setInspected(undefined);
        setMessage(result.error ?? "Abra uma nova sessão.");
        return false;
      }
      if (result.state) setView(result.state);
      if (result.token) {
        setToken(result.token); saveToken(result.token);
        setEditor(undefined); setInspected(undefined); setQuery(""); setFilter("todos"); setPage(0); setConfirmRemove(false);
      }
      setMessage(result.error ?? result.message ?? "Sessão aberta.");
      return response.ok;
    } catch {
      setMessage("A API não respondeu. Tente novamente.");
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || busy.current) return;
    busy.current = true;
    setPending(true);
    let csv: string;
    try {
      if (file.size > 4096) throw new Error("O CSV precisa ter até 4 KiB.");
      csv = await file.text();
      parseCsv(csv);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao ler o CSV.");
      return;
    } finally {
      busy.current = false;
      setPending(false);
    }
    await request({ action: "importar", csv });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const { id, reference, origin, date, amount } = editor;
    if (await request({ action: id ? "atualizar" : "criar", id, reference, origin, date, cents: Number(amount) })) {
      setEditor(undefined);
    }
  }

  const status = view ? statusByReference(view) : new Map<string, Status>();
  const visible = (view?.entries ?? []).filter((entry) => (
    (filter === "todos" || status.get(entry.reference) === filter) &&
    (entry.id.includes(query.trim().toUpperCase()) || entry.reference.includes(query.trim().toUpperCase()))
  ));
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const editable = view?.role === "analista" && view.revision < maxRevision;
  const counts = (state: Status) => [...status.values()].filter((value) => value === state).length;
  const distribution = (Object.keys(states) as Status[]).map((state) => ({ state, count: counts(state) }));
  const related = inspected ? (view?.entries ?? []).filter((entry) => entry.reference === inspected) : [];

  return (
    <>
      <div className="lab-panel ledger-session">
        <div>
          <p className="eyebrow">AMBIENTE DE DEMONSTRAÇÃO</p>
          <h2>{view ? (view.role === "analista" ? "Sessão de analista" : "Sessão de leitor") : "Abra uma sessão"}</h2>
          <p className="lab-meta">Dados fictícios e acesso por duas horas. Cada perfil abre uma sessão isolada.</p>
        </div>
        <div className="links">
          <button className="button button-primary" disabled={!ready || pending} onClick={() => void request({}, "analista")}>Entrar como analista</button>
          <button className="button button-outline" disabled={!ready || pending} onClick={() => void request({}, "leitor")}>Entrar como leitor</button>
        </div>
      </div>
      <p className="lab-feedback" role="status">{pending ? "Consultando a API…" : message}</p>
      {view && (
        <>
          <div className="lab-summary ledger-summary" aria-label="Indicadores da conciliação">
            <div className="metric"><b>{view.entries.length}</b><span>Lançamentos</span></div>
            <div className="metric"><b>{counts("conciliada")}</b><span>Referências conciliadas</span></div>
            <div className="metric"><b>{counts("divergente")}</b><span>Referências divergentes</span></div>
            <div className="metric"><b>{counts("pendente") + counts("ambigua")}</b><span>Referências para revisar</span></div>
          </div>
          <section className="lab-panel" aria-labelledby="ledger-table">
            <div className="panel-heading">
              <h2 id="ledger-table">Lançamentos</h2>
              <code>REV {view.revision} / {maxRevision}</code>
            </div>
            <p className="lab-meta">{view.reconciled
              ? "Conciliação calculada pela referência, valor e janela de dois dias."
              : "Importe o extrato e rode a conciliação para comparar as fontes."}</p>
            {view.reconciled && (
              <div className="ledger-distribution" aria-label="Distribuição por referência">
                <div className="ledger-bar" aria-hidden="true">
                  {distribution.filter(({ count }) => count > 0).map(({ state, count }) => (
                    <span key={state} data-state={state} style={{ flexGrow: count }} />
                  ))}
                </div>
                <ul>{distribution.map(({ state, count }) => <li key={state}>
                  <i data-state={state} aria-hidden="true" />{states[state]} <b>{count}</b>
                </li>)}</ul>
              </div>
            )}
            <div className="lab-toolbar">
              {editable && (
                <>
                  <button className="button button-primary" disabled={pending} onClick={() => void request({ action: "importar", csv: sampleCsv })}>Importar CSV de exemplo</button>
                  <button className="button button-outline" disabled={pending} onClick={() => void request({ action: "conciliar" })}>Conciliar agora</button>
                  <button className="button button-outline" disabled={pending} onClick={() => { setEditor(editValues()); setConfirmRemove(false); }}>Novo lançamento</button>
                  <label className="button button-outline file-control">
                    Enviar CSV fictício<input type="file" accept=".csv,text/csv" disabled={pending} onChange={upload} aria-label="Enviar CSV fictício" />
                  </label>
                </>
              )}
              <button className="button button-outline" onClick={() => download("ledgerflow-exemplo.csv", sampleCsv)}>Baixar modelo CSV</button>
              <button className="button button-outline" disabled={!visible.length} onClick={() => download("ledgerflow-resultados.csv", exportCsv(visible, status))}>Exportar recorte</button>
            </div>
            {editor && editable && (
              <dialog className="command-dialog ledger-dialog" ref={editorDialog} aria-labelledby="ledger-editor-title"
                onCancel={(event) => { if (pending) event.preventDefault(); else setEditor(undefined); }}>
              <h3 id="ledger-editor-title">{editor.id ? "Editar lançamento" : "Criar lançamento"}</h3>
              <form className="ledger-editor" onSubmit={submit}>
                <label>Referência<input required pattern="LF-[0-9]{4,6}" value={editor.reference} onChange={(e) => setEditor({ ...editor, reference: e.target.value })} /></label>
                <label>Origem<select value={editor.origin} onChange={(e) => setEditor({ ...editor, origin: e.target.value as Origin })}><option value="sistema">Sistema</option><option value="banco">Banco</option></select></label>
                <label>Data<input type="date" required value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} /></label>
                <label>Valor em centavos<input type="number" required min="1" max="99999999" value={editor.amount} onChange={(e) => setEditor({ ...editor, amount: e.target.value })} /></label>
                <div className="links editor-actions">
                  <button type="submit" className="button button-primary" disabled={pending}>Salvar lançamento</button>
                  <button type="button" className="button button-outline" disabled={pending} onClick={() => setEditor(undefined)}>Cancelar</button>
                  {editor.id && <button type="button" className="button button-outline" disabled={pending} onClick={async () => {
                    if (!confirmRemove) { setConfirmRemove(true); return; }
                    if (await request({ action: "remover", id: editor.id })) setEditor(undefined);
                  }}>{confirmRemove ? "Confirmar remoção" : "Remover lançamento"}</button>}
                </div>
              </form>
              <p className="lab-feedback" role="status">{pending ? "Consultando a API…" : message}</p>
              </dialog>
            )}
            <div className="demo-form">
              <label>Buscar ID ou referência<input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="LF-1002" /></label>
              <label>Estado<select value={filter} onChange={(e) => { setFilter(e.target.value as Status | "todos"); setPage(0); }}>
                <option value="todos">Todos</option>
                {(Object.keys(states) as Status[]).map((key) => <option key={key} value={key}>{states[key]}</option>)}
              </select></label>
            </div>
            <div className="table-wrap" role="region" tabIndex={0} aria-labelledby="ledger-table">
              <table className="lab-table ledger-table">
                <thead><tr><th scope="col">Referência</th><th scope="col">Origem</th><th scope="col">Data</th><th scope="col">Valor</th><th scope="col">Estado</th>{editable && <th scope="col">Ação</th>}</tr></thead>
                <tbody>
                  {visible.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((entry) => {
                    const value = status.get(entry.reference) ?? "pendente";
                    return <tr key={entry.id}><td><button type="button" className="text-link ledger-inspect" aria-pressed={inspected === entry.reference}
                      aria-label={"Inspecionar " + entry.reference} onClick={() => setInspected(entry.reference)}>{entry.reference}</button><br /><code>{entry.id}</code></td>
                      <td>{entry.origin}</td><td>{entry.date}</td><td>{money.format(entry.cents / 100)}</td>
                      <td><span className="pill" data-status={value}>{states[value]}</span></td>
                      {editable && <td>{entry.manual ? <button className="button button-compact button-outline" disabled={pending} aria-label={"Editar " + entry.id} onClick={() => { setEditor(editValues(entry)); setConfirmRemove(false); }}>Editar</button> : "—"}</td>}
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {!visible.length && <p className="lab-meta">Nenhum lançamento corresponde ao recorte.</p>}
            {inspected && related.length > 0 && (
              <section className="lab-guide ledger-inspection" aria-label={"Comparação de " + inspected}>
                <div className="panel-heading">
                  <strong>{inspected} · {states[status.get(inspected) ?? "pendente"]}</strong>
                  <button className="button button-compact button-outline" onClick={() => setInspected(undefined)}>Fechar comparação</button>
                </div>
                <ul>{related.map((entry) => <li key={entry.id}>{entry.origin} · {entry.date} · {money.format(entry.cents / 100)} <code>{entry.id}</code></li>)}</ul>
                {related.length === 2 && related[0].origin !== related[1].origin && <p>Diferença de valor <strong>{money.format(Math.abs(related[0].cents - related[1].cents) / 100)}</strong></p>}
              </section>
            )}
            <div className="ledger-pagination">
              <button className="button button-compact button-outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button>
              <span>Página {currentPage + 1} de {pages}</span>
              <button className="button button-compact button-outline" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Próxima</button>
            </div>
          </section>
          <section className="lab-panel ledger-audit" aria-labelledby="ledger-audit">
            <h2 id="ledger-audit">Histórico de alterações</h2>
            {view.audit.length ? <ol className="audit-list">
              {view.audit.map((entry) => <li key={entry.revision}><code>#{entry.revision}</code><div>{actions[entry.action]}<small>{entry.detail}</small></div></li>)}
            </ol> : <p className="lab-meta">As alterações autorizadas aparecerão aqui.</p>}
          </section>
        </>
      )}
    </>
  );
}
