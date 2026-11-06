import { QualityGate } from "../../components/qualitygate";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata(
  "QualityGate Studio",
  "Compare a reserva de estoque de referência com uma falha injetada na aplicação de teste.",
  "/qualitygate",
);

export default function QualityGatePage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/qualitygate-studio">← Estudo de caso</a>
      <div className="lab-title">
        <p className="eyebrow"><span /> QUALITY ENGINEERING / LAB 01</p>
        <h1>QualityGate Studio</h1>
        <p>Teste um serviço de reserva de estoque sob condições controladas. A API executa o mesmo pedido em dois ambientes isolados e verifica a regra que deveria se manter.</p>
      </div>
      <QualityGate />
    </main>
  );
}
