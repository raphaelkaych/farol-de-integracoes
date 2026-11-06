export const scenarios = {
  stock: {
    name: "Limite de estoque",
    premise: "Um pedido solicita 5 unidades quando só existem 4.",
    invariant: "Recusar com 409, preservar o saldo e não criar reserva.",
    defect: "A validação de saldo foi removida.",
  },
  replay: {
    name: "Reenvio do pedido",
    premise: "A mesma reserva de 2 unidades é enviada duas vezes.",
    invariant: "Responder 201 e 200 com o mesmo recibo e gravar apenas uma reserva.",
    defect: "O serviço deixou de consultar o identificador antes da escrita.",
  },
  role: {
    name: "Permissão de escrita",
    premise: "Um perfil de leitura tenta reservar 1 unidade.",
    invariant: "Responder 403 e preservar o estado original.",
    defect: "O serviço deixou de conferir a permissão de escrita.",
  },
} as const;

export type Scenario = keyof typeof scenarios;
