import { z } from "zod";

const protocol = z.string().trim().min(1).max(48);
const contract = z.discriminatedUnion("estado", [
  z.object({ estado: z.literal("aceito"), protocolo: protocol }),
  z.object({ estado: z.literal("em_fila"), protocolo: protocol }),
  z.object({ estado: z.literal("rejeitado"), motivo: z.string().trim().min(1).max(160) }),
]);

export const returnFixtures = [
  { id: "aceito", label: "Confirmação", http: 200, payload: { estado: "aceito", protocolo: "DEMO-421" } },
  { id: "fila", label: "Ainda em fila", http: 202, payload: { estado: "em_fila", protocolo: "DEMO-422" } },
  { id: "rejeitado", label: "Rejeição de negócio", http: 200, payload: { estado: "rejeitado", motivo: "Referência de exemplo ausente" } },
  { id: "formato", label: "Formato alterado", http: 200, payload: { estado: "aceito", protocolo: 421 } },
  { id: "indisponivel", label: "Serviço indisponível", http: 503, payload: { mensagem: "Serviço fictício indisponível" } },
] as const;

export const maxReturnLength = 4096;

export type ReturnFinding = {
  decision: "Avançar" | "Aguardar" | "Revisar" | "Repetir depois";
  detail: string;
  fields?: string[];
};

export function inspectReturn(http: number, body: string): ReturnFinding {
  if (!Number.isInteger(http) || http < 100 || http > 599) {
    return { decision: "Revisar", detail: "Informe um código HTTP entre 100 e 599." };
  }
  if (http === 429 || http >= 500) {
    return { decision: "Repetir depois", detail: "O serviço falhou ou limitou as chamadas. Programe outra tentativa se a operação aceitar reenvio seguro." };
  }
  if (http < 200 || http >= 300) {
    return { decision: "Revisar", detail: "O código HTTP pede revisão antes de interpretar o retorno como uma resposta de negócio." };
  }
  if (body.length > maxReturnLength) {
    return { decision: "Revisar", detail: "O retorno ultrapassa o limite de 4.096 caracteres do laboratório." };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return { decision: "Revisar", detail: "O retorno não contém um JSON válido. Confira a sintaxe no editor." };
  }

  const parsed = contract.safeParse(payload);
  if (!parsed.success) {
    return {
      decision: "Revisar",
      detail: "O HTTP indica sucesso, mas o retorno não atende ao contrato deste laboratório.",
      fields: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "corpo"))],
    };
  }

  const response = parsed.data;
  const expectedHttp = response.estado === "em_fila" ? 202 : 200;
  if (http !== expectedHttp) {
    return {
      decision: "Revisar",
      detail: "Neste contrato, o estado " + response.estado + " deve chegar com HTTP " + expectedHttp + ".",
      fields: ["estado", "HTTP"],
    };
  }
  switch (response.estado) {
    case "aceito":
      return { decision: "Avançar", detail: "O retorno confirma o recebimento e traz um protocolo válido." };
    case "em_fila":
      return { decision: "Aguardar", detail: "O retorno confirma a entrada na fila. O protocolo permite acompanhar o processamento." };
    case "rejeitado":
      return { decision: "Revisar", detail: "O serviço respondeu e informou uma rejeição de negócio. Confira o campo motivo antes de reenviar." };
  }
}
