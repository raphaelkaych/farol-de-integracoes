import { ReturnRadar } from "../../components/return-radar";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("Radar de Retorno", "Valide respostas fictícias de integração e descubra se o fluxo pode avançar.", "/radar-de-retorno");

export default function ReturnRadarPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/radar-de-retorno">← Estudo de caso</a>
      <header className="lab-title">
        <p className="eyebrow"><span /> CONTRATOS DE API / LAB 08</p>
        <h1>Radar de Retorno</h1>
        <p>Escolha uma resposta fictícia. Compare o código HTTP com o conteúdo para decidir se o fluxo pode avançar, aguardar ou pedir revisão.</p>
      </header>
      <ReturnRadar />
    </main>
  );
}
