"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { casePath } from "../lib/project-index";
import { useBrowserReady } from "./use-browser-ready";

type Scenario = "success" | "blocked" | "invalid" | "stock";
type Step = { id: string; node: number; text: string; duration: number; path?: string };
const layers = [
  { label: "Interface", tag: "01 / ENVIO", text: "A interface prepara a quantidade e a referência do pedido.", project: "qualitygate-studio" },
  { label: "API", tag: "02 / VALIDAÇÃO", text: "A API verifica o perfil e os dados antes de autorizar a reserva.", project: "ledgerflow" },
  { label: "Dados", tag: "03 / ESTADO", text: "Uma operação válida atualiza o saldo e gera um único recibo.", project: "farol-de-integracoes" },
] as const;
const scenarios: Record<Scenario, { label: string; code: string; result: string; detail: string; node: number }> = {
  success: { label: "Reserva válida", code: "HTTP 201", result: "Reserva confirmada", detail: "O saldo é atualizado e a interface recebe o recibo da reserva.", node: 2 },
  blocked: { label: "Perfil sem permissão", code: "HTTP 403", result: "Escrita bloqueada", detail: "O perfil de leitura é recusado na API. Nenhum dado é alterado.", node: 1 },
  invalid: { label: "Quantidade inválida", code: "HTTP 422", result: "Validação rejeitada", detail: "A quantidade zero é recusada na API. Nenhuma reserva é criada.", node: 1 },
  stock: { label: "Saldo insuficiente", code: "HTTP 409", result: "Limite preservado", detail: "O pedido de 5 unidades excede o saldo de 4. A operação termina sem escrita.", node: 1 },
};
const paths = { outbound: "M160 132H240", write: "M360 132H440", back: "M500 188V211Q500 225 486 225H114Q100 225 100 211V188", reject: "M300 188V211Q300 225 286 225H114Q100 225 100 211V188" };
function sequence(scenario: Scenario): Step[] {
  const rejected = scenario !== "success";
  const steps: Step[] = [
    { id: "prepare", node: 0, text: "Preparando o pedido", duration: 500 },
    { id: "send", node: 0, text: "Enviando para a API", duration: 650, path: paths.outbound },
    { id: "validate", node: 1, text: scenario === "blocked" ? "Verificando a permissão" : "Validando a requisição", duration: 800 },
  ];
  if (scenario === "success") steps.push(
    { id: "write", node: 1, text: "Encaminhando a reserva", duration: 650, path: paths.write },
    { id: "persist", node: 2, text: "Atualizando saldo e recibo", duration: 750 },
  );
  if (scenario === "stock") steps.push({ id: "limit", node: 1, text: "Conferindo o limite de estoque", duration: 750 });
  steps.push(
    { id: "return", node: rejected ? 1 : 2, text: rejected ? "Devolvendo o motivo da recusa" : "Retornando a confirmação", duration: 850, path: rejected ? paths.reject : paths.back },
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
  const bench = useRef<HTMLDivElement>(null);
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

  function execute(next: Scenario) {
    setScenario(next);
    setSelected(reduced || paused ? scenarios[next].node : 0);
    setPlay((previous) => ({ run: previous.run + 1, step: reduced || paused ? sequence(next).length - 1 : 0 }));
  }
  function reset(next = scenario) {
    setScenario(next);
    setSelected(0);
    setPlay((previous) => ({ run: previous.run + 1, step: -1 }));
  }

  return (
    <div ref={bench} className="workbench" aria-label="Mapa dos laboratórios" data-ambient={ambient ? "running" : "paused"}
      data-stage={step?.id ?? "idle"} data-error={hasError} style={{ "--stage-duration": (step?.duration ?? 650) + "ms" } as CSSProperties}>
      <div className="workbench-title">
        <div><span className="workbench-mark" aria-hidden="true">⌘</span><strong>Mapa dos laboratórios</strong></div>
        <span className="workbench-label">FLUXO ILUSTRATIVO</span>
      </div>
      <div className="workbench-art">
        <div className="wb-light" />
        <svg className="wb-diagram" viewBox="0 0 600 278" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={uid + "-node"} x2="0" y2="1"><stop stopColor="#142944" /><stop offset="1" stopColor="#080f1d" /></linearGradient>
            <radialGradient id={uid + "-aura"}><stop stopColor="#377ffb" stopOpacity=".16" /><stop offset="1" stopColor="#377ffb" stopOpacity="0" /></radialGradient>
            <pattern id={uid + "-grid"} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#75a9ff" strokeOpacity=".065" /></pattern>
          </defs>
          <rect width="600" height="278" fill={"url(#" + uid + "-grid)"} />
          <ellipse className="wb-aura" cx="300" cy="138" rx="215" ry="135" fill={"url(#" + uid + "-aura)"} />
          <g className="wb-coordinates"><path d="M18 38V18H38 M562 18H582V38 M18 240V260H38 M562 260H582V240" /><text x="42" y="39">REQUEST / RESERVA</text><text x="558" y="39" textAnchor="end">01 — 03</text></g>
          <circle className="wb-orbit" cx="300" cy="132" r="79" />
          <g className="wb-tracks"><path d={paths.outbound} /><path d={paths.write} /><path d={paths.back} /></g>
          <g className="wb-route" data-active={active}><path className="wb-route-in" d={paths.outbound} /><path className="wb-route-out" d={paths.write} /></g>
          {layers.map((layer, index) => <g className="wb-node" data-selected={active === index} data-rejected={hasError && index === 1} key={layer.label} transform={"translate(" + (40 + index * 200) + " 76)"}>
            <rect className="wb-node-halo" x="-5" y="-5" width="130" height="122" rx="20" />
            <rect className="wb-node-surface" width="120" height="112" rx="15" fill={"url(#" + uid + "-node)"} />
            <g className="wb-icon" transform="translate(44 21)">
              {index === 0 ? <><rect width="32" height="25" rx="4" /><path d="M0 7H32 M8 13L12 16L8 19 M17 20H23" /></> : index === 1 ? <><path d="M9 2L0 12L9 22 M23 2L32 12L23 22 M19 -1L13 25" /><path className="wb-check" d="M8 12L14 18L25 5" /></> : <><ellipse cx="16" cy="3" rx="15" ry="5" /><path d="M1 3V23C1 30 31 30 31 23V3 M1 13C1 20 31 20 31 13" /></>}
            </g>
            <text x="60" y="75" textAnchor="middle">{layer.label.toUpperCase()}</text>
            <text className="wb-node-note" x="60" y="94" textAnchor="middle">{["preparar", "validar", "persistir"][index]}</text>
            <circle className="wb-port" cx="120" cy="56" r="3" />
          </g>)}
          <circle className="wb-ambient-packet" cx="160" cy="132" r="2.2" />
          {running && step.path && <path key={play.run + "/" + step.id} className="wb-packet" d={step.path} pathLength="1" />}
          <text className="wb-return-label" x="300" y="253" textAnchor="middle">{hasError ? "SEM ESCRITA · ESTADO PRESERVADO" : "REQUISIÇÃO → RESPOSTA"}</text>
        </svg>
      </div>
      <div className="wb-playback">
        <div className="wb-progress" aria-hidden="true"><i /><span key={step?.id ?? "idle"}>{step?.text ?? "Siga uma requisição pelo sistema"}</span><code>{step ? String(play.step + 1).padStart(2, "0") : "00"} / {String(steps.length).padStart(2, "0")}</code></div>
        <div className="wb-run-controls">
          <label className="sr-only" htmlFor={uid + "-scenario"}>Cenário do mapa</label>
          <select id={uid + "-scenario"} value={scenario} disabled={!ready} onChange={(event) => reset(event.target.value as Scenario)}>
            {Object.entries(scenarios).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}
          </select>
          <button className="button button-primary button-compact" type="button" disabled={!ready} aria-disabled={running}
            onClick={() => { if (!running) execute(scenario); }}><span aria-hidden="true">▷</span> Executar fluxo</button>
        </div>
        <div className="wb-shortcuts"><button type="button" disabled={!ready} onClick={() => execute("blocked")}>Simular bloqueio <span aria-hidden="true">↗</span></button><button type="button" disabled={!ready || !step} onClick={() => reset()}>Reiniciar <span aria-hidden="true">↺</span></button></div>
      </div>
      <div className="workbench-tabs" role="group" aria-label="Camada do sistema">
        {layers.map((layer, index) => <button key={layer.label} type="button" aria-pressed={active === index} disabled={!ready}
          onClick={() => { setSelected(index); if (running) setPlay((previous) => ({ ...previous, step: -1 })); }}>{layer.label}</button>)}
      </div>
      <div className="workbench-caption">
        <div className="wb-details">
          {layers.map((layer, index) => <div className="workbench-detail" key={layer.label} data-current={active === index} aria-hidden={active !== index}>
            <span>{layer.tag}</span>
            <p>{complete && active === index ? <><code>{result.code}</code> · {index === 2 && scenario !== "success" ? "Sem escrita: saldo e recibos permanecem intactos." : result.detail}</> : layer.text}</p>
          </div>)}
        </div>
        <a href={casePath(layers[active].project)} aria-label={"Ver projeto da camada " + layers[active].label}>↗</a>
      </div>
      <p className="sr-only" role="status">{complete ? result.code + ". " + result.result + ". " + result.detail : ""}</p>
      <div className="workbench-tools">
        <button type="button" disabled={!ready || reduced} onClick={() => setPaused(!paused)} aria-pressed={paused}>
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span> {reduced ? "Movimento reduzido" : paused ? "Retomar animações" : "Pausar animações"}
        </button>
        <a className="text-link" href={"/workspace?projeto=" + layers[active].project + "&painel=arquitetura"}>Abrir arquitetura <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  );
}
