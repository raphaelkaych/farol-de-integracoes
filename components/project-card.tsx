import { casePath, type Project } from "../lib/project-index";
import { analyze } from "../lib/traceatlas/model";

export function ProjectPreview({ slug }: { slug: string }) {
  if (slug === "contractshield") {
    return (
      <div className="project-preview preview-visual preview-contract-flow" aria-hidden="true">
        <div className="preview-head"><span><i /> FLUXO HTTP</span><span>EXEMPLOS DE CONTRATO</span></div>
        <div className="pv-body">
          <div className="pv-contract-path">
            <div className="pv-flow-node">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m7 10 2 2-2 2m5 0h4" /></svg>
              <span>Requisição</span>
            </div>
            <span className="pv-flow-arrow">→</span>
            <div className="pv-flow-node">
              <svg viewBox="0 0 24 24"><path d="m12 3 7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6Z" /><path d="m9 12 2 2 4-4" /></svg>
              <span>Permissão</span>
            </div>
            <span className="pv-flow-arrow">→</span>
            <div className="pv-flow-node">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M7 10h5m-5 4h10" /></svg>
              <span>Resposta</span>
            </div>
          </div>
          <div className="pv-contract-outcomes">
            <div data-tone="ok"><code>POST <b>201</b></code><span>Operador</span></div>
            <div data-tone="warn"><code>GET <b>404</b></code><span>Outro escopo</span></div>
            <div data-tone="ok"><code>POST <b>200</b></code><span>Mesma chave</span></div>
          </div>
        </div>
      </div>
    );
  }
  if (slug === "qualitygate-studio") {
    return (
      <div className="project-preview preview-visual preview-comparison" aria-hidden="true">
        <div className="preview-head"><span><i /> REENVIO DE PEDIDO</span><span>SIMULAÇÃO</span></div>
        <div className="pv-body pv-comparison-grid">
          <div className="pv-comparison-result" data-tone="ok">
            <small>REFERÊNCIA</small>
            <b>201 <span>→</span> 200</b>
            <span className="pv-badge"><i /> 1 reserva</span>
          </div>
          <div className="pv-comparison-result" data-tone="warn">
            <small>FALHA INJETADA</small>
            <b>201 <span>→</span> 201</b>
            <span className="pv-badge"><i /> 2 reservas</span>
          </div>
        </div>
        <div className="pv-note"><code>PED-120</code><span>Um recibo por pedido</span></div>
      </div>
    );
  }
  if (slug === "ledgerflow") {
    return (
      <div className="project-preview preview-visual preview-reconciliation" aria-hidden="true">
        <div className="preview-head"><span><i /> CONCILIAÇÃO</span><span>EXTRATO FICTÍCIO</span></div>
        <div className="pv-body pv-ledger-pair">
          <div className="pv-ledger-source"><small>SISTEMA</small><b>R$ 349,00</b><code>S-101</code></div>
          <div className="pv-ledger-bridge"><span>=</span></div>
          <div className="pv-ledger-source"><small>BANCO</small><b>R$ 349,00</b><code>B-101</code></div>
        </div>
        <div className="pv-note"><code>LF-1001</code><span className="pv-badge" data-tone="ok"><i /> Conciliada</span></div>
      </div>
    );
  }
  if (slug === "farol-de-integracoes") {
    return (
      <div className="project-preview preview-visual preview-delivery" aria-hidden="true">
        <div className="preview-head"><span><i /> ENTREGA AO ERP</span><span>SIMULAÇÃO</span></div>
        <ol className="pv-body pv-delivery-path">
          <li data-tone="warn"><small>+00 s</small><i /><code>503</code><span>Tentativa</span></li>
          <li data-tone="warn"><small>+30 s</small><i /><code>503</code><span>Retentativa</span></li>
          <li data-tone="ok"><small>+90 s</small><i /><code>200</code><span>Entregue</span></li>
        </ol>
        <div className="pv-note"><code>EVT-1042</code><span>ERP instável · relógio virtual</span></div>
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
      <div className="project-preview preview-visual preview-waterfall" aria-hidden="true">
        <div className="preview-head"><span><i /> RASTRO DE PEDIDO</span><span>SIMULAÇÃO</span></div>
        <div className="pv-body pv-waterfall-rows">
          {trace.spans.filter(({ service }) => service === "API" || service === "Banco" || service === "ERP").map((item) => (
            <div className="pv-waterfall-row" key={item.id} data-tone={item.service === "Banco" ? "warn" : undefined}>
              <span>{item.service}</span>
              <span className="pv-waterfall-track"><i style={{ left: item.startMs / trace.durationMs * 100 + "%", width: item.durationMs / trace.durationMs * 100 + "%" }} /></span>
              <code>{item.durationMs} ms</code>
            </div>
          ))}
          <div className="pv-waterfall-axis"><span>0</span><span>{trace.durationMs} ms</span></div>
        </div>
        <div className="pv-note"><span>Cenário de banco lento</span></div>
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
