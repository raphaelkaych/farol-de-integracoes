"use client";

import { useState } from "react";
import { casePath } from "../lib/project-index";

const panes = [
  { label: "Interface", tag: "01 / REACT", text: "Compare as respostas de duas implementações de uma reserva de estoque.", project: "qualitygate-studio" },
  { label: "API", tag: "02 / HTTP", text: "Uma sessão de leitor consulta o extrato. O servidor recusa qualquer tentativa de escrita.", project: "ledgerflow" },
  { label: "Dados", tag: "03 / SQL", text: "O Farol grava cada ação com uma revisão para manter o histórico consistente quando chegam dois pedidos juntos.", project: "farol-de-integracoes" },
] as const;

export function HeroWorkbench() {
  const [selected, setSelected] = useState(0);
  const item = panes[selected];
  return (
    <div className="workbench" aria-label="Mapa dos laboratórios">
      <div className="workbench-title">
        <div><span className="workbench-mark" aria-hidden="true">⌘</span><strong>Mapa dos laboratórios</strong></div>
        <span className="workbench-label">RK / PORTFÓLIO</span>
      </div>
      <div className="workbench-art">
        {/* The functional layers are described by the controls below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-diagrama.svg" alt="" width="600" height="380" fetchPriority="high" />
      </div>
      <div className="workbench-tabs" role="group" aria-label="Camada do sistema">
        {panes.map((pane, index) => (
          <button key={pane.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>{pane.label}</button>
        ))}
      </div>
      <div className="workbench-caption" aria-live="polite">
        <div><span>{item.tag}</span><p>{item.text}</p></div>
        <a href={casePath(item.project)} aria-label={"Ver projeto da camada " + item.label}>↗</a>
      </div>
    </div>
  );
}
