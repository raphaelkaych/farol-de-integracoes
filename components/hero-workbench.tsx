"use client";

import { useState } from "react";
import { casePath } from "../lib/project-index";
import { useBrowserReady } from "./use-browser-ready";

const panes = [
  { label: "Interface", tag: "01 / REACT", text: "Compare na tela o que muda entre duas versões da mesma regra de estoque.", project: "qualitygate-studio", outline: [38, 101, 132, 101], wire: "M170 151H237" },
  { label: "API", tag: "02 / HTTP", text: "O LedgerFlow aplica a permissão no servidor. Uma sessão de leitor pode consultar o extrato.", project: "ledgerflow", outline: [233, 97, 134, 110], wire: "M300 207V255" },
  { label: "Dados", tag: "03 / SQL", text: "O Farol usa revisões para manter o histórico consistente quando duas ações chegam ao mesmo tempo.", project: "farol-de-integracoes", outline: [430, 101, 132, 101], wire: "M367 151H430" },
] as const;

export function HeroWorkbench() {
  const ready = useBrowserReady();
  const [selected, setSelected] = useState(0);
  const item = panes[selected];
  const [x, y, width, height] = item.outline;
  return (
    <div className="workbench" aria-label="Mapa dos laboratórios">
      <div className="workbench-title">
        <div><span className="workbench-mark" aria-hidden="true">⌘</span><strong>Mapa dos laboratórios</strong></div>
        <span className="workbench-label">EXPLORE AS CAMADAS</span>
      </div>
      <div className="workbench-art">
        {/* The functional layers are described by the controls below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-diagrama.svg" alt="" width="600" height="380" fetchPriority="high" />
        <svg className="workbench-signal" viewBox="0 0 600 380" aria-hidden="true" focusable="false">
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
        <div key={item.label} className="workbench-detail"><span>{item.tag}</span><p>{item.text}</p></div>
        <a href={casePath(item.project)} aria-label={"Ver projeto da camada " + item.label}>↗</a>
      </div>
    </div>
  );
}
