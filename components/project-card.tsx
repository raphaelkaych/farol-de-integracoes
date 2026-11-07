import { casePath, type Project } from "../lib/project-index";
import { analyze } from "../lib/traceatlas/model";

export function ProjectPreview({ slug }: { slug: string }) {
  if (slug === "qualitygate-studio") {
    return (
      <div className="project-preview preview-qa" aria-hidden="true">
        <div className="preview-head"><span><i /> QA STUDIO</span><span>REENVIO / PED-120</span></div>
        <div className="preview-qa-grid">
          <div><small>REFERÊNCIA</small><b>201 <i>→</i> 200</b><span><i className="preview-dot ok" /> 1 reserva</span></div>
          <div><small>FALHA INJETADA</small><b>201 <i>→</i> 201</b><span><i className="preview-dot warn" /> 2 reservas</span></div>
        </div>
        <div className="preview-foot">Contrato esperado · um recibo por pedido</div>
      </div>
    );
  }
  if (slug === "ledgerflow") {
    return (
      <div className="project-preview preview-ledger" aria-hidden="true">
        <div className="preview-head"><span><i /> LEDGERFLOW</span><span>EXTRATO FICTÍCIO</span></div>
        <div className="preview-ledger-row"><code>LF-1001</code><b>R$ 349,00</b><span>Conciliada</span></div>
        <div className="preview-ledger-row"><code>LF-1002</code><b>R$ 1.260,00</b><span>Divergente</span></div>
        <div className="preview-ledger-row"><code>LF-1004</code><b>R$ 79,90</b><span>Pendente</span></div>
      </div>
    );
  }
  if (slug === "farol-de-integracoes") {
    return (
      <div className="project-preview preview-farol" aria-hidden="true">
        <div className="preview-head"><span><i /> EVENT TRACE</span><span>EVT-1042</span></div>
        <div className="preview-trace">
          <div><small>+00s</small><i /><code>503</code></div>
          <div><small>+30s</small><i /><code>503</code></div>
          <div><small>+90s</small><i /><code>200</code></div>
        </div>
        <div className="preview-foot">Cenário ERP instável · relógio virtual</div>
      </div>
    );
  }
  if (slug === "ponte-erp") {
    return (
      <div className="project-preview preview-compact" aria-hidden="true">
        <div className="preview-head"><span><i /> POST /WEBHOOK</span><span>HMAC</span></div>
        <div className="preview-command"><code>201</code><b>Criado</b><code>200</code><b>Reenvio</b><code>409</code><b>Conflito</b></div>
      </div>
    );
  }
  if (slug === "traceatlas") {
    const trace = analyze("db-lento", "exemplo").traces[1];
    return (
      <div className="project-preview" aria-hidden="true">
        <div className="preview-head"><span><i /> TRACEATLAS</span><span>BANCO LENTO / SIMULAÇÃO</span></div>
        <div className="preview-spans">
          {trace.spans.filter(({ service }) => service === "API" || service === "Banco" || service === "ERP").map((item) => (
            <div key={item.id}><span>{item.service}</span><span><i style={{ left: item.startMs / trace.durationMs * 100 + "%", width: item.durationMs / trace.durationMs * 100 + "%" }} /></span><code>{item.durationMs} ms</code></div>
          ))}
        </div>
      </div>
    );
  }
  if (slug === "pulso-operacao") {
    return (
      <div className="project-preview preview-compact" aria-hidden="true">
        <div className="preview-head"><span><i /> RECORTE SQL</span><span>08 MAI / 18H UTC</span></div>
        <div className="preview-pulso"><b>75%</b><span>resolvidos<br />no prazo</span><i /></div>
      </div>
    );
  }
  if (slug === "radar-de-retorno") {
    return (
      <div className="project-preview" aria-hidden="true">
        <div className="preview-head"><span><i /> RADAR DE RETORNO</span><span>CONTRATO</span></div>
        <div className="preview-ledger-row"><code>200</code><b>Protocolo em texto</b><span>Avançar</span></div>
        <div className="preview-ledger-row"><code>200</code><b>Protocolo numérico</b><span>Revisar</span></div>
        <div className="preview-ledger-row"><code>202</code><b>Em processamento</b><span>Aguardar</span></div>
      </div>
    );
  }
  return (
    <div className="project-preview preview-compact" aria-hidden="true">
      <div className="preview-head"><span><i /> FILA DO PLANTÃO</span><span>SLA</span></div>
      <div className="preview-plantao"><code>P1</code><b>ERP indisponível</b><span>Em atraso</span></div>
      <div className="preview-plantao"><code>P2</code><b>Falha em importação</b><span>+20 min</span></div>
    </div>
  );
}

export function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <article className={"project-card" + (featured ? " project-feature" : "")} aria-labelledby={"card-" + project.slug}>
      <div className="project-content">
        <div className="card-kicker"><span className="eyebrow">{project.index} / {project.label}</span><span className="live-label"><i /> Demo online</span></div>
        <h3 id={"card-" + project.slug}><a href={casePath(project.slug)}>{project.name}</a></h3>
        <p>{project.summary}</p>
        <div className="tags">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <ProjectPreview slug={project.slug} />
      <div className="card-actions">
        <a className="case-link" href={casePath(project.slug)} aria-label={"Estudo de caso de " + project.name}>Estudo de caso <span aria-hidden="true">↗</span></a>
        <div>
          <a href={project.demo} aria-label={"Demo de " + project.name}>Demo <span aria-hidden="true">↗</span></a>
          <a href={project.code} aria-label={"Código de " + project.name}>Código <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </article>
  );
}
