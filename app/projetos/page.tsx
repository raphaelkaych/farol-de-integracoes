import { ProjectCard } from "../../components/project-card";
import { categories, projects, type Category } from "../../lib/project-index";
import { pageMetadata } from "../../lib/portfolio-meta";

export const metadata = pageMetadata("Projetos", "Estudos de caso e demonstrações de desenvolvimento, QA, APIs, arquitetura e dados.", "/projetos");

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ categoria?: string | string[] }> }) {
  const { categoria } = await searchParams;
  const selected = typeof categoria === "string" && Object.hasOwn(categories, categoria) ? categoria as Category : "todos";
  const visible = selected === "todos" ? projects : projects.filter((project) => project.categories.includes(selected));
  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page">
      <a className="back-link" href="/">← Início</a>
      <header className="page-intro">
        <p className="eyebrow"><span /> ÍNDICE / LABORATÓRIOS</p><h1>Projetos</h1>
        <p>Explore o problema, as decisões técnicas, o código e a demonstração de cada projeto.</p>
      </header>
      <nav className="project-filters" aria-label="Filtrar projetos">
        {(Object.entries(categories) as [Category, string][]).map(([key, label]) => (
          <a key={key} href={key === "todos" ? "/projetos" : "/projetos?categoria=" + key}
            aria-current={selected === key ? "page" : undefined}>{label}</a>
        ))}
      </nav>
      <section aria-labelledby="resultados">
        <h2 id="resultados" className="catalog-count">{visible.length} {visible.length === 1 ? "projeto" : "projetos"}</h2>
        <div className="catalog-grid">{visible.map((project) => <ProjectCard project={project} key={project.slug} />)}</div>
      </section>
    </main>
  );
}
