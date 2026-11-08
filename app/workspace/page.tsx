import { WorkspaceExplorer } from "../../components/workspace-explorer";
import { pageMetadata } from "../../lib/portfolio-meta";
import { panels, workspaceProjects, type Panel } from "../../lib/workspace-projects";
import "./workspace.css";

export const metadata = pageMetadata("Developer Workspace", "Explore código, arquitetura, testes e evidências dos laboratórios de Raphael Kaych.", "/workspace");

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<{ projeto?: string; painel?: string }> }) {
  const params = await searchParams;
  const projects = workspaceProjects();
  const slug = projects.find(({ project }) => project.slug === params.projeto)?.project.slug ?? projects[0].project.slug;
  const panel = typeof params.painel === "string" && Object.hasOwn(panels, params.painel) ? params.painel as Panel : "visao";

  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page workspace-page">
      <a className="back-link" href="/">← Portfólio</a>
      <header className="page-intro workspace-intro">
        <p className="eyebrow"><span /> RK / BANCADA DE ENGENHARIA</p>
        <h1>Developer Workspace</h1>
        <p>Escolha um projeto e siga da arquitetura ao código e às evidências de teste.</p>
      </header>
      <WorkspaceExplorer entries={projects} panels={panels} initialSlug={slug} initialPanel={panel} />
    </main>
  );
}
