import { github } from "../components/portfolio-chrome";

const projects = [
  {
    name: "Plantão de TI", slug: "plantao-ti", label: "Suporte e SLA",
    text: "Abra chamados, veja qual vence primeiro e resolva um incidente com o prazo à vista.",
    stack: "Python · SQLite",
  },
  {
    name: "Ponte ERP", slug: "ponte-erp", label: "APIs e webhooks",
    text: "Assine um pedido e repita a entrega para ver como o receptor evita registrar a mesma operação duas vezes.",
    stack: "Python · HTTP · HMAC · SQLite",
  },
  {
    name: "Pulso da Operação", slug: "pulso-operacao", label: "Dados e indicadores",
    text: "Mude o horário de corte e descubra onde estão os chamados vencidos em uma base fictícia.",
    stack: "SQL · Python · HTML",
  },
];

const experience = [
  {
    period: "AGO – SET 2026", role: "Analista de Sistemas", company: "Estoril Renault",
    text: "Sustentação de sistemas corporativos, suporte N1 e N2, administração de ambientes Windows Server e investigação de incidentes e integrações.",
  },
  {
    period: "JAN – AGO 2026", role: "Coordenador de Projetos de TI", company: "G2 Tecnologia",
    text: "Organização das demandas de TI, acompanhamento de entregas e indicadores e padronização de processos e rotinas de auditoria.",
  },
  {
    period: "NOV 2024 – DEZ 2025", role: "Analista de TI", company: "Mar Brasil Serviços e Locações",
    text: "Implantação de ERP, projetos de migração para nuvem e melhorias em sistemas e processos junto às áreas de negócio.",
  },
];

