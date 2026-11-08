import { scenarios, type Scenario } from "./scenarios.ts";

type Order = { ref: string; quantity: number; role: "operador" | "leitor" };
type Receipt = { id: string; ref: string; quantity: number };
type Inventory = { available: number; receipts: Receipt[] };
type Response = { code: 200 | 201 | 403 | 409 | 422; reason: string; receipt?: string };

function reserve(inventory: Inventory, order: Order, defect?: Scenario): Response {
  if (order.role !== "operador" && defect !== "role") return { code: 403, reason: "sem_permissao" };
  if (!Number.isInteger(order.quantity) || order.quantity < 1) return { code: 422, reason: "quantidade_invalida" };
  const existing = inventory.receipts.find((receipt) => receipt.ref === order.ref);
  if (existing && defect !== "replay") {
    return existing.quantity === order.quantity
      ? { code: 200, reason: "reserva_existente", receipt: existing.id }
      : { code: 409, reason: "chave_em_conflito" };
  }
  if (order.quantity > inventory.available && defect !== "stock") return { code: 409, reason: "saldo_insuficiente" };
  const receipt = { id: "RS-" + (inventory.receipts.length + 1), ref: order.ref, quantity: order.quantity };
  inventory.receipts.push(receipt);
  inventory.available -= order.quantity;
  return { code: 201, reason: "reserva_criada", receipt: receipt.id };
}

const examples: Record<Scenario, Order> = {
  stock: { ref: "PED-110", quantity: 5, role: "operador" },
  replay: { ref: "PED-120", quantity: 2, role: "operador" },
  role: { ref: "PED-130", quantity: 1, role: "leitor" },
};

function verify(scenario: Scenario, inventory: Inventory, responses: Response[]) {
  const assertions = [
    { label: "Respostas HTTP", expected: scenario === "replay" ? "201 → 200" : scenario === "stock" ? "409" : "403",
      actual: responses.map((response) => response.code).join(" → ") },
    { label: "Saldo final", expected: scenario === "replay" ? "2" : "4", actual: String(inventory.available) },
    { label: "Recibos gravados", expected: scenario === "replay" ? "1" : "0", actual: String(inventory.receipts.length) },
  ];
  if (scenario === "replay") {
    const [first, second] = responses;
    assertions.push({ label: "Recibo no reenvio", expected: "Mesmo identificador",
      actual: first.receipt && first.receipt === second.receipt ? "Mesmo identificador" : "Identificadores diferentes ou ausentes" });
  }
  return assertions.map((assertion) => ({ ...assertion, passed: assertion.expected === assertion.actual }));
}

function exercise(scenario: Scenario, injectDefect: boolean) {
  const inventory: Inventory = { available: 4, receipts: [] };
  const order = examples[scenario];
  const fault = injectDefect ? scenario : undefined;
  const responses = [reserve(inventory, order, fault)];
  if (scenario === "replay") responses.push(reserve(inventory, order, fault));
  const assertions = verify(scenario, inventory, responses);
  return { responses, inventory, assertions, conforms: assertions.every((assertion) => assertion.passed) };
}

export function compare(scenario: Scenario) {
  return {
    scenario, input: examples[scenario], invariant: scenarios[scenario].invariant,
    control: exercise(scenario, false), injected: exercise(scenario, true),
  };
}

export type Comparison = ReturnType<typeof compare>;
