"use client";

import { useState } from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { github, siteRepository } from "../lib/portfolio-meta";
import type { Panel, WorkspaceProject } from "../lib/workspace-projects";
import { useBrowserReady } from "./use-browser-ready";

type Props = { entries: WorkspaceProject[]; panels: Record<Panel, string>; initialSlug: string; initialPanel: Panel };
type Excerpt = WorkspaceProject["snippets"][number];

function sourceUrl(file: Excerpt) {
  return siteRepository + "/blob/main/" + file.file + "#L" + file.line + "-L" + file.end;
}

function CodeExplorer({ snippets }: { snippets: Excerpt[] }) {
  const ready = useBrowserReady();
  const [selected, setSelected] = useState(0);
  const file = snippets[selected];
  return (
    <>
      <h2>Código fonte</h2>
      <p className="lab-meta">Os trechos são extraídos dos arquivos e conferidos pelo CI.</p>
      <div className="ws-options" role="group" aria-label="Selecionar trecho">
        {snippets.map((item, index) => <button type="button" key={item.kind} disabled={!ready}
          aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.kind}</button>)}
      </div>
      <figure className="code-sample ws-code">
        <figcaption><span>{file.file}</span><a href={sourceUrl(file)}>Abrir linhas no GitHub ↗</a></figcaption>
        <pre tabIndex={0} aria-label="Código do repositório"><code>{file.code.split("\n").map((line, index) =>
          <span className="ws-code-line" key={index}><i aria-hidden="true">{file.line + index}</i>{line}{"\n"}</span>)}</code></pre>
      </figure>
    </>
  );
}

function Architecture({ entry }: { entry: WorkspaceProject }) {
  const ready = useBrowserReady();
  const [selected, setSelected] = useState(0);
  const node = entry.nodes[selected];
  const stage = entry.detail.architecture[selected];
  const excerpt = entry.snippets.find((item) => item.kind === node.kind) ?? entry.snippets[0];
  return (
    <>
      <h2>Arquitetura</h2>
      <p className="lab-meta">Selecione um componente para seguir o fluxo e ver como ele pode falhar.</p>
      <ol className="ws-flow" aria-label="Componentes do sistema">
        {entry.nodes.map((_, index) => <li key={index}>
          <button type="button" aria-pressed={selected === index} disabled={!ready} onClick={() => setSelected(index)}>
            <code>0{index + 1}</code>{entry.detail.architecture[index].title}
          </button>
        </li>)}
      </ol>
      <section className="ws-inspector" aria-labelledby="ws-node-title">
        <h3 id="ws-node-title">{stage.title}</h3><p>{stage.text}</p>
        <dl>
          <div><dt>Entrada</dt><dd>{node.input}</dd></div>
          <div><dt>Saída</dt><dd>{node.output}</dd></div>
          <div><dt>Dependência</dt><dd>{node.depends}</dd></div>
          <div><dt>Falha possível</dt><dd>{node.failure}</dd></div>
        </dl>
        <a className="text-link" href={sourceUrl(excerpt)}>{excerpt.file} ↗</a>
      </section>
    </>
  );
}

const commands = ["help", "projects", "skills", "architecture", "tests", "github", "contact"] as const;
type Command = typeof commands[number];

