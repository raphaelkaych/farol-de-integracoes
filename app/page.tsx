import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Career, Milestones, VindexFeature } from "../components/career";
import { HomeMotion } from "../components/home-motion";
import { HeroWorkbench } from "../components/hero-workbench";
import { ProjectCard } from "../components/project-card";
import { casePath, projects } from "../lib/project-index";
import { github, siteRepository } from "../lib/portfolio-meta";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const skills = [
  { index: "01", title: "Desenvolvimento", stack: "TypeScript · React · Python", detail: "Interfaces interativas e lógica de domínio separada da apresentação.", href: "/projetos?categoria=fullstack" },
  { index: "02", title: "Backend e dados", stack: "HTTP · SQL · D1 · SQLite", detail: "Contratos de API, persistência, reenvios idempotentes e conciliação.", href: "/projetos?categoria=backend" },
  { index: "03", title: "Quality Engineering", stack: "Playwright · axe · node:test", detail: "Casos negativos, testes de integração e evidências de falhas controladas.", href: "/projetos?categoria=qualidade" },
  { index: "04", title: "Entrega", stack: "Git · GitHub Actions · Workers", detail: "Build reproduzível, validação automatizada e publicação da aplicação.", href: siteRepository + "/actions/workflows/validar.yml" },
];

const notes = [
  { index: "01", title: "Quando parar de tentar entregar um evento?", detail: "O Farol limita as retentativas e preserva o ID quando um pedido precisa passar pela DLQ.", href: casePath("farol-de-integracoes") + "#decisoes" },
  { index: "02", title: "Como conferir que um teste detecta a falha?", detail: "O QualityGate executa a regra em duas variantes do mesmo serviço e compara o estado final.", href: casePath("qualitygate-studio") + "#qualidade" },
  { index: "03", title: "Por que guardar valores em centavos?", detail: "O LedgerFlow concilia quantias inteiras e registra a operação na mesma transação que altera os dados.", href: casePath("ledgerflow") + "#decisoes" },
  { index: "04", title: "Como separar simulação e medição?", detail: "O TraceAtlas exibe os rastros simulados e mede a sonda real do D1 em um painel separado.", href: casePath("traceatlas") + "#decisoes" },
];

const headline = ["Software que", "passa pelo teste."];
const featured = ["qualitygate-studio", "contractshield", "ledgerflow", "traceatlas"]
  .flatMap((slug) => projects.filter((project) => project.slug === slug));

function Headline() {
  return (
    <h1 className="hero-title" aria-label={headline.join(" ")}>
      {headline.map((line, lineIndex) => (
        <span key={line} aria-hidden="true" className={"type-line type-line-" + lineIndex}
          style={{ "--steps": line.length, "--delay": lineIndex === 0 ? "110ms" : "480ms" } as CSSProperties}>
          <span className="type-text">{line}</span>
        </span>
      ))}
    </h1>
  );
}

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1}>
      <section className="hero-band" id="inicio" aria-label="Apresentação">
        <HomeMotion />
        <div className="shell hero">
          <div className="hero-copy">
            <p className="eyebrow hero-kicker"><i /> RAPHAEL KAYCH <span>/</span> PRAIA GRANDE, SP</p>
            <Headline />
            <p className="hero-lead">Desenvolvimento de software e engenharia de qualidade.</p>
            <p className="hero-note">Estudo ADS na Fatec Praia Grande. Uso o que aprendi sustentando sistemas para criar aplicações, APIs e automações de teste que você pode experimentar.</p>
            <div className="links hero-actions">
              <a className="button button-primary" href="/workspace">Explorar Workspace <span aria-hidden="true">↗</span></a>
              <a className="button button-outline" href="#projetos">Explorar projetos <span aria-hidden="true">↓</span></a>
              <a className="text-link" href="/trajetoria">Currículo <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <HeroWorkbench />
        </div>
        <div className="shell hero-bottom">
          <span>DESENVOLVIMENTO / INTEGRAÇÕES / QUALIDADE</span>
          <a href="#projetos">VER OS LABORATÓRIOS <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section id="projetos" className="shell section" aria-labelledby="featured-title">
        <div className="section-heading" data-enter>
          <div><p className="eyebrow">01 / PROJETOS EM DESTAQUE</p><h2 id="featured-title">Projetos para testar</h2></div>
          <a className="button button-outline" href="/projetos">Ver todos os projetos <span aria-hidden="true">↗</span></a>
        </div>
        <div className="feature-grid" data-enter>
          {featured.map((project, index) => <ProjectCard key={project.slug} project={project} featured={index < 2} />)}
        </div>
      </section>

      <section id="engenharia" className="section section-tint" aria-labelledby="engineering-title">
        <div className="shell">
          <div className="section-heading" data-enter>
            <div><p className="eyebrow">02 / ENGENHARIA</p><h2 id="engineering-title">O que você encontra no código</h2></div>
            <p>Da regra de negócio à entrega, cada área aponta para um projeto ou uma execução verificável.</p>
          </div>
          <div className="skill-grid" data-enter>
            {skills.map((skill) => <a href={skill.href} className="skill-card" key={skill.index}>
              <div><span className="eyebrow">{skill.index}</span><span aria-hidden="true">↗</span></div>
              <h3>{skill.title}</h3><p>{skill.detail}</p><span className="skill-stack">{skill.stack}</span>
            </a>)}
          </div>
          <div className="quality-band">
            <div><p className="eyebrow">QUALITY ENGINEERING</p><h3>Uma regra, duas implementações.</h3>
              <p>No QualityGate, um mesmo pedido passa pela versão de referência e por uma versão com falha injetada. O resultado mostra onde a regra foi violada.</p></div>
            <a className="button button-primary" href="/qualitygate">Executar um cenário <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section className="shell section notes" aria-labelledby="notes-title" data-enter>
        <p className="eyebrow">03 / ENGINEERING NOTES</p><h2 id="notes-title">Decisões de implementação</h2>
        <div className="notes-grid">{notes.map((note) => <article key={note.index}>
          <p className="eyebrow">NOTA / {note.index}</p><h3><a href={note.href}>{note.title}</a></h3><p>{note.detail}</p>
        </article>)}</div>
      </section>

      <section className="shell section trajectory" id="trajetoria" aria-labelledby="trajectory-title">
        <div className="section-heading" data-enter>
          <div><p className="eyebrow">04 / TRAJETÓRIA</p><h2 id="trajectory-title">Minha jornada em TI</h2></div>
          <a className="button button-outline" href="/trajetoria">Currículo online <span aria-hidden="true">↗</span></a>
        </div>
        <Career />
        <VindexFeature />
        <p className="eyebrow milestone-label">PROJETOS PRÓPRIOS E ACADÊMICOS</p>
        <Milestones />
      </section>

      <section className="contact" id="contato" aria-labelledby="contact-title">
        <div className="shell contact-inner">
          <div><p className="eyebrow">05 / CONTATO</p><h2 id="contact-title">Raphael Kaych</h2>
            <p>Encontre meu perfil e os repositórios dos projetos no GitHub.</p></div>
          <div className="links"><a className="button button-primary" href={github}>Meu GitHub <span aria-hidden="true">↗</span></a>
            <a className="button button-outline" href="/trajetoria">Currículo online</a></div>
        </div>
      </section>
    </main>
  );
}
