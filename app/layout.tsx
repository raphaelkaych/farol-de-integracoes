import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/portfolio-chrome";
import { github, siteUrl } from "../lib/portfolio-meta";
import "./globals.css";
import "./portfolio.css";
import "./labs.css";
import "./motion.css";
import "./workbench.css";
import "./project-previews.css";

const description = "Portfólio de Raphael Kaych. Projetos de desenvolvimento full stack, APIs, testes e integração de sistemas, com demos e código público.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Raphael Kaych | Software e qualidade", template: "%s | Raphael Kaych" },
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Raphael Kaych | Software e qualidade", description, locale: "pt_BR", type: "website",
    images: [{ url: "/compartilhamento.png", width: 1200, height: 630, alt: "Raphael Kaych, desenvolvimento de software e qualidade" }],
  },
  twitter: { card: "summary_large_image", title: "Raphael Kaych | Software e qualidade", description, images: ["/compartilhamento.png"] },
};

const identity = {
  "@context": "https://schema.org", "@type": "Person", name: "Raphael Kaych", url: siteUrl,
  sameAs: [github], alumniOf: { "@type": "EducationalOrganization", name: "ETEC de Praia Grande" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(identity) }} />
      </body>
    </html>
  );
}
