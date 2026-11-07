const roles = [
  {
    period: "AGO – SET 2026", title: "Analista de Sistemas", company: "Estoril Renault",
    details: "Sustentação de sistemas corporativos, suporte N1 e N2, administração de ambientes Windows Server e investigação de incidentes. Atuação com NBS e integrações entre sistemas.",
  },
  {
    period: "JAN – AGO 2026", title: "Coordenador de Projetos de TI", company: "G2 Tecnologia",
    details: "Coordenação de equipes técnicas, priorização de demandas e acompanhamento de entregas e indicadores. Padronização de processos e rotinas de auditoria.",
  },
  {
    period: "NOV 2024 – DEZ 2025", title: "Analista de TI", company: "Mar Brasil Serviços e Locações",
    details: "Implantação de ERP, projetos de migração para nuvem e melhorias em sistemas e processos junto às áreas de negócio.",
  },
];

export function Career() {
  return (
    <div className="career-grid">
      <div>
        <h3 className="eyebrow">EXPERIÊNCIA PROFISSIONAL</h3>
        <ol className="career-timeline">
          {roles.map((role) => (
            <li key={role.company}>
              <p className="eyebrow">{role.period}</p>
              <h4>{role.title}</h4>
              <p className="career-company">{role.company}</p>
              <p>{role.details}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="career-education">
        <h3 className="eyebrow">FORMAÇÃO</h3>
        <article><p className="eyebrow">DESDE JUL 2025 · EM ANDAMENTO</p><h4>Análise e Desenvolvimento de Sistemas</h4><p>Fatec Praia Grande</p></article>
        <article><p className="eyebrow">JAN 2024 – JUL 2025</p><h4>Técnico em Informática</h4><p>ETEC de Praia Grande</p></article>
      </div>
    </div>
  );
}

export function ResumeDetails() {
  return (
    <section className="resume-details" aria-labelledby="resume-details-title">
      <h2 id="resume-details-title" className="eyebrow">COMPETÊNCIAS E IDIOMAS</h2>
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
        <p className="eyebrow">PROJETO EM EQUIPE / INTEGRAÇÃO FISCAL</p>
        <Heading id="vindex-fiscal-title">Vindex Fiscal</Heading>
        <p>Participei do desenvolvimento em equipe do Vindex Fiscal, projeto de integração com a Secretaria da Fazenda (SEFAZ).</p>
        <p>Em integrações assim, interpretar a resposta do serviço externo ajuda a decidir se o fluxo pode avançar ou se precisa de revisão.</p>
        <a className="text-link vindex-demo" href="/radar-de-retorno">Testar um retorno fictício <span aria-hidden="true">↗</span></a>
      </div>
      <figure className="vindex-art">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vindex-fluxo.svg" width="600" height="250" loading="lazy" decoding="async" alt="" />
        <figcaption>Ilustração da integração</figcaption>
      </figure>
    </section>
  );
}

export function Milestones() {
  return (
    <div className="milestones">
      <article className="milestone">
        <p className="eyebrow">TCC / ETEC</p><h3>Projeto Casa</h3>
        <p>Um projeto com Arduino e aplicativo para apoiar a comunicação de pessoas autistas. A pessoa seleciona uma imagem no app. O dispositivo acende luzes, exibe a imagem e fala o que foi mostrado.</p>
        <div className="casa-flow" aria-label="Fluxo do Projeto Casa">
          <span>01 · Selecionar</span><span>02 · Acender</span><span>03 · Exibir e falar</span>
        </div>
        <p>A neuropsicóloga Karen Baldin reconheceu o projeto pelo seu potencial de apoio à comunicação.</p>
      </article>
      <article className="milestone">
        <p className="eyebrow">PROJETO PRÓPRIO / ATENDIMENTO</p><h3>SaaSTickets</h3>
        <p>Meu projeto na área de atendimento, com versão publicada.</p>
        <a className="text-link" href="https://saastickets.ai/">Visitar SaaSTickets <span aria-hidden="true">↗</span></a>
      </article>
    </div>
  );
}
