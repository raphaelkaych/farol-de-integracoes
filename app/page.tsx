import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Career, Milestones, VindexFeature } from "../components/career";
import { HomeMotion } from "../components/home-motion";
import { HeroWorkbench } from "../components/hero-workbench";
import { ProjectRow } from "../components/project-card";
import { casePath, projects } from "../lib/project-index";
import { github, siteRepository } from "../lib/portfolio-meta";
import inventory from "../lib/test-inventory.json";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const areas = [
  { title: "Desenvolvimento", stack: "TypeScript, React, Python", detail: "Interfaces interativas com a lógica de domínio separada da apresentação.", href: "/projetos?categoria=fullstack", link: "Projetos full stack" },
  { title: "Backend e dados", stack: "HTTP, SQL, D1, SQLite", detail: "Contratos de API, persistência, reenvios idempotentes e conciliação.", href: "/projetos?categoria=backend", link: "Projetos de backend" },
  { title: "Quality engineering", stack: "Playwright, axe, node:test", detail: "Casos negativos, testes de integração e falhas controladas com evidência.", href: "/projetos?categoria=qualidade", link: "Projetos de QA" },
  { title: "Entrega", stack: "Git, GitHub Actions, Workers", detail: "Build reproduzível, validação automatizada e publicação da aplicação.", href: siteRepository + "/actions/workflows/validar.yml", link: "Execuções do CI" },
];

const questions = [
  { title: "Quando parar de tentar entregar um evento?", detail: "O Farol limita as retentativas e preserva o ID quando um pedido precisa passar pela DLQ.", href: casePath("farol-de-integracoes") + "#decisoes" },
  { title: "Como conferir que um teste detecta a falha?", detail: "O QualityGate executa a regra em duas variantes do mesmo serviço e compara o estado final.", href: casePath("qualitygate-studio") + "#qualidade" },
  { title: "Por que guardar valores em centavos?", detail: "O LedgerFlow concilia quantias inteiras e registra a operação na mesma transação que altera os dados.", href: casePath("ledgerflow") + "#decisoes" },
  { title: "Como separar simulação e medição?", detail: "O TraceAtlas exibe os rastros simulados e mede a sonda real do D1 em um painel separado.", href: casePath("traceatlas") + "#decisoes" },
];

const stats = [
  { value: projects.length, label: "laboratórios que rodam no navegador" },
  { value: inventory.browser.tests, label: "cenários Playwright no CI" },
  { value: inventory.logic.files, label: "suítes de testes de lógica" },
  { value: projects.filter((project) => !project.code.startsWith(siteRepository)).length, label: "repositórios Python independentes" },
];

const headline = ["Software que", "passa pelo teste."];
const featured = ["qualitygate-studio", "contractshield", "ledgerflow", "traceatlas", "farol-de-integracoes"]
  .flatMap((slug) => projects.filter((project) => project.slug === slug));

function Headline() {
  return (
    <h1 className="hero-title" id="hero-title" aria-label={headline.join(" ")}>
      {headline.map((line, lineIndex) => (
        <span key={line} aria-hidden="true" className={"type-line type-line-" + lineIndex}
          style={{ "--steps": line.length, "--delay": lineIndex === 0 ? "120ms" : "520ms" } as CSSProperties}>
          <span className="type-text">{line}</span>
        </span>
      ))}
    </h1>
  );
}

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1} className="home">
      <section className="hero-band" id="inicio" aria-labelledby="hero-title">
        <HomeMotion />
        <div className="shell hero">
          <div className="hero-copy">
            <p className="hero-kicker">Desenvolvimento, integrações e qualidade de software</p>
            <Headline />
          </div>
          <div className="hero-aside">
            <p className="hero-lead">Sou <strong>Raphael Kaych</strong>, estudante de ADS na Fatec Praia Grande. Desenvolvo aplicações, APIs e integrações, e escrevo os testes que provam que elas funcionam.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/qualitygate">Executar uma demo</a>
              <a className="button button-outline" href="#projetos">Ver projetos</a>
            </div>
            <p className="hero-shortcuts">
              <a href="/trajetoria">Currículo</a>
              <a href={github}>GitHub <span aria-hidden="true">↗</span></a>
              <a href="/workspace">Código e testes</a>
            </p>
          </div>
        </div>
        <div className="shell hero-bench">
          <HeroWorkbench />
          <dl className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd><data value={stat.value} data-count={stat.value}>{stat.value}</data></dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="projetos" className="section" aria-labelledby="featured-title">
        <div className="shell">
          <header className="section-head">
            <h2 id="featured-title">Projetos para testar</h2>
            <p>Cada projeto parte de um problema de integração ou qualidade, toma uma decisão técnica e chega a um resultado que um teste confirma.</p>
          </header>
          <ol className="case-rows">
            {featured.map((project) => <ProjectRow key={project.slug} project={project} />)}
          </ol>
          <div className="lab-index" data-enter>
            <div className="lab-index-head">
              <h3>Os nove laboratórios</h3>
              <a className="text-link" href="/projetos">Catálogo com filtros</a>
            </div>
            <ul>
              {projects.map((project) => (
                <li key={project.slug}>
                  <a href={casePath(project.slug)}>{project.name}</a>
                  <span>{project.label}</span>
                  <code>{project.stack.slice(0, 3).join(", ")}</code>
                  <a className="lab-index-demo" href={project.demo} aria-label={"Demo de " + project.name}>Demo</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="engenharia" className="section section-tint" aria-labelledby="engineering-title">
        <div className="shell engineering">
          <header className="section-head">
            <h2 id="engineering-title">O que você encontra no código</h2>
            <p>Da regra de negócio à entrega, cada área aponta para um projeto ou uma execução verificável.</p>
          </header>
          <ul className="area-list" data-enter>
            {areas.map((area) => (
              <li key={area.title}>
                <h3>{area.title}</h3>
                <p>{area.detail}</p>
                <code>{area.stack}</code>
                <a className="text-link" href={area.href}>{area.link}</a>
              </li>
            ))}
          </ul>
          <div className="questions" data-enter>
            <h3>Perguntas que o código responde</h3>
            <ul>
              {questions.map((question) => (
                <li key={question.title}>
                  <a href={question.href}>{question.title}</a>
                  <p>{question.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section trajectory" id="trajetoria" aria-labelledby="trajectory-title">
        <div className="shell">
          <header className="section-head">
            <h2 id="trajectory-title">Minha jornada em TI</h2>
            <p>Da sustentação de sistemas ao desenvolvimento. O que aprendi resolvendo incidentes aparece nos laboratórios.</p>
            <a className="button button-outline button-compact" href="/trajetoria">Currículo completo</a>
          </header>
          <Career />
          <VindexFeature />
          <h3 className="milestone-label">Projetos próprios e acadêmicos</h3>
          <Milestones />
        </div>
      </section>

      <section className="contact" id="contato" aria-labelledby="contact-title">
        <div className="shell contact-inner">
          <div>
            <h2 id="contact-title">Vamos conversar</h2>
            <p>Código, currículo e demonstrações estão abertos. O GitHub reúne os repositórios e o caminho para falar comigo.</p>
          </div>
          <div className="links">
            <a className="button button-primary" href={github}>Meu GitHub <span aria-hidden="true">↗</span></a>
            <a className="button button-outline" href="/trajetoria">Currículo online</a>
          </div>
        </div>
      </section>
    </main>
  );
}
