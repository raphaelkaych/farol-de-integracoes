"use client";

import { useState } from "react";
import { casePath } from "../lib/project-index";
import { useBrowserReady } from "./use-browser-ready";

const panes = [
  { label: "Interface", tag: "01 / ENVIO", status: "POST /reservas", denied: "POST /reservas", text: "A interface envia a quantidade e a referência do pedido.", error: "A mesma solicitação parte de um perfil de leitura.", project: "qualitygate-studio", outline: [38, 101, 132, 101], wire: "M170 151H237" },
  { label: "API", tag: "02 / VALIDAÇÃO", status: "Permissão válida", denied: "HTTP 403", text: "A API verifica o perfil antes de encaminhar a escrita.", error: "A API bloqueia a escrita e devolve o motivo para a interface.", project: "ledgerflow", outline: [233, 97, 134, 110], wire: "M300 207V255" },
  { label: "Dados", tag: "03 / RETORNO", status: "HTTP 201 · recibo", denied: "Sem escrita", text: "A reserva gera um recibo e confirma a operação.", error: "O bloqueio preserva o saldo e o histórico.", project: "farol-de-integracoes", outline: [430, 101, 132, 101], wire: "M367 151H430" },
] as const;

export function HeroWorkbench() {
  const ready = useBrowserReady();
  const [selected, setSelected] = useState(0);
  const [denied, setDenied] = useState(false);
  const item = panes[selected];
  const [x, y, width, height] = item.outline;
  return (
    <div className="workbench" aria-label="Mapa dos laboratórios">
      <div className="workbench-title">
        <div><span className="workbench-mark" aria-hidden="true">⌘</span><strong>Mapa dos laboratórios</strong></div>
        <span className="workbench-label">FLUXO ILUSTRATIVO</span>
      </div>
      <div className="workbench-art">
        {/* The functional layers are described by the controls below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-diagrama.svg" alt="" width="600" height="380" fetchPriority="high" />
        <svg className="workbench-signal" data-blocked={denied && selected > 0} viewBox="0 0 600 380" aria-hidden="true" focusable="false">
          <rect x={x} y={y} width={width} height={height} rx="12" />
          <path key={item.label} d={item.wire} pathLength="1" />
        </svg>
      </div>
      <div className="workbench-tabs" role="group" aria-label="Camada do sistema">
        {panes.map((pane, index) => (
          <button key={pane.label} type="button" aria-pressed={selected === index} disabled={!ready} onClick={() => setSelected(index)}>{pane.label}</button>
        ))}
      </div>
      <div className="workbench-caption" aria-live="polite">
        <div key={item.label} className="workbench-detail">
          <span>{item.tag}</span>
          <p><code>{denied ? item.denied : item.status}</code> · {denied ? item.error : item.text}</p>
        </div>
        <a href={casePath(item.project)} aria-label={"Ver projeto da camada " + item.label}>↗</a>
      </div>
      <div className="workbench-tools">
        <button type="button" className="text-link" disabled={!ready} aria-pressed={denied}
          onClick={() => { setDenied(!denied); setSelected(1); }}>Simular bloqueio</button>
        <a className="text-link" href={"/workspace?projeto=" + item.project + "&painel=arquitetura"}>Abrir arquitetura <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
}
