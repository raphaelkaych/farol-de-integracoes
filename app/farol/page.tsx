import type { Metadata } from "next";
import { FarolPanel } from "../../components/farol-panel";
import { github } from "../../components/portfolio-chrome";

export const metadata: Metadata = {
  title: "Farol de Integrações",
  description: "Laboratório com fila de eventos, retentativas, quarentena e reprocessamento de um ERP simulado.",
};

export default function Farol() {
  return (
    <main id="conteudo" className="shell lab">
      <a className="text-link" href="/#projetos">← Voltar aos projetos</a>
      <div className="lab-title">
        <p className="eyebrow">01 / LABORATÓRIO DE INTEGRAÇÕES</p>
        <h1>Farol de Integrações</h1>
        <p>Acompanhe um pedido que precisa chegar a um ERP simulado. A API registra as ações no banco e o painel mostra a fila, as tentativas e o histórico do evento. Você controla o relógio da simulação.</p>
        <a className="text-link" href={github + "/farol-de-integracoes"}>Ver código e arquitetura <span aria-hidden="true">↗</span></a>
      </div>
      <FarolPanel />
    </main>
  );
}
