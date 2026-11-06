import { LedgerFlow } from "../../components/ledgerflow";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata(
  "LedgerFlow", "Importe um extrato fictício, concilie lançamentos e confira as alterações registradas no banco.", "/ledgerflow",
);

export default function LedgerFlowPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href="/projetos/ledgerflow">← Estudo de caso</a>
      <div className="lab-title">
        <p className="eyebrow"><span /> FULL STACK / LAB 02</p>
        <h1>LedgerFlow</h1>
        <p>Concilie um extrato bancário fictício com os lançamentos do sistema. Abra como analista para importar e editar dados ou como leitor para consultar a sessão.</p>
      </div>
      <LedgerFlow />
    </main>
  );
}
