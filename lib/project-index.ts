import { github, siteRepository } from "./portfolio-meta";

export const categories = {
  todos: "Todos",
  fullstack: "Full Stack",
  backend: "Backend & APIs",
  qualidade: "QA & Automation",
  arquitetura: "Arquitetura",
  dados: "Dados & Observabilidade",
} as const;

export type Category = keyof typeof categories;
export type Project = {
  slug: string; index: string; name: string; label: string; summary: string;
  stack: string[]; categories: readonly Exclude<Category, "todos">[]; demo: string; code: string;
};

export const projects: readonly Project[] = [
  {
    slug: "qualitygate-studio", index: "01", name: "QualityGate Studio", label: "QUALITY ENGINEERING",
    summary: "Descubra quais testes detectam uma reserva duplicada, uma permissão ignorada ou um estoque negativo.",
    stack: ["TypeScript", "React", "Playwright", "GitHub Actions"], categories: ["qualidade", "backend"],
    demo: "/qualitygate", code: siteRepository + "/tree/main/lib/qualitygate",
  },
  {
    slug: "ledgerflow", index: "02", name: "LedgerFlow", label: "FULL STACK / DADOS",
    summary: "Importe extratos fictícios, concilie lançamentos e veja a trilha de alterações de cada sessão.",
    stack: ["TypeScript", "React", "SQL / D1", "API HTTP"], categories: ["fullstack", "backend", "dados"],
    demo: "/ledgerflow", code: siteRepository + "/tree/main/lib/ledgerflow",
  },
  {
    slug: "farol-de-integracoes", index: "03", name: "Farol de Integrações", label: "CONFIABILIDADE",
    summary: "Acompanhe um pedido quando o ERP cai. Investigue as retentativas e recupere o evento sem perder o histórico.",
    stack: ["TypeScript", "React", "SQL / D1", "API HTTP"], categories: ["fullstack", "backend", "arquitetura"],
    demo: "/farol", code: siteRepository + "/tree/main/lib/farol",
  },
  {
    slug: "traceatlas", index: "04", name: "TraceAtlas", label: "OBSERVABILIDADE",
    summary: "Compare rastros de pedidos, encontre o serviço que falhou e inspecione uma recuperação pelo ID de correlação.",
    stack: ["TypeScript", "React", "API HTTP", "D1"], categories: ["fullstack", "arquitetura", "dados"],
    demo: "/traceatlas", code: siteRepository + "/tree/main/lib/traceatlas",
  },
  {
    slug: "ponte-erp", index: "05", name: "Ponte ERP", label: "WEBHOOKS",
    summary: "Envie um webhook assinado e observe como o receptor trata reenvios, conflitos e assinaturas inválidas.",
    stack: ["Python", "HMAC-SHA256", "SQLite"], categories: ["backend", "arquitetura"],
    demo: "/demos/ponte-erp", code: github + "/ponte-erp",
  },
  {
    slug: "pulso-operacao", index: "06", name: "Pulso da Operação", label: "SQL / ANÁLISE",
    summary: "Compare horários de corte para entender como a fila de chamados e o SLA mudam ao longo do dia.",
    stack: ["SQL", "Python", "HTML"], categories: ["dados"],
    demo: "/demos/pulso-operacao", code: github + "/pulso-operacao",
  },
  {
    slug: "plantao-ti", index: "07", name: "Plantão de TI", label: "REGRAS DE DOMÍNIO",
    summary: "Priorize incidentes pelo prazo de resolução e registre o momento em que cada chamado foi encerrado.",
    stack: ["Python", "SQLite"], categories: ["arquitetura"],
    demo: "/demos/plantao-ti", code: github + "/plantao-ti",
  },
];

export function findProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function casePath(slug: string) {
  return "/projetos/" + slug;
}
