import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlantaoDemo, PonteDemo, PulsoDemo } from "../../../components/classic-labs";
import { github, pageMetadata } from "../../../lib/portfolio-meta";

const labs = {
  "plantao-ti": {
    title: "Plantão de TI", index: "07",
    description: "Abra chamados e veja como a fila muda quando o relógio avança ou um incidente é resolvido.",
    Demo: PlantaoDemo,
  },
  "ponte-erp": {
    title: "Ponte ERP", index: "05",
    description: "Teste o envio de um webhook, a validação da assinatura e o tratamento de uma entrega repetida.",
    Demo: PonteDemo,
  },
  "pulso-operacao": {
    title: "Pulso da Operação", index: "06",
    description: "Compare três horários de corte sobre a mesma base de chamados e veja o que muda nos indicadores.",
    Demo: PulsoDemo,
  },
};

function getLab(slug: string) {
  return Object.hasOwn(labs, slug) ? labs[slug as keyof typeof labs] : null;
}

export function generateStaticParams() {
  return Object.keys(labs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  return lab ? pageMetadata(lab.title, lab.description, "/demos/" + slug) : {};
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();
  return (
    <main id="conteudo" tabIndex={-1} className="shell lab">
      <a className="back-link" href={"/projetos/" + slug}>← Estudo de caso</a>
      <div className="lab-title">
        <p className="eyebrow"><span /> {lab.index} / DEMONSTRAÇÃO</p>
        <h1>{lab.title}</h1>
        <p>{lab.description}</p>
        <a className="text-link" href={github + "/" + slug}>Ver código original <span aria-hidden="true">↗</span></a>
      </div>
      <lab.Demo />
    </main>
  );
}