export default function Home() {
  return (
    <main id="conteudo">
      <section className="hero shell" aria-labelledby="nome">
        <div className="hero-copy">
          <p className="eyebrow"><span className="index-mark" /> PORTFÓLIO / TI</p>
          <h1 id="nome">Raphael<br /><em>Kaych.</em></h1>
          <p className="hero-lead">Análise de sistemas, desenvolvimento e operações de TI.</p>
          <p className="hero-note">Estudo ADS na Fatec Praia Grande. Meus projetos partem de perguntas do dia a dia de TI: qual chamado atender primeiro, como recuperar uma integração e o que os dados da fila mostram.</p>
          <div className="links">
            <a className="button button-primary" href="#projetos">Explorar projetos <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="#trajetoria">Ver trajetória <span aria-hidden="true">↘</span></a>
          </div>
        </div>
        <figure className="hero-art">
          {/* The diagram is decorative. Its three themes are also present in the page text. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mapa.svg" alt="" width="520" height="526" fetchPriority="high" />
          <figcaption><span>FIG. 01 / MAPA DE TRABALHO</span><span>PRAIA GRANDE · SP</span></figcaption>
        </figure>
      </section>

      <section className="projects-section" id="projetos" aria-labelledby="projetos-titulo">
        <div className="shell">
          <div className="section-heading">
            <div><p className="eyebrow">01 / PROJETOS</p><h2 id="projetos-titulo">Do problema<br className="desktop-break" /> ao sistema.</h2></div>
            <p>Quatro laboratórios com código público, dados fictícios e demonstrações que você pode experimentar no navegador.</p>
          </div>
          <article className="featured">
            <div>
              <p className="eyebrow accent">EM DESTAQUE / ENGENHARIA DE SOFTWARE</p>
              <h3>Farol de<br />Integrações</h3>
              <p>Um pedido chega. O ERP está fora do ar. Acompanhe o evento da fila até a entrega ou a quarentena. Depois, restaure o destino e reprocesse o evento mantendo o histórico.</p>
              <p className="stack">TypeScript · React · API HTTP · SQL/D1</p>
              <div className="links">
                <a className="button button-light" href="/farol">Experimentar o Farol <span aria-hidden="true">↗</span></a>
                <a className="text-link light-link" href={github + "/farol-de-integracoes"}>Ver código <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <div className="flow-art" aria-hidden="true">
              <div className="flow-top"><span>RASTREAMENTO / EVT-1042</span><span>LAB</span></div>
              <div className="flow-row"><span className="flow-dot" /><span>Evento recebido</span><code>+00s</code></div>
              <div className="flow-row"><span className="flow-dot flow-warn" /><span>ERP responde 503</span><code>+00s</code></div>
              <div className="flow-row"><span className="flow-dot flow-warn" /><span>Nova tentativa</span><code>+30s</code></div>
              <div className="flow-row"><span className="flow-dot" /><span>Entrega confirmada</span><code>+90s</code></div>
              <div className="flow-bottom"><span>↳</span> MESMO EVENTO, HISTÓRICO COMPLETO</div>
            </div>
          </article>

          <div className="project-list">
            {projects.map((project, index) => (
              <article className="project-row" key={project.slug}>
                <span className="project-number" aria-hidden="true">0{index + 2}</span>
                <div><p className="eyebrow">{project.label}</p><h3>{project.name}</h3></div>
                <div className="project-description"><p>{project.text}</p><p className="stack">{project.stack}</p></div>
                <div className="project-links">
                  <a className="text-link" href={"/demos/" + project.slug} aria-label={"Abrir demo de " + project.name}>Abrir demo <span aria-hidden="true">↗</span></a>
                  <a href={github + "/" + project.slug} aria-label={"Ver código de " + project.name}>Código <span aria-hidden="true">↗</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="journey shell" id="trajetoria" aria-labelledby="trajetoria-titulo">
        <div className="section-heading">
          <div><p className="eyebrow">02 / TRAJETÓRIA</p><h2 id="trajetoria-titulo">Minha jornada<br className="desktop-break" /> em TI.</h2></div>
          <p>De sustentar sistemas e atender usuários a acompanhar projetos, processos e indicadores de operação.</p>
        </div>
        <div className="journey-grid">
          <div>
            <h3 className="eyebrow block-label">EXPERIÊNCIA PROFISSIONAL</h3>
            <ol className="timeline">
              {experience.map((item) => (
                <li key={item.company}>
                  <p className="eyebrow date-label">{item.period}</p>
                  <h4>{item.role}</h4>
                  <p className="company">{item.company}</p>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="education" aria-labelledby="formacao">
            <h3 className="eyebrow block-label" id="formacao">FORMAÇÃO</h3>
            <div><p className="eyebrow date-label">DESDE JUL 2025 · EM ANDAMENTO</p><h4>Análise e Desenvolvimento de Sistemas</h4><p>Fatec Praia Grande</p></div>
            <div><p className="eyebrow date-label">JAN 2024 – JUL 2025</p><h4>Técnico em Informática</h4><p>ETEC de Praia Grande</p></div>
          </aside>
        </div>

        <h3 className="eyebrow block-label milestones-label">PROJETOS PRÓPRIOS E ACADÊMICOS</h3>
        <div className="milestones">
          <article className="milestone casa">
            <p className="eyebrow">TCC / ETEC</p>
            <h4>Projeto Casa</h4>
            <p>Um projeto com Arduino e aplicativo para apoiar a comunicação de pessoas autistas. A pessoa seleciona uma imagem no app. O dispositivo acende luzes, exibe a imagem e fala o que foi mostrado.</p>
            <div className="casa-flow" aria-label="Fluxo do Projeto Casa">
              <span><b>01</b> Selecionar</span><span><b>02</b> Acender</span><span><b>03</b> Exibir e falar</span>
            </div>
            <p className="small">A neuropsicóloga Karen Baldin reconheceu o projeto pelo seu potencial de apoio à comunicação.</p>
          </article>
          <article className="milestone saas">
            <p className="eyebrow">PROJETO PRÓPRIO / ATENDIMENTO</p>
            <h4>SaaSTickets</h4>
            <p>Meu projeto na área de atendimento. Você pode conhecer a versão publicada no site do SaaSTickets.</p>
            <a className="text-link" href="https://saastickets.ai/">Visitar SaaSTickets <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>

      <div className="outro">
        <div className="shell outro-inner"><p>Quer ver como os projetos funcionam por dentro?</p><a className="button button-primary" href={github}>Explorar meu GitHub <span aria-hidden="true">↗</span></a></div>
      </div>
    </main>
  );
}
