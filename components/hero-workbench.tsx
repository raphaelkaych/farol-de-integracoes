"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { casePath } from "../lib/project-index";
import { useBrowserReady } from "./use-browser-ready";

type Scenario = "success" | "blocked" | "invalid" | "stock";
type Step = { id: string; node: number; text: string; duration: number; path?: string };
const layers = [
  { label: "Interface", text: "Prepara a quantidade e a referência do pedido e envia para a API.", project: "qualitygate-studio", projectName: "QualityGate Studio" },
  { label: "API", text: "Confere o perfil e os dados antes de autorizar a reserva.", project: "ledgerflow", projectName: "LedgerFlow" },
  { label: "Dados", text: "Uma operação válida atualiza o saldo e gera um único recibo.", project: "farol-de-integracoes", projectName: "Farol de Integrações" },
] as const;
const scenarios: Record<Scenario, { label: string; status: string; code: string; result: string; detail: string; node: number }> = {
  success: { label: "Reserva válida", status: "201", code: "HTTP 201", result: "Reserva confirmada", detail: "O saldo é atualizado e a interface recebe o recibo da reserva.", node: 2 },
  blocked: { label: "Perfil sem permissão", status: "403", code: "HTTP 403", result: "Escrita bloqueada", detail: "O perfil de leitura é recusado na API. Nenhum dado é alterado.", node: 1 },
  invalid: { label: "Quantidade inválida", status: "422", code: "HTTP 422", result: "Validação rejeitada", detail: "A quantidade zero é recusada na API. Nenhuma reserva é criada.", node: 1 },
  stock: { label: "Saldo insuficiente", status: "409", code: "HTTP 409", result: "Limite preservado", detail: "O pedido de 5 unidades excede o saldo de 4. A operação termina sem escrita.", node: 1 },
};
const paths = { outbound: "M160 132H240", write: "M360 132H440", back: "M500 188V211Q500 225 486 225H114Q100 225 100 211V188", reject: "M300 188V211Q300 225 286 225H114Q100 225 100 211V188" };
function sequence(scenario: Scenario): Step[] {
  const rejected = scenario !== "success";
  const steps: Step[] = [
    { id: "prepare", node: 0, text: "Preparar o pedido", duration: 500 },
    { id: "send", node: 0, text: "Enviar para a API", duration: 650, path: paths.outbound },
    { id: "validate", node: 1, text: scenario === "blocked" ? "Verificar a permissão" : "Validar a requisição", duration: 800 },
  ];
  if (scenario === "success") steps.push(
    { id: "write", node: 1, text: "Encaminhar a reserva", duration: 650, path: paths.write },
    { id: "persist", node: 2, text: "Atualizar saldo e recibo", duration: 750 },
  );
  if (scenario === "stock") steps.push({ id: "limit", node: 1, text: "Conferir o limite de estoque", duration: 750 });
  steps.push(
    { id: "return", node: rejected ? 1 : 2, text: rejected ? "Devolver o motivo da recusa" : "Devolver a confirmação", duration: 850, path: rejected ? paths.reject : paths.back },
    { id: "complete", node: scenarios[scenario].node, text: scenarios[scenario].result, duration: 0 },
  );
  return steps;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function HeroWorkbench() {
  const ready = useBrowserReady();
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(reducedQuery).matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("success");
  const [selected, setSelected] = useState(0);
  const [play, setPlay] = useState({ step: -1, run: 0 });
  const bench = useRef<HTMLElement>(null);
  const clock = useRef({ key: "", remaining: 0 });
  const uid = useId().replaceAll(":", "");
  const steps = sequence(scenario);
  const step = steps[play.step];
  const complete = step?.id === "complete";
  const running = Boolean(step && !complete);
  const active = running ? step.node : selected;
  const ambient = ready && !paused && !reduced && visible && inView;
  const result = scenarios[scenario];
  const hasError = scenario !== "success" && (complete || step?.id === "return");

  useEffect(() => {
    const element = bench.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    // One scheduled step, not a render loop. Preserve its remaining time across pauses.
    const key = play.run + "/" + play.step;
    if (clock.current.key !== key) clock.current = { key, remaining: step.duration };
    if ((!ambient || paused) && !reduced) return;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      setPlay((previous) => ({ ...previous, step: reduced ? sequence(scenario).length - 1 : previous.step + 1 }));
      if (reduced || play.step === steps.length - 2) setSelected(result.node);
    }, reduced ? 0 : clock.current.remaining);
    return () => {
      window.clearTimeout(timer);
      clock.current.remaining = Math.max(0, clock.current.remaining - (performance.now() - started));
    };
  }, [ambient, paused, play.run, play.step, reduced, result.node, running, scenario, step?.duration, steps.length]);

  function execute() {
    if (running) return;
    setSelected(reduced || paused ? scenarios[scenario].node : 0);
    setPlay((previous) => ({ run: previous.run + 1, step: reduced || paused ? sequence(scenario).length - 1 : 0 }));
  }
  function reset(next = scenario) {
    setScenario(next);
    setSelected(0);
    setPlay((previous) => ({ run: previous.run + 1, step: -1 }));
  }

  return (
    <section ref={bench} className="workbench" aria-labelledby={uid + "-title"} data-ambient={ambient ? "running" : "paused"}
      data-stage={step?.id ?? "idle"} data-error={hasError} data-scenario={scenario}
      style={{ "--stage-duration": (step?.duration ?? 650) + "ms" } as CSSProperties}>
      <header className="workbench-title">
        <h2 id={uid + "-title"}>Siga uma requisição</h2>
        <p>Interface, API e dados, com sucesso e recusas controladas. <span>Fluxo ilustrativo: nenhuma API é chamada.</span></p>
      </header>

      <div className="wb-stage">
        <fieldset className="wb-scenarios" disabled={!ready}>
          <legend>Cenário do mapa</legend>
          {(Object.entries(scenarios) as [Scenario, (typeof scenarios)[Scenario]][]).map(([value, item]) => (
            <label key={value} className="wb-scenario" data-tone={value === "success" ? "ok" : "warn"}>
              <input type="radio" name={uid + "-scenario"} value={value} checked={scenario === value}
                onChange={() => reset(value)} />
              <code aria-hidden="true">{item.status}</code>
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="workbench-art">
          <div className="wb-light" />
          <svg className="wb-diagram" viewBox="0 0 600 278" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={uid + "-node"} x2="0" y2="1"><stop stopColor="#132a4a" /><stop offset="1" stopColor="#08101f" /></linearGradient>
              <radialGradient id={uid + "-aura"}><stop stopColor="#377ffb" stopOpacity=".2" /><stop offset="1" stopColor="#377ffb" stopOpacity="0" /></radialGradient>
            </defs>
            <ellipse className="wb-aura" cx="300" cy="138" rx="230" ry="130" fill={"url(#" + uid + "-aura)"} />
            <circle className="wb-orbit" cx="300" cy="132" r="79" />
            <g className="wb-tracks"><path d={paths.outbound} /><path d={paths.write} /><path d={paths.back} /></g>
            <g className="wb-route" data-active={active}><path className="wb-route-in" d={paths.outbound} /><path className="wb-route-out" d={paths.write} /></g>
            {layers.map((layer, index) => <g className="wb-node" data-selected={active === index} data-rejected={hasError && index === 1} key={layer.label} style={{ "--i": index } as CSSProperties} transform={"translate(" + (40 + index * 200) + " 76)"}>
              <rect className="wb-node-halo" x="-6" y="-6" width="132" height="124" rx="20" />
              <rect className="wb-node-surface" width="120" height="112" rx="14" fill={"url(#" + uid + "-node)"} />
              <g className="wb-icon" transform="translate(44 22)">
                {index === 0 ? <><rect width="32" height="25" rx="4" /><path d="M0 7H32 M8 13L12 16L8 19 M17 20H23" /></> : index === 1 ? <><path d="M9 2L0 12L9 22 M23 2L32 12L23 22 M19 -1L13 25" /><path className="wb-check" d="M8 12L14 18L25 5" /></> : <><ellipse cx="16" cy="3" rx="15" ry="5" /><path d="M1 3V23C1 30 31 30 31 23V3 M1 13C1 20 31 20 31 13" /></>}
              </g>
              <text x="60" y="78" textAnchor="middle">{layer.label}</text>
              <text className="wb-node-note" x="60" y="96" textAnchor="middle">{["prepara", "valida", "persiste"][index]}</text>
              <circle className="wb-port" cx="120" cy="56" r="3" />
            </g>)}
            <circle className="wb-ambient-packet" cx="160" cy="132" r="2.2" />
            {running && step.path && <path key={play.run + "/" + step.id} className="wb-packet" d={step.path} pathLength="1" />}
            <text className="wb-return-label" x="300" y="253" textAnchor="middle">{hasError ? "recusa na API · nenhum dado gravado" : "requisição e retorno"}</text>
          </svg>
        </div>

        <div className="wb-readout">
          <ol className="wb-steps" aria-label="Etapas do cenário">
            {steps.filter(({ id }) => id !== "complete").map((item, index) => (
              <li key={scenario + item.id}
                data-state={complete || index < play.step ? "done" : index === play.step ? "current" : "todo"}>
                {item.text}
              </li>
            ))}
          </ol>
          <div className="wb-result" data-visible={complete}>
            {complete
              ? <><code>{result.status}</code><p><strong>{result.result}</strong> {result.detail}</p></>
              : <p className="wb-result-hint">{running ? "Acompanhe as etapas acima." : "Escolha um cenário e execute o fluxo."}</p>}
          </div>
        </div>
      </div>

      <div className="wb-controls">
        <button className="button button-primary" type="button" disabled={!ready} aria-disabled={running}
          onClick={execute}><span aria-hidden="true">▶</span> Executar fluxo</button>
        <button className="button button-quiet" type="button" disabled={!ready || !step} onClick={() => reset()}>Reiniciar</button>
        <div className="workbench-tabs" role="group" aria-label="Camada do sistema">
          {layers.map((layer, index) => <button key={layer.label} type="button" aria-pressed={active === index} disabled={!ready}
            onClick={() => { setSelected(index); if (running) setPlay((previous) => ({ ...previous, step: -1 })); }}>{layer.label}</button>)}
        </div>
        <button className="wb-pause" type="button" disabled={!ready || reduced} onClick={() => setPaused(!paused)} aria-pressed={paused}>
          <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span> {reduced ? "Movimento reduzido" : paused ? "Retomar animações" : "Pausar animações"}
        </button>
      </div>

      <div className="workbench-caption">
        <div className="wb-details">
          {layers.map((layer, index) => <p className="workbench-detail" key={layer.label} data-current={active === index} aria-hidden={active !== index}>
            <strong>{layer.label}.</strong> {complete && active === index ? <><code>{result.code}</code> · {index === 2 && scenario !== "success" ? "Sem escrita: saldo e recibos permanecem intactos." : result.detail}</> : layer.text}
          </p>)}
        </div>
        <div className="wb-links">
          <a href={casePath(layers[active].project)} aria-label={"Ver projeto da camada " + layers[active].label + ": " + layers[active].projectName}>{layers[active].projectName}</a>
          <a href={"/workspace?projeto=" + layers[active].project + "&painel=arquitetura"}>Abrir arquitetura</a>
        </div>
      </div>
      <p className="sr-only" role="status">{complete ? result.code + ". " + result.result + ". " + result.detail : ""}</p>
    </section>
  );
}
