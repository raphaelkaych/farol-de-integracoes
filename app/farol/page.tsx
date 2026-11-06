import { FarolPanel } from "../../components/farol-panel";
import { pageMetadata, siteRepository } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("Farol de Integrações", "Laboratório com fila de eventos, retentativas, quarentena e reprocessamento de um ERP simulado.", "/farol");

export default function Farol() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/farol-de-integracoes">← Estudo de caso</a>
      <div className="lab-title">
        <p className="eyebrow"><span /> 03 / LABORATÓRIO DE INTEGRAÇÕES</p>
        <h1>Farol de Integrações</h1>
        <p>Acompanhe um pedido que precisa chegar a um ERP simulado. A API registra as ações no banco e o painel mostra a fila, as tentativas e o histórico do evento. Você controla o relógio da simulação.</p>
        <a className="text-link" href={siteRepository}>Ver código e arquitetura <span aria-hidden="true">↗</span></a>
      </div>
      <FarolPanel />
    </main>
  );
}
