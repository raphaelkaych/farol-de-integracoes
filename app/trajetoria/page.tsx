import { Career, Milestones, ResumeDetails, VindexFeature } from "../../components/career";
import { PrintButton } from "../../components/print-button";
import { github, pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("Currículo", "Experiência profissional, formação e projetos de Raphael Kaych, incluindo o Vindex Fiscal.", "/trajetoria");

export default function CareerPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page career-page">
      <a className="back-link" href="/#trajetoria">← Voltar ao portfólio</a>
      <header className="page-intro">
        <p className="eyebrow"><span /> CURRÍCULO ONLINE</p><h1>Raphael Kaych</h1>
        <p>Desenvolvimento de software, qualidade e sustentação de sistemas.</p>
        <PrintButton />
        <div className="links resume-quick">
          <a className="text-link" href="/projetos">Projetos e demonstrações ↗</a>
          <a className="text-link" href="/workspace?painel=testes">Testes e código ↗</a>
          <a className="text-link" href={github}>GitHub ↗</a>
        </div>
      </header>
      <h2 className="sr-only">Experiência e formação</h2>
      <Career />
      <VindexFeature heading="h2" />
      <ResumeDetails />
      <h2 className="eyebrow milestone-label">PROJETOS PRÓPRIOS E ACADÊMICOS</h2>
      <Milestones />
    </main>
  );
}
