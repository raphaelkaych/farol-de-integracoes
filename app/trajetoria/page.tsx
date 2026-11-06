import { Career, Milestones } from "../../components/career";
import { PrintButton } from "../../components/print-button";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("Trajetória", "Experiência profissional, formação e projetos de Raphael Kaych.", "/trajetoria");

export default function CareerPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page career-page">
      <a className="back-link" href="/#trajetoria">← Voltar ao portfólio</a>
      <header className="page-intro">
        <p className="eyebrow"><span /> RESUMO PROFISSIONAL</p><h1>Raphael Kaych</h1>
        <p>Desenvolvimento de software, qualidade e sustentação de sistemas.</p>
        <PrintButton />
      </header>
      <h2 className="sr-only">Experiência e formação</h2>
      <Career />
      <h2 className="eyebrow milestone-label">PROJETOS PRÓPRIOS E ACADÊMICOS</h2>
      <Milestones />
    </main>
  );
}
