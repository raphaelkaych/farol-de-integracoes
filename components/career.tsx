const roles = [
  {
    period: "Ago – set 2026", title: "Analista de Sistemas", company: "Estoril Renault",
    details: "Sustentação de sistemas corporativos, suporte N1 e N2, administração de ambientes Windows Server e investigação de incidentes. Atuação com NBS e integrações entre sistemas.",
  },
  {
    period: "Jan – ago 2026", title: "Coordenador de Projetos de TI", company: "G2 Tecnologia",
    details: "Coordenação de equipes técnicas, priorização de demandas e acompanhamento de entregas e indicadores. Padronização de processos e rotinas de auditoria.",
  },
  {
    period: "Nov 2024 – dez 2025", title: "Analista de TI", company: "Mar Brasil Serviços e Locações",
    details: "Implantação de ERP, projetos de migração para nuvem e melhorias em sistemas e processos junto às áreas de negócio.",
  },
];

export function Career() {
  return (
    <div className="career-grid">
      <div>
        <h3 className="career-heading">Experiência profissional</h3>
        <ol className="career-timeline">
          {roles.map((role) => (
            <li key={role.company}>
              <p className="career-period">{role.period}</p>
              <h4>{role.title}</h4>
              <p className="career-company">{role.company}</p>
              <p>{role.details}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="career-education">
        <h3 className="career-heading">Formação</h3>
        <article><p className="career-period">Desde jul 2025, em andamento</p><h4>Análise e Desenvolvimento de Sistemas</h4><p>Fatec Praia Grande</p></article>
        <article><p className="career-period">Jan 2024 – jul 2025</p><h4>Técnico em Informática</h4><p>ETEC de Praia Grande</p></article>
      </div>
    </div>
  );
}

export function ResumeDetails() {
  return (
    <section className="resume-details" aria-labelledby="resume-details-title">
      <h2 id="resume-details-title" className="career-heading">Competências e idiomas</h2>
      <dl>
        <div><dt>Sistemas e operações</dt><dd>Suporte N1 e N2, Windows Server, NBS e implantação de ERP.</dd></div>
        <div><dt>Desenvolvimento e integração</dt><dd>SQL, Git e GitHub, APIs, webhooks e testes de software.</dd></div>
        <div><dt>Idiomas</dt><dd>Português nativo, inglês intermediário e espanhol básico.</dd></div>
      </dl>
    </section>
  );
}

export function VindexFeature({ heading: Heading = "h3" }: { heading?: "h2" | "h3" }) {
  return (
    <section className="vindex-feature" id="vindex-fiscal" aria-labelledby="vindex-fiscal-title" data-enter>
      <div className="vindex-copy">
        <p className="eyebrow">Projeto em equipe, integração fiscal</p>
        <Heading id="vindex-fiscal-title">Vindex Fiscal</Heading>
        <p>Participei do desenvolvimento em equipe do Vindex Fiscal, projeto de integração com a Secretaria da Fazenda (SEFAZ).</p>
        <p>Em integrações assim, interpretar a resposta do serviço externo ajuda a decidir se o fluxo pode avançar ou se precisa de revisão.</p>
        <a className="text-link vindex-demo" href="/radar-de-retorno">Testar um retorno fictício</a>
      </div>
      <figure className="vindex-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vindex-fluxo.svg" width="600" height="250" loading="lazy" decoding="async" alt="" />
        <figcaption>Ilustração da integração</figcaption>
      </figure>
    </section>
  );
}

function CasaFlow() {
  return (
    <figure className="casa-flow">
      <svg viewBox="0 0 420 150" role="img" aria-labelledby="casa-flow-title">
        <title id="casa-flow-title">Fluxo do Projeto Casa: o aplicativo seleciona uma imagem, o dispositivo acende luzes, exibe a imagem e fala o conteúdo.</title>
        <g className="casa-phone">
          <rect x="18" y="18" width="70" height="114" rx="12" />
          <rect className="casa-pick" x="31" y="40" width="44" height="34" rx="5" />
          <path d="M31 86h44M31 98h30" />
        </g>
        <path className="casa-signal" d="M100 75H182" />
        <g className="casa-device">
          <rect x="196" y="30" width="128" height="90" rx="14" />
          <rect className="casa-screen" x="212" y="46" width="64" height="48" rx="6" />
          <circle className="casa-light" cx="300" cy="54" r="6" />
          <circle className="casa-light" cx="300" cy="74" r="6" />
          <circle className="casa-light" cx="300" cy="94" r="6" />
        </g>
        <g className="casa-voice"><path d="M340 60q12 15 0 30" /><path d="M354 50q22 25 0 50" /><path d="M368 40q32 35 0 70" /></g>
      </svg>
      <figcaption>
        <ol>
          <li>Selecionar no app</li>
          <li>Acender as luzes</li>
          <li>Exibir e falar</li>
        </ol>
      </figcaption>
    </figure>
  );
}

export function Milestones() {
  return (
    <div className="milestones">
      <article className="milestone milestone-casa" data-enter>
        <p className="eyebrow">TCC na ETEC</p><h3>Projeto Casa</h3>
        <p>Um projeto com Arduino e aplicativo para apoiar a comunicação de pessoas autistas. A pessoa seleciona uma imagem no app. O dispositivo acende luzes, exibe a imagem e fala o que foi mostrado.</p>
        <CasaFlow />
        <p className="milestone-note">A neuropsicóloga Karen Baldin reconheceu o projeto pelo seu potencial de apoio à comunicação.</p>
      </article>
      <article className="milestone milestone-saas" data-enter>
        <p className="eyebrow">Projeto próprio, atendimento</p><h3>SaaSTickets</h3>
        <p>Meu projeto na área de atendimento, com versão publicada.</p>
        <a className="button button-outline button-compact" href="https://saastickets.ai/">Visitar SaaSTickets <span aria-hidden="true">↗</span></a>
      </article>
    </div>
  );
}
