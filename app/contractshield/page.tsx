import { ContractShield } from "../../components/contractshield";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("ContractShield", "Exercite contratos e autorização em uma API demonstrativa de mudanças.", "/contractshield");

export default function ContractShieldPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/contractshield">← Estudo de caso</a>
      <header className="lab-title">
        <p className="eyebrow"><span /> API QUALITY &amp; SECURITY / LAB 09</p>
        <h1>ContractShield</h1>
        <p>Exercite o contrato de uma API de mudanças. Compare o retorno obtido com a permissão, a versão e a regra que a operação exige.</p>
      </header>
      <ContractShield />
    </main>
  );
}
