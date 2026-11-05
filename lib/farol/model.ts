export const scenarios = ["instavel", "indisponivel"] as const;
export type Scenario = (typeof scenarios)[number];

export const orders = {
  "1042": { id: "evt-1042", order: "PC-1042", name: "Reposição de sensores" },
  "1047": { id: "evt-1047", order: "PC-1047", name: "Kit de manutenção" },
  "1051": { id: "evt-1051", order: "PC-1051", name: "Conectores de rede" },
} as const;

export const actions = [
  "enviar-1042", "enviar-1047", "enviar-1051", "rodada", "recuperar", "reprocessar",
] as const;
export type Action = (typeof actions)[number];
export type OrderCode = keyof typeof orders;
export type EventStatus = "fila" | "retentativa" | "entregue" | "dlq";
type AuditKind = "recebido" | "duplicado" | "retentativa" | "entregue" | "dlq" | "recuperado" | "reprocessado";

export interface Event {
  id: string;
  order: string;
  name: string;
  status: EventStatus;
  due: number;
  attempts: number;
  cycleAttempts: number;
}

export interface AuditEntry {
  at: number;
  kind: AuditKind;
  eventId?: string;
  http?: 200 | 503;
  nextAt?: number;
}

export interface State {
  scenario: Scenario;
  now: number;
  manualRecovery: boolean;
  events: Event[];
  audit: AuditEntry[];
  version: number;
}

export const maxActions = 32;
const delays = [30, 60];

export class InvalidAction extends Error {}

export function destinationIsUp(state: State) {
  return state.manualRecovery || (state.scenario === "instavel" && state.now >= 90);
}

export function nextDue(state: State) {
  const waiting = state.events.filter((event) => event.status === "fila" || event.status === "retentativa");
  return waiting.length ? Math.min(...waiting.map((event) => event.due)) : null;
}

function enqueue(state: State, code: OrderCode) {
  const order = orders[code];
  if (state.events.some((event) => event.id === order.id)) {
    state.audit.push({ at: state.now, kind: "duplicado", eventId: order.id });
    return;
  }
  state.events.push({
    ...order, status: "fila", due: state.now, attempts: 0, cycleAttempts: 0,
  });
  state.audit.push({ at: state.now, kind: "recebido", eventId: order.id });
}

function runRound(state: State) {
  const due = nextDue(state);
  if (due === null) throw new InvalidAction("A fila não tem eventos pendentes.");
  state.now = Math.max(state.now, due);

  for (const event of state.events) {
    if ((event.status !== "fila" && event.status !== "retentativa") || event.due > state.now) continue;
    event.attempts += 1;
    event.cycleAttempts += 1;
    if (destinationIsUp(state)) {
      event.status = "entregue";
      state.audit.push({ at: state.now, kind: "entregue", eventId: event.id, http: 200 });
      continue;
    }
    const delay = delays[event.cycleAttempts - 1];
    if (delay === undefined) {
      event.status = "dlq";
      state.audit.push({ at: state.now, kind: "dlq", eventId: event.id, http: 503 });
    } else {
      event.status = "retentativa";
      event.due = state.now + delay;
      state.audit.push({ at: state.now, kind: "retentativa", eventId: event.id, http: 503, nextAt: event.due });
    }
  }
}

function redrive(state: State) {
  if (!destinationIsUp(state)) throw new InvalidAction("Restaure o destino antes de reprocessar a DLQ.");
  const quarantined = state.events.filter((event) => event.status === "dlq");
  if (!quarantined.length) throw new InvalidAction("A DLQ está vazia.");
  for (const event of quarantined) {
    event.status = "fila";
    event.due = state.now;
    event.cycleAttempts = 0;
    state.audit.push({ at: state.now, kind: "reprocessado", eventId: event.id });
  }
}

function apply(state: State, action: Action) {
  switch (action) {
    case "enviar-1042": enqueue(state, "1042"); break;
    case "enviar-1047": enqueue(state, "1047"); break;
    case "enviar-1051": enqueue(state, "1051"); break;
    case "rodada": runRound(state); break;
    case "recuperar":
      if (destinationIsUp(state)) throw new InvalidAction("O destino já está disponível.");
      state.manualRecovery = true;
      state.audit.push({ at: state.now, kind: "recuperado" });
      break;
    case "reprocessar": redrive(state); break;
  }
  state.version += 1;
}

export function replay(scenario: Scenario, journal: readonly Action[]) {
  const state: State = { scenario, now: 0, manualRecovery: false, events: [], audit: [], version: 0 };
  enqueue(state, "1042");
  for (const action of journal) apply(state, action);
  return state;
}