function Terminal({ entry, onPanel }: { entry: WorkspaceProject; onPanel: (panel: Panel) => void }) {
  const ready = useBrowserReady();
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{ command: string; output: ReactNode }[]>([]);

  function run(value: string) {
    const action = value.trim().toLowerCase();
    if (!action) return;
    const outputs: Record<Command, ReactNode> = {
      help: commands.join(" · "),
      projects: <a href="/projetos">Abrir o catálogo completo ↗</a>,
      skills: entry.project.stack.join(" · "),
      architecture: "Painel de arquitetura aberto.",
      tests: "Painel de testes aberto.",
      github: <a href={entry.project.code}>Abrir o código no GitHub ↗</a>,
      contact: <a href="/#contato">Ver os canais de contato ↗</a>,
    };
    const output = Object.hasOwn(outputs, action) ? outputs[action as Command] : "Comando desconhecido. Digite help para ver a lista.";
    if (action === "architecture") onPanel("arquitetura");
    if (action === "tests") onPanel("testes");
    setHistory((previous) => [...previous.slice(-5), { command: action, output }]);
    setCommand("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(command);
  }

  return (
    <section className="ws-terminal" aria-labelledby="ws-terminal-title">
      <header><h2 id="ws-terminal-title">Terminal demonstrativo</h2><span>COMANDOS DA INTERFACE</span></header>
      <div className="ws-log" aria-live="polite">
        {history.length ? history.map((item, index) => (
          <div key={index}><code>$ {item.command}</code><p>{item.output}</p></div>
        )) : <p>Use <code>help</code> para listar comandos ou abra um painel pelos atalhos.</p>}
      </div>
      <div className="ws-options" role="group" aria-label="Atalhos do terminal">
        {commands.map((item) => <button type="button" key={item} disabled={!ready} onClick={() => run(item)}>{item}</button>)}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="ws-command" className="sr-only">Comando demonstrativo</label>
        <input id="ws-command" type="text" autoComplete="off" spellCheck={false} placeholder="help" maxLength={42}
          value={command} disabled={!ready} onChange={(event) => setCommand(event.target.value)} />
        <button type="submit" className="button button-outline" disabled={!ready || !command.trim()}>Executar</button>
      </form>
    </section>
  );
}

function PanelContent({ entry, panel }: { entry: WorkspaceProject; panel: Panel }) {
  const { project, detail, test } = entry;
  if (panel === "codigo") return <CodeExplorer snippets={entry.snippets} />;
  if (panel === "arquitetura") return <Architecture entry={entry} />;
  if (panel === "testes") {
    const excerpt = entry.snippets.find((item) => item.kind === "Teste");
    return (
      <>
        <h2>Testes</h2>
        <div className="ws-inspector">
          <p className="eyebrow">{test.kind}</p><h3>{test.title}</h3>
          <p>{detail.tests}</p><p>{test.result}</p>
          <div className="links">
            {excerpt && <a className="text-link" href={sourceUrl(excerpt)}>Arquivo do teste ↗</a>}
            <a className="text-link" href={test.link}>GitHub Actions ↗</a>
          </div>
        </div>
      </>
    );
  }
  if (panel === "evidencias") return (
    <>
      <h2>Evidências</h2>
      <p>{test.result}</p>
      <div className="ws-resource-links">
        <a href={test.link}>Execução e artefatos no GitHub Actions ↗</a>
        <a href={"/projetos/" + project.slug + "#qualidade"}>Estratégia de segurança e testes ↗</a>
        {project.slug === "qualitygate-studio" && <a href="/evidencias/qualitygate-permissao.png">Captura real do teste de autorização ↗</a>}
        {project.slug === "contractshield" && <a href="/contractshield.openapi.json">Contrato OpenAPI do laboratório ↗</a>}
      </div>
    </>
  );
  return (
    <>
      <h2>Visão geral</h2><p>{detail.context}</p><p>{detail.goal}</p>
      <div className="tags">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <h3>Decisões do projeto</h3>
      <ul className="ws-decisions">{detail.decisions.map(({ title, text }) => <li key={title}><strong>{title}</strong><p>{text}</p></li>)}</ul>
    </>
  );
}

export function WorkspaceExplorer({ entries, panels, initialSlug, initialPanel }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [panel, setPanel] = useState(initialPanel);
  const entry = entries.find(({ project }) => project.slug === slug) ?? entries[0];
  const path = (project: string, next: Panel) => "/workspace?projeto=" + project + "&painel=" + next;

  function select(project: string, next: Panel) {
    setSlug(project);
    setPanel(next);
    window.history.replaceState(window.history.state, "", path(project, next));
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, project: string, next: Panel) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select(project, next);
  }

  return (
    <div className="workspace">
      <div className="ws-bar">
        <span className="ws-mark" aria-hidden="true">⌘</span>
        <code>raphael-kaych / {entry.project.slug}</code>
        <span className="ws-bar-note">CÓDIGO E TESTES VERIFICÁVEIS</span>
      </div>
      <div className="ws-layout">
        <aside className="ws-sidebar">
          <p className="eyebrow">EXPLORADOR</p>
          <nav aria-label="Projetos no Workspace">
            {entries.map(({ project }) => <a href={path(project.slug, panel)} key={project.slug}
              aria-current={slug === project.slug ? "page" : undefined} onClick={(event) => follow(event, project.slug, panel)}>
              <code>{project.index}</code> {project.name}
            </a>)}
          </nav>
          <a className="text-link" href="/projetos">Catálogo completo ↗</a>
        </aside>
        <div className="ws-main">
          <header className="ws-project">
            <div><p className="eyebrow">{entry.project.label}</p><p className="ws-project-title">{entry.project.name}</p></div>
            <div className="links">
              <a className="button button-compact button-outline" href={"/projetos/" + slug}>Estudo de caso ↗</a>
              <a className="button button-compact button-primary" href={entry.project.demo}>Abrir demo ↗</a>
            </div>
          </header>
          <nav className="ws-panels" aria-label="Painéis do Workspace">
            {(Object.keys(panels) as Panel[]).map((key) => <a href={path(slug, key)} key={key}
              aria-current={panel === key ? "page" : undefined} onClick={(event) => follow(event, slug, key)}>{panels[key]}</a>)}
          </nav>
          <div className="ws-content" key={slug + "/" + panel}>
            <PanelContent entry={entry} panel={panel} />
          </div>
          <Terminal entry={entry} onPanel={(next) => select(slug, next)} />
        </div>
      </div>
      <footer className="ws-footer"><a href={github}>Perfil GitHub ↗</a><a href="/trajetoria">Currículo online ↗</a></footer>
    </div>
  );
}
