import { notFound } from "next/navigation";
import { ProjectPreview } from "../../../components/project-card";
import { cases } from "../../../lib/project-cases";
import { casePath, findProject, projects } from "../../../lib/project-index";
import { pageMetadata, siteRepository } from "../../../lib/portfolio-meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = findProject(slug);
  return project ? pageMetadata(project.name, project.summary, casePath(slug)) : {};
}

const sections = [
  ["contexto", "Contexto e objetivo"], ["arquitetura", "Arquitetura"], ["decisoes", "Decisões"],
  ["qualidade", "Segurança e testes"], ["demo", "Demonstração"], ["limites", "Limites e próximos passos"],
] as const;

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const project = findProject(slug);
  const detail = cases.find((item) => item.slug === slug);
  if (!project || !detail) notFound();
  const inWorkspace = project.code.startsWith(siteRepository);

  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page">
      <a className="back-link" href="/projetos">← Todos os projetos</a>
      <header className="case-hero">
        <div className="page-intro">
          <p className="eyebrow"><span /> {project.index} / {project.label}</p>
          <h1>{project.name}</h1><p>{project.summary}</p>
          <div className="tags">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="links">
            <a className="button button-primary" href={project.demo}>Abrir demonstração <span aria-hidden="true">↗</span></a>
            <a className="button button-outline" href={project.code}>Ver código <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <ProjectPreview slug={slug} />
      </header>
      <div className="case-layout">
        <aside className="case-sidebar">
          <nav aria-label="Neste estudo"><p className="eyebrow">NESTE ESTUDO</p>
            {sections.map(([id, label]) => <a key={id} href={"#" + id}>{label}</a>)}
          </nav>
        </aside>
        <div className="case-main">
          <section id="contexto" className="case-section">
            <h2>Contexto e objetivo</h2><p>{detail.context}</p><p>{detail.goal}</p>
          </section>
          <section id="arquitetura" className="case-section">
            <h2>Arquitetura</h2><p>Abra uma etapa para ver o que ela faz no fluxo.</p>
            <div className="architecture">
              {detail.architecture.map((stage, index) => (
                <details key={stage.title} name="etapa" open={index === 0}>
                  <summary><code>0{index + 1}</code><strong>{stage.title}</strong><span aria-hidden="true">+</span></summary>
                  <p>{stage.text}</p>
                </details>
              ))}
            </div>
          </section>
          <section id="decisoes" className="case-section">
            <h2>Decisões e desafios</h2>
            <div className="decision-list">{detail.decisions.map((decision) => (
              <article key={decision.title}><h3>{decision.title}</h3><p>{decision.text}</p></article>
            ))}</div>
            <figure className="code-sample"><figcaption>{detail.snippetLabel}</figcaption>
              <pre tabIndex={0} aria-label="Trecho de código"><code>{detail.snippet}</code></pre>
            </figure>
          </section>
          <section id="qualidade" className="case-section">
            <h2>Segurança e estratégia de testes</h2><p>{detail.quality}</p><p>{detail.tests}</p>
            <div className="links">
              {inWorkspace && <a className="text-link" href={siteRepository + "/actions/workflows/validar.yml"}>Execuções no GitHub Actions ↗</a>}
              {inWorkspace && <a className="text-link" href="/api-contract.json">Contrato HTTP ↗</a>}
              {!inWorkspace && <a className="text-link" href={project.code}>Instruções e testes no repositório ↗</a>}
            </div>
            {slug === "qualitygate-studio" && (
              <details className="case-evidence">
                <summary>Ver a captura do teste de autorização</summary>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/evidencias/qualitygate-permissao.png" loading="lazy" width="1280" height="1326"
                    alt="A versão de referência recusa a reserva com HTTP 403. Com o defeito injetado, o leitor grava uma reserva e recebe HTTP 201." />
                  <figcaption>Captura da execução local em Chromium, no cenário de falha controlada.</figcaption>
                </figure>
              </details>
            )}
          </section>
          <section id="demo" className="case-section case-demo">
            <h2>Experimente o fluxo</h2><p>{project.summary}</p>
            <a className="button button-primary" href={project.demo}>Abrir demonstração ↗</a>
          </section>
          <section id="limites" className="case-section">
            <h2>Limites e próximos passos</h2><p>{detail.limits}</p><p>{detail.next}</p>
            <a className="text-link" href={project.code}>Abrir código e documentação ↗</a>
          </section>
        </div>
      </div>
    </main>
  );
}
