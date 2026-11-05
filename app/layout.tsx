import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/portfolio-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Raphael Kaych | Portfólio em TI", template: "%s | Raphael Kaych" },
  description: "Análise de sistemas, desenvolvimento e operações de TI. Conheça a trajetória e experimente os projetos de Raphael Kaych.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Raphael Kaych | Portfólio em TI",
    description: "Análise de sistemas, desenvolvimento e operações de TI.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
