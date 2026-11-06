export type Origin = "banco" | "sistema";
export type Role = "analista" | "leitor";
export type Status = "conciliada" | "divergente" | "pendente" | "ambigua";
export type Entry = { id: string; reference: string; origin: Origin; date: string; cents: number; manual?: true };
export type Ledger = { entries: Entry[]; reconciled: boolean };
export type Audit = { revision: number; action: string; detail: string; at: number };
export type View = Ledger & { role: Role; revision: number; audit: Audit[] };

export const header = "id,referencia,origem,data,valor_centavos";
export const sampleCsv = [
  header,
  "B-101,LF-1001,banco,2026-10-02,34900",
  "B-102,LF-1002,banco,2026-10-03,126000",
  "B-104,LF-1004,banco,2026-10-05,7990",
].join("\n");

export const maxEntries = 48;
export const maxRevision = 60;
export const states: Record<Status, string> = {
  conciliada: "Conciliada", divergente: "Divergente", pendente: "Pendente", ambigua: "Ambígua",
};

const idPattern = /^[BS]-\d{3,5}$/;
const referencePattern = /^LF-\d{4,6}$/;
const iso = /^\d{4}-\d{2}-\d{2}$/;
const dayMs = 86_400_000;

export class LedgerError extends Error {
  readonly status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.status = status;
  }
}

function originOf(value: unknown): value is Origin {
  return value === "banco" || value === "sistema";
}

export function validReference(value: unknown): value is string {
  return typeof value === "string" && referencePattern.test(value);
}

function dateOf(value: unknown): value is string {
  if (typeof value !== "string" || !iso.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function centsOf(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 99_999_999;
}

export function initialLedger(): Ledger {
  return {
    entries: [
      { id: "S-101", reference: "LF-1001", origin: "sistema", date: "2026-10-01", cents: 34900 },
      { id: "S-102", reference: "LF-1002", origin: "sistema", date: "2026-10-01", cents: 126500 },
      { id: "S-103", reference: "LF-1003", origin: "sistema", date: "2026-10-02", cents: 5990 },
    ],
    reconciled: false,
  };
}

export function parseCsv(input: string): Entry[] {
  const lines = input.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  if (lines[0] !== header) throw new LedgerError("Use o cabeçalho do CSV de exemplo.");
  if (lines.length < 2 || lines.length > maxEntries + 1) throw new LedgerError("O CSV precisa ter de 1 a 48 linhas de dados.");
  return lines.slice(1).map((line, index) => {
    const parts = line.split(",").map((value) => value.trim());
    const [id, reference, origin, date, amount] = parts;
    const cents = Number(amount);
    if (parts.length !== 5 || !idPattern.test(id) || !validReference(reference) || !originOf(origin) ||
        id[0] !== (origin === "banco" ? "B" : "S") || !dateOf(date) || !/^\d{1,8}$/.test(amount) || !centsOf(cents)) {
      throw new LedgerError("Dados inválidos na linha " + (index + 2) + ". Confira os campos do exemplo.");
    }
    return { id, reference, origin, date, cents };
  });
}

function equalEntry(a: Entry, b: Entry) {
  return a.reference === b.reference && a.origin === b.origin && a.date === b.date && a.cents === b.cents;
}

export function importEntries(ledger: Ledger, imported: Entry[]) {
  const byId = new Map(ledger.entries.map((entry) => [entry.id, entry]));
  let inserted = 0;
  for (const entry of imported) {
    const prior = byId.get(entry.id);
    if (prior && !equalEntry(prior, entry)) throw new LedgerError("O ID " + entry.id + " já tem outros dados.", 409);
    if (prior) continue;
    byId.set(entry.id, entry);
    inserted += 1;
  }
  if (byId.size > maxEntries) throw new LedgerError("A sessão comporta até 48 lançamentos.");
  return { ledger: inserted ? { entries: [...byId.values()], reconciled: false } : ledger, inserted, duplicates: imported.length - inserted };
}

export function statusByReference(ledger: Ledger) {
  const grouped = new Map<string, { banco: Entry[]; sistema: Entry[] }>();
  for (const entry of ledger.entries) {
    const pair = grouped.get(entry.reference) ?? { banco: [], sistema: [] };
    pair[entry.origin].push(entry);
    grouped.set(entry.reference, pair);
  }
  const statuses = new Map<string, Status>();
  for (const [reference, pair] of grouped) {
    const [bank] = pair.banco;
    const [system] = pair.sistema;
    let status: Status = "pendente";
    if (ledger.reconciled && (pair.banco.length > 1 || pair.sistema.length > 1)) {
      status = "ambigua";
    } else if (ledger.reconciled && bank && system) {
      const days = Math.abs(Date.parse(bank.date) - Date.parse(system.date)) / dayMs;
      status = bank.cents === system.cents && days <= 2 ? "conciliada" : "divergente";
    }
    statuses.set(reference, status);
  }
  return statuses;
}

export function mutate(ledger: Ledger, body: Record<string, unknown>, revision: number) {
  if (body.action === "importar") {
    if (typeof body.csv !== "string") throw new LedgerError("Informe o CSV.");
    const result = importEntries(ledger, parseCsv(body.csv));
    return { ledger: result.ledger, detail: result.inserted + " novos · " + result.duplicates + " duplicados" };
  }
  if (body.action === "conciliar") {
    const reconciled = { ...ledger, reconciled: true };
    const matches = [...statusByReference(reconciled).values()].filter((value) => value === "conciliada").length;
    return { ledger: reconciled, detail: matches + " referência(s) conciliada(s)" };
  }
  if (body.action === "criar") {
    const { reference, origin, date, cents } = body;
    if (!validReference(reference) || !originOf(origin) || !dateOf(date) || !centsOf(cents)) {
      throw new LedgerError("Confira referência LF-0000, origem, data e valor em centavos.");
    }
    if (ledger.entries.length >= maxEntries) throw new LedgerError("A sessão comporta até 48 lançamentos.");
    const id = "M-" + (revision + 1).toString().padStart(3, "0");
    const entry: Entry = { id, reference, origin, date, cents, manual: true };
    return { ledger: { entries: [...ledger.entries, entry], reconciled: false }, detail: id + " criado" };
  }
  if (body.action !== "atualizar" && body.action !== "remover") throw new LedgerError("Ação inválida.");
  const current = ledger.entries.find((entry) => entry.id === body.id && entry.manual);
  if (!current) throw new LedgerError("Lançamento manual não encontrado.", 404);
  if (body.action === "remover") {
    return { ledger: { entries: ledger.entries.filter((entry) => entry.id !== current.id), reconciled: false }, detail: current.id + " removido" };
  }
  const { reference, origin, date, cents } = body;
  if (!validReference(reference) || !originOf(origin) || !dateOf(date) || !centsOf(cents)) {
    throw new LedgerError("Confira referência LF-0000, origem, data e valor em centavos.");
  }
  const replacement: Entry = { ...current, reference, origin, date, cents };
  const entries = ledger.entries.map((entry) => entry.id === current.id ? replacement : entry);
  return { ledger: { entries, reconciled: false }, detail: current.id + " atualizado" };
}

export function exportCsv(entries: Entry[], status: Map<string, Status>) {
  return [
    header + ",status",
    ...entries.map((entry) => [entry.id, entry.reference, entry.origin, entry.date, entry.cents, status.get(entry.reference) ?? "pendente"].join(",")),
  ].join("\r\n") + "\r\n";
}
