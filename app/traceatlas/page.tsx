import { TraceAtlas } from "../../components/traceatlas";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("TraceAtlas", "Investigue falhas e latência em rastros simulados e compare com uma sonda real da demo.", "/traceatlas");

export default function TraceAtlasPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/traceatlas">← Estudo de caso</a>
      <div className="lab-title">
        <p className="eyebrow"><span /> OBSERVABILIDADE / LAB 04</p>
        <h1>TraceAtlas</h1>
        <p>Investigue nove pedidos por execução. Escolha uma falha e acompanhe o rastro até o serviço que interrompeu ou atrasou o fluxo.</p>
      </div>
      <TraceAtlas />
    </main>
  );
}
