import evidence from "./workspace-evidence.json";
import { cases } from "./project-cases";
import { projects, type Project } from "./project-index";
import type { Case } from "./project-cases";

type Snippet = { kind: string; file: string; line: number; end: number; code: string };
type Node = { input: string; output: string; depends: string; failure: string; kind: string };
export type WorkspaceProject = {
  project: Project;
  detail: Case;
  snippets: Snippet[];
  nodes: Node[];
  test: { title: string; kind: string; result: string; link: string };
};

export const panels = {
  visao: "Visão geral", codigo: "Código", arquitetura: "Arquitetura", testes: "Testes", evidencias: "Evidências",
};
export type Panel = keyof typeof panels;
export const verifiedRun = "https://github.com/raphaelkaych/farol-de-integracoes/actions/runs/42381664293";
const workflow = "https://github.com/raphaelkaych/farol-de-integracoes/actions/workflows/validar.yml";
const observed = "Cenário aprovado na execução de referência do GitHub Actions.";

const data: Record<keyof typeof evidence, { nodes: Node[]; test: WorkspaceProject["test"] }> = {
  "qualitygate-studio": {
    nodes: [
      { input: "Um cenário selecionado", output: "POST com o identificador", depends: "Painel React", failure: "Falha de rede", kind: "API" },
      { input: "JSON de até 1 KiB", output: "Cenário validado", depends: "Parser compartilhado", failure: "Corpo inválido ou acima do limite", kind: "API" },
      { input: "Pedido e perfil fictícios", output: "Saldo, recibos e códigos", depends: "Estado em memória", failure: "Reserva indevida na variante controlada", kind: "Regra" },
      { input: "Resultados das duas variantes", output: "Assertivas e evidência", depends: "Playwright e GitHub Actions", failure: "A asserção pode deixar de detectar o defeito", kind: "Teste" },
    ],
    test: { title: "Um leitor nunca deveria criar uma reserva", kind: "Regressão por perfil", result: "Falha esperada registrada com trace no CI.", link: verifiedRun },
  },
  ledgerflow: {
    nodes: [
      { input: "Extrato fictício e ações", output: "Tabela conciliada", depends: "API e estado de sessão", failure: "CSV inválido", kind: "Validação" },
      { input: "Credencial e revisão", output: "Permissão da operação", depends: "Sessão persistida", failure: "Perfil leitor ou revisão antiga", kind: "Teste" },
      { input: "Referências, valores e datas", output: "Classificação da conciliação", depends: "Centavos inteiros", failure: "Valor divergente ou referência ambígua", kind: "Regra" },
      { input: "Operação e revisão esperada", output: "Estado e trilha de auditoria", depends: "Lote SQL em D1", failure: "Escrita concorrente devolve 409", kind: "Persistência" },
    ],
    test: { title: "Leitor bloqueado e escrita concorrente", kind: "Integração HTTP e D1", result: observed, link: verifiedRun },
  },
  "farol-de-integracoes": {
    nodes: [
      { input: "Evento de pedido", output: "Ação no diário", depends: "Sessão de demonstração", failure: "A sessão expira", kind: "Persistência" },
      { input: "Fila e relógio simulado", output: "Retentativa ou quarentena", depends: "Motor de reexecução", failure: "ERP indisponível", kind: "Regra" },
      { input: "Evento em quarentena", output: "Evento entregue e histórico", depends: "Destino recuperado", failure: "Reenvio com destino indisponível", kind: "Teste" },
    ],
    test: { title: "O evento pode sair da quarentena e preservar o histórico", kind: "Domínio", result: observed, link: verifiedRun },
  },
  traceatlas: {
    nodes: [
      { input: "Cenário de falha", output: "Identificador de execução", depends: "Rota HTTP", failure: "Cenário fora do catálogo", kind: "API" },
      { input: "Cenário e ID do lote", output: "Spans e logs correlacionados", depends: "Relógio simulado", failure: "Erro reproduzido no cenário", kind: "Regra" },
      { input: "Lote, filtro e ID de correlação", output: "Waterfall, gargalo e logs da investigação", depends: "Spans ordenados", failure: "Nenhum rastro atende ao recorte", kind: "Regra" },
      { input: "Consulta de prontidão", output: "Disponibilidade e duração reais", depends: "Banco D1", failure: "Sonda indisponível", kind: "Teste" },
    ],
    test: { title: "A sonda real fica separada do cenário simulado", kind: "Unidade com dependência injetada", result: observed, link: verifiedRun },
  },
  "radar-de-retorno": {
    nodes: [
      { input: "Status HTTP e JSON", output: "Corpo interpretado no navegador", depends: "Editor local", failure: "JSON com sintaxe inválida", kind: "Validação" },
      { input: "Resposta interpretada", output: "Decisão e campos a revisar", depends: "Schema discriminado Zod", failure: "Status e estado incompatíveis", kind: "Validação" },
      { input: "Resultado do schema e código HTTP", output: "Orientação ao operador", depends: "Decisão de fluxo", failure: "Transporte e estado apontam em direções distintas", kind: "Teste" },
    ],
    test: { title: "HTTP 200 com contrato inválido pede revisão", kind: "Domínio e navegador", result: observed, link: verifiedRun },
  },
  contractshield: {
    nodes: [
      { input: "Abertura de sessão", output: "Credenciais temporárias", depends: "D1 e Web Crypto", failure: "Capacidade ou expiração da sessão", kind: "API" },
      { input: "Credencial, escopo e JSON", output: "Operação autorizada e validada", depends: "Schema de entrada e limite por sessão", failure: "Escopo externo, perfil leitor ou campo protegido", kind: "Validação" },
      { input: "Chave de idempotência e mudança", output: "Um registro por chave no escopo", depends: "Restrição única e escrita SQL", failure: "Chave reutilizada com conteúdo diferente", kind: "Persistência" },
      { input: "Registro e versão solicitada", output: "DTO público validado pela suíte", depends: "OpenAPI e Playwright", failure: "Mudança incompatível de contrato", kind: "Teste" },
    ],
    test: { title: "Contrato v2 e isolamento de objeto", kind: "Contrato OpenAPI e integração", result: "Consulte o resultado da suíte de contrato no pipeline.", link: workflow },
  },
};

export function workspaceProjects(): WorkspaceProject[] {
  const order: (keyof typeof evidence)[] = ["qualitygate-studio", "contractshield", "ledgerflow", "traceatlas", "farol-de-integracoes", "radar-de-retorno"];
  return order.map((slug) => {
    const project = projects.find((item) => item.slug === slug);
    const detail = cases.find((item) => item.slug === slug);
    if (!project || !detail) throw new Error("Projeto do Workspace sem estudo " + slug);
    return { project, detail, snippets: evidence[slug], ...data[slug] };
  });
}
